import React, { useState } from 'react';
import type { ChangeEvent } from 'react';

/**
 * Props interface for the imageAnalyzer component
 * essentially what is needed is:
 * @property renderItems
 * @property 
 */
interface FileUploaderProps {
  onFileUpload?: (file: File) => void;
  onUploadSuccess?: (path: string) => void;
  onUploadError?: (error: string) => void;
}