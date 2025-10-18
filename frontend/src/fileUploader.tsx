import React, { useState } from 'react';
import type { ChangeEvent } from 'react';

/**
 * Props interface for the FileUploader component
 * @property onFileUpload - Optional callback when a file is selected
 * @property onUploadSuccess - Optional callback when file upload succeeds, receives the upload path
 * @property onUploadError - Optional callback when file upload fails, receives the error message
 */
interface FileUploaderProps {
  onFileUpload?: (file: File) => void;
  onUploadSuccess?: (path: string) => void;
  onUploadError?: (error: string) => void;
}

/**
 * Interface defining the structure of upload confirmation data
 * Used to display upload results and store upload metadata
 */
interface UploadConfirmation {
  fileName: string;
  fileSize: number;
  uploadPath: string;
  timestamp: string;
  fileType: string;
  previewUrl?: string;
}

/**
 * FileUploader Component
 * Handles file selection and uploading to a backend server with a confirmation view
 */
const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, onUploadSuccess, onUploadError }) => {
  // State management for file handling and UI
  const [selectedFile, setSelectedFile] = useState<File | null>(null);        // Stores the currently selected file
  const [isUploading, setIsUploading] = useState(false);                     // Tracks upload status for UI feedback
  const [showConfirmation, setShowConfirmation] = useState(false);           // Controls confirmation view visibility
  const [uploadResult, setUploadResult] = useState<UploadConfirmation | null>(null); // Stores upload result data

  /**
   * Handles the file upload process to the backend server
   * @param file - The file to upload
   * @returns UploadConfirmation object with upload details
   */
  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const previewUrl = createPreviewUrl(file);
      const confirmation: UploadConfirmation = {
        fileName: file.name,
        fileSize: file.size,
        uploadPath: data.path,
        timestamp: new Date().toLocaleString(),
        fileType: file.type,
        previewUrl
      };
      setUploadResult(confirmation);
      onUploadSuccess?.(data.path);
      return confirmation;
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handles file selection from the input element
   * Updates component state and triggers the onFileUpload callback
   */
  /**
   * Creates a preview URL for the file if it's an image
   * @param file - The file to create a preview for
   * @returns Preview URL or undefined if not an image
   */
  const createPreviewUrl = (file: File): string | undefined => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return undefined;
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setShowConfirmation(false);
      
      // Notify parent component of file selection
      if (onFileUpload) {
        onFileUpload(file);
      }
    }
  };

  /**
   * Triggers the hidden file input when the select button is clicked
   * This allows for a custom-styled button while maintaining native file picker functionality
   */
  const handleFileClick = () => {
    document.getElementById('file-upload')?.click();
  };

  /**
   * Handles the submit button click
   * Initiates the file upload process and shows the confirmation view on success
   */
  const handleSubmitClick = async () => {
    if (!selectedFile) return;

    try {
      await uploadFile(selectedFile);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  /**
   * Renders the confirmation view showing upload details
   * Only displayed after a successful file upload
   */
  const renderConfirmation = () => {
    if (!uploadResult) return null;

    const renderPreview = () => {
      if (uploadResult.previewUrl) {
        return (
          <div className="file-preview">
            <img 
              src={uploadResult.previewUrl} 
              alt={uploadResult.fileName}
              className="preview-image"
            />
          </div>
        );
      } else {
        // Show an icon or placeholder based on file type
        return (
          <div className="file-preview file-icon">
            <div className="file-type">{uploadResult.fileType.split('/')[1].toUpperCase()}</div>
          </div>
        );
      }
    };

    return (
      <div className="upload-confirmation">
        <h2>File Successfully Uploaded!</h2>
        {renderPreview()}
        <div className="confirmation-details">
          <p><strong>File Name:</strong> {uploadResult.fileName}</p>
          <p><strong>Type:</strong> {uploadResult.fileType}</p>
          <p><strong>Size:</strong> {(uploadResult.fileSize / 1024).toFixed(2)} KB</p>
          <p><strong>Upload Path:</strong> {uploadResult.uploadPath}</p>
          <p><strong>Timestamp:</strong> {uploadResult.timestamp}</p>
        </div>
        <button 
          onClick={() => {
            setSelectedFile(null);
            setShowConfirmation(false);
            setUploadResult(null);
            // Clean up any object URLs to prevent memory leaks
            if (uploadResult.previewUrl) {
              URL.revokeObjectURL(uploadResult.previewUrl);
            }
          }}
          className="new-upload-button"
        >
          Upload Another File
        </button>
      </div>
    );
  };

  // Main component render method
  return (
    <div className="file-uploader">
      {/* Conditional rendering based on upload state */}
      {showConfirmation ? (
        // Show confirmation view after successful upload
        renderConfirmation()
      ) : (
        // Show file selection and upload interface
        <>
          {/* Hidden file input - triggered by select button */}
          <input
            type="file"
            id="file-upload"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          {/* File selection button */}
          <button 
            onClick={handleFileClick} 
            className="select-button"
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Select File'}
          </button>
          
          {/* File preview and information display */}
          {selectedFile && (
            <>
              <div className="file-preview">
                {selectedFile.type.startsWith('image/') ? (
                  <img 
                    src={createPreviewUrl(selectedFile)} 
                    alt={selectedFile.name}
                    className="preview-image"
                  />
                ) : (
                  <div className="file-icon">
                    <div className="file-type">
                      {selectedFile.type.split('/')[1].toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
              <div className="file-info">
                <p>Selected file: {selectedFile.name}</p>
                <p>Type: {selectedFile.type}</p>
                <p>Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
              </div>
            </>
          )}
          
          {/* Submit button - only shown when a file is selected */}
          {selectedFile && (
            <button
              onClick={handleSubmitClick}
              className="submit-button"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Submit File'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default FileUploader;
