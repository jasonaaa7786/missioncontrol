/**
 * Token Usage Parser & Aggregator
 *
 * Hybrid approach:
 * 1. Primary: Query Activity table for token/cost data logged by agents
 * 2. Secondary: Parse JSONL session files from OpenClaw agent directories
 *
 * Results are cached with a 5-minute TTL to avoid re-parsing on every request.
 */

import { PrismaClient } from '@prisma/client';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

// Cost rates per 1K tokens (input/output)
const MODEL_RATES: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-5': { input: 0.003, output: 0.015 },
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
  'claude-opus-4': { input: 0.015, output: 0.075 },
  'claude-haiku-4': { input: 0.0003, output: 0.0015 },
  'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-haiku': { input: 0.0003, output: 0.0015 },
  'gemini-flash': { input: 0.0001, output: 0.0004 },
};

export interface CostSummary {
  today: number;
  sevenDay: number;
  thirtyDay: number;
  allTime: number;
  projected: number;
  totalTokens: number;
  byModel: { model: string; tokens: number; cost: number; calls: number }[];
  byAgent: { agent: string; tokens: number; cost: number; calls: number }[];
  dailyTrend: { date: string; cost: number; tokens: number }[];
}

interface ActivityRecord {
  id: string;
  type: string;
  agentId: string | null;
  metadata: string;
  createdAt: Date;
}

// Simple in-memory cache
let cachedResult: CostSummary | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cost summary from Activity table records
 */
export async function getCostSummary(prisma: PrismaClient): Promise<CostSummary> {
  const now = Date.now();
  if (cachedResult && now < cacheExpiry) {
    return cachedResult;
  }

  const result = await computeCostSummary(prisma);
  cachedResult = result;
  cacheExpiry = now + CACHE_TTL;
  return result;
}

/**
 * Invalidate the cost cache (e.g. after new data is logged)
 */
export function invalidateCostCache() {
  cachedResult = null;
  cacheExpiry = 0;
}

async function computeCostSummary(prisma: PrismaClient): Promise<CostSummary> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch all activities that have token/cost metadata
  // These come from log-agent-usage.py and agent heartbeats
  const activities = await prisma.activity.findMany({
    where: {
      type: {
        in: ['agent_completed', 'agent_started'],
      },
    },
    orderBy: { createdAt: 'desc' },
  }) as ActivityRecord[];

  // Parse metadata and extract cost/token data
  interface ParsedActivity {
    tokens: number;
    cost: number;
    model: string;
    agent: string;
    date: string; // YYYY-MM-DD
    createdAt: Date;
  }

  const parsed: ParsedActivity[] = [];

  for (const activity of activities) {
    try {
      const meta = JSON.parse(activity.metadata || '{}');
      if (meta.tokens || meta.cost) {
        parsed.push({
          tokens: meta.tokens || 0,
          cost: meta.cost || estimateCost(meta.tokens || 0, meta.model || 'claude-sonnet-4-5'),
          model: meta.model || 'unknown',
          agent: activity.agentId?.replace('livescape-', '').toUpperCase() || 'UNKNOWN',
          date: activity.createdAt.toISOString().split('T')[0],
          createdAt: activity.createdAt,
        });
      }
    } catch {
      // Skip entries with invalid metadata
    }
  }

  // Also try to parse JSONL files if available
  const jsonlParsed = await parseJSONLSessions();
  parsed.push(...jsonlParsed);

  // Deduplicate by rough timestamp+agent (in case both sources have the same data)
  const seen = new Set<string>();
  const deduped = parsed.filter(p => {
    const key = `${p.agent}-${p.date}-${Math.round(p.tokens / 100)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Compute aggregates
  const today = deduped.filter(p => p.createdAt >= todayStart);
  const sevenDay = deduped.filter(p => p.createdAt >= sevenDaysAgo);
  const thirtyDay = deduped.filter(p => p.createdAt >= thirtyDaysAgo);

  const todayCost = sum(today.map(p => p.cost));
  const sevenDayCost = sum(sevenDay.map(p => p.cost));
  const thirtyDayCost = sum(thirtyDay.map(p => p.cost));
  const allTimeCost = sum(deduped.map(p => p.cost));
  const totalTokens = sum(deduped.map(p => p.tokens));

  // Projected monthly: based on 30-day rolling average
  const daysWithData = new Set(deduped.map(p => p.date)).size || 1;
  const avgDailyCost = allTimeCost / daysWithData;
  const projected = round(avgDailyCost * 30);

  // By model
  const modelMap = new Map<string, { tokens: number; cost: number; calls: number }>();
  for (const p of deduped) {
    const existing = modelMap.get(p.model) || { tokens: 0, cost: 0, calls: 0 };
    existing.tokens += p.tokens;
    existing.cost += p.cost;
    existing.calls += 1;
    modelMap.set(p.model, existing);
  }
  const byModel = Array.from(modelMap.entries())
    .map(([model, data]) => ({ model, ...data, cost: round(data.cost) }))
    .sort((a, b) => b.cost - a.cost);

  // By agent
  const agentMap = new Map<string, { tokens: number; cost: number; calls: number }>();
  for (const p of deduped) {
    const existing = agentMap.get(p.agent) || { tokens: 0, cost: 0, calls: 0 };
    existing.tokens += p.tokens;
    existing.cost += p.cost;
    existing.calls += 1;
    agentMap.set(p.agent, existing);
  }
  const byAgent = Array.from(agentMap.entries())
    .map(([agent, data]) => ({ agent, ...data, cost: round(data.cost) }))
    .sort((a, b) => b.cost - a.cost);

  // Daily trend (last 7 days)
  const dailyMap = new Map<string, { cost: number; tokens: number }>();
  // Pre-fill last 7 days with zeros
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dailyMap.set(dateStr, { cost: 0, tokens: 0 });
  }
  for (const p of sevenDay) {
    const existing = dailyMap.get(p.date) || { cost: 0, tokens: 0 };
    existing.cost += p.cost;
    existing.tokens += p.tokens;
    dailyMap.set(p.date, existing);
  }
  const dailyTrend = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, cost: round(data.cost), tokens: data.tokens }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    today: round(todayCost),
    sevenDay: round(sevenDayCost),
    thirtyDay: round(thirtyDayCost),
    allTime: round(allTimeCost),
    projected,
    totalTokens,
    byModel,
    byAgent,
    dailyTrend,
  };
}

/**
 * Parse JSONL session files from OpenClaw agent directories.
 * Looks for files in common agent locations.
 */
async function parseJSONLSessions(): Promise<Array<{
  tokens: number;
  cost: number;
  model: string;
  agent: string;
  date: string;
  createdAt: Date;
}>> {
  const results: Array<{
    tokens: number;
    cost: number;
    model: string;
    agent: string;
    date: string;
    createdAt: Date;
  }> = [];

  // Common locations for OpenClaw session files
  const baseDirs = [
    '/root/livescape-marketing',
    join(process.env.HOME || '/root', 'livescape-marketing'),
  ];

  for (const baseDir of baseDirs) {
    try {
      const dirStat = await stat(baseDir);
      if (!dirStat.isDirectory()) continue;

      const entries = await readdir(baseDir);
      const agentDirs = entries.filter(e => e.startsWith('livescape-') || e.startsWith('ls-'));

      for (const agentDir of agentDirs) {
        const sessionsDir = join(baseDir, agentDir, '.claude', 'projects');
        try {
          await stat(sessionsDir);
          const projectDirs = await readdir(sessionsDir);

          for (const projDir of projectDirs) {
            const projPath = join(sessionsDir, projDir);
            const projStat = await stat(projPath);
            if (!projStat.isDirectory()) continue;

            const files = await readdir(projPath);
            const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));

            for (const jsonlFile of jsonlFiles) {
              try {
                const filePath = join(projPath, jsonlFile);
                const content = await readFile(filePath, 'utf-8');
                const lines = content.split('\n').filter(l => l.trim());

                let sessionTokens = 0;
                let sessionCost = 0;
                let sessionModel = 'unknown';
                let sessionDate: Date | null = null;

                for (const line of lines) {
                  try {
                    const entry = JSON.parse(line);

                    // Extract usage from assistant messages
                    if (entry.type === 'assistant' && entry.message?.usage) {
                      const usage = entry.message.usage;
                      sessionTokens += (usage.input_tokens || 0) + (usage.output_tokens || 0);

                      if (usage.cost?.total) {
                        sessionCost += usage.cost.total;
                      }
                    }

                    // Extract model info
                    if (entry.model) {
                      sessionModel = entry.model;
                    }

                    // Extract timestamp
                    if (entry.timestamp && !sessionDate) {
                      sessionDate = new Date(entry.timestamp);
                    }
                  } catch {
                    // Skip malformed lines
                  }
                }

                if (sessionTokens > 0) {
                  const date = sessionDate || new Date();
                  if (!sessionCost) {
                    sessionCost = estimateCost(sessionTokens, sessionModel);
                  }

                  results.push({
                    tokens: sessionTokens,
                    cost: sessionCost,
                    model: sessionModel,
                    agent: agentDir.replace('livescape-', '').replace('ls-', '').toUpperCase(),
                    date: date.toISOString().split('T')[0],
                    createdAt: date,
                  });
                }
              } catch {
                // Skip unreadable files
              }
            }
          }
        } catch {
          // Sessions dir doesn't exist for this agent
        }
      }
    } catch {
      // Base dir doesn't exist
    }
  }

  return results;
}

function estimateCost(tokens: number, model: string): number {
  const rate = MODEL_RATES[model] || MODEL_RATES['claude-sonnet-4-5'];
  // Assume 70% input, 30% output (rough average)
  const cost = (tokens * 0.7 * rate.input / 1000) + (tokens * 0.3 * rate.output / 1000);
  return round(cost);
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}
