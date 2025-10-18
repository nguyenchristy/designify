import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import SidePanel from './SidePanel.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <SidePanel />
  </StrictMode>,
)
