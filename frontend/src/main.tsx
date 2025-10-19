import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SidePanel from './SidePanel.tsx'
import FileUploader from './fileUploader.tsx'
import { RenderedImage } from './renderedImage.tsx'

function App() {
  const [isUploaded, setIsUploaded] = useState(false);

  return (
    <div className="app-container">
      <h1>Designify</h1>
      {!isUploaded ? (
        <>
          <h3>Please upload a photo of the room you want to redesign (5MB max), we'll do the rest!</h3>
          <FileUploader 
            onUploadSuccess={(path) => {
              console.log('File uploaded to:', path);
              setIsUploaded(true);
            }}
            onUploadError={(error) => console.error('Upload failed:', error)}
            isSubmitted={setIsUploaded}
          />
        </>
      ) : (
        <div className="content-container">
          <RenderedImage />
          <SidePanel />
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)