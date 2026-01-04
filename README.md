# DeadStream React

**A dedicated Raspberry Pi device for streaming Grateful Dead concerts from the Internet Archive.**

Single-purpose appliance with touchscreen interface, built with React + TypeScript.

---

## Quick Start

### What is DeadStream?

DeadStream is a React web application that runs in Chromium kiosk mode on a Raspberry Pi 4, providing a dedicated interface for browsing and streaming 15,000+ Grateful Dead concerts from the Internet Archive.

**Platform:** React + TypeScript + Chromium Kiosk
**Status:** Phase 4 Complete - Audio Player Component
**Created:** January 2, 2026

### Tech Stack

```
React 18 + TypeScript
├── Vite (build tool)
├── Tailwind CSS (styling)
├── Dexie.js (IndexedDB wrapper)
├── HTML5 Audio API (playback)
└── Chromium Kiosk (display)
```

### Hardware (Target Platform)

- **Raspberry Pi 4** (4GB RAM)
- **7" Official Touch Display** (1280×720, landscape)
- **IQaudio DAC Pro** (audio output)
- **32GB microSD** (storage)

---

## Core Features

1. **Browse Shows** - By date, year, venue, random, top-rated
2. **Smart Selection** - Automatically pick best recording (SBD > Matrix > AUD)
3. **Stream Audio** - Direct from archive.org
4. **Touch Interface** - Large buttons, no typing required
5. **Offline Browsing** - 15K shows cached locally after first load

---

## Development

### Prerequisites

- Node.js 18+
- Git

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/deadstream-react.git
cd deadstream-react

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Commands

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests in watch mode
npm run lint         # Run ESLint
```

### Development Workflow

**On macOS (Primary Development):**
- Edit code → instant hot reload in browser
- Use Chrome DevTools for debugging
- Test touch interactions with browser touch emulation

**On Raspberry Pi (Validation):**
```bash
git pull
npm run build
chromium-browser --kiosk --app=http://localhost:3000
```

---

## Project Status

### Completed (PyQt5 Version)
- ✅ API research and integration patterns
- ✅ Database design and schema
- ✅ Audio playback concepts
- ✅ Smart selection algorithm
- ✅ UI/UX design specifications

**Value Preserved:** ~60% of planning work transfers directly to React implementation.

### Completed Phases
- [x] **Phase 1:** React project setup (2-4 hours)
- [x] **Phase 2:** IndexedDB implementation (4-8 hours)
- [x] **Phase 3:** API integration (4-6 hours)

### Current Phase
- [ ] **Phase 4:** Audio player (6-10 hours)

### Upcoming Phases
- [ ] Phase 5: Recording selection (4-6 hours)
- [ ] Phase 6-9: UI screens (20-30 hours)
- [ ] Phase 10-12: Integration, deployment, polish (16-26 hours)

**Total Estimate:** 56-90 hours (7-11 weeks at 8 hrs/week)

---

## Architecture

### Data Strategy
- **Client Storage:** IndexedDB (15K shows = ~7.5MB)
- **API Strategy:** Pre-download catalog, lazy-load metadata
- **Query Performance:** <100ms for indexed searches

### UI Principles
- **Touch targets:** 60px minimum, 80px for primary controls
- **Typography:** 18px minimum, 24-32px headers
- **No hover:** All interactions tap-based
- **High contrast:** Readable in various lighting

### Why React + Chromium?

| Decision | Rationale |
|----------|-----------|
| React over PyQt5 | Faster dev, better tooling, larger ecosystem |
| TypeScript over JavaScript | Catch errors at compile time |
| Vite over CRA | 10-100x faster dev server |
| IndexedDB over SQLite | Browser-native, no server needed |
| HTML5 Audio over VLC | Simpler, no dependencies |
| Chromium kiosk over Qt | Lighter weight, easier deployment |

---

## Documentation

### For Developers
- **[Quick Reference](docs/development/quick-reference.md)** - Commands and common patterns
- **[Guidelines](docs/development/guidelines.md)** - Standards and best practices
- **[Import Architecture](docs/development/import-architecture.md)** - Module organization

### Architecture & Design
- **[Technical Decisions](docs/architecture/technical-decisions.md)** - Tech stack rationale
- **[Database Schema](docs/architecture/database-schema.md)** - IndexedDB design

### Roadmap
- **[Implementation Roadmap](docs/roadmap/implementation.md)** - Phase-by-phase plan
- **[Task Breakdown](docs/roadmap/task-breakdown.md)** - Granular tasks

### Historical Context
- **[Platform Pivot Analysis](docs/archive/01-platform-pivot-analysis.md)** - Why PyQt5 → React
- **[API Analysis](docs/archive/10-api-analysis.md)** - Archive.org integration (still valid)
- **[Project Charter](docs/archive/11-project-charter.md)** - Original goals

---

## Project Philosophy

**This is a learning journey, not a race.**

- Step-by-step progression through phases
- Understand before moving forward
- Quality over speed
- Document as you go
- Commit often

**Personal Project Standards:**
- Occasional reboot acceptable
- Manual updates acceptable
- Minor UI imperfections acceptable
- Audio playback must be stable
- Code must be understandable

---

## Contributing

This is a personal learning project, but insights and suggestions are welcome! Please open an issue to discuss before submitting PRs.

### Development Standards
- Follow existing code patterns
- Write tests for new features
- Update documentation
- Use descriptive commit messages

---

## License

This project is licensed under the MIT License - see LICENSE file for details.

---

## Acknowledgments

- **Internet Archive** for hosting the Grateful Dead collection
- **Grateful Dead** for allowing free streaming of their concerts