# OpenClaw Mission Control

**Local-first control center for managing multiple OpenClaw projects, tasks, agents, and automations.**

## Status: Initial Build - Phase 1

**Created:** March 2, 2026  
**Stack:** React + TypeScript + Tailwind / Fastify + Prisma + SQLite / WebSocket

## Quick Start

```bash
# Install dependencies
npm install

# Start dev servers (backend + frontend)
npm run dev

# Backend only
npm run dev:server

# Frontend only  
npm run dev:web
```

## Project Structure

```
mission-control/
├── packages/
│   ├── server/       # Fastify backend + Prisma
│   ├── web/          # React frontend
│   └── shared/       # Shared types
├── docker-compose.yml
└── package.json      # Root workspace config
```

## Features

- 🎯 Multi-project management with strict separation
- 📋 Task board (Backlog → Planned → In Progress → Blocked → Done)
- 🤖 Sub-agent management (from OpenClaw config)
- 💬 Built-in chat interface (context-aware)
- ⏰ Cron/scheduler control (view, create, edit, run now, enable/disable)
- 📁 File & artifact browser with OS integration
- 🔄 Real-time updates via WebSocket

## Integration

- Reads `~/.openclaw/openclaw.json` for agent discovery
- Maps projects to working directories
- Links to output folders for quick access
- Supports "Open in Finder/Explorer" actions

## Architecture

- **Local-first:** Runs on LAN (127.0.0.1 by default)
- **Offline-friendly:** No cloud dependencies
- **Simple auth:** Local-only, no enterprise overhead
- **SQLite database:** `~/.mission-control/data/mc.db`

---

**Built for:** Multi-project operators who need fast triage and clear visibility
