'use client';

import React from 'react';
import { X, FileImage, FileJson, File } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import type { FileUpload } from '@/types/api';

interface FileListProps {
  files: FileUpload[];
  onRemove: (fileName: string) => void;
}

export const FileList: React.FC<FileListProps> = ({ files, onRemove }) => {
  if (files.length === 0) {
    return null;
  }

  const getFileIcon = (type: FileUpload['type']) => {
    switch (type) {
      case 'image':
        return <FileImage className="w-5 h-5 text-blue-500" />;
      case 'json':
        return <FileJson className="w-5 h-5 text-green-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="mt-6 space-y-2">
      <h3 className="text-sm font-medium text-gray-700">Uploaded Files</h3>
      <div className="space-y-2">
        {files.map((fileUpload) => (
          <div
            key={fileUpload.file.name}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              {getFileIcon(fileUpload.type)}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {fileUpload.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatBytes(fileUpload.file.size)}
                </p>
              </div>
            </div>
            <button
              onClick={() => onRemove(fileUpload.file.name)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              aria-label={`Remove ${fileUpload.file.name}`}
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};