# DeadStream React - Project Knowledge Primer

**Platform:** React + TypeScript + Chromium Kiosk  
**Created:** January 2, 2026  
**Status:** Ready to Begin Implementation

---

## Quick Start

**What is this project?**
A dedicated Raspberry Pi device for streaming Grateful Dead concerts from the Internet Archive. Single-purpose appliance with touchscreen interface.

**What changed?**
Platform pivot from PyQt5 (Python desktop app) to React (web app in Chromium kiosk mode).

**What's preserved?**
All domain knowledge, API integration patterns, database design, UX decisions, and scoring algorithms. ~60% of planning work transfers directly.

**Current phase:**
Beginning React implementation. Foundation is solid, now building the new platform.

---

## Essential Reading Order

### 1. Start Here (Context)
- **`platform-pivot-analysis.md`** - Understand what changed and why (15 min read)
- **`technical-decisions-react.md`** - Know the tech stack and rationale (20 min read)

### 2. Core Reference (Keep Open)
- **`database-schema-indexeddb.md`** - Data model and queries (reference)
- **`react-implementation-roadmap.md`** - Phase-by-phase plan (reference)

### 3. Original Planning (Background)
- **`00-api-analysis.md`** - Archive.org API patterns (still 100% valid)
- **`01-project-charter.md`** - Goals and philosophy (unchanged)
- **`05-technical-decisions.md`** - Original PyQt5 decisions (for context)

---

## What You're Building

### Hardware (Fixed)
- Raspberry Pi 4 (4GB)
- 7" Official Touch Display (1280×720, landscape)
- IQaudio DAC Pro
- 32GB microSD

### Software Stack (New)
```
React 18 + TypeScript
├── Vite (build tool)
├── Tailwind CSS (styling)
├── Dexie.js (IndexedDB wrapper)
├── HTML5 Audio API (playback)
└── Chromium Kiosk (display)
```

### Core Features
1. **Browse Shows** - By date, year, venue, random, top-rated
2. **Smart Selection** - Automatically pick best recording (SBD > Matrix > AUD)
3. **Stream Audio** - Direct from archive.org
4. **Touch Interface** - Large buttons, no typing required
5. **Offline Browsing** - 15K shows cached locally after first load

---

## Project Philosophy (Unchanged)

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

## Key Architectural Decisions

### Why React + Chromium?
| Decision | Rationale |
|----------|-----------|
| React over PyQt5 | Faster dev, better tooling, larger ecosystem |
| TypeScript over JavaScript | Catch errors at compile time |
| Vite over CRA | 10-100x faster dev server |
| IndexedDB over SQLite | Browser-native, no server needed |
| HTML5 Audio over VLC | Simpler, no dependencies |
| Chromium kiosk over Qt | Lighter weight, easier deployment |

### Data Architecture
- **Client Storage:** IndexedDB (15K shows = ~7.5MB)
- **API Strategy:** Pre-download catalog, lazy-load metadata
- **Query Performance:** <100ms for indexed searches
- **Lazy Loading:** sourceType, taper fetched on-demand

### UI Principles
- **Touch targets:** 60px minimum, 80px for primary controls
- **Typography:** 18px minimum, 24-32px headers
- **Transitions:** 300ms fade (same as PyQt5 research)
- **No hover:** All interactions tap-based
- **High contrast:** Readable in various lighting

---

## What Transfers from PyQt5 Version

### 100% Reusable (Copy/Translate)
- **API patterns** - Search, metadata, audio URLs (JavaScript instead of Python)
- **Database schema** - Field names, indexes, validation (IndexedDB instead of SQLite)
- **Scoring algorithm** - Recording quality weights (port to TypeScript)
- **UX flows** - Screen organization, navigation (React components instead of QWidgets)

### 40-60% Reusable (Concepts Only)
- **Audio playback** - Same resilience patterns, different implementation
- **Error handling** - Same philosophy, different syntax
- **State management** - Same patterns, React hooks instead of signals/slots

### Obsolete (Discard)
- All PyQt5 code (~2000-3000 lines)
- Python VLC integration
- Python import/path patterns
- Qt-specific patterns

---

## Current Status

### Completed (PyQt5 Version)
- ✅ Phase 1-3: API research, database design, show catalog
- ✅ Phase 4: Audio playback concepts (network resilience, buffering)
- ✅ Phase 5: Smart selection algorithm
- ✅ Phase 6-9: UI design (screens, components, navigation)

**Value Preserved:** Design decisions, domain knowledge, testing insights

### To Be Built (React Version)
- [ ] Phase 1: React project setup (2-4 hours)
- [ ] Phase 2: IndexedDB implementation (4-8 hours)
- [ ] Phase 3: API integration (4-6 hours)
- [ ] Phase 4: Audio player (6-10 hours)
- [ ] Phase 5: Recording selection (4-6 hours)
- [ ] Phase 6-9: UI screens (20-30 hours)
- [ ] Phase 10-12: Integration, deployment, polish (16-26 hours)

**Total Estimate:** 56-90 hours (7-11 weeks at 8 hrs/week)

---

## Development Workflow

### On macOS (Primary Development)
```bash
# Start dev server
npm run dev

# Edit code → instant hot reload in browser
# Use Chrome DevTools for debugging
# Test touch interactions with browser touch emulation

# Run tests
npm run test

# Build for production
npm run build
```

### On Raspberry Pi (Validation)
```bash
# Pull latest code
git pull

# Build production bundle
npm run build

# Test in Chromium
chromium-browser --kiosk --app=http://localhost:3000
```

### Git Workflow
```bash
# After completing each task
git add .
git commit -m "Phase X.Y: Descriptive message"
git push origin main
```

---

## Success Criteria (Updated for React)

### Technical
- [ ] Streams audio from archive.org without CORS issues
- [ ] IndexedDB stores 15,000 shows efficiently
- [ ] Touch targets meet 60px minimum
- [ ] Screen transitions smooth at 60fps
- [ ] Audio playback stable for 3+ hour shows
- [ ] Chromium kiosk mode reliable on Pi
- [ ] Build creates optimized bundle (<500KB gzipped)

### Development
- [ ] Hot reload works on macOS
- [ ] TypeScript shows no errors
- [ ] Tests pass for all core functions
- [ ] Can deploy to Pi without code changes
- [ ] Browser DevTools debugging works

### User Experience
- [ ] Browse by date, year, venue, random
- [ ] Smart recording selection working
- [ ] Player controls responsive to touch
- [ ] Settings persist across sessions
- [ ] Error messages clear and helpful

---

## Risk Assessment

### High Priority (Mitigate Immediately)
1. **CORS with archive.org**
   - Risk: Browser may block audio streaming
   - Mitigation: Test in Phase 3 with real show
   - Fallback: Proxy server if needed

2. **IndexedDB capacity**
   - Risk: 15K shows may hit browser limits
   - Mitigation: Test with full dataset in Phase 2
   - Fallback: Server-side database + API

3. **Chromium performance on Pi**
   - Risk: Browser slower than native app
   - Mitigation: Performance testing in Phase 11
   - Optimization: Code splitting, lazy loading

### Medium Priority (Monitor)
- Touch responsiveness (test early on hardware)
- Audio codec support (test FLAC, MP3, OGG)
- Battery usage if going portable

### Low Priority (Acceptable)
- Learning curve (expected, manageable)
- Build complexity (Vite handles it)

---

## Next Steps

### Immediate Actions (Today)

1. **Install Node.js 18+** (if not already installed)
   ```bash
   node --version  # Should be v18.0.0 or higher
   ```

2. **Create React project**
   ```bash
   npm create vite@latest deadstream-react -- --template react-ts
   cd deadstream-react
   npm install
   npm run dev
   ```

3. **Verify setup**
   - Browser opens to http://localhost:5173
   - See React + Vite welcome screen
   - Edit `src/App.tsx`, see instant update

4. **Read Phase 1 tasks** in `react-implementation-roadmap.md`

5. **Complete Phase 1.1-1.3** (project structure, dependencies, Tailwind)

### This Week

- [ ] Complete Phase 1 (project setup) - 2-4 hours
- [ ] Start Phase 2 (IndexedDB) - Begin with schema definition
- [ ] Set up GitHub repository
- [ ] Commit after each completed task

### Next Week

- [ ] Complete Phase 2 (database) - 4-8 hours
- [ ] Start Phase 3 (API integration)
- [ ] Test with real archive.org data
- [ ] Validate CORS works for audio streaming

---

## Common Questions

**Q: Do I need to learn React before starting?**
A: No. The roadmap teaches React concepts as you go. Basic JavaScript knowledge sufficient.

**Q: Will this be faster than the PyQt5 version?**
A: Yes. You already know the problem space. Focus is on learning React, not figuring out requirements.

**Q: Can I still use the PyQt5 code as reference?**
A: Yes for concepts (algorithms, patterns), no for implementation (different framework).

**Q: What if I get stuck?**
A: Each phase has detailed examples, tests, and success criteria. Follow them sequentially.

**Q: When will I see something working?**
A: Phase 1 = project runs. Phase 3 = API calls work. Phase 4 = audio plays. Phase 6 = UI appears.

**Q: How do I know I'm ready for the next phase?**
A: Complete all deliverables, pass all tests, understand the concepts. Don't skip ahead.

---

## Resources

### Documentation
- React: https://react.dev (official tutorial is excellent)
- TypeScript: https://www.typescriptlang.org/docs/handbook/intro.html
- Vite: https://vitejs.dev/guide/
- Dexie.js: https://dexie.org
- Tailwind: https://tailwindcss.com/docs

### Tools
- Chrome DevTools: Built-in browser debugging
- React DevTools: Browser extension for React
- VS Code: Recommended editor (excellent TypeScript support)

### Community
- React Discord: https://discord.gg/react
- Stack Overflow: Tag questions with [reactjs] [typescript]

---

## File Organization Reference

```
deadstream-react/
├── src/
│   ├── components/
│   │   ├── atoms/          # Buttons, inputs, icons
│   │   ├── molecules/      # ShowCard, VolumeControl
│   │   ├── organisms/      # ShowList, PlayerWidget
│   │   └── screens/        # Browse, Player, Settings
│   ├── services/
│   │   ├── archiveApi.ts   # API client
│   │   ├── database.ts     # IndexedDB + Dexie
│   │   ├── audioPlayer.ts  # Audio control
│   │   └── scoringEngine.ts # Recording selection
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React Context providers
│   ├── utils/              # Helper functions
│   ├── types/              # TypeScript interfaces
│   └── App.tsx
├── public/                 # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

## Motivation Reminders

**Why this is worth doing:**
- Learn modern web development (React, TypeScript)
- Build something unique and personal
- Combine hardware + software skills
- Create a beautiful, functional music player
- Deep dive into a fascinating music collection

**When it gets hard:**
- Remember: You already solved the hard problems (API, data, UX)
- This is just learning a new language for the same concepts
- Each small step forward is progress
- The end result will be worth it

**You've got this.** The foundation is solid. Now build something amazing.

---

## Document Updates

This primer will be updated as the project progresses:

- **January 2, 2026:** Initial version (platform pivot)
- **Future:** Add lessons learned, update status, revise estimates

---

**Ready to begin? Start with Phase 1 in `react-implementation-roadmap.md`**
