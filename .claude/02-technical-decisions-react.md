# Technical Decisions Record - React Platform

**Last Updated:** January 2, 2026  
**Platform:** React Web Application  
**Previous Platform:** PyQt5 Desktop (see archive for comparison)

---

## Hardware (Unchanged)

- **Raspberry Pi:** Pi 4 Model B (4GB RAM)
- **DAC:** IQaudio DAC Pro (I²S)
- **Display:** Official Raspberry Pi Touch Display 2 (7", 1280×720 landscape)
- **Storage:** 32GB microSD
- **Power:** Official 5V 3A USB-C power supply

---

## Software Stack (Updated for React)

### Platform Choice: React + Chromium Kiosk

**Core Technologies:**
- **Framework:** React 18+ (functional components with hooks)
- **Language:** TypeScript (type safety, better DX)
- **Build Tool:** Vite (fast HMR, optimized builds)
- **Browser:** Chromium in kiosk/fullscreen mode
- **OS:** Raspberry Pi OS Lite (64-bit) - minimal footprint

**Why This Stack:**

| Decision | Rationale |
|----------|-----------|
| React over PyQt5 | Faster development, better tooling, larger ecosystem |
| TypeScript over JavaScript | Catch errors at compile time, better IDE support |
| Vite over Create React App | 10-100x faster dev server, better build optimization |
| Chromium kiosk over Electron | No additional dependencies, native to Pi |
| Pi OS Lite over Desktop | Minimal resource usage, faster boot |

### Data Storage

**Client-Side Database:**
- **Primary:** IndexedDB via Dexie.js
- **Capacity:** 15,000+ shows with full metadata
- **Query Performance:** < 100ms for indexed searches
- **Persistence:** Survives browser restarts

**Configuration Storage:**
- **Preferences:** localStorage (JSON)
- **Playback State:** sessionStorage (temporary)
- **Cache:** IndexedDB (API responses)

**Alternative (If IndexedDB Insufficient):**
- **Server:** Lightweight Express.js + SQLite
- **API:** RESTful endpoints for show data
- **Deployment:** Same Pi, different port

### Audio Playback

**HTML5 Audio API:**
- **Element:** `<audio>` with JavaScript control
- **Streaming:** Direct from archive.org URLs
- **Format Support:** Browser-native (MP3, OGG, FLAC via opus)
- **Buffering:** Browser-managed (typically 30s-60s)
- **Network Resilience:** JavaScript retry logic

**Why HTML5 Over VLC:**
- No external dependencies
- Native browser codec support
- Better error messages
- Cross-platform by default
- Simpler codebase

**CORS Consideration:**
Archive.org supports cross-origin requests for audio streaming. Confirmed via:
```
Access-Control-Allow-Origin: *
```

### Routing & Navigation

**Option A: React Router (Recommended for Multi-Screen)**
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<Routes>
  <Route path="/" element={<Browse />} />
  <Route path="/player" element={<Player />} />
  <Route path="/settings" element={<Settings />} />
</Routes>
```

**Option B: State-Based (Simpler, Single-Page)**
```typescript
const [screen, setScreen] = useState('browse');

{screen === 'browse' && <Browse />}
{screen === 'player' && <Player />}
{screen === 'settings' && <Settings />}
```

**Decision:** Use **Option B** initially (simpler, no routing dependencies). Migrate to React Router if navigation becomes complex.

### Styling System

**Tailwind CSS (Recommended)**

**Reasons:**
1. **Utility-first:** Rapid iteration without writing CSS
2. **Touch-friendly:** Easy to create large tap targets
3. **Responsive:** Built-in breakpoint system
4. **Performance:** Purges unused styles in production
5. **Consistency:** Design tokens prevent arbitrary values

**Configuration for Touch:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        'touch': '60px',  // Minimum touch target
        'touch-lg': '80px' // Primary controls
      },
      fontSize: {
        'touch': '18px',  // Minimum readable
        'touch-lg': '24px'
      }
    }
  }
}
```

**Alternative Considered:** CSS Modules
- **Pros:** Traditional CSS, scoped styles
- **Cons:** Slower development, more boilerplate

### State Management

**React Context + Hooks (No Redux)**

**Reasoning:**
- Application state is straightforward (current show, preferences, playback)
- No complex async data flows
- Context sufficient for prop drilling prevention
- Hooks provide local state management

**Structure:**
```typescript
// contexts/AudioContext.tsx
export const AudioContext = createContext<AudioState>({});

export function AudioProvider({ children }) {
  const [currentShow, setCurrentShow] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // ...
}

// contexts/PreferencesContext.tsx
export const PreferencesContext = createContext<Prefs>({});

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(loadFromStorage);
  // ...
}
```

**When to Add Redux:** If state management becomes complex (>5 contexts, complex async flows). Not expected for v1.0.

---

## Architecture Patterns

### Component Architecture

**Atomic Design Principles:**

```
src/
├── components/
│   ├── atoms/           # Basic elements
│   │   ├── Button.tsx
│   │   ├── IconButton.tsx
│   │   └── ProgressBar.tsx
│   ├── molecules/       # Simple combinations
│   │   ├── ShowCard.tsx
│   │   ├── PlaybackControls.tsx
│   │   └── VolumeControl.tsx
│   ├── organisms/       # Complex components
│   │   ├── ShowList.tsx
│   │   ├── DatePicker.tsx
│   │   └── PlayerWidget.tsx
│   └── screens/         # Full screens
│       ├── BrowseScreen.tsx
│       ├── PlayerScreen.tsx
│       └── SettingsScreen.tsx
```

### Service Layer Pattern

**Separation of Concerns:**

```
src/
├── services/
│   ├── archiveApi.ts      # Archive.org API calls
│   ├── database.ts        # IndexedDB operations
│   ├── audioPlayer.ts     # Audio control logic
│   ├── scoringEngine.ts   # Recording selection algorithm
│   └── preferences.ts     # Settings persistence
```

**Benefits:**
- Business logic separate from UI
- Easy to test (mock services)
- Reusable across components
- Clear dependencies

### Custom Hooks Pattern

**Encapsulate Complex Logic:**

```typescript
// hooks/useAudioPlayer.ts
export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const play = useCallback(() => {
    audioRef.current?.play();
  }, []);
  
  return { isPlaying, currentTime, play, pause, seek };
}

// hooks/useShowDatabase.ts
export function useShowDatabase() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const searchByDate = useCallback(async (date: string) => {
    return db.shows.where('date').equals(date).toArray();
  }, []);
  
  return { shows, loading, searchByDate, searchByVenue };
}
```

---

## API Strategy (Unchanged Conceptually)

### Data Acquisition

**Pre-download Master List:**
- One-time fetch of all show metadata (15,000 shows)
- Store in IndexedDB
- ~7.5 MB total (500 bytes per show average)
- Enables offline browsing

**Lazy Metadata Loading:**
- Fetch full metadata only when user selects a show
- Cache in IndexedDB (TTL: 30 days)
- Reduces initial load time

**Weekly Updates:**
- Background check for new shows
- Service Worker or scheduled fetch
- Compare publicdate with last sync

### API Client Implementation

```typescript
// services/archiveApi.ts
const BASE_URL = 'https://archive.org';

export async function searchShows(params: SearchParams) {
  const url = `${BASE_URL}/advancedsearch.php`;
  const query = new URLSearchParams({
    q: `collection:GratefulDead AND date:${params.date}`,
    fl: 'identifier,title,date,venue,avg_rating',
    rows: '100',
    output: 'json'
  });
  
  const response = await fetch(`${url}?${query}`);
  if (!response.ok) throw new Error('API request failed');
  
  return response.json();
}

export async function getMetadata(identifier: string) {
  const url = `${BASE_URL}/metadata/${identifier}`;
  const response = await fetch(url);
  return response.json();
}

export function getStreamUrl(identifier: string, filename: string) {
  return `${BASE_URL}/download/${identifier}/${filename}`;
}
```

### Rate Limiting

```typescript
class RateLimiter {
  private lastRequest = 0;
  private readonly minInterval = 1000; // 1 second between requests
  
  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const wait = Math.max(0, this.minInterval - (now - this.lastRequest));
    
    if (wait > 0) {
      await new Promise(resolve => setTimeout(resolve, wait));
    }
    
    this.lastRequest = Date.now();
    return fn();
  }
}

export const apiLimiter = new RateLimiter();
```

---

## UI Principles (Unchanged)

### Touch-First Design Standards

**Minimum Touch Targets:**
- **Primary controls:** 80×80px (play/pause, main actions)
- **Secondary controls:** 60×60px (skip, volume, settings)
- **Tertiary controls:** 50×50px (close buttons, checkboxes)
- **Spacing:** Minimum 8px between tap targets

**Typography:**
- **Minimum size:** 18px for body text
- **Headers:** 24-32px
- **Emphasis:** 40-48px (song titles, venue names)
- **Contrast:** WCAG AA minimum (4.5:1)

**No Hover Dependencies:**
- All interactions must work via tap/click
- No tooltips requiring hover
- No hover-to-reveal controls
- Touch-friendly dropdowns (large hit areas)

### Screen Transition Timing

**Maintained from PyQt5 Research:**
- **Transition duration:** 300ms
- **Easing:** ease-in-out (cubic-bezier(0.42, 0, 0.58, 1))
- **Total transition:** 600ms (fade out + fade in)
- **User perception:** "Instant" with professional polish

**Implementation:**
```css
.screen-transition {
  opacity: 1;
  transition: opacity 300ms cubic-bezier(0.42, 0, 0.58, 1);
}

.screen-transition-exit {
  opacity: 0;
}
```

---

## Database Schema (Adapted for IndexedDB)

### Dexie.js Schema

```typescript
// services/database.ts
import Dexie, { Table } from 'dexie';

interface Show {
  id?: number;
  date: string;
  venue: string;
  city: string;
  state: string;
  identifier: string;
  avgRating: number;
  numReviews: number;
  sourceType: 'sbd' | 'aud' | 'matrix';
  taper: string;
  transferer: string;
  lastUpdated: string;
}

class DeadStreamDatabase extends Dexie {
  shows!: Table<Show, number>;
  
  constructor() {
    super('DeadStreamDB');
    
    this.version(1).stores({
      shows: '++id, date, identifier, venue, avgRating, sourceType'
    });
  }
}

export const db = new DeadStreamDatabase();
```

**Indexed Fields:**
- `date` - Primary browse mode
- `identifier` - Unique show lookup
- `venue` - Venue-based browsing
- `avgRating` - Top-rated shows
- `sourceType` - Filter by recording source

**Why Dexie.js:**
- TypeScript support
- Promise-based API
- Automatic version management
- Advanced querying (compound indexes, sorting)
- 90KB gzipped (small footprint)

---

## Audio Playback Decisions

### Streaming Strategy

**Stream-Only (No Local Caching):**
- **Rationale:** Same as PyQt5 version
  - Archive.org bandwidth excellent
  - Saves storage
  - Always latest version
  - Simpler code

**Browser Buffering:**
- **Default:** Browser manages buffer (typically 30-60s)
- **Preload:** `<audio preload="auto">` for next track
- **Network Resilience:** Retry on stall/error

### Playlist Management

**Upfront Playlist Construction:**
```typescript
interface PlaylistTrack {
  url: string;
  title: string;
  duration: number;
  index: number;
}

class Playlist {
  private tracks: PlaylistTrack[] = [];
  private currentIndex = 0;
  
  async loadShow(identifier: string) {
    const metadata = await getMetadata(identifier);
    const audioFiles = extractAudioFiles(metadata);
    
    this.tracks = audioFiles.map((file, index) => ({
      url: getStreamUrl(identifier, file.name),
      title: file.title || file.name,
      duration: parseDuration(file.length),
      index
    }));
  }
  
  getCurrentTrack() {
    return this.tracks[this.currentIndex];
  }
  
  next() {
    if (this.currentIndex < this.tracks.length - 1) {
      this.currentIndex++;
      return this.getCurrentTrack();
    }
    return null;
  }
}
```

**Auto-Play Next Track:**
```typescript
audioElement.addEventListener('ended', () => {
  const next = playlist.next();
  if (next) {
    audioElement.src = next.url;
    audioElement.play();
  }
});
```

---

## Error Handling Philosophy

### Network Errors

**Graceful Degradation:**
```typescript
async function playShow(identifier: string) {
  try {
    const metadata = await getMetadata(identifier);
    // ... success path
  } catch (error) {
    if (error.message.includes('network')) {
      showToast('No internet connection. Please check your network.');
      return;
    }
    
    if (error.message.includes('404')) {
      showToast('Show not found. It may have been removed.');
      return;
    }
    
    // Generic error
    showToast('Failed to load show. Please try again.');
    logError(error);
  }
}
```

### Audio Errors

**Retry Logic:**
```typescript
const MAX_RETRIES = 3;
let retryCount = 0;

audioElement.addEventListener('error', async (e) => {
  if (retryCount < MAX_RETRIES) {
    retryCount++;
    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    audioElement.load();
    audioElement.play();
  } else {
    showToast('Audio playback failed. Please try a different recording.');
  }
});
```

### User Feedback

**Toast Notifications:**
- **Duration:** 3-5 seconds
- **Position:** Bottom center
- **Dismissible:** Tap to dismiss early
- **Types:** Info, success, warning, error

---

## Testing Strategy

### Unit Testing

**Tool:** Vitest (Vite-native, faster than Jest)

```typescript
// services/__tests__/scoringEngine.test.ts
import { describe, it, expect } from 'vitest';
import { scoreRecording } from '../scoringEngine';

describe('scoreRecording', () => {
  it('prefers soundboard over audience', () => {
    const sbd = { sourceType: 'sbd', format: 'MP3', avgRating: 4.0 };
    const aud = { sourceType: 'aud', format: 'MP3', avgRating: 4.5 };
    
    expect(scoreRecording(sbd)).toBeGreaterThan(scoreRecording(aud));
  });
});
```

### Component Testing

**Tool:** React Testing Library

```typescript
// components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../atoms/Button';

describe('Button', () => {
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
  
  it('meets touch target minimum size', () => {
    const { container } = render(<Button>Click Me</Button>);
    const button = container.firstChild as HTMLElement;
    
    expect(button.offsetWidth).toBeGreaterThanOrEqual(60);
    expect(button.offsetHeight).toBeGreaterThanOrEqual(60);
  });
});
```

### Integration Testing

**Tool:** Playwright (optional for end-to-end)

```typescript
// e2e/browse-and-play.spec.ts
import { test, expect } from '@playwright/test';

test('can browse shows and start playback', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Browse by date
  await page.click('[data-testid="browse-by-date"]');
  await page.click('[data-testid="date-1977-05-08"]');
  
  // Select show
  await page.click('[data-testid="show-card-0"]');
  
  // Verify player screen
  await expect(page.locator('[data-testid="player-screen"]')).toBeVisible();
  
  // Play button should be visible
  await expect(page.locator('[data-testid="play-button"]')).toBeVisible();
});
```

---

## Performance Targets

### Load Time
- **Initial bundle:** < 500KB gzipped
- **Time to Interactive:** < 3 seconds on Pi
- **Database query:** < 100ms for searches
- **API response:** < 500ms (network dependent)

### Runtime Performance
- **Screen transition:** 60fps (16ms frame time)
- **Touch response:** < 100ms visual feedback
- **Memory usage:** < 300MB (browser + app)
- **Audio buffering:** < 3 seconds to start playback

### Optimization Strategies
- **Code splitting:** Lazy load screens
- **Asset optimization:** Compress images, tree-shake CSS
- **Memoization:** React.memo for expensive components
- **Virtual scrolling:** For long show lists (react-window)

---

## Deployment Strategy

### Development Workflow

```bash
# On macOS
npm run dev          # Start dev server (http://localhost:5173)
# Edit code, instant hot reload

# Test changes
npm run test         # Run Vitest unit tests

# Build for production
npm run build        # Creates dist/ folder

# Preview production build
npm run preview      # Test optimized build locally

# Commit and push
git add .
git commit -m "Add feature X"
git push origin main
```

### Raspberry Pi Deployment

**Setup (One-Time):**
```bash
# On Pi
cd ~
git clone https://github.com/yourusername/deadstream-react.git
cd deadstream-react
npm install
npm run build

# Create static file server
npm install -g serve

# Create startup script
cat > ~/start-deadstream.sh << 'EOF'
#!/bin/bash
cd ~/deadstream-react
serve -s dist -l 3000 &
sleep 2
chromium-browser --kiosk --app=http://localhost:3000
EOF

chmod +x ~/start-deadstream.sh
```

**Update Workflow:**
```bash
# On Pi
cd ~/deadstream-react
git pull
npm install  # Only if package.json changed
npm run build
sudo reboot  # Or restart Chromium
```

### Kiosk Mode Configuration

**Chromium Flags:**
```bash
chromium-browser \
  --kiosk \
  --app=http://localhost:3000 \
  --no-first-run \
  --disable-infobars \
  --disable-translate \
  --disable-features=TranslateUI \
  --disk-cache-dir=/dev/null \
  --disk-cache-size=1
```

**Auto-Start on Boot:**
```bash
# Add to ~/.config/lxsession/LXDE-pi/autostart
@/home/pi/start-deadstream.sh
```

---

## Security Considerations

### What We Don't Need (Single-User, Local Device)
- User authentication
- HTTPS (local network only)
- XSS protection (no user-generated content)
- CSRF tokens (no forms posting to server)

### What We Do Need
- **Input sanitization:** Validate search queries
- **Safe URL construction:** Prevent injection in archive.org URLs
- **Content Security Policy:** Restrict script sources
- **Error handling:** Don't expose internal state in errors

### CSP Header (If Using Server)
```
Content-Security-Policy: 
  default-src 'self'; 
  connect-src 'self' https://archive.org; 
  media-src https://archive.org; 
  img-src 'self' https://archive.org;
```

---

## Future Extensibility

### Designed For (Possible Phase 2+)
- **Bluetooth audio:** Web Bluetooth API support
- **Battery status:** Battery API for portable builds
- **Offline mode:** Service Worker + cache API
- **Remote control:** WebSocket for phone control
- **Multiple collections:** Architecture supports other artists

### Explicitly Out of Scope (v1.0)
- Multi-user support
- Cloud sync
- Native mobile apps
- Commercial features
- Social features

---

## Technology Choices - Detailed Rationale

### Why React Over Other Frameworks

**Considered Alternatives:**

| Framework | Pros | Cons | Decision |
|-----------|------|------|----------|
| **Vue.js** | Easier learning curve, great docs | Smaller ecosystem | React chosen for larger ecosystem |
| **Svelte** | Faster, no virtual DOM | Less mature, smaller community | Too bleeding-edge for learning project |
| **Vanilla JS** | No dependencies | Slow development, reinvent patterns | Too low-level |
| **Angular** | Full framework | Steep learning curve, heavy | Overkill for project |

**React Selected Because:**
1. Largest ecosystem (most tutorials, libraries, solutions)
2. Transferable skill (widely used in industry)
3. Excellent TypeScript support
4. Mature (stable APIs, proven patterns)
5. Component model natural for this use case

### Why TypeScript Over JavaScript

**Benefits:**
- Catch errors at compile time (typos, wrong types)
- Better IDE autocomplete and refactoring
- Self-documenting code (type signatures)
- Easier maintenance (types = documentation)
- Growing industry standard

**Minimal Overhead:**
- Types erased at build time (no runtime cost)
- Can start permissive, tighten over time
- Excellent React integration

### Why Vite Over Create React App

**Vite Advantages:**

| Metric | Vite | Create React App |
|--------|------|------------------|
| Dev server start | <1 second | 10-30 seconds |
| Hot reload | <50ms | 1-2 seconds |
| Build speed | 2-3x faster | Baseline |
| Bundle size | Smaller (tree-shaking) | Larger |
| Modern features | ESM, native deps | Webpack-based |

**Recommendation:** Vite unless team already expert in CRA

### Why Tailwind Over Traditional CSS

**Tailwind Benefits:**
1. **Rapid prototyping:** No context switching to CSS files
2. **Consistency:** Design tokens prevent arbitrary values
3. **Performance:** Purges unused styles (smaller bundles)
4. **Responsive:** Breakpoints built-in (`md:`, `lg:`)
5. **Touch-friendly:** Utility classes for sizing (`w-20`, `h-20`)

**Example Comparison:**

**Traditional CSS:**
```css
/* Button.module.css */
.button {
  width: 80px;
  height: 80px;
  background-color: #3b82f6;
  border-radius: 8px;
  font-size: 18px;
}

.button:hover {
  background-color: #2563eb;
}
```

**Tailwind:**
```tsx
<button className="w-20 h-20 bg-blue-500 hover:bg-blue-700 rounded-lg text-lg">
  Play
</button>
```

**Decision:** Tailwind for v1.0. Can add CSS modules for complex components if needed.

---

## Decision Change Log

| Date | Decision | Reason |
|------|----------|--------|
| 2026-01-02 | **Platform pivot: PyQt5 → React + Chromium** | Better DX, simpler deployment, web-native advantages |
| 2026-01-02 | **TypeScript over JavaScript** | Type safety, better tooling, industry trend |
| 2026-01-02 | **Vite over Create React App** | 10-100x faster dev server, modern build tool |
| 2026-01-02 | **Tailwind CSS as primary styling** | Rapid development, consistency, touch-friendly utilities |
| 2026-01-02 | **IndexedDB over localStorage** | Better for large datasets (15K shows), more powerful queries |
| 2026-01-02 | **HTML5 Audio over external libraries** | Built-in, no dependencies, excellent browser support |
| 2026-01-02 | **State-based routing initially** | Simpler than React Router for initial version |
| 2026-01-02 | **React Context over Redux** | Sufficient for app complexity, less boilerplate |

---

## Open Questions

Questions to answer during development:

- [ ] Does IndexedDB handle 15,000 shows performantly? (Test in Phase 2)
- [ ] Do we need service worker for offline support? (Defer to Phase 12+)
- [ ] Should we implement virtual scrolling for show lists? (Test with real data)
- [ ] Is server-side database needed, or is IndexedDB sufficient? (Evaluate in Phase 2)
- [ ] Does archive.org CORS work as expected? (Test immediately in Phase 3)
- [ ] Can browser cache 30-60s audio buffer reliably? (Test in Phase 4)
- [ ] Do we need React Router or is state-based routing enough? (Evaluate in Phase 6)

---

## Resources & References

- **React:** https://react.dev
- **TypeScript:** https://www.typescriptlang.org
- **Vite:** https://vitejs.dev
- **Tailwind CSS:** https://tailwindcss.com
- **Dexie.js:** https://dexie.org
- **React Testing Library:** https://testing-library.com/react
- **Vitest:** https://vitest.dev
- **Internet Archive API:** https://archive.org/developers/
- **MDN Audio API:** https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio

---

**This document replaces the PyQt5-specific decisions in the original `05-technical-decisions.md`.**  
**For historical PyQt5 decisions, see archive.**
