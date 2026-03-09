#!/usr/bin/env node

/**
 * Heartbeat Scheduler - Autonomous Agent Automation
 * 
 * This script runs agents on schedule (heartbeats) and logs activity.
 * Inspired by Mission Control HQ's autonomous agent operation.
 * 
 * Usage:
 *   node heartbeat-scheduler.js
 * 
 * Or install as cron job:
 *   */30 * * * * cd /root/mission-control && node heartbeat-scheduler.js >> /var/log/heartbeat.log 2>&1
 */

const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:/root/.mission-control/data/mc.db'
    }
  }
});

// Agent heartbeat configuration
const AGENT_SCHEDULES = {
  'livescape-scout': {
    interval: 24 * 60 * 60 * 1000, // 24 hours
    description: 'Artist intelligence research',
    checkTasks: true, // Check for assigned tasks
  },
  'livescape-pulse': {
    interval: 6 * 60 * 60 * 1000, // 6 hours
    description: 'Sentiment tracking',
    checkTasks: true,
  },
  'livescape-radar': {
    interval: 12 * 60 * 60 * 1000, // 12 hours
    description: 'Competitor monitoring',
    checkTasks: true,
  },
  'livescape-meta': {
    interval: 1 * 60 * 60 * 1000, // 1 hour
    description: 'Campaign sync',
    checkTasks: true,
  },
  'livescape-audit': {
    interval: 24 * 60 * 60 * 1000, // 24 hours
    description: 'ROI analysis',
    checkTasks: true,
  },
  'livescape-trends': {
    interval: 12 * 60 * 60 * 1000, // 12 hours
    description: 'Trend analysis',
    checkTasks: true,
  },
  'livescape-brain': {
    interval: 24 * 60 * 60 * 1000, // 24 hours
    description: 'Pattern recognition',
    checkTasks: true,
  },
  'livescape-brand': {
    interval: 24 * 60 * 60 * 1000, // 24 hours
    description: 'Brand monitoring',
    checkTasks: true,
  },
};

async function checkAgentTasks(agentId) {
  // Check if agent has any active tasks assigned
  const tasks = await prisma.task.findMany({
    where: {
      assignedAgent: agentId,
      status: { in: ['assigned', 'active', 'review'] }
    }
  });
  
  return tasks;
}

async function shouldRunHeartbeat(agentId, config) {
  // Get agent from database
  const agent = await prisma.agent.findUnique({
    where: { id: agentId }
  });
  
  if (!agent) {
    console.log(`[${agentId}] Agent not found in database`);
    return { should: false, reason: 'not_found' };
  }
  
  if (!agent.isActive) {
    console.log(`[${agentId}] Agent is paused`);
    return { should: false, reason: 'paused' };
  }
  
  // Check last heartbeat time
  const now = Date.now();
  const lastHeartbeat = agent.updatedAt ? new Date(agent.updatedAt).getTime() : 0;
  const timeSinceLastRun = now - lastHeartbeat;
  
  if (timeSinceLastRun < config.interval) {
    const minutesUntilNext = Math.ceil((config.interval - timeSinceLastRun) / 60000);
    console.log(`[${agentId}] Too soon. Next run in ${minutesUntilNext} minutes`);
    return { should: false, reason: 'too_soon', minutesUntilNext };
  }
  
  // Check if agent has tasks
  if (config.checkTasks) {
    const tasks = await checkAgentTasks(agentId);
    if (tasks.length > 0) {
      console.log(`[${agentId}] Has ${tasks.length} active tasks - RUNNING`);
      return { should: true, reason: 'has_tasks', tasks };
    } else {
      console.log(`[${agentId}] No active tasks - skipping`);
      return { should: false, reason: 'no_tasks' };
    }
  }
  
  // Default: run heartbeat
  console.log(`[${agentId}] Time for heartbeat - RUNNING`);
  return { should: true, reason: 'scheduled' };
}

async function runAgentHeartbeat(agentId, reason, tasks = []) {
  console.log(`\n🔄 [${agentId}] Starting heartbeat (reason: ${reason})`);
  
  try {
    // Log activity: agent_started
    await prisma.activity.create({
      data: {
        type: 'agent_started',
        agentId: agentId,
        taskId: tasks[0]?.id || null,
        message: `${agentId} heartbeat started (${reason})`,
        metadata: JSON.stringify({ reason, taskCount: tasks.length })
      }
    });
    
    // Build heartbeat message for agent
    let heartbeatMessage = `Heartbeat check. `;
    
    if (tasks.length > 0) {
      heartbeatMessage += `You have ${tasks.length} active task(s):\n\n`;
      tasks.forEach((task, i) => {
        heartbeatMessage += `${i + 1}. [${task.status.toUpperCase()}] ${task.title}\n`;
        if (task.description) {
          heartbeatMessage += `   ${task.description.substring(0, 100)}...\n`;
        }
      });
      heartbeatMessage += `\nWork on these tasks and report progress.`;
    } else {
      heartbeatMessage += `No active tasks. Check for new opportunities or research needs.`;
    }
    
    // Spawn agent via OpenClaw CLI
    // Note: Using --profile livescape to use correct agent profile
    const command = `cd ~/livescape-marketing/${agentId} && openclaw sessions spawn --task "${heartbeatMessage}" --mode run --runtime subagent --profile livescape --timeout 600`;
    
    console.log(`[${agentId}] Spawning agent...`);
    const { stdout, stderr } = await execAsync(command, {
      timeout: 10 * 60 * 1000, // 10 minute timeout
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    console.log(`[${agentId}] ✅ Heartbeat complete`);
    
    // Log activity: agent_completed
    await prisma.activity.create({
      data: {
        type: 'agent_completed',
        agentId: agentId,
        taskId: tasks[0]?.id || null,
        message: `${agentId} heartbeat completed`,
        metadata: JSON.stringify({ reason, taskCount: tasks.length, success: true })
      }
    });
    
    // Update agent lastHeartbeat time
    await prisma.agent.update({
      where: { id: agentId },
      data: { updatedAt: new Date() }
    });
    
    return { success: true, output: stdout };
    
  } catch (error) {
    console.error(`[${agentId}] ❌ Heartbeat failed:`, error.message);
    
    // Log error activity
    await prisma.activity.create({
      data: {
        type: 'agent_completed',
        agentId: agentId,
        message: `${agentId} heartbeat failed: ${error.message}`,
        metadata: JSON.stringify({ reason, error: error.message, success: false })
      }
    });
    
    return { success: false, error: error.message };
  }
}

async function runHeartbeatCycle() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`💓 Heartbeat Cycle - ${new Date().toISOString()}`);
  console.log(`${'='.repeat(60)}\n`);
  
  const results = [];
  
  for (const [agentId, config] of Object.entries(AGENT_SCHEDULES)) {
    console.log(`\n--- Checking ${agentId} ---`);
    
    try {
      const check = await shouldRunHeartbeat(agentId, config);
      
      if (check.should) {
        const result = await runAgentHeartbeat(agentId, check.reason, check.tasks || []);
        results.push({ agentId, ...result });
      } else {
        results.push({ agentId, skipped: true, reason: check.reason });
      }
    } catch (error) {
      console.error(`[${agentId}] Error:`, error);
      results.push({ agentId, error: error.message });
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Heartbeat Cycle Summary:`);
  console.log(`   - Total agents: ${Object.keys(AGENT_SCHEDULES).length}`);
  console.log(`   - Ran: ${results.filter(r => r.success).length}`);
  console.log(`   - Skipped: ${results.filter(r => r.skipped).length}`);
  console.log(`   - Failed: ${results.filter(r => r.error).length}`);
  console.log(`${'='.repeat(60)}\n`);
  
  return results;
}

// Main execution
(async () => {
  try {
    await runHeartbeatCycle();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
