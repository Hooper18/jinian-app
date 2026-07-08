import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initStatusBarSync } from './lib/statusBar'
import './index.css'

initStatusBarSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
