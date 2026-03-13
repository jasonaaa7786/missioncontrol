# MISSION CONTROL - SYSTEM OVERVIEW

**Date:** 2026-03-13  
**Version:** Production (commit 9142a07)  
**Purpose:** Comprehensive guide for development and improvements

---

## 🎯 **MISSION CONTROL OBJECTIVES**

### **Primary Purpose:**
Mission Control is the centralized research and coordination hub for **Livescape Group**, a concert and festival promoter in Southeast Asia (Malaysia, Singapore, Thailand, Indonesia, Vietnam, Hong Kong).

### **Core Objectives:**

1. **Artist Research Intelligence**
   - Evaluate artists for festival bookings (10,000+ capacity shows)
   - Analyze social media metrics (YouTube, Spotify, Instagram, TikTok)
   - Track artist performance, sentiment, and market fit
   - Generate artist feasibility scores (0-100)

2. **Event Planning Coordination**
   - Track multiple festival projects (ASOT Vietnam 2026, Hanumankind SEA Tour, etc.)
   - Manage research briefs and findings
   - Coordinate between marketing, creative, and analytics teams

3. **AI Agent Orchestration**
   - Dispatch specialist AI agents for specific research tasks
   - Track agent activity and token usage
   - Aggregate findings from multiple agents into composite briefs

4. **Team Collaboration**
   - Multi-user access (admin: Iqbal, viewer: basicjo)
   - Real-time activity feed showing what's happening
   - Task management with 7-status kanban workflow (inbox → done)
   - Comment threading on research tasks

5. **Data-Driven Decision Making**
   - Live dashboards showing agent activity, project status
   - Budget tracking (token usage, API costs)
   - Historical memory of past research and decisions

---

## 🤖 **AI AGENT ROSTER (15 AGENTS)**

### **ORCHESTRATOR:**

#### **HEYMACHA (ls-commander)** 🎮
- **Role:** Mission Control hub, chief of staff
- **Function:** Routes questions to specialists, synthesizes responses, enforces command protocols
- **Location:** `~/livescape-marketing/ls-commander/`
- **Communication:** Telegram War Room (team chat)
- **Key Feature:** Adversarial review (forces debate between SCOUT vs AUDIT, TRENDS vs PULSE before final verdict)

---

### **CORE 8 SPECIALISTS:**

#### **1. SCOUT** 🔍
- **Role:** Artist Intelligence & Show Viability
- **Focus:** SEA market fit (Malaysia, Singapore, Thailand, Indonesia, Vietnam, Hong Kong)
- **Data Sources:** YouTube API, Spotify API, show history, genre fit
- **Output:** Artist feasibility score (0-100), TIER classification (1/2/3), GO/CONDITIONAL/NO-GO verdict
- **Key Rule:** "A globally huge artist who is cold in SEA is NOT viable"
- **Location:** `~/livescape-marketing/livescape-scout/`

#### **2. PULSE** 💓
- **Role:** Audience Sentiment Analysis
- **Focus:** Fan sentiment, controversy detection, emotional intelligence
- **Data Sources:** Reddit, Twitter (via Apify), Google News API
- **Output:** Sentiment score (-100 to +100), controversy flags, veto recommendations
- **Veto Trigger:** Sentiment <-20, viral backlash detected
- **Location:** `~/livescape-marketing/livescape-pulse/`

#### **3. RADAR** 📡
- **Role:** Competitor Intelligence
- **Focus:** SEA market event tracking, venue analysis
- **Data Sources:** Bandsintown, Songkick, Google Search Console, Apify (event scrapers)
- **Output:** Competitor show calendar, venue progression tracking, market gaps
- **Proactive:** Weekly competitor scan (Mondays 09:00 MYT)
- **Location:** `~/livescape-marketing/livescape-radar/`

#### **4. META** 🎯
- **Role:** Paid Media Performance
- **Focus:** Facebook/Instagram ad campaigns
- **Data Sources:** Meta Ads API, Google Ads API, Google Analytics
- **Output:** Campaign performance (spend, CTR, CPC, reach), budget utilization
- **Current Status:** ✅ Fully integrated (Meta API added 2026-03-13)
- **Location:** `~/livescape-marketing/livescape-meta/`

#### **5. AUDIT** 📊
- **Role:** Campaign Performance Auditor (Cross-Channel)
- **Focus:** ROAS calculation, budget verification
- **Data Sources:** Meta Ads API, Google Ads API, Google Sheets API
- **Output:** ROAS reports, spend verification, ROI verdicts
- **Veto Trigger:** ROAS <2x, CAC >25%, historical loss pattern
- **Location:** `~/livescape-marketing/livescape-audit/`

#### **6. TRENDS** 📈
- **Role:** Market Intelligence & Revenue Optimization
- **Focus:** Ticket pricing tactics, upsell strategies
- **Data Sources:** Google Trends, Spotify API, Google Sheets API
- **Output:** Pricing recommendations, revenue maximization tactics
- **Location:** `~/livescape-marketing/livescape-trends/`

#### **7. BRAND** 🏟️
- **Role:** Festival IP Intelligence
- **Focus:** Livescape's own festival brands (ASOT, Livescape events)
- **Data Sources:** Historical event data, brand sentiment, IP strength
- **Output:** Brand health scores, IP valuation
- **Location:** `~/livescape-marketing/livescape-brand/`

#### **8. BRAIN** 🧠
- **Role:** Institutional Memory & Pattern Analysis
- **Focus:** Historical patterns, "what worked before"
- **Data Sources:** `MEMORY.md`, daily memory logs, past briefs
- **Output:** Pattern matches, historical comparisons, lessons learned
- **Veto Trigger:** Pattern match to past failure
- **Location:** `~/livescape-marketing/livescape-brain/`

---

### **R&D SPECIALISTS (Artist Feasibility Scoring):**

#### **9. SOCIAL-SENTINEL** 📱
- **Role:** Social Media Intelligence (Deep Analysis)
- **Focus:** Instagram, TikTok, Twitter engagement
- **Data Sources:** Apify API (Instagram/TikTok/Twitter scrapers), Spotify API, TikTok API
- **Output:** Social Sentiment Score (0-100) = 40% weight in final artist score
- **Metrics:** Total reach, engagement rate, growth trend, SEA follower %
- **Location:** `~/livescape-marketing/livescape-social-sentinel/`

#### **10. TICKET-ANALYST** 🎫
- **Role:** Historical Ticketing & Venue Intelligence
- **Focus:** Sell-through rates, venue capacity progression
- **Data Sources:** Pollstar API (pending), Bandsintown, Songkick, web search
- **Output:** Ticket Viability Score (0-100) = 40% weight in final artist score
- **Metrics:** Historical sell-through, venue progression, pricing benchmarks
- **Gap:** ❌ Pollstar Enterprise API not yet subscribed ($200-500/mo)
- **Location:** `~/livescape-marketing/livescape-ticket-analyst/`

#### **11. SPONSOR-INTEL** 💼
- **Role:** Brand Partnership Viability
- **Focus:** Sponsorship potential, brand safety
- **Data Sources:** Web search, Instagram logo detection (future: Google Vision API)
- **Output:** Sponsorship Score (0-100) = 20% weight in final artist score
- **Metrics:** Active partnerships, brand alignment, commercial presence
- **Location:** `~/livescape-marketing/livescape-sponsor-intel/`

---

### **DATABASE CURATORS:**

#### **12. VENUE-SCOUT** 🏟️
- **Role:** SEA Venue Database Curator
- **Focus:** Malaysia, Singapore, Thailand, Indonesia, Vietnam venues
- **Data Sources:** Manual research, Viberate (6K festivals, 115K venues)
- **Output:** Venue capacity, location, type, amenities, contact info
- **Database:** Planned Google Sheets integration
- **Location:** `~/livescape-marketing/livescape-venue-scout/`

#### **13. BOOKER-INTEL** 📞
- **Role:** Booking Agent/Agency Database
- **Focus:** Global agent contacts, artist representation
- **Data Sources:** Manual research, industry contacts
- **Output:** Agent contact info, agency roster, booking fee ranges
- **Database:** Planned at `~/livescape-marketing/databases/booking-fees.json`
- **Location:** `~/livescape-marketing/livescape-booker-intel/`

---

### **INFRASTRUCTURE:**

#### **14. FORGE** ⚙️
- **Role:** Technical Builder (Dashboards, UTM, Landing Pages)
- **Focus:** Google Workspace automation, document generation
- **Data Sources:** Google Docs API, Google Sheets API, Google Slides API, Google Drive API
- **Output:** Pitch decks, ROAS dashboards, composite briefs, tracking pixels
- **Location:** `~/livescape-marketing/livescape-forge/`

---

## 🔌 **CONNECTED APIs (16 TOTAL)**

### **VIA MATON.AI GATEWAY (10 APIs)** - OAuth via jason@livescape.asia
*Access via `MATON_API_KEY` stored in `~/.bashrc`*

| # | API | Purpose | Cost | Agent(s) Using |
|---|-----|---------|------|----------------|
| 1 | **YouTube Data API v3** | Video metrics, subscriber counts | FREE (10K units/day) | SCOUT, SOCIAL-SENTINEL |
| 2 | **Google Ads API** | Campaign management, ad performance | FREE (MCC account) | META, AUDIT |
| 3 | **Google Analytics Data API** | Traffic, conversion tracking | FREE | META, AUDIT |
| 4 | **Google Analytics Admin API** | GA4 property setup | FREE | META (setup only) |
| 5 | **Google Slides API** | Pitch deck generation | FREE | FORGE |
| 6 | **Google Sheets API** | ROAS reports, budget dashboards | FREE | AUDIT, TRENDS, FORGE |
| 7 | **Google Docs API** | Composite briefs, documentation | FREE | FORGE, HEYMACHA |
| 8 | **Google Drive API** | File uploads, team sharing | FREE | FORGE, HEYMACHA |
| 9 | **Gmail API** | Team notifications, briefs | FREE | HEYMACHA |
| 10 | **Google Search Console API** | SEO monitoring | FREE | RADAR |

**Gateway URL:** https://gateway.maton.ai/  
**Documentation:** `~/livescape-marketing/ls-commander/memory/maton-integrations.md`

---

### **DIRECT API KEYS (6 APIs)** - Stored in `~/.bashrc`

| # | API | Purpose | Cost | Agent(s) Using |
|---|-----|---------|------|----------------|
| 11 | **Spotify API** | Followers, popularity score | FREE (basic tier) | SCOUT, SOCIAL-SENTINEL, TRENDS |
| 12 | **TikTok API** | Followers, likes, engagement | FREE (business approval pending) | SOCIAL-SENTINEL |
| 13 | **Apify API** | Instagram/Reddit/Twitter scraping | $49/month (Starter plan) | SOCIAL-SENTINEL, PULSE, RADAR |
| 14 | **Google News API** (NewsAPI.org) | Artist news, controversy checks | FREE (100 req/day) | SCOUT, PULSE |
| 15 | **Brave Search API** | Web research, artist intel | FREE (built into OpenClaw) | ALL AGENTS |
| 16 | **Meta Ads API** | Facebook/Instagram ad performance | FREE | META, AUDIT |

**Meta Ads Credentials:**
- `META_ACCESS_TOKEN` - Added 2026-03-13 ✅
- `META_AD_ACCOUNT_ID=act_319437718450817`
- `META_PIXEL_ID=1188983386656318`

---

### **PENDING/PLANNED APIs:**

| API | Purpose | Cost | Status | Impact |
|-----|---------|------|--------|--------|
| **Pollstar Enterprise** | Ticket sell-through data | $200-500/mo | ⏳ Pricing requested | HIGH - biggest accuracy gap |
| **Viberate API** | Spotify monthly listeners, SEA breakdown | €300/mo (~$325) | 🔄 Researching | MEDIUM - solves Spotify gap |
| **Google Vision API** | Logo detection in photos | ~$10-20/mo | 📋 Planned | LOW - sponsor detection |

---

### **API GAPS (NO PUBLIC API EXISTS):**

- ❌ **Booking fees** - No API available (manual tracking only)
- ❌ **Spotify monthly listeners** - Requires Premium subscription OR Viberate
- ❌ **Real-time Instagram engagement** - Rate limited, requires Apify credits

---

## 📊 **MISSION CONTROL TECH STACK**

### **Frontend:**
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI Library:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS + custom cyberpunk theme
- **Charts:** Recharts
- **Icons:** Lucide React
- **Notifications:** Sonner (toast library)
- **Font:** Orbitron (headings), JetBrains Mono (data), Outfit (body)

### **Backend:**
- **Runtime:** Node.js 22.22.0
- **Framework:** Fastify (high-performance REST API)
- **Database:** Prisma ORM + SQLite
- **WebSocket:** @fastify/websocket (real-time activity feed)
- **Auth:** JWT tokens
- **CORS:** Enabled for localhost:5173

### **Database Schema:**
- **User** - Authentication (username, password hash, role)
- **Agent** - AI agent tracking (name, status, lastActive)
- **Project** - Event/festival projects (name, status, deadline)
- **Task** - Kanban tasks (7 statuses: inbox → assigned → active → review → waiting → blocked → done)
- **TaskComment** - Thread comments on tasks
- **Activity** - Activity feed events (task_created, agent_started, etc.)
- **Session** - User sessions

### **Deployment:**
- **Process Manager:** systemd (`mission-control.service`)
- **Auto-restart:** Enabled
- **VPS:** 140.82.57.157 (Ubuntu 24.04 LTS)
- **Frontend Port:** 5173
- **Backend Port:** 3001

### **Development:**
- **Monorepo:** `packages/server`, `packages/web`, `packages/shared`
- **Hot Reload:** Vite HMR (frontend), nodemon (backend)
- **Version Control:** Git + GitHub (https://github.com/jasonaaa7786/missioncontrol)

---

## 📂 **KEY FILE LOCATIONS**

### **Backend (Server):**
```
~/mission-control/packages/server/
├── src/
│   ├── index.ts              # Main Fastify server
│   ├── routes/
│   │   ├── tasks-v2.ts       # Kanban task management
│   │   ├── activity.ts       # Activity feed
│   │   ├── agents.ts         # Agent status tracking
│   │   ├── projects.ts       # Project management
│   │   └── schedules.ts      # Scheduled jobs
│   ├── middleware/
│   │   ├── auth.ts           # JWT authentication
│   │   └── cors.ts           # CORS configuration
│   └── prisma/
│       └── schema.prisma     # Database schema
```

### **Frontend (Web):**
```
~/mission-control/packages/web/
├── src/
│   ├── App.tsx                    # Main app router
│   ├── main.tsx                   # Entry point
│   ├── pages/
│   │   ├── Dashboard.tsx          # Main dashboard (live stats, activity feed)
│   │   ├── Pipeline.tsx           # 7-column kanban board
│   │   ├── ArtistResearch.tsx     # YouTube API integration
│   │   ├── VenueSearch.tsx        # Venue research placeholder
│   │   └── DatabaseSearch.tsx     # Database search placeholder
│   ├── components/
│   │   ├── CyberLayout/
│   │   │   ├── IconNav.tsx        # Left sidebar (62px)
│   │   │   ├── ActivityFeed.tsx   # Right sidebar (272px, live updates)
│   │   │   └── CyberLayout.tsx    # 3-column layout wrapper
│   │   ├── TaskDetailModal.tsx    # Task comments UI
│   │   └── [other components]
│   ├── lib/
│   │   └── api.ts                 # API client functions
│   └── styles/
│       └── cyberpunk.css          # Custom cyberpunk theme
```

### **Scripts & Automation:**
```
~/mission-control/
├── heartbeat-scheduler.js     # Cron job (every 30 min, triggers agent heartbeats)
├── log-agent-usage.py         # Token usage logger (posts to activity feed)
├── health-check.sh            # Production health check script
└── .env                       # Environment variables
```

### **Data & Database:**
```
~/.mission-control/
├── data/
│   └── mc.db                  # SQLite database (production data)
└── uploads/                   # User-uploaded files
```

---

## 🎯 **DEVELOPMENT POINTERS FOR CLAUDE CODE**

### **HIGH-PRIORITY IMPROVEMENTS:**

#### **1. Dashboard Enhancements** 🎨
**Current State:** Basic stats, activity feed working  
**Opportunities:**
- ✅ Add real-time agent heartbeat indicators (green dot = online)
- ✅ Chart historical agent activity (usage over time)
- ✅ Project health scores (green/yellow/red based on task velocity)
- ✅ Budget burn rate visualization (daily/weekly token spend)
- ✅ Top 5 most active projects (last 7 days)

**Wireframe suggestion:**
```
┌─────────────────────────────────────────────────┐
│ Intelligence Overview (4 metrics)               │
│ [Active Projects] [Agent Swarm] [Tasks] [Jobs] │
├─────────────────────────────────────────────────┤
│ Live Agent Status (with heartbeat indicators)  │
│ 🟢 SCOUT | 🟢 PULSE | 🔴 RADAR (offline 2h)   │
├─────────────────────────────────────────────────┤
│ Token Usage Chart (last 7 days)                │
│ [Recharts line chart showing daily spend]      │
└─────────────────────────────────────────────────┘
```

#### **2. Kanban Board (Pipeline) Improvements** 📋
**Current State:** 7-column board working, task creation/comments functional  
**Opportunities:**
- ✅ Drag-and-drop between columns (use `@dnd-kit/core`)
- ✅ Bulk actions (select multiple tasks, move all at once)
- ✅ Task templates (quick-create "Artist Research Brief" with pre-filled fields)
- ✅ Time tracking (how long tasks stay in each status)
- ✅ Task dependencies (block a task until another is done)
- ✅ Due date warnings (red highlight if overdue)

**Technical debt:**
- TaskDetailModal is large (500+ lines) - consider splitting into smaller components
- Task state management could use React Query for better caching

#### **3. Artist Research Page** 🔍
**Current State:** YouTube API integration working  
**Opportunities:**
- ✅ Add Spotify artist lookup (monthly listeners, top tracks)
- ✅ Instagram follower growth chart (via Apify)
- ✅ TikTok viral content detection (top videos by views)
- ✅ "Generate Brief" button (calls SCOUT agent, displays full report)
- ✅ Save research to database (cache results, avoid duplicate API calls)
- ✅ Compare two artists side-by-side

**API integration needed:**
- Spotify API: `GET /v1/artists/{id}` (already configured, just wire it up)
- Apify Instagram Scraper: Script exists at `~/livescape-marketing/data-scripts/apify-integrations/`

#### **4. Venue & Database Pages** 🏟️
**Current State:** Placeholder pages  
**Opportunities:**
- **Venue Search:**
  - ✅ Search SEA venues by capacity, location, genre
  - ✅ Show venue calendar (upcoming events)
  - ✅ Integrate with VENUE-SCOUT agent
  - ✅ Map view (Google Maps embed showing venue locations)
  
- **Database Search:**
  - ✅ Search booking agents/agencies
  - ✅ Search historical artist briefs
  - ✅ Search past event data (what worked, what didn't)

#### **5. Activity Feed Enhancements** 📡
**Current State:** Real-time feed working, 30s auto-refresh  
**Opportunities:**
- ✅ Filter by activity type (tasks only, agents only, decisions only)
- ✅ Search activity history (find "when did we research Artist X?")
- ✅ Export to PDF (weekly activity report)
- ✅ @mention notifications (when someone tags you in a comment)
- ✅ WebSocket instead of polling (real-time without refresh delay)

**Technical improvement:**
- Switch from 30s polling to WebSocket push (backend already has `@fastify/websocket`)

---

### **MEDIUM-PRIORITY FEATURES:**

#### **6. Settings Page** ⚙️
**Current State:** Exists but minimal  
**Opportunities:**
- ✅ LLM model switching (already exists, enhance UI)
- ✅ API key management (view, rotate, test API connections)
- ✅ Agent configuration (enable/disable specific agents)
- ✅ Budget limits (set daily/monthly token spend caps)
- ✅ Notification preferences (email, Telegram, in-app)
- ✅ Theme switcher (light mode option for daytime use)

#### **7. Reporting & Export** 📊
**Opportunities:**
- ✅ Weekly digest email (summary of research, decisions made)
- ✅ Export artist briefs to PDF/DOCX (via FORGE agent)
- ✅ ROAS dashboard (integrate AUDIT agent's Google Sheets reports)
- ✅ Custom report builder (drag-drop metrics, auto-generate)

#### **8. Team Collaboration** 👥
**Current State:** Multi-user auth working (iqbal admin, basicjo viewer)  
**Opportunities:**
- ✅ User profile pages (see what each person is working on)
- ✅ Task assignment UI (assign to Iqbal, basicjo, or AI agent)
- ✅ Approval workflows (basicjo submits → Iqbal approves)
- ✅ Comment @mentions with notifications

---

### **LOW-PRIORITY / NICE-TO-HAVE:**

#### **9. Mobile Responsiveness** 📱
**Current State:** Desktop-first (3-column layout breaks on mobile)  
**Improvement:** Responsive layout (collapse sidebars on mobile, hamburger menu)

#### **10. Dark/Light Mode Toggle** 🌓
**Current State:** Dark cyberpunk theme only  
**Improvement:** Add light mode toggle in Settings (use Tailwind's `dark:` classes)

#### **11. Keyboard Shortcuts** ⌨️
**Improvement:** Add hotkeys (e.g., `Cmd+K` for search, `C` to create task, `?` for help)

---

## 🐛 **KNOWN ISSUES & BUGS**

### **High Priority:**
1. ⚠️ **Schedules route had extra spaces** (FIXED in commit 9142a07)
2. ⚠️ **Promise.all cascade failures** (FIXED in commit 9142a07 - switched to Promise.allSettled)
3. ⚠️ **Hardcoded agent swarm** (FIXED in commit 9142a07 - now pulls from /api/agents)

### **Medium Priority:**
4. ⚠️ **Activity feed only shows last 3 items** - Pagination needed for full history
5. ⚠️ **No error handling** if API endpoints fail (show friendly error message)
6. ⚠️ **No loading states** on slow API calls (add skeleton loaders)

### **Low Priority:**
7. ⚠️ **TaskDetailModal doesn't support file attachments** (comments are text-only)
8. ⚠️ **No task search** on Pipeline page (hard to find specific tasks)

---

## 🔒 **SECURITY CONSIDERATIONS**

### **Current Security:**
- ✅ JWT authentication on all API endpoints
- ✅ Password hashing (bcrypt)
- ✅ CORS restricted to localhost:5173
- ✅ Private GitHub repository
- ✅ API keys stored in `~/.bashrc` (not committed to Git)

### **Security Improvements Needed:**
- ⚠️ **HTTPS not enabled** (currently HTTP only) - Add SSL certificate
- ⚠️ **No rate limiting** on API endpoints - Add Fastify rate-limit plugin
- ⚠️ **JWT secrets in .env** - Move to secure vault (e.g., HashiCorp Vault)
- ⚠️ **No 2FA** on user accounts - Add TOTP or SMS verification
- ⚠️ **No audit log** for user actions (who did what when)

---

## 📈 **PERFORMANCE OPTIMIZATION OPPORTUNITIES**

### **Frontend:**
- ✅ Code splitting (lazy load pages with React.lazy)
- ✅ Image optimization (compress L3 logo, use WebP)
- ✅ API response caching (React Query with 5-minute stale time)
- ✅ Debounce search inputs (wait 300ms before API call)
- ✅ Virtual scrolling for long task lists (react-window)

### **Backend:**
- ✅ Database indexing (add indexes on frequently queried columns)
- ✅ Response compression (gzip/brotli)
- ✅ Connection pooling for database (Prisma already does this)
- ✅ Cache frequent queries (Redis layer for hot data)

### **Database:**
- Current size: Small (< 1MB)
- SQLite is fine for now, but consider PostgreSQL if data grows >100MB

---

## 🧪 **TESTING RECOMMENDATIONS**

**Current State:** No automated tests  
**Recommended:**
- ✅ **Unit tests** - Test API routes with Fastify's `inject()` method
- ✅ **Component tests** - Test React components with Vitest + Testing Library
- ✅ **E2E tests** - Test full user flows with Playwright
- ✅ **API contract tests** - Ensure backend/frontend API schemas match

**Test coverage goal:** 70%+ for critical paths (auth, task CRUD, agent calls)

---

## 🚀 **DEPLOYMENT WORKFLOW**

### **Current Process:**
1. Work locally with Claude Code
2. Commit changes: `git add . && git commit -m "message"`
3. Push to GitHub: `git push origin master`
4. Deploy to VPS: HEYMACHA runs `git pull && systemctl restart`

### **Recommended CI/CD:**
- ✅ GitHub Actions workflow (`.github/workflows/deploy.yml`)
- ✅ Auto-run tests on push
- ✅ Auto-deploy to VPS on merge to `master`
- ✅ Staging environment for testing before production

---

## 🎓 **LEARNING RESOURCES**

**For understanding the codebase:**
- **Fastify Docs:** https://fastify.dev/
- **Prisma Docs:** https://prisma.io/docs
- **shadcn/ui:** https://ui.shadcn.com/
- **Recharts:** https://recharts.org/

**For AI agent integration:**
- **OpenClaw Docs:** https://docs.openclaw.ai/
- **Agent spawn guide:** See `sessions_spawn` in OpenClaw docs

**For API integrations:**
- **Maton.ai Gateway:** `~/livescape-marketing/ls-commander/memory/maton-integrations.md`
- **Meta Ads API:** `~/livescape-marketing/ls-commander/META-API-TEST-RESULTS.md`

---

## 💡 **QUICK WINS (EASY IMPROVEMENTS)**

**If you want fast, visible improvements, start here:**

1. **Add loading spinners** (10 min) - Show spinner when fetching data
2. **Error boundaries** (15 min) - Catch React errors gracefully
3. **Toast notifications** (20 min) - Show success/error messages on actions
4. **Task search filter** (30 min) - Add search box to Pipeline page
5. **Agent heartbeat dots** (30 min) - Show green/red dots for agent status

---

## 📞 **CONTACTS & SUPPORT**

**Team:**
- **Iqbal (Owner):** iqbalaaameer@gmail.com, 0193325042
- **OpenClaw AI Assistant (HEYMACHA):** Telegram War Room

**Livescape Group:**
- **Website:** livescape.asia
- **Platform:** all-access.io

**GitHub Repository:** https://github.com/jasonaaa7786/missioncontrol  
**Production URL:** http://140.82.57.157:5173/dashboard

---

## 🏁 **READY TO BUILD?**

**Start here:**
1. Clone repo: `git clone https://github.com/jasonaaa7786/missioncontrol.git`
2. Install deps: `npm install`
3. Read this document
4. Pick a feature from **Quick Wins** or **High-Priority Improvements**
5. Make changes, test locally
6. Push to GitHub: `git add . && git commit && git push`
7. Tell HEYMACHA to deploy

**Good luck! 🚀**

---

**Last Updated:** 2026-03-13 14:13 UTC  
**Commit:** 9142a07  
**Status:** Production-ready, actively used by Livescape team
