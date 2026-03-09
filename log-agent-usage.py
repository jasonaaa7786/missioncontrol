#!/usr/bin/env python3
"""
Log Agent Token Usage to Mission Control

Usage:
  python3 log-agent-usage.py --agent scout --tokens 5000 --task "Artist research: KI/KI"
  
This script logs agent token usage to Mission Control activity feed for tracking.
"""

import argparse
import requests
import json
import os
from datetime import datetime

# Mission Control API
API_BASE = os.getenv('MC_API_URL', 'http://140.82.57.157:3001')
API_TOKEN = None  # Will login to get token

def login():
    """Get API token"""
    response = requests.post(
        f"{API_BASE}/api/auth/login",
        json={"username": "iqbal", "password": "test123"}
    )
    response.raise_for_status()
    return response.json()['token']

def log_activity(token, agent_id, message, metadata):
    """Log activity to Mission Control"""
    response = requests.post(
        f"{API_BASE}/api/activity/log",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "type": "agent_completed",
            "agentId": agent_id,
            "message": message,
            "metadata": json.dumps(metadata)
        }
    )
    response.raise_for_status()
    return response.json()

def estimate_cost(tokens, model="claude-sonnet-4-5"):
    """Estimate cost based on tokens and model"""
    # Rough estimates (check actual pricing)
    rates = {
        "claude-sonnet-4-5": {"input": 0.003, "output": 0.015},  # per 1K tokens
        "claude-haiku-4": {"input": 0.0003, "output": 0.0015},
        "gemini-flash": {"input": 0.0001, "output": 0.0004},
    }
    
    rate = rates.get(model, rates["claude-sonnet-4-5"])
    # Assume 70% input, 30% output (rough average)
    cost = (tokens * 0.7 * rate["input"] / 1000) + (tokens * 0.3 * rate["output"] / 1000)
    return round(cost, 4)

def main():
    parser = argparse.ArgumentParser(description="Log agent token usage to Mission Control")
    parser.add_argument("--agent", required=True, help="Agent ID (e.g., livescape-scout)")
    parser.add_argument("--tokens", type=int, required=True, help="Tokens used")
    parser.add_argument("--task", required=True, help="Task description")
    parser.add_argument("--model", default="claude-sonnet-4-5", help="Model used")
    parser.add_argument("--apis", help="APIs used (comma-separated)")
    parser.add_argument("--task-id", help="Task ID if associated with a task")
    
    args = parser.parse_args()
    
    # Login and get token
    print(f"🔐 Logging in to Mission Control...")
    token = login()
    
    # Calculate cost
    cost = estimate_cost(args.tokens, args.model)
    
    # Build message
    message = f"{args.agent} completed: {args.task} ({args.tokens:,} tokens, ~${cost})"
    
    # Build metadata
    metadata = {
        "tokens": args.tokens,
        "cost": cost,
        "model": args.model,
        "task": args.task,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if args.apis:
        metadata["apis"] = args.apis.split(",")
    
    # Log to Mission Control
    print(f"📊 Logging activity...")
    result = log_activity(token, args.agent, message, metadata)
    
    print(f"✅ Logged to Mission Control")
    print(f"   - Agent: {args.agent}")
    print(f"   - Tokens: {args.tokens:,}")
    print(f"   - Cost: ~${cost}")
    print(f"   - Activity ID: {result.get('id')}")
    
    # Also append to daily memory log
    memory_file = f"/root/livescape-marketing/ls-commander/memory/{datetime.utcnow().strftime('%Y-%m-%d')}.md"
    log_entry = f"\n### {datetime.utcnow().strftime('%H:%M')} UTC - {args.agent} Token Usage\n"
    log_entry += f"- Task: {args.task}\n"
    log_entry += f"- Tokens: {args.tokens:,}\n"
    log_entry += f"- Cost: ~${cost}\n"
    log_entry += f"- Model: {args.model}\n"
    if args.apis:
        log_entry += f"- APIs: {args.apis}\n"
    log_entry += "\n"
    
    with open(memory_file, "a") as f:
        f.write(log_entry)
    
    print(f"📝 Also logged to {memory_file}")

if __name__ == "__main__":
    main()
