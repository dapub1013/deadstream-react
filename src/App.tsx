import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button } from './components/atoms/Button';
import { useDatabase } from './hooks/useDatabase';
import { DatabaseSetup } from './components/screens/DatabaseSetup';

function App() {
  const [count, setCount] = useState(0)
  const { isReady, showCount } = useDatabase();

  // Show database setup screen if database is empty
  if (!isReady) {
    return <DatabaseSetup />;
  }

  return (
    <>
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-bold">DeadStream Database</h2>
        <p>Status: {isReady ? 'Ready' : 'Empty'}</p>
        <p>Shows: {showCount}</p>
      </div>

      <Button size="large" onClick={() => alert('Clicked!')}>
        Test Button
      </Button>

      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
