import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SidePanel from './SidePanel.tsx'
import FileUploader from './fileUploader.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <h1>Designify</h1>
    <h3>Please upload a photo of the room you want to redesign (5MB max), we'll do the rest!</h3>
    <FileUploader 
      onUploadSuccess={(path) => console.log('File uploaded to:', path)}
      onUploadError={(error) => console.error('Upload failed:', error)} />
    <SidePanel />
  </StrictMode>,
)

