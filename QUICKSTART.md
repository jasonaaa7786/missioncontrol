# Mission Control - Quick Start Guide

## 🚀 First Time Setup

### 1. Install Dependencies

```bash
cd ~/mission-control
npm install
```

This will install all dependencies for the monorepo (server, web, shared packages).

### 2. Initialize Database

```bash
# Create database directory
mkdir -p ~/.mission-control/data

# Run Prisma migrations
npm run db:migrate
```

This creates the SQLite database at `~/.mission-control/data/mc.db` and runs all schema migrations.

### 3. Seed Initial Data (Optional)

```bash
npm run db:seed
```

This populates the database with sample projects and agents from your OpenClaw config.

## 🏃 Running the Application

### Development Mode (Recommended)

Start both backend and frontend in watch mode:

```bash
npm run dev
```

This starts:
- **Backend** (Fastify): http://127.0.0.1:3001
- **Frontend** (Vite/React): http://127.0.0.1:5173

Open http://127.0.0.1:5173 in your browser.

### Start Separately

If you prefer to run them separately:

```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev:web
```

## 📊 Database Management

### View Database

```bash
npm run db:studio
```

Opens Prisma Studio at http://localhost:5555 to browse/edit database records.

### Create New Migration

After changing `packages/server/prisma/schema.prisma`:

```bash
npm run db:migrate
```

### Reset Database

```bash
cd packages/server
npx prisma migrate reset
```

⚠️ **Warning:** This will delete all data and recreate the database.

## 🔧 OpenClaw Integration

Mission Control automatically reads from `~/.openclaw/openclaw.json`.

### Sync Agents

1. Open http://127.0.0.1:5173/agents
2. Click "Sync from OpenClaw"
3. Agents from your config will be imported

### Create Project

1. Go to http://127.0.0.1:5173/projects
2. Click "+ New Project"
3. Fill in:
   - Name
   - Working directory (e.g., `~/my-project`)
   - Output directory (optional)
   - Default agent (from synced agents)

## 📁 Project Structure

```
mission-control/
├── packages/
│   ├── server/           # Fastify backend
│   │   ├── src/
│   │   │   ├── index.ts         # Server entry point
│   │   │   └── routes/          # API routes
│   │   └── prisma/
│   │       └── schema.prisma    # Database schema
│   ├── web/              # React frontend
│   │   └── src/
│   │       ├── pages/           # Page components
│   │       ├── components/      # Shared components
│   │       └── hooks/           # Custom hooks
│   └── shared/           # Shared types
│       └── src/
│           └── types.ts         # TypeScript definitions
└── ~/.mission-control/   # Runtime data
    └── data/
        └── mc.db                # SQLite database
```

## 🌐 API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks/project/:projectId` - List tasks for project
- `POST /api/tasks/project/:projectId` - Create task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Agents
- `GET /api/agents` - List agents
- `POST /api/agents/sync` - Sync from OpenClaw config

### Schedules
- `GET /api/schedules` - List schedules
- `POST /api/schedules` - Create schedule
- `POST /api/schedules/:id/run` - Run schedule now
- `POST /api/schedules/:id/toggle` - Enable/disable

### WebSocket
- `ws://127.0.0.1:3001/ws` - Real-time events

## 🛠️ Troubleshooting

### Port Already in Use

If port 3001 or 5173 is already in use:

```bash
# Change backend port
PORT=3002 npm run dev:server

# Change frontend port (edit vite.config.ts)
# server.port: 5174
```

### Database Locked

If you see "database is locked" errors:

```bash
# Close any open Prisma Studio windows
# Restart the server
npm run dev:server
```

### OpenClaw Config Not Found

Mission Control looks for `~/.openclaw/openclaw.json`.

If using a profile (e.g., `~/.openclaw-livescape/`), update the path in:
- `packages/server/src/routes/agents.ts` (line 8)

### Hot Reload Not Working

```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

## 🚢 Production Deployment

### Build

```bash
npm run build
```

Outputs:
- `packages/server/dist/` - Compiled backend
- `packages/web/dist/` - Static frontend files

### Run Production Server

```bash
npm start
```

Serves both backend API and static frontend on port 3001.

### Environment Variables

Create `.env` in project root:

```env
PORT=3001
HOST=127.0.0.1
NODE_ENV=production
DATABASE_URL=file:~/.mission-control/data/mc.db
```

## 🔐 Security Notes

- **Default bind:** 127.0.0.1 (localhost only)
- **No authentication:** Designed for local use
- **Path validation:** File operations validate paths to prevent traversal
- **For remote access:** Use SSH tunnel or add authentication layer

## 📚 Next Steps

1. ✅ Complete Phase 1 (Initial Setup)
2. 🔄 Phase 2: Wire OpenClaw Integration
   - Implement real task execution via CLI
   - Add agent communication
   - Integrate cron job management
3. 🎨 Phase 3: UI Polish
   - Task board drag-and-drop
   - Real-time updates
   - Chat interface
4. 🚀 Phase 4: Advanced Features
   - File indexing
   - Multi-project views
   - Analytics dashboard

## ❓ Need Help?

- Check logs: `packages/server/` console output
- Database issues: `npm run db:studio` to inspect data
- OpenClaw integration: Test `openclaw --version` first

---

**Version:** 0.1.0 (Phase 1)  
**Last Updated:** March 2, 2026  
**Status:** Initial build complete, OpenClaw integration pending
