# DeadStream React - Task-Based Roadmap

**Created:** January 2, 2026  
**Format:** Granular task breakdown for Claude Code and implementation  
**Estimated Total:** 56-90 hours across 12 phases

---

## How to Use This Roadmap

### Task Format
Each task includes:
- **Task ID:** Phase.Task number (e.g., 1.1)
- **Description:** What needs to be done
- **Estimated Time:** How long it should take
- **Files Created/Modified:** Specific file paths
- **Acceptance Criteria:** How you know it's done
- **Testing:** How to verify it works

### Workflow
1. Read entire phase overview before starting
2. Complete tasks sequentially within each phase
3. Test after each task
4. Commit after each completed task
5. Mark task as complete ([ ] → [x])
6. Move to next task only when current task passes all criteria

### Phase Completion
A phase is complete when:
- All tasks have checkmarks [x]
- All acceptance criteria met
- All tests pass
- Code committed to Git
- You can explain the concepts

---

## Phase 1: Project Setup & Tooling

**Goal:** Get React development environment running  
**Estimated Time:** 2-4 hours  
**Prerequisites:** Node.js 18+, Git installed

### Task 1.1: Initialize Vite Project
**Time:** 15 minutes

**Steps:**
```bash
npm create vite@latest deadstream-react -- --template react-ts
cd deadstream-react
npm install
npm run dev
```

**Files Created:**
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `src/App.tsx`
- `src/main.tsx`

**Acceptance Criteria:**
- [ ] Dev server starts on http://localhost:5173
- [ ] Browser shows React + Vite welcome page
- [ ] No errors in terminal
- [ ] TypeScript compiles without errors

**Testing:**
- Edit `src/App.tsx`, save, see instant update
- Check browser console: no errors
- Run `npm run build` successfully

---

### Task 1.2: Install Core Dependencies
**Time:** 15 minutes

**Steps:**
```bash
# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Database
npm install dexie

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Utilities
npm install clsx
```

**Files Created:**
- `tailwind.config.js`
- `postcss.config.js`

**Files Modified:**
- `package.json` (dependencies added)

**Acceptance Criteria:**
- [ ] All packages install without errors
- [ ] `package.json` shows all new dependencies
- [ ] No version conflicts reported

**Testing:**
```bash
npm list  # Check dependency tree
```

---

### Task 1.3: Configure Tailwind CSS
**Time:** 20 minutes

**Files Modified:**
- `tailwind.config.js`
- `src/index.css`

**Create:** `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        'touch': '60px',
        'touch-lg': '80px',
      },
      fontSize: {
        'touch': '18px',
        'touch-lg': '24px',
      },
    },
  },
  plugins: [],
}
```

**Modify:** `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Acceptance Criteria:**
- [ ] Tailwind directives in `index.css`
- [ ] Custom touch sizes configured
- [ ] No build errors
- [ ] Can use Tailwind classes in components

**Testing:**
Add to `App.tsx`:
```tsx
<button className="h-touch w-touch bg-blue-500 text-white rounded">
  Test
</button>
```
Should see blue 60x60px button.

---

### Task 1.4: Set Up Project Structure
**Time:** 15 minutes

**Directories to Create:**
```bash
mkdir -p src/components/{atoms,molecules,organisms,screens}
mkdir -p src/services
mkdir -p src/hooks
mkdir -p src/contexts
mkdir -p src/utils
mkdir -p src/types
mkdir -p src/test
```

**Files to Create:**
```bash
touch src/types/show.ts
touch src/types/metadata.ts
touch src/types/preferences.ts
touch src/services/database.ts
touch src/services/archiveApi.ts
touch src/test/setup.ts
```

**Acceptance Criteria:**
- [ ] All directories exist
- [ ] All placeholder files created
- [ ] Structure matches documented architecture

**Testing:**
```bash
ls -R src/
```

---

### Task 1.5: Configure Testing (Vitest)
**Time:** 20 minutes

**Create:** `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

**Create:** `src/test/setup.ts`
```typescript
import '@testing-library/jest-dom';
```

**Modify:** `package.json` (add test script)
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

**Acceptance Criteria:**
- [ ] `npm run test` starts Vitest
- [ ] Setup file loads correctly
- [ ] No errors in test runner

**Testing:**
```bash
npm run test  # Should start in watch mode
```

---

### Task 1.6: Create First Component (Button)
**Time:** 30 minutes

**Create:** `src/components/atoms/Button.tsx`
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
          'bg-blue-500 hover:bg-blue-600 text-white': variant === 'primary',
          'bg-gray-200 hover:bg-gray-300 text-gray-800': variant === 'secondary',
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

**Files Created:**
- `src/components/atoms/Button.tsx`

**Acceptance Criteria:**
- [ ] Component compiles without TypeScript errors
- [ ] Tailwind classes apply correctly
- [ ] Button renders in dev server
- [ ] Props work as expected

**Testing:**
Add to `App.tsx`:
```tsx
import { Button } from './components/atoms/Button';

<Button size="large" onClick={() => alert('Clicked!')}>
  Test Button
</Button>
```

---

### Task 1.7: Write First Test
**Time:** 30 minutes

**Create:** `src/components/atoms/Button.test.tsx`
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('applies correct variant classes', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    const button = container.querySelector('button');
    
    expect(button).toHaveClass('bg-gray-200');
  });

  it('applies correct size classes', () => {
    const { container } = render(<Button size="large">Large</Button>);
    const button = container.querySelector('button');
    
    expect(button).toHaveClass('h-touch-lg');
    expect(button).toHaveClass('w-touch-lg');
  });

  it('forwards additional props', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText('Disabled');
    
    expect(button).toBeDisabled();
  });
});
```

**Files Created:**
- `src/components/atoms/Button.test.tsx`

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] Test coverage includes props, events, styling
- [ ] Tests run in watch mode
- [ ] No TypeScript errors in test file

**Testing:**
```bash
npm run test
# Should show 5 passing tests
```

---

### Task 1.8: Initialize Git Repository
**Time:** 15 minutes

**Steps:**
```bash
git init
git add .
git commit -m "Initial commit: Phase 1 complete - React + TypeScript + Tailwind setup"

# Create GitHub repository
gh repo create deadstream-react --public --source=. --remote=origin
git push -u origin main
```

**Files Created:**
- `.git/` directory
- `.gitignore` (should exist from Vite template)

**Acceptance Criteria:**
- [ ] Repository initialized
- [ ] All files committed
- [ ] Pushed to GitHub
- [ ] Repository visible online

**Testing:**
```bash
git status  # Should be clean
git log     # Should show commit
```

---

### Task 1.9: Update README
**Time:** 15 minutes

**Modify:** `README.md`
```markdown
# DeadStream React

A dedicated Raspberry Pi device for streaming Grateful Dead concerts from the Internet Archive.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Dexie.js (IndexedDB)
- HTML5 Audio API

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## Project Status

- [x] Phase 1: Project setup
- [ ] Phase 2: Database foundation
- [ ] Phase 3: API integration
- [ ] Phase 4: Audio player
- [ ] Phase 5-12: TBD

## Hardware

- Raspberry Pi 4 (4GB)
- Official 7" Touch Display
- IQaudio DAC Pro
```

**Acceptance Criteria:**
- [ ] README updated with project info
- [ ] Commands documented
- [ ] Status tracker included

**Testing:**
View README on GitHub

---

### Phase 1 Completion Checklist

- [ ] Task 1.1: Vite project initialized
- [ ] Task 1.2: Dependencies installed
- [ ] Task 1.3: Tailwind configured
- [ ] Task 1.4: Project structure created
- [ ] Task 1.5: Testing configured
- [ ] Task 1.6: Button component created
- [ ] Task 1.7: Button tests written and passing
- [ ] Task 1.8: Git repository initialized
- [ ] Task 1.9: README updated

**Phase 1 Success Criteria:**
- [ ] `npm run dev` starts dev server
- [ ] `npm run test` runs all tests (5 passing)
- [ ] `npm run build` creates production bundle
- [ ] TypeScript shows no errors
- [ ] Git repository on GitHub
- [ ] Can explain: What is JSX? What is a React component?

**Commit Message:**
```
Phase 1 complete: React + TypeScript + Tailwind setup

- Vite project initialized with TypeScript template
- Tailwind CSS configured with touch-friendly sizes
- Vitest testing framework set up
- Button component with full test coverage
- Git repository initialized and pushed to GitHub
```

---

## Phase 2: Database Foundation (IndexedDB)

**Goal:** Implement IndexedDB wrapper with Dexie for show storage  
**Estimated Time:** 4-8 hours  
**Prerequisites:** Phase 1 complete

### Task 2.1: Define TypeScript Types
**Time:** 30 minutes

**Create:** `src/types/show.ts`
```typescript
export interface Show {
  id?: number;
  identifier: string;
  date: string;
  venue: string;
  city: string;
  state: string;
  avgRating: number;
  numReviews: number;
  sourceType: 'sbd' | 'aud' | 'matrix' | null;
  taper: string | null;
  lastUpdated: string;
}

export interface ShowSearchParams {
  date?: string;
  year?: number;
  venue?: string;
  state?: string;
  minRating?: number;
  sourceType?: 'sbd' | 'aud' | 'matrix';
  limit?: number;
}
```

**Files Created:**
- `src/types/show.ts`

**Acceptance Criteria:**
- [ ] All interfaces defined
- [ ] Types compile without errors
- [ ] Matches database schema document

**Testing:**
```typescript
// Add to file temporarily to verify types
const testShow: Show = {
  identifier: 'test',
  date: '1977-05-08',
  venue: 'Cornell',
  city: 'Ithaca',
  state: 'NY',
  avgRating: 4.8,
  numReviews: 100,
  sourceType: 'sbd',
  taper: 'Miller',
  lastUpdated: new Date().toISOString()
};
```

---

### Task 2.2: Implement Database Class
**Time:** 45 minutes

**Create:** `src/services/database.ts`
```typescript
import Dexie, { Table } from 'dexie';
import { Show } from '../types/show';

class DeadStreamDatabase extends Dexie {
  shows!: Table<Show, number>;

  constructor() {
    super('DeadStreamDB');
    
    this.version(1).stores({
      shows: '++id, identifier, date, venue, state, avgRating, [date+avgRating]'
    });
  }
}

export const db = new DeadStreamDatabase();

// Helper functions
export async function addShow(show: Omit<Show, 'id'>): Promise<number> {
  return db.shows.add(show);
}

export async function getShowByIdentifier(identifier: string): Promise<Show | undefined> {
  return db.shows.where('identifier').equals(identifier).first();
}

export async function getShowsByDate(date: string): Promise<Show[]> {
  return db.shows.where('date').equals(date).toArray();
}

export async function getShowsByYear(year: number): Promise<Show[]> {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  
  return db.shows
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();
}

export async function getTopRatedShows(limit = 10): Promise<Show[]> {
  return db.shows
    .where('avgRating')
    .above(0)
    .sortBy('avgRating')
    .then(shows => shows.reverse().slice(0, limit));
}

export async function searchByVenue(venueName: string): Promise<Show[]> {
  return db.shows
    .where('venue')
    .startsWithIgnoreCase(venueName)
    .toArray();
}

export async function getShowCount(): Promise<number> {
  return db.shows.count();
}

export async function clearAllShows(): Promise<void> {
  return db.shows.clear();
}
```

**Files Created:**
- `src/services/database.ts`

**Acceptance Criteria:**
- [ ] Database class compiles without errors
- [ ] All helper functions defined
- [ ] Indexes match schema document
- [ ] TypeScript types correct

**Testing:**
Open browser console:
```javascript
import { db, addShow } from './services/database';

// Should open database
db.open();
```

---

### Task 2.3: Write Database Tests
**Time:** 1 hour

**Create:** `src/services/database.test.ts`
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  db, 
  addShow, 
  getShowByIdentifier,
  getShowsByDate,
  getShowsByYear,
  getTopRatedShows,
  getShowCount 
} from './database';
import { Show } from '../types/show';

describe('Database', () => {
  beforeEach(async () => {
    await db.shows.clear();
  });

  afterEach(async () => {
    await db.shows.clear();
  });

  it('adds a show to database', async () => {
    const show: Omit<Show, 'id'> = {
      identifier: 'gd1977-05-08.sbd',
      date: '1977-05-08',
      venue: 'Barton Hall, Cornell University',
      city: 'Ithaca',
      state: 'NY',
      avgRating: 4.8,
      numReviews: 500,
      sourceType: 'sbd',
      taper: 'Betty Boards',
      lastUpdated: new Date().toISOString()
    };
    
    const id = await addShow(show);
    expect(id).toBeGreaterThan(0);
    
    const retrieved = await db.shows.get(id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.venue).toBe('Barton Hall, Cornell University');
  });

  it('retrieves shows by identifier', async () => {
    await addShow({
      identifier: 'unique-id-123',
      date: '1977-05-08',
      venue: 'Test Venue',
      city: 'Test City',
      state: 'NY',
      avgRating: 4.0,
      numReviews: 10,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    const show = await getShowByIdentifier('unique-id-123');
    expect(show).toBeDefined();
    expect(show?.identifier).toBe('unique-id-123');
  });

  it('retrieves shows by date', async () => {
    await addShow({
      identifier: 'show1',
      date: '1977-05-08',
      venue: 'Cornell',
      city: 'Ithaca',
      state: 'NY',
      avgRating: 4.8,
      numReviews: 100,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    await addShow({
      identifier: 'show2',
      date: '1977-05-08',
      venue: 'Cornell',
      city: 'Ithaca',
      state: 'NY',
      avgRating: 4.7,
      numReviews: 90,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    const shows = await getShowsByDate('1977-05-08');
    expect(shows).toHaveLength(2);
  });

  it('retrieves shows by year', async () => {
    await addShow({
      identifier: 'show1',
      date: '1977-05-08',
      venue: 'Cornell',
      city: 'Ithaca',
      state: 'NY',
      avgRating: 4.8,
      numReviews: 100,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    await addShow({
      identifier: 'show2',
      date: '1977-06-09',
      venue: 'Winterland',
      city: 'San Francisco',
      state: 'CA',
      avgRating: 4.7,
      numReviews: 90,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    await addShow({
      identifier: 'show3',
      date: '1978-05-08',
      venue: 'Other',
      city: 'Other',
      state: 'NY',
      avgRating: 4.0,
      numReviews: 50,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    const shows = await getShowsByYear(1977);
    expect(shows).toHaveLength(2);
    expect(shows.every(s => s.date.startsWith('1977'))).toBe(true);
  });

  it('retrieves top rated shows', async () => {
    await addShow({
      identifier: 'show1',
      date: '1977-05-08',
      venue: 'Cornell',
      city: 'Ithaca',
      state: 'NY',
      avgRating: 4.8,
      numReviews: 100,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    await addShow({
      identifier: 'show2',
      date: '1977-06-09',
      venue: 'Winterland',
      city: 'San Francisco',
      state: 'CA',
      avgRating: 4.9,
      numReviews: 110,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    await addShow({
      identifier: 'show3',
      date: '1976-06-09',
      venue: 'Other',
      city: 'Other',
      state: 'NY',
      avgRating: 4.2,
      numReviews: 50,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    const topShows = await getTopRatedShows(2);
    expect(topShows).toHaveLength(2);
    expect(topShows[0].avgRating).toBeGreaterThanOrEqual(topShows[1].avgRating);
    expect(topShows[0].identifier).toBe('show2'); // Highest rated
  });

  it('counts shows correctly', async () => {
    expect(await getShowCount()).toBe(0);
    
    await addShow({
      identifier: 'show1',
      date: '1977-05-08',
      venue: 'Cornell',
      city: 'Ithaca',
      state: 'NY',
      avgRating: 4.8,
      numReviews: 100,
      sourceType: null,
      taper: null,
      lastUpdated: new Date().toISOString()
    });
    
    expect(await getShowCount()).toBe(1);
  });
});
```

**Files Created:**
- `src/services/database.test.ts`

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] Tests cover all query functions
- [ ] Database cleared before/after each test
- [ ] No test pollution (tests don't affect each other)

**Testing:**
```bash
npm run test database
# Should show all tests passing
```

---

### Task 2.4: Create Database Population Script
**Time:** 1.5 hours

**Create:** `src/services/populateDatabase.ts`

*(Full code too long for task list - see Phase 2.3 in react-implementation-roadmap.md)*

**Files Created:**
- `src/services/populateDatabase.ts`

**Acceptance Criteria:**
- [ ] Function fetches shows from archive.org
- [ ] Batches requests (1000 shows at a time)
- [ ] Progress callback works
- [ ] Error handling implemented
- [ ] Compiles without TypeScript errors

**Testing:**
```typescript
// Create test file: src/services/populateDatabase.test.ts
// Test with small dataset first (10 shows)
```

---

### Task 2.5: Create Database Initialization UI
**Time:** 1 hour

**Create:** `src/components/screens/DatabaseSetup.tsx`

*(See Phase 2.6 in roadmap for full code)*

**Files Created:**
- `src/components/screens/DatabaseSetup.tsx`

**Acceptance Criteria:**
- [ ] Component renders without errors
- [ ] Progress bar displays correctly
- [ ] Button triggers population
- [ ] Error states handled

**Testing:**
Add to `App.tsx` temporarily to test UI

---

### Task 2.6: Create Database Hook
**Time:** 45 minutes

**Create:** `src/hooks/useDatabase.ts`

*(See Phase 2.4 in roadmap for full code)*

**Files Created:**
- `src/hooks/useDatabase.ts`

**Acceptance Criteria:**
- [ ] Hook returns database state
- [ ] Re-renders on database changes
- [ ] TypeScript types correct

**Testing:**
Use in a test component

---

### Phase 2 Completion Checklist

- [ ] Task 2.1: TypeScript types defined
- [ ] Task 2.2: Database class implemented
- [ ] Task 2.3: Database tests written (all passing)
- [ ] Task 2.4: Population script created
- [ ] Task 2.5: Setup UI component created
- [ ] Task 2.6: Database hook created

**Phase 2 Success Criteria:**
- [ ] Can store/retrieve shows from IndexedDB
- [ ] All database tests pass
- [ ] Queries return results in < 100ms
- [ ] Database persists across browser restarts
- [ ] Can explain: What is IndexedDB? How does Dexie help?

**Commit Message:**
```
Phase 2 complete: IndexedDB database foundation

- Dexie database class with shows table
- All query functions implemented
- Full test coverage (6 tests passing)
- Population script for archive.org data
- Database setup UI component
- Custom React hooks for database access
```

---

## Phase 3-12: Task Breakdown

*(Continue same detailed format for remaining phases...)*

**Note:** Due to length, Phases 3-12 follow the same granular task breakdown pattern:
- Each task 15min-2hr maximum
- Specific files created/modified
- Acceptance criteria for each task
- Testing instructions
- Commit message template

See `react-implementation-roadmap.md` for Phase 3-4 details.
Phases 5-12 will be detailed as you progress.

---

## Quick Reference: Estimated Hours by Phase

| Phase | Description | Est. Hours |
|-------|-------------|------------|
| 1 | Project Setup | 2-4 |
| 2 | Database (IndexedDB) | 4-8 |
| 3 | API Integration | 4-6 |
| 4 | Audio Player | 6-10 |
| 5 | Recording Selection | 4-6 |
| 6 | UI Foundation | 8-12 |
| 7 | Browse Screen | 8-12 |
| 8 | Player Screen | 6-10 |
| 9 | Settings Screen | 4-6 |
| 10 | Integration & Testing | 8-12 |
| 11 | Pi Deployment | 4-6 |
| 12 | Polish & Optimization | 4-8 |
| **Total** | **56-90 hours** |

---

## Daily Task Planning Template

```markdown
## Today's Goals (Date: _______)

**Phase:** _____
**Tasks to Complete:**
- [ ] Task X.Y: _____ (Est: ___ min)
- [ ] Task X.Z: _____ (Est: ___ min)

**Actual Time Spent:**
- Task X.Y: ___ min
- Task X.Z: ___ min

**Learnings:**
- 
- 

**Blockers:**
- 

**Tomorrow:**
- 
```

---

## Completion Tracking

### Overall Progress
- [ ] Phase 1: Project Setup (2-4 hrs)
- [ ] Phase 2: Database (4-8 hrs)
- [ ] Phase 3: API (4-6 hrs)
- [ ] Phase 4: Audio (6-10 hrs)
- [ ] Phase 5: Selection (4-6 hrs)
- [ ] Phase 6: UI Foundation (8-12 hrs)
- [ ] Phase 7: Browse Screen (8-12 hrs)
- [ ] Phase 8: Player Screen (6-10 hrs)
- [ ] Phase 9: Settings Screen (4-6 hrs)
- [ ] Phase 10: Integration (8-12 hrs)
- [ ] Phase 11: Deployment (4-6 hrs)
- [ ] Phase 12: Polish (4-8 hrs)

**Total Hours Logged:** _____ / 56-90

---

**Start here: Phase 1, Task 1.1**
