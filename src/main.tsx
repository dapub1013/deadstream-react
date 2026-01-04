import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { NavigationProvider } from './contexts/NavigationContext'
import { AudioProvider } from './contexts/AudioContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NavigationProvider>
      <AudioProvider>
        <App />
      </AudioProvider>
    </NavigationProvider>
  </StrictMode>,
)
