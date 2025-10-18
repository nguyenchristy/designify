import React, { useState } from 'react';
import type { ChangeEvent } from 'react';

interface FileUploaderProps {
  onFileUpload?: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      
      // Call the callback if provided
      if (onFileUpload) {
        onFileUpload(file);
      }
    }
  };

  const handleClick = () => {
    // Programmatically click the hidden file input
    document.getElementById('file-upload')?.click();
  };

  return (
    <div className="file-uploader">
      <input
        type="file"
        id="file-upload"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <button onClick={handleClick} className="upload-button">
        Upload File
      </button>
      {selectedFile && (
        <div className="file-info">
          <p>Selected file: {selectedFile.name}</p>
          <p>Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
