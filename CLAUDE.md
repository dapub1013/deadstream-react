# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DeadStream** is a dedicated Raspberry Pi touchscreen device for streaming Grateful Dead concerts from the Internet Archive. This is a React web application running in Chromium kiosk mode.

### What This Application Does
- Browse 15,000+ Grateful Dead shows by date, year, venue, or rating
- Smart recording selection (automatically picks best quality: SBD > Matrix > AUD)
- Stream audio directly from archive.org
- Touch-optimized interface for 7" 1280×720 display
- Offline-capable browsing with local IndexedDB cache

### Technology Stack
- **React 19** with TypeScript (functional components + hooks)
- **Vite** for build tooling and dev server
- **Dexie.js** for IndexedDB client-side database (stores 15K shows locally)
- **Tailwind CSS** for styling with custom touch-optimized design system
- **HTML5 Audio API** for playback
- **Vitest** with React Testing Library for testing
- **Target Platform:** Chromium kiosk mode on Raspberry Pi 4

### Hardware Context
This code will run on a Raspberry Pi 4 (4GB) with:
- Official 7" Touch Display (1280×720, landscape orientation)
- IQaudio DAC Pro for audio output
- Chromium in kiosk/fullscreen mode

## Development Commands

```bash
# Start development server with HMR
npm run dev

# Run type checking and build for production
npm run build

# Preview production build locally
npm run preview

# Run linting
npm run lint

# Run tests in watch mode
npm test

# Run tests once (CI mode)
npm test -- --run

# Run tests with UI
npm run test:ui

# Type check without emitting files
npx tsc --noEmit
```

### Testing
- Vitest runs tests matching `*.test.tsx` or `*.test.ts` patterns
- Test setup is in [src/test/setup.ts](src/test/setup.ts)
- Uses `@testing-library/react` and `@testing-library/jest-dom`
- To run a single test file: `npm test -- <filename>`
- To run tests matching a pattern: `npm test -- <pattern>`

## Architecture

### Component Structure
The project follows **Atomic Design** principles:
- **atoms/**: Basic building blocks (buttons, inputs, icons, labels)
- **molecules/**: Simple combinations of atoms (ShowCard, VolumeControl, SearchBar)
- **organisms/**: Complex UI components (ShowList, PlayerWidget, FilterPanel)
- **screens/**: Full page layouts (BrowseScreen, PlayerScreen, SettingsScreen)

All components should be placed in the appropriate directory under [src/components/](src/components/).

### Data Layer

**Database Schema (IndexedDB via Dexie):**
```typescript
interface Show {
  identifier: string;    // Primary key (e.g., "gd1977-05-08.sbd.hicks.4982")
  date: string;         // YYYY-MM-DD format
  venue: string;
  city: string;
  state: string;        // 2-letter abbreviation
  avgRating: number;
  numReviews: number;
  sourceType?: string;  // 'sbd', 'matrix', 'aud' (lazy-loaded)
  taper?: string;       // (lazy-loaded)
  lastUpdated: string;
}
```

**Data Strategy:**
- Pre-download show catalog (15K shows = ~7.5MB in IndexedDB)
- Lazy-load detailed metadata (sourceType, taper) on-demand
- IndexedDB provides <100ms query performance with proper indexes
- API integration in [src/services/archiveApi.ts](src/services/archiveApi.ts)
- Database wrapper in [src/services/database.ts](src/services/database.ts)

**State Management:**
- Use React Context + hooks (no Redux needed)
- AudioContext for playback state
- PreferencesContext for user settings
- Keep state simple and localized when possible

### Styling System

**Tailwind CSS with Touch-Optimized Design Tokens:**

Custom spacing (defined in [tailwind.config.js](tailwind.config.js)):
- `h-touch` / `w-touch`: 60px (minimum touch target)
- `h-touch-lg` / `w-touch-lg`: 80px (primary controls)

Custom typography:
- `text-touch`: 18px (minimum readable size)
- `text-touch-lg`: 24px (headers/important controls)

**Design Principles for This Application:**
1. **Touch-first:** All interactive elements minimum 60px
2. **No hover states:** Everything must work with tap only
3. **High contrast:** Readable in various lighting conditions
4. **Large text:** Minimum 18px for readability at arm's length
5. **Generous spacing:** Prevent accidental taps
6. **Smooth transitions:** 300ms fade animations for screen changes

**Styling Patterns:**
```tsx
// Touch-friendly button
<button className="h-touch w-touch text-touch bg-blue-500 rounded-lg">
  Play
</button>

// Use clsx for conditional classes
import clsx from 'clsx';

<button className={clsx(
  'h-touch w-touch rounded-lg',
  isPrimary ? 'bg-blue-500' : 'bg-gray-300'
)}>
```

### Audio Architecture

**HTML5 Audio API** (not VLC):
- Direct streaming from archive.org (CORS supported)
- Browser-native codec support (MP3, OGG, FLAC)
- Resilient playback with retry logic
- Network buffering managed by browser

**Smart Recording Selection:**
Recording quality preference: SBD (soundboard) > Matrix > AUD (audience)
- Implement scoring algorithm in [src/services/scoringEngine.ts](src/services/scoringEngine.ts)
- Automatically select best available recording per user preferences

### Navigation

**State-based routing** (no React Router initially):
```typescript
const [screen, setScreen] = useState<'browse' | 'player' | 'settings'>('browse');
```

Screens transition with 300ms fade animation. Keep navigation simple since this is a kiosk device.

## Key Patterns and Conventions

### Component Pattern
```typescript
import { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'normal' | 'large';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'normal',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-lg font-semibold transition-colors',
        {
          'bg-blue-500 hover:bg-blue-600': variant === 'primary',
          'bg-gray-200 hover:bg-gray-300': variant === 'secondary',
          'h-touch w-touch text-touch': size === 'normal',
          'h-touch-lg w-touch-lg text-touch-lg': size === 'large',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

### IndexedDB Query Pattern (Dexie)
```typescript
// Get by primary key
const show = await db.shows.get('gd1977-05-08.sbd.hicks.4982');

// Query by date
const shows = await db.shows
  .where('date')
  .equals('1977-05-08')
  .toArray();

// Range query with sorting
const topShows = await db.shows
  .where('avgRating')
  .above(4.5)
  .sortBy('avgRating')
  .reverse()
  .limit(10);
```

### API Integration Pattern
```typescript
// Fetch show metadata from archive.org
async function getShowMetadata(identifier: string) {
  const response = await fetch(
    `https://archive.org/metadata/${identifier}`
  );
  return response.json();
}
```

## File Organization

```
src/
├── components/
│   ├── atoms/           # Button, Input, Icon, Label
│   ├── molecules/       # ShowCard, VolumeControl, SearchBar
│   ├── organisms/       # ShowList, PlayerWidget, FilterPanel
│   └── screens/         # BrowseScreen, PlayerScreen, SettingsScreen
├── services/
│   ├── archiveApi.ts    # Internet Archive API client
│   ├── database.ts      # Dexie configuration and helpers
│   ├── audioPlayer.ts   # HTML5 Audio wrapper with resilience
│   └── scoringEngine.ts # Recording quality selection algorithm
├── hooks/
│   ├── useDatabase.ts   # Database query hooks
│   ├── useAudio.ts      # Audio player state hook
│   └── useMetadata.ts   # Lazy metadata loading
├── contexts/
│   ├── AudioContext.tsx      # Playback state provider
│   └── PreferencesContext.tsx # User settings provider
├── types/
│   ├── show.ts          # Show and metadata interfaces
│   ├── metadata.ts      # Archive.org response types
│   └── preferences.ts   # User preference types
└── utils/
    └── validation.ts    # Helper functions
```

## Project Context and Standards

### This is a Learning Project
- Built by a single developer learning React/TypeScript
- Quality over speed - understand concepts before moving forward
- Document decisions and architectural choices
- Commit frequently with descriptive messages

### Platform Pivot Context
This React version is a platform pivot from a PyQt5 (Python desktop) version. The domain knowledge, API integration patterns, database schema, UX decisions, and recording selection algorithm were preserved from the PyQt5 version and adapted to React.

**What Transferred:**
- Archive.org API patterns (search, metadata, audio URLs)
- Database schema (field names, indexes, query patterns)
- Recording quality scoring algorithm
- UI/UX design (screen organization, touch optimization)
- All domain knowledge about Grateful Dead shows and Internet Archive

**What Changed:**
- Framework: PyQt5 → React
- Language: Python → TypeScript
- Database: SQLite → IndexedDB
- Audio: VLC → HTML5 Audio API
- Deployment: Desktop app → Chromium kiosk

### Code Quality Standards

**CRITICAL: Text Encoding**
- Use ASCII characters only in all code, comments, and console output
- NO emojis, unicode checkmarks, or special symbols
- Use `[PASS]`, `[FAIL]`, `[INFO]`, `[ERROR]` for status messages
- This prevents syntax errors and display issues

**TypeScript:**
- Enable strict mode
- Define interfaces for all data structures
- Use type inference when obvious
- Prefer `interface` over `type` for object shapes

**Component Standards:**
- Functional components with hooks (no class components)
- Props interfaces should extend HTML element attributes when applicable
- Export components as named exports
- Keep components focused and single-purpose

**Testing Standards:**
- Write tests for all service layer code (API, database, scoring)
- Test component rendering and user interactions
- Use descriptive test names: `it('selects SBD over AUD when both available')`
- Mock external dependencies (API calls, database)

### Development Workflow

**Development Environment:**
- Primary development on macOS
- Hot reload in browser with Chrome DevTools
- Test touch interactions with browser device emulation
- Deploy to Raspberry Pi for hardware validation

**Git Workflow:**
```bash
# After completing each task
git add .
git commit -m "Phase X.Y: Description of what was accomplished"
git push origin main
```

**Deployment to Raspberry Pi:**
```bash
# Build production bundle
npm run build

# Copy dist/ to Pi and serve with Chromium
chromium-browser --kiosk --app=file:///path/to/dist/index.html
```

## Additional Documentation

For more detailed information, see the [.claude/](.claude/) directory:
- [00-project-knowledge-primer.md](.claude/00-project-knowledge-primer.md) - Project overview and context
- [02-technical-decisions-react.md](.claude/02-technical-decisions-react.md) - Detailed technical rationale
- [06-quick-reference.md](.claude/06-quick-reference.md) - Command and pattern quick reference
- [14-project-guidelines.md](.claude/14-project-guidelines.md) - Standards and best practices
- [20-database-schema-sqlite.md](.claude/20-database-schema-sqlite.md) - Database schema documentation
