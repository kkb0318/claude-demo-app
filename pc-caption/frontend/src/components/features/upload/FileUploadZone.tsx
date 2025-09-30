'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, FileJson } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFileType } from '@/lib/utils';
import type { FileUpload } from '@/types/api';

interface FileUploadZoneProps {
  onFilesAdded: (files: FileUpload[]) => void;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  isUploading?: boolean;
  disabled?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesAdded,
  maxFiles = 10,
  acceptedFileTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/json'],
  isUploading = false,
  disabled = false
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const fileUploads: FileUpload[] = acceptedFiles.map(file => {
      const type = getFileType(file);
      const fileUpload: FileUpload = {
        file,
        type: type === 'unknown' ? 'image' : type
      };

      if (type === 'image') {
        fileUpload.preview = URL.createObjectURL(file);
      }

      return fileUpload;
    });

    onFilesAdded(fileUploads);
  }, [onFilesAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/json': ['.json']
    },
    disabled: disabled || isUploading
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center space-y-4">
        {isUploading ? (
          <div className="animate-pulse">
            <Upload className="w-12 h-12 text-blue-500 animate-bounce" />
          </div>
        ) : (
          <Upload className="w-12 h-12 text-gray-400" />
        )}

        <div>
          {isUploading ? (
            <p className="text-lg font-medium text-blue-600 animate-pulse">
              Processing files...
            </p>
          ) : (
            <p className="text-lg font-medium text-gray-700">
              {isDragActive
                ? 'Drop files here'
                : 'Drag & drop files here, or click to select'}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Supported files: PNG, JPEG, JSON
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Maximum {maxFiles} files
          </p>
        </div>

        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileImage className="w-5 h-5" />
            <span>Screenshots</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileJson className="w-5 h-5" />
            <span>Operation Log</span>
          </div>
        </div>
      </div>
    </div>
  );
};