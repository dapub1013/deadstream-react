# Quick Reference Guide - DeadStream React

**Purpose:** Fast lookup for common commands, patterns, and solutions  
**Keep this handy while working**

---

## Essential Commands

### Development
```bash
# Start dev server (hot reload)
npm run dev

# Run tests (watch mode)
npm run test

# Run tests once
npm run test -- --run

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx tsc --noEmit
```

### Git
```bash
# Status
git status

# Add all changes
git add .

# Commit
git commit -m "Phase X.Y: Description"

# Push
git push origin main

# View log
git log --oneline
```

### Package Management
```bash
# Install package
npm install package-name

# Install dev package
npm install -D package-name

# Update packages
npm update

# Check for outdated
npm outdated

# View dependency tree
npm list
```

---

## Common React Patterns

### Functional Component
```typescript
interface Props {
  name: string;
  age?: number;
}

export function MyComponent({ name, age = 0 }: Props) {
  return <div>{name} is {age}</div>;
}
```

### Component with State
```typescript
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

### Component with Effect
```typescript
import { useState, useEffect } from 'react';

export function DataFetcher() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      const result = await fetch('/api/data');
      setData(await result.json());
      setLoading(false);
    }
    fetchData();
  }, []); // Empty array = run once on mount
  
  if (loading) return <div>Loading...</div>;
  return <div>{JSON.stringify(data)}</div>;
}
```

### Custom Hook
```typescript
import { useState, useEffect } from 'react';

export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return size;
}
```

---

## Common Tailwind Patterns

### Touch-Friendly Button
```tsx
<button className="h-touch w-touch bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700">
  Click Me
</button>
```

### Flexbox Layout
```tsx
<div className="flex items-center justify-between">
  <div>Left</div>
  <div>Right</div>
</div>

<div className="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Grid Layout
```tsx
<div className="grid grid-cols-3 gap-4">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</div>
```

### Responsive Design
```tsx
<div className="text-sm md:text-base lg:text-lg">
  Responsive text
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  Responsive grid
</div>
```

### Common Utilities
```tsx
// Spacing
className="p-4 m-2 px-6 py-3 mx-auto"

// Typography
className="text-lg font-bold text-gray-800"

// Colors
className="bg-blue-500 text-white border-gray-300"

// Rounded corners
className="rounded rounded-lg rounded-full"

// Shadows
className="shadow shadow-md shadow-lg"

// Display
className="hidden block inline-block flex"
```

---

## Dexie.js (IndexedDB) Patterns

### Basic Queries
```typescript
// Get by primary key
const show = await db.shows.get(123);

// Get by index
const show = await db.shows
  .where('identifier')
  .equals('gd1977-05-08.sbd')
  .first();

// Get multiple
const shows = await db.shows
  .where('date')
  .equals('1977-05-08')
  .toArray();

// Range query
const shows = await db.shows
  .where('date')
  .between('1977-01-01', '1977-12-31', true, true)
  .toArray();

// Starts with
const shows = await db.shows
  .where('venue')
  .startsWith('Fillmore')
  .toArray();
```

### Sorting and Limiting
```typescript
// Sort ascending
const shows = await db.shows
  .orderBy('date')
  .toArray();

// Sort descending
const shows = await db.shows
  .orderBy('avgRating')
  .reverse()
  .toArray();

// Limit results
const shows = await db.shows
  .orderBy('avgRating')
  .reverse()
  .limit(10)
  .toArray();
```

### Filtering
```typescript
// Filter with function
const shows = await db.shows
  .where('state')
  .equals('CA')
  .and(show => show.avgRating > 4.5)
  .toArray();

// Multiple conditions
const shows = await db.shows
  .filter(show => 
    show.state === 'NY' && 
    show.avgRating > 4.0 &&
    show.numReviews > 50
  )
  .toArray();
```

### Modifying Data
```typescript
// Add
await db.shows.add(newShow);

// Bulk add
await db.shows.bulkAdd([show1, show2, show3]);

// Update
await db.shows.update(123, { avgRating: 4.9 });

// Modify with where clause
await db.shows
  .where('identifier')
  .equals('gd1977-05-08')
  .modify({ sourceType: 'sbd' });

// Delete
await db.shows.delete(123);

// Clear all
await db.shows.clear();
```

---

## Testing Patterns

### Component Test
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent name="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### Async Test
```typescript
it('fetches data', async () => {
  render(<DataComponent />);
  
  // Wait for loading to finish
  await screen.findByText('Loaded!');
  
  expect(screen.getByText('Data here')).toBeInTheDocument();
});
```

### Hook Test
```typescript
import { renderHook, waitFor } from '@testing-library/react';

it('useData hook works', async () => {
  const { result } = renderHook(() => useData());
  
  expect(result.current.loading).toBe(true);
  
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });
  
  expect(result.current.data).toBeDefined();
});
```

---

## TypeScript Patterns

### Interface vs Type
```typescript
// Interface (can be extended)
interface Show {
  id: number;
  name: string;
}

interface DetailedShow extends Show {
  description: string;
}

// Type (more flexible)
type Status = 'loading' | 'success' | 'error';

type ShowOrNull = Show | null;
```

### Optional Properties
```typescript
interface Config {
  name: string;
  age?: number;  // Optional
  email?: string;
}

// Usage
const config: Config = { name: 'Test' }; // Valid
```

### Function Types
```typescript
type Callback = (value: string) => void;

interface Props {
  onClick: (id: number) => void;
  onSubmit?: () => Promise<void>;
}
```

### Utility Types
```typescript
// Partial - make all properties optional
type PartialShow = Partial<Show>;

// Pick - select specific properties
type ShowPreview = Pick<Show, 'id' | 'name'>;

// Omit - exclude properties
type ShowWithoutId = Omit<Show, 'id'>;

// Required - make all properties required
type RequiredConfig = Required<Config>;
```

---

## Common Error Solutions

### "Module not found"
```bash
# Make sure dependency is installed
npm install package-name

# Check import path
# Wrong: import { X } from 'components/X'
# Right:  import { X } from './components/X'
```

### "Type error in test file"
```typescript
// Add to src/test/setup.ts
import '@testing-library/jest-dom';

// Make sure vitest.config.ts has globals: true
```

### "Tailwind classes not working"
```javascript
// Check tailwind.config.js content paths
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
]

// Make sure @tailwind directives in src/index.css
```

### "IndexedDB not persisting"
```typescript
// Check if in incognito mode (IndexedDB disabled)
// Clear browser data and try again
// Check Application tab in DevTools
```

### "Hot reload not working"
```bash
# Restart dev server
# Clear browser cache
# Check for console errors
```

---

## Browser DevTools

### Inspect IndexedDB
1. Open DevTools (F12)
2. Application tab (Chrome) or Storage tab (Firefox)
3. IndexedDB → DeadStreamDB → shows
4. Browse/edit records directly

### React DevTools
1. Install React DevTools extension
2. Open DevTools → Components tab
3. Inspect component props/state
4. Profiler tab for performance

### Console Tricks
```javascript
// Import database in console
import { db } from './services/database';

// Query directly
await db.shows.count()
await db.shows.where('date').equals('1977-05-08').toArray()

// Clear and reset
await db.delete()
```

---

## File Organization

```
src/
├── components/
│   ├── atoms/           # Button, Input, Icon
│   ├── molecules/       # ShowCard, VolumeControl
│   ├── organisms/       # ShowList, PlayerWidget
│   └── screens/         # BrowseScreen, PlayerScreen
├── services/
│   ├── archiveApi.ts    # API calls
│   ├── database.ts      # Dexie + helpers
│   ├── audioPlayer.ts   # Audio control
│   └── scoringEngine.ts # Selection algorithm
├── hooks/
│   ├── useDatabase.ts
│   ├── useAudio.ts
│   └── useMetadata.ts
├── contexts/
│   ├── AudioContext.tsx
│   └── PreferencesContext.tsx
├── types/
│   ├── show.ts
│   ├── metadata.ts
│   └── preferences.ts
└── utils/
    └── validation.ts
```

---

## Keyboard Shortcuts

### VS Code
- `Cmd/Ctrl + P` - Quick open file
- `Cmd/Ctrl + Shift + P` - Command palette
- `Cmd/Ctrl + /` - Toggle comment
- `Cmd/Ctrl + D` - Select next occurrence
- `Alt + Up/Down` - Move line up/down
- `F2` - Rename symbol

### Browser DevTools
- `Cmd/Ctrl + Shift + C` - Inspect element
- `Cmd/Ctrl + Shift + M` - Toggle device toolbar
- `Cmd/Ctrl + R` - Reload
- `Cmd/Ctrl + Shift + R` - Hard reload

---

## Phase Checklist Template

```markdown
## Phase X: Description

**Goal:** _______________
**Estimated Time:** ___ hours

### Tasks
- [ ] X.1: Task name (___min)
- [ ] X.2: Task name (___min)
- [ ] X.3: Task name (___min)

### Testing
- [ ] All tests pass
- [ ] TypeScript compiles
- [ ] Manual testing complete

### Commit
```
Phase X complete: Summary

- Bullet points of what was done
- Major changes
- Test results
```
```

---

## When Stuck

1. **Read error message carefully** - TypeScript errors are usually helpful
2. **Check documentation** - React, Dexie, Tailwind all have excellent docs
3. **Search the issue** - Stack Overflow, GitHub issues
4. **Simplify** - Create minimal reproduction
5. **Take a break** - Fresh eyes help
6. **Ask for help** - Describe what you tried

---

## Performance Tips

### React
- Use `React.memo()` for expensive components
- Use `useCallback()` for stable function references
- Use `useMemo()` for expensive calculations
- Lazy load components: `const Component = lazy(() => import('./Component'))`

### IndexedDB
- Use indexes for frequent queries
- Batch operations with `bulkAdd()` / `bulkPut()`
- Limit results when possible
- Avoid full table scans

### Tailwind
- Purge unused CSS in production (automatic with Vite)
- Use fixed sizing when possible
- Avoid arbitrary values: `w-[123px]` → `w-32`

---

## Useful Links

### Documentation
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org/docs
- Vite: https://vitejs.dev/guide
- Dexie: https://dexie.org
- Tailwind: https://tailwindcss.com/docs
- Vitest: https://vitest.dev
- Testing Library: https://testing-library.com

### Tools
- Can I Use: https://caniuse.com (browser support)
- TypeScript Playground: https://www.typescriptlang.org/play
- Tailwind Playground: https://play.tailwindcss.com

### Community
- React Discord: https://discord.gg/react
- Stack Overflow: https://stackoverflow.com/questions/tagged/reactjs

---

**Keep this reference open while coding!**
