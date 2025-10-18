import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import SidePanel from './SidePanel.tsx'
import FileUploader from './fileUploader.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <h1>Designify</h1>
    <h3>Please upload a photo of the room you want to redesign, we'll do the rest!</h3>
    <FileUploader />
    <SidePanel />
  </StrictMode>,
)
