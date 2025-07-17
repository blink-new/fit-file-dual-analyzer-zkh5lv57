import React, { useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { FileUploadState } from '../types/fit';

interface FileUploadProps {
  fileState: FileUploadState;
  onFileSelect: (file: File) => void;
  label: string;
  accept?: string;
}

export function FileUpload({ fileState, onFileSelect, label, accept = '.fit' }: FileUploadProps) {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const fitFile = files.find(file => file.name.toLowerCase().endsWith('.fit'));
    if (fitFile) {
      onFileSelect(fitFile);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const getStatusIcon = () => {
    if (fileState.loading) {
      return <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />;
    }
    if (fileState.error) {
      return <AlertCircle className="w-5 h-5 text-destructive" />;
    }
    if (fileState.data) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    return <Upload className="w-5 h-5 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (fileState.loading) return 'Processing...';
    if (fileState.error) return 'Error';
    if (fileState.data) return 'Ready';
    return 'Upload';
  };

  const getStatusColor = () => {
    if (fileState.loading) return 'border-primary bg-primary/5';
    if (fileState.error) return 'border-destructive bg-destructive/5';
    if (fileState.data) return 'border-green-500 bg-green-50';
    return 'border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5';
  };

  return (
    <div className="space-y-3">
      <Card 
        className={`transition-all duration-200 ${getStatusColor()}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div className="text-center">
                <h3 className="font-medium text-sm">{label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{getStatusText()}</p>
              </div>
            </div>

            {fileState.fileName && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{fileState.fileName}</span>
              </div>
            )}

            {fileState.data && (
              <div className="text-xs text-center space-y-1">
                <p className="text-green-600 font-medium">
                  {fileState.data.availableMetrics.length} metrics found
                </p>
                <p className="text-muted-foreground">
                  {fileState.data.availableMetrics.join(', ')}
                </p>
              </div>
            )}

            {!fileState.data && !fileState.loading && (
              <div className="space-y-3">
                <input
                  type="file"
                  accept={accept}
                  onChange={handleFileInput}
                  className="hidden"
                  id={`file-input-${label}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="cursor-pointer"
                >
                  <label htmlFor={`file-input-${label}`}>
                    Choose File
                  </label>
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  or drag and drop your .FIT file here
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {fileState.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {fileState.error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}