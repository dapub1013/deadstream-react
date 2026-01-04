# CLAUDE.md

**AI Assistant Guide for DeadStream React Project**

This file provides essential context for AI assistants (Claude Code, GitHub Copilot, etc.) working with this codebase.

---

## Project at a Glance

**DeadStream** is a React web app for streaming Grateful Dead concerts from the Internet Archive, designed to run in Chromium kiosk mode on a Raspberry Pi 4 with a 7" touchscreen.

**Key Facts:**
- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + IndexedDB
- **Target:** Raspberry Pi 4 (4GB) with 7" touch display (1280×720)
- **Database:** IndexedDB via Dexie.js (stores 15K shows locally)
- **Audio:** HTML5 Audio API (streams from archive.org)
- **Status:** Phase 4 Complete - Audio Player Component

---

## Quick Start

### Development Commands
```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run test         # Run tests in watch mode
npm run lint         # ESLint
npx tsc --noEmit     # Type check only
```

### Project Structure
```
src/
├── components/      # Atomic design (atoms/molecules/organisms/screens)
├── services/        # API, database, audio, scoring
├── hooks/           # Custom React hooks
├── contexts/        # React Context providers
├── types/           # TypeScript interfaces
└── utils/           # Helper functions
```

---

## Documentation Map

**Essential References:**
- **[README.md](README.md)** - Project overview and quick start
- **[docs/development/quick-reference.md](docs/development/quick-reference.md)** - Commands & patterns
- **[docs/development/guidelines.md](docs/development/guidelines.md)** - Standards & best practices

**Architecture & Design:**
- **[docs/architecture/technical-decisions.md](docs/architecture/technical-decisions.md)** - Tech stack rationale
- **[docs/architecture/database-schema.md](docs/architecture/database-schema.md)** - IndexedDB design

**Implementation:**
- **[docs/roadmap/implementation.md](docs/roadmap/implementation.md)** - Phase-by-phase plan
- **[docs/roadmap/task-breakdown.md](docs/roadmap/task-breakdown.md)** - Granular tasks

**Historical Context:**
- **[docs/archive/](docs/archive/)** - PyQt5 → React platform pivot background

---

## Critical Standards

### 1. Text Encoding (MANDATORY)
**ASCII ONLY** - No emojis, unicode symbols, or special characters
```typescript
// ✅ CORRECT
console.log('[PASS] Test passed');

// ❌ WRONG
console.log('✓ Test passed');
```

### 2. Touch-First Design
```typescript
// All interactive elements: minimum 60px touch targets
<button className="h-touch w-touch text-touch">  // 60×60px, 18px text
<button className="h-touch-lg w-touch-lg">        // 80×80px primary
```

**Design Rules:**
- No hover-dependent interactions
- Minimum 18px text size
- High contrast colors
- 300ms transition animations

### 3. TypeScript Patterns
```typescript
// Component with props
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

export function Button({ variant = 'primary', ...props }: ButtonProps) {
  // Implementation
}
```

### 4. Data Layer (IndexedDB)
```typescript
// Dexie.js query patterns
const show = await db.shows.get(identifier);
const shows = await db.shows.where('date').equals('1977-05-08').toArray();
const topShows = await db.shows.orderBy('avgRating').reverse().limit(10).toArray();
```

**Database Schema:**
```typescript
interface Show {
  identifier: string;    // Primary key
  date: string;         // YYYY-MM-DD
  venue: string;
  city: string;
  state: string;        // 2-letter code
  avgRating: number;
  numReviews: number;
  sourceType?: string;  // 'sbd' | 'matrix' | 'aud' (lazy-loaded)
  taper?: string;       // (lazy-loaded)
  lastUpdated: string;
}
```

### 5. Testing Standards
```typescript
// Vitest + React Testing Library
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });
});
```

---

## Architecture Highlights

### Component Organization (Atomic Design)
- **atoms/**: Button, Input, Icon, Label
- **molecules/**: ShowCard, VolumeControl, SearchBar
- **organisms/**: ShowList, PlayerWidget, FilterPanel
- **screens/**: BrowseScreen, PlayerScreen, SettingsScreen

### State Management
- **React Context + Hooks** (no Redux)
- AudioContext for playback state
- PreferencesContext for user settings
- Keep state localized when possible

### Audio Strategy
- **HTML5 Audio API** (not VLC)
- Direct streaming from archive.org
- Browser-native buffering
- Resilient playback with retry logic

### Recording Selection
**Smart Quality Preference:** SBD (soundboard) > Matrix > AUD (audience)
- Scoring algorithm in `src/services/scoringEngine.ts`
- User preferences stored in IndexedDB
- Automatic best-recording selection

---

## Common Patterns

### Tailwind Utility Classes
```tsx
// Touch-friendly button
<button className="h-touch w-touch bg-blue-500 rounded-lg">

// Conditional classes with clsx
import clsx from 'clsx';
<button className={clsx(
  'h-touch rounded-lg',
  isPrimary ? 'bg-blue-500' : 'bg-gray-300'
)}>
```

### API Integration
```typescript
// Archive.org metadata fetch
async function getMetadata(identifier: string) {
  const response = await fetch(
    `https://archive.org/metadata/${identifier}`
  );
  return response.json();
}
```

### Custom Hooks
```typescript
// Database query hook
export function useShows(params: { date?: string; year?: number }) {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch logic
  }, [params.date, params.year]);
  
  return { shows, loading };
}
```

---

## Project Context

### Platform Pivot
This is a **React reimplementation** of a PyQt5 (Python) desktop app. The following transferred:
- Archive.org API integration patterns
- Database schema and query patterns
- Recording quality scoring algorithm
- UI/UX design decisions
- Touch optimization standards

### Learning Project
- Built by a single developer learning React/TypeScript
- **Quality over speed** - understand before proceeding
- Document architectural decisions
- Commit frequently with clear messages

### Git Workflow
```bash
# After each completed task
git add .
git commit -m "Phase X.Y: Clear description"
git push origin main
```

---

## When Working on This Project

### Before Writing Code
1. Check **[docs/development/guidelines.md](docs/development/guidelines.md)** for standards
2. Review **[docs/development/quick-reference.md](docs/development/quick-reference.md)** for patterns
3. Verify **[docs/architecture/technical-decisions.md](docs/architecture/technical-decisions.md)** for rationale

### For New Features
1. Follow atomic design component structure
2. Use TypeScript strict mode
3. Write tests (Vitest + React Testing Library)
4. Use ASCII-only text in code and output
5. Ensure 60px minimum touch targets
6. Update documentation if adding new patterns

### Common Pitfalls to Avoid
- ❌ Using emojis/unicode in code/output
- ❌ Creating hover-dependent interactions
- ❌ Text smaller than 18px
- ❌ Touch targets smaller than 60px
- ❌ Using class components (use functional + hooks)
- ❌ Hardcoding values (use Tailwind design tokens)

---

## Need More Detail?

- **Commands:** [docs/development/quick-reference.md](docs/development/quick-reference.md)
- **Standards:** [docs/development/guidelines.md](docs/development/guidelines.md)
- **Import patterns:** [docs/development/import-architecture.md](docs/development/import-architecture.md)
- **Database:** [docs/architecture/database-schema.md](docs/architecture/database-schema.md)
- **Roadmap:** [docs/roadmap/implementation.md](docs/roadmap/implementation.md)

---

**Ready to code? Start with Phase 1 in [docs/roadmap/implementation.md](docs/roadmap/implementation.md)**
