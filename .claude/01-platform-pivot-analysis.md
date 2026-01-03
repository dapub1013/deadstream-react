# Platform Pivot Analysis: PyQt5 → React + Chromium

**Date:** January 2, 2026  
**Status:** Planning Phase  
**Original Platform:** PyQt5 on Raspberry Pi OS Desktop  
**New Platform:** React web app in Chromium kiosk mode

---

## Executive Summary

This document analyzes the impact of pivoting from a PyQt5 desktop application to a React web application displayed in Chromium. The analysis identifies what conceptual work carries forward, what needs complete rethinking, and what becomes obsolete.

**Key Finding:** Approximately 60% of planning work remains relevant. The Internet Archive API integration, data architecture, and UX principles transfer directly. The UI implementation, audio playback mechanism, and development workflow change significantly.

---

## What Stays the Same (Direct Transfer)

### 1. Internet Archive API Integration ✅ FULLY REUSABLE

**Status:** 100% transferable

**Components:**
- API endpoints and query patterns
- Search and metadata extraction logic
- Recording quality scoring algorithm
- Show selection cascading logic
- Rate limiting strategy
- Database update mechanisms

**From `00-api-analysis.md`:**
- All API call examples remain valid
- Scoring algorithm (lines 67-111) transfers to JavaScript/TypeScript
- Database population strategy unchanged
- Weekly update pattern still applicable

**Action Required:** 
- Port Python scoring logic to JavaScript
- API calls will use `fetch()` instead of `requests`
- Same endpoints, same data structures

---

### 2. Data Architecture & Database ✅ FULLY REUSABLE

**Status:** 100% transferable (database choice changes)

**Conceptual Elements That Transfer:**
- Show metadata schema
- Query patterns (by date, venue, year, rating)
- Smart selection preferences system
- Multiple recordings per show date model
- Indexing strategy

**From `05-technical-decisions.md` (lines 83-103):**
```sql
-- This schema design is platform-agnostic
CREATE TABLE shows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    venue TEXT,
    city TEXT,
    state TEXT,
    identifier TEXT UNIQUE NOT NULL,
    avg_rating REAL,
    -- etc.
);
```

**What Changes:**
- SQLite → Browser-based storage or server-side database
- Python queries → JavaScript/SQL or GraphQL
- File location: local SQLite file → IndexedDB, LocalStorage, or server DB

**Recommendation:** 
- For client-side: IndexedDB for ~15,000 shows (works well in browsers)
- For server-side: PostgreSQL or keep SQLite (excellent for read-heavy workloads)
- Hybrid: Initial catalog in IndexedDB, lazy-load full metadata from server

---

### 3. UX Principles & User Flows ✅ FULLY REUSABLE

**Status:** 100% conceptually transferable

**From `01-project-charter.md` and touch guidelines:**
- Touch-first design principles
- Large hit targets (60x60px minimum)
- Minimal text input
- Browse modes: by date, year, venue, random, top-rated
- "Now Playing" screen layout concepts
- Navigation hierarchy

**UI Design Decisions That Transfer:**
- Screen organization (Browse, Player, Settings)
- Button sizing standards
- High contrast for readability
- No hover-dependent UI

**What Changes:**
- Implementation language (QWidget → React components)
- Animation library (QPropertyAnimation → CSS/Framer Motion)
- Touch event handling (PyQt5 touch → React onClick)

---

### 4. Audio Quality Preferences ✅ CONCEPT REUSABLE

**Status:** Algorithm transfers, implementation changes

**From `05-technical-decisions.md` (lines 359-383):**
- Scoring weights system
- Source type hierarchy (SBD > Matrix > AUD)
- Format preference (FLAC > MP3 320 > MP3 128)
- Community rating integration
- Taper reputation tracking

**What Changes:**
- Configuration storage: YAML files → localStorage/server preferences
- Preference management: Python PreferenceManager → React Context/state
- Validation: Python → JavaScript

**Implementation Path:**
```javascript
// Same conceptual algorithm, different language
const scoringWeights = {
  sourceType: 0.35,
  format: 0.25,
  communityRating: 0.20,
  lineage: 0.10,
  taper: 0.10
};
```

---

### 5. Project Philosophy & Quality Standards ✅ FULLY REUSABLE

**Status:** 100% applicable

**From `01-project-charter.md` Success Criteria:**
- "Occasional reboot is acceptable"
- "Manual updates are acceptable" 
- "Audio playback should be stable over multi-hour sessions"
- Learning-focused approach
- Step-by-step progression

**From `07-project-guidelines.md`:**
- Testing philosophy
- Error handling patterns (concept, not Python-specific)
- Documentation standards
- Code quality expectations

---

## What Needs Significant Rework (Adapt & Translate)

### 1. Audio Playback System ⚠️ MAJOR REDESIGN

**Status:** Complete reimplementation required

**Old Approach (PyQt5 + VLC Python bindings):**
- `src/audio/resilient_player.py` - VLC instance management
- `src/audio/vlc_config.py` - Platform-aware configuration
- Python-VLC bindings for playback control
- ALSA/CoreAudio direct audio output

**New Approach (React + HTML5 Audio):**
- HTML5 `<audio>` element for playback
- JavaScript Media API
- Browser handles all audio codec/format support
- Native browser buffering and streaming

**Key Differences:**

| Aspect | PyQt5 + VLC | React + HTML5 |
|--------|-------------|---------------|
| Audio backend | VLC media player | Browser audio engine |
| Platform config | ALSA vs CoreAudio | Browser-agnostic |
| Streaming | VLC network cache | Browser fetch + buffer |
| Controls | Python API calls | JavaScript Audio API |
| Error handling | Python try/except | JavaScript promises/async |

**Advantages of Browser Audio:**
- No VLC installation needed
- Cross-platform by default (macOS dev, Pi production)
- Built-in format support
- Better error messages
- Simpler codebase

**Challenges:**
- Less control over buffering
- Different network resilience approach
- CORS considerations for archive.org

**Implementation Pattern:**
```javascript
// Conceptually similar to Python ResilientPlayer
class ResilientAudioPlayer {
  constructor() {
    this.audio = new Audio();
    this.setupErrorHandling();
    this.setupNetworkMonitoring();
  }
  
  async play(url) {
    this.audio.src = url;
    await this.audio.play();
  }
  
  // Similar recovery logic to Python version
  handleError(error) {
    // Retry logic, buffering strategies
  }
}
```

---

### 2. UI Framework & Component Architecture ⚠️ COMPLETE REWRITE

**Status:** Conceptual design transfers, implementation is 100% new

**Old Approach:**
- PyQt5 widgets (`QWidget`, `QMainWindow`, `QStackedWidget`)
- Signal/slot event system
- `.py` files defining UI programmatically
- QPropertyAnimation for transitions

**New Approach:**
- React components (functional components + hooks)
- Props/state management
- JSX for declarative UI
- CSS transitions or Framer Motion

**Translation Map:**

| PyQt5 Concept | React Equivalent |
|---------------|------------------|
| `QMainWindow` | `<App>` component |
| `QStackedWidget` | React Router or conditional rendering |
| `QWidget` subclasses | React functional components |
| Signals/slots | Event handlers + callbacks |
| `QPropertyAnimation` | CSS transitions / Framer Motion |
| `.show_screen('player')` | `navigate('/player')` or `setScreen('player')` |
| Keyboard shortcuts | Event listeners + key detection |

**Example Translation:**

**PyQt5:**
```python
class PlayerScreen(QWidget):
    def __init__(self):
        super().__init__()
        self.play_button = QPushButton("Play")
        self.play_button.clicked.connect(self.on_play)
```

**React:**
```jsx
function PlayerScreen() {
  const handlePlay = () => {
    // Play logic
  };
  
  return (
    <button onClick={handlePlay}>Play</button>
  );
}
```

**What Transfers:**
- Screen organization (Browse, Player, Settings)
- Component hierarchy concepts
- State management patterns (different implementation)
- Event-driven architecture

**What's Lost:**
- All existing PyQt5 code (phases 6-9)
- Python-specific patterns
- Qt Designer layouts (if any)

---

### 3. Development Workflow ⚠️ SIGNIFICANT CHANGES

**Status:** Conceptual approach similar, tools completely different

**Old Workflow:**
```
macOS (PyQt5 development)
  → Git push
    → Raspberry Pi (git pull, run Python)
```

**New Workflow:**
```
macOS (React development)
  → npm run build
    → Git push
      → Raspberry Pi (git pull, serve static files, open Chromium)
```

**Tool Changes:**

| Old | New |
|-----|-----|
| Python 3.9+ | Node.js + npm/yarn |
| PyQt5 | React 18+ |
| VLC Python bindings | HTML5 Audio API |
| SSH + X11 forwarding | HTTP server + browser |
| `python main_window.py` | `npm run dev` or `npm start` |

**New Development Tools:**
- **Build system:** Vite or Create React App
- **Package manager:** npm or yarn
- **Dev server:** Built-in hot reload
- **Testing:** Jest + React Testing Library
- **Linting:** ESLint + Prettier

**Advantages:**
- Faster hot-reload development
- Better debugging tools (Chrome DevTools)
- No X11 forwarding needed
- Test on any device with browser

**New Skills Required:**
- JavaScript/TypeScript
- React hooks (useState, useEffect, useContext)
- CSS-in-JS or CSS modules
- npm/yarn workflow
- Browser APIs

---

### 4. Settings & Configuration ⚠️ STORAGE MECHANISM CHANGES

**Status:** Concept identical, implementation different

**Old Approach:**
- YAML files (`config/preferences.yaml`)
- Python YAML parser
- File I/O for persistence
- Preference classes in Python

**New Approach:**
- Browser `localStorage` or `IndexedDB`
- JSON format (native to JavaScript)
- `localStorage.setItem()` / `getItem()`
- React Context for preferences state

**Translation:**

**Python:**
```python
# Load preferences
with open('config/preferences.yaml') as f:
    prefs = yaml.safe_load(f)

# Update
prefs['auto_play'] = True
with open('config/preferences.yaml', 'w') as f:
    yaml.dump(prefs, f)
```

**JavaScript:**
```javascript
// Load preferences
const prefs = JSON.parse(
  localStorage.getItem('preferences') || '{}'
);

// Update
prefs.autoPlay = true;
localStorage.setItem('preferences', JSON.stringify(prefs));
```

**Conceptual Equivalence:**
- Same preference categories (Network, Audio, Display)
- Same validation logic
- Same preset system (balanced, audiophile, crowd_favorite)

---

### 5. Screen Transitions & Animations ⚠️ DIFFERENT LIBRARY

**Status:** Same visual goals, different implementation

**Old Approach (from `05-technical-decisions.md` lines 425-433):**
- QPropertyAnimation with 300ms fade
- Easing curves: InOutQuad
- Signal-based completion callbacks

**New Approach:**
- CSS transitions
- React transition libraries (Framer Motion, React Transition Group)
- JavaScript animation timing

**Example Translation:**

**PyQt5:**
```python
animation = QPropertyAnimation(self.fade_effect, b"opacity")
animation.setDuration(300)
animation.setStartValue(1.0)
animation.setEndValue(0.0)
animation.setEasingCurve(QEasingCurve.InOutQuad)
animation.finished.connect(callback)
animation.start()
```

**React (CSS):**
```css
.screen-transition {
  opacity: 1;
  transition: opacity 300ms cubic-bezier(0.42, 0, 0.58, 1);
}

.screen-transition.exiting {
  opacity: 0;
}
```

**React (Framer Motion):**
```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3, ease: 'easeInOut' }}
>
  {children}
</motion.div>
```

---

### 6. Testing Strategy ⚠️ COMPLETE TOOLCHAIN CHANGE

**Status:** Philosophy transfers, tools are entirely different

**Old Testing:**
- PyQt5 test utilities (`QTest`)
- Python `unittest` or `pytest`
- Manual GUI testing
- Integration tests in Python

**New Testing:**
- Jest (JavaScript test runner)
- React Testing Library
- Vitest (if using Vite)
- Browser-based integration tests

**Conceptual Similarity:**
- Unit test components
- Integration test workflows
- Mock API responses
- Test user interactions

**Example Translation:**

**Python:**
```python
from PyQt5.QtTest import QTest

def test_screen_transition():
    window.show_screen('player')
    QTest.qWait(600)  # Wait for animation
    assert window.current_screen == 'player'
```

**JavaScript:**
```javascript
import { render, screen, waitFor } from '@testing-library/react';

test('screen transition', async () => {
  const { container } = render(<App />);
  fireEvent.click(screen.getByText('Player'));
  
  await waitFor(() => {
    expect(container).toHaveClass('player-screen');
  }, { timeout: 600 });
});
```

---

## What Becomes Obsolete (Discard)

### 1. PyQt5-Specific Code ❌ COMPLETELY OBSOLETE

**Discard:**
- All files in `src/ui/` (phases 6-9 implementation)
- PyQt5 widget subclasses
- Qt signal/slot connections
- QML/Qt Designer files (if any)
- Python UI event handling

**Estimated Loss:** ~2,000-3,000 lines of Python UI code

**Why It's Okay:**
- UI design concepts documented (can rebuild in React)
- Backend logic (API, database queries) is separate
- Learning experience remains valuable
- Faster rebuild with React knowledge

---

### 2. Python VLC Integration ❌ OBSOLETE

**Discard:**
- `src/audio/vlc_player.py`
- `src/audio/vlc_config.py` (platform-aware VLC setup)
- `src/audio/resilient_player.py` (Python VLC wrapper)
- All VLC instance configuration code

**Replacement:** HTML5 Audio API (built into browsers)

**Why Change is Good:**
- Simpler: No VLC installation on Pi
- More portable: Works on any device with browser
- Better error messages from browser
- Native format support

---

### 3. Python-Specific Imports & Project Structure ❌ OBSOLETE

**Discard:**
- `08-import-and-architecture-reference.md` (Python sys.path manipulation)
- `src/` directory structure (replace with standard React structure)
- `__init__.py` files
- Python path manipulation patterns

**Replacement:** 
```
deadstream-react/
├── src/
│   ├── components/      # React components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API calls, database
│   ├── utils/          # Helper functions
│   └── App.jsx
├── public/             # Static assets
└── package.json
```

---

### 4. Raspberry Pi OS Desktop Dependency ❌ OBSOLETE

**Old Requirement:**
- Full desktop environment (Wayland compositor)
- X11 forwarding for development
- PyQt5 system dependencies

**New Requirement:**
- Chromium browser only
- Can use Raspberry Pi OS Lite (lighter weight)
- Boot directly to kiosk mode

**Deployment Simplification:**
```bash
# Old
sudo apt install python3-pyqt5 python3-vlc
python3 main_window.py

# New
chromium-browser --kiosk --app=http://localhost:3000
```

---

### 5. Python Testing Infrastructure ❌ OBSOLETE

**Discard:**
- Python test utilities
- PyQt5 test event simulation
- Python assertion libraries (for UI tests)

**Keep:**
- Testing philosophy
- Integration test concepts
- Error handling patterns

---

## Impact on Phase Progress

### Completed Phases - Value Retained

**Phase 1-3: Foundation & Data (FULL VALUE RETAINED)**
- API research → Still valid
- Database design → Adapt to new storage
- Query patterns → Translate to JavaScript
- **Estimated reuse:** 85%

**Phase 4: Audio Playback (CONCEPT RETAINED, CODE LOST)**
- Network resilience concepts → Apply in JavaScript
- Buffering strategies → Translate to HTML5 Audio
- Error recovery patterns → Reimplement in JS
- **Estimated reuse:** 40% (concepts only)

**Phase 5: Smart Selection (FULL VALUE RETAINED)**
- Scoring algorithm → Port to JavaScript
- Preference system → Translate to localStorage
- Test cases → Rewrite in Jest
- **Estimated reuse:** 80%

**Phase 6-9: UI Implementation (FULL CODE LOSS, DESIGN RETAINED)**
- Screen designs → Rebuild in React
- Component hierarchy → Same structure, new framework
- Navigation patterns → React Router
- **Estimated reuse:** 25% (design docs only, all code lost)

---

## Migration Strategy Recommendations

### 1. Preserve Conceptual Documentation

**Keep and Update:**
- `00-api-analysis.md` - Minimal changes (Python → JS examples)
- `01-project-charter.md` - Update platform references
- UX design documents - Full reuse
- Scoring algorithm documentation - Port to JS

**Archive:**
- `07-project-guidelines.md` - Python-specific rules
- `08-import-and-architecture-reference.md` - Python imports

**Create New:**
- `React-development-workflow.md`
- `Browser-audio-implementation.md`
- `IndexedDB-vs-server-database.md`

---

### 2. Recommended Phase Restart

**Phase 1 (NEW): React Project Setup**
- Initialize React app (Vite recommended)
- Set up TypeScript (recommended for type safety)
- Configure ESLint, Prettier
- Create component structure
- **Estimated time:** 2-4 hours

**Phase 2 (NEW): Browser Database Implementation**
- Implement IndexedDB wrapper or server database
- Port show data schema
- Create query functions in JavaScript
- Test with existing show data
- **Estimated time:** 4-8 hours

**Phase 3 (NEW): Archive.org API Integration**
- Port API client to JavaScript (fetch)
- Implement metadata extraction
- Port scoring algorithm
- Test with real shows
- **Estimated time:** 4-6 hours

**Phase 4 (NEW): HTML5 Audio Player**
- Implement audio component
- Network resilience logic
- Buffering strategies
- Playlist management
- **Estimated time:** 6-10 hours

**Phase 5 (NEW): React UI Foundation**
- Main app structure
- Screen routing
- Component library setup
- Styling system (CSS modules, Tailwind, or styled-components)
- **Estimated time:** 8-12 hours

**Phase 6-8: Screen Implementation**
- Browse screen components
- Player screen
- Settings screen
- **Estimated time:** 12-16 hours

**Phase 9-10: Integration & Polish**
- End-to-end testing
- Performance optimization
- Chromium kiosk setup
- **Estimated time:** 8-12 hours

**Total Estimated Time:** 44-68 hours (vs. original 10-16 weeks)

**Why Faster:**
- Existing design decisions made
- Clear requirements
- Proven API patterns
- No exploratory learning phase

---

### 3. Technology Stack Recommendations

**Core:**
- **Framework:** React 18+ with functional components
- **Language:** TypeScript (type safety, better tooling)
- **Build tool:** Vite (faster than Create React App)
- **Routing:** React Router v6 (if multi-page) or state-based navigation

**Data:**
- **Client storage:** IndexedDB (better for large datasets than localStorage)
- **IndexedDB library:** Dexie.js (excellent TypeScript support)
- **Alternative:** Server with SQLite + API (if client storage too complex)

**Audio:**
- **Playback:** Native HTML5 `<audio>` element
- **State management:** React hooks (useState, useEffect)
- **No external libraries needed initially**

**Styling:**
- **Option A:** Tailwind CSS (utility-first, rapid development)
- **Option B:** CSS Modules (scoped styles, traditional CSS)
- **Option C:** styled-components (CSS-in-JS)
- **Recommendation:** Tailwind for speed, aligns with touch-first large targets

**Testing:**
- **Test runner:** Vitest (Vite-native) or Jest
- **Component tests:** React Testing Library
- **Integration:** Playwright or Cypress (optional)

**Development:**
- **Package manager:** npm or yarn
- **Code quality:** ESLint + Prettier
- **Version control:** Same Git workflow

---

### 4. What to Do Today

**Immediate Next Steps:**

1. **Create new React project:**
```bash
npm create vite@latest deadstream-react -- --template react-ts
cd deadstream-react
npm install
```

2. **Install essential dependencies:**
```bash
npm install dexie  # IndexedDB wrapper
npm install react-router-dom  # If using routing
```

3. **Port scoring algorithm first (quick win):**
   - Copy from Phase 5 documentation
   - Translate to TypeScript
   - Write unit tests
   - Validates that logic translates cleanly

4. **Stub out component structure:**
```
src/
├── components/
│   ├── Browse/
│   ├── Player/
│   └── Settings/
├── services/
│   ├── archiveApi.ts
│   ├── database.ts
│   └── audioPlayer.ts
└── App.tsx
```

5. **Port show database schema to IndexedDB:**
```typescript
// services/database.ts
import Dexie from 'dexie';

class ShowDatabase extends Dexie {
  shows: Dexie.Table<Show, number>;
  
  constructor() {
    super('DeadStreamDB');
    this.version(1).stores({
      shows: '++id, date, identifier, venue, avg_rating'
    });
  }
}

export const db = new ShowDatabase();
```

---

## Risk Assessment

### High Risk (Immediate Attention Required)

**CORS Issues with Archive.org**
- **Risk:** Browser security may block direct audio streaming
- **Mitigation:** Test immediately with sample show
- **Fallback:** Proxy server on Pi if needed

**IndexedDB Size Limits**
- **Risk:** ~15,000 shows may approach browser storage limits
- **Mitigation:** Test with full dataset early
- **Fallback:** Server-side database + API

**Audio Codec Support**
- **Risk:** Some archive.org formats may not work in browsers
- **Mitigation:** Test FLAC, MP3, OGG early
- **Fallback:** Server-side transcoding if needed

### Medium Risk (Monitor)

**Chromium Performance on Pi**
- **Risk:** Browser may be slower than native Qt
- **Mitigation:** Performance testing on actual Pi hardware
- **Optimization:** Minimize JavaScript, optimize rendering

**Touch Responsiveness**
- **Risk:** Browser touch handling different from Qt
- **Mitigation:** Early testing on touch display
- **Solution:** CSS touch-action, preventDefault patterns

### Low Risk (Acceptable)

**Learning Curve**
- **Risk:** React learning overhead
- **Mitigation:** Strong conceptual foundation from PyQt5 experience
- **Reality:** Faster development once familiar

**Build Complexity**
- **Risk:** npm/build process adds complexity
- **Mitigation:** Vite handles most automatically
- **Reality:** Better DX than Python in practice

---

## Success Criteria (Updated)

**Technical:**
- [ ] Streams audio from archive.org without CORS issues
- [ ] IndexedDB stores 15,000 shows efficiently
- [ ] Touch targets 60x60px minimum (same as PyQt5)
- [ ] Screen transitions smooth at 60fps
- [ ] Audio playback stable for 3+ hour shows
- [ ] Chromium kiosk mode works reliably on Pi

**Development:**
- [ ] Hot reload working on macOS
- [ ] Build process creates optimized production bundle
- [ ] Can test on Pi without code changes
- [ ] Git workflow: develop on Mac, deploy to Pi

**UX:**
- [ ] Browse by date, year, venue, random
- [ ] Smart recording selection working
- [ ] Player controls responsive to touch
- [ ] Settings persist across sessions

---

## Conclusion

**Overall Assessment:** This pivot is **technically sound and strategically smart**.

**Preserved Value:**
- API integration strategy
- Data architecture
- UX design decisions
- Quality scoring algorithm
- Testing philosophy

**Net Loss:**
- ~2,000-3,000 lines of Python UI code
- PyQt5 learning investment (but knowledge transferable)
- Phase 6-9 implementation time

**Net Gain:**
- Simpler deployment (browser vs. Qt dependencies)
- Better development experience (hot reload, DevTools)
- More portable (any device with browser)
- Larger ecosystem (React community)
- Easier testing (React Testing Library)

**Time Impact:**
- Original estimate: 10-16 weeks
- With pivot: 44-68 hours (4-8.5 weeks at 8 hours/week)
- **Faster than original despite restart**

**Recommendation:** Proceed with React implementation. The conceptual work is solid and transferable. The platform change aligns better with modern web development practices and the "always connected" use case.

---

**Next Document:** Create detailed React implementation roadmap
