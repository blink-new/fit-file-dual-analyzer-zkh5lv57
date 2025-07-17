import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { FileUpload } from './FileUpload';
import { Alert, AlertDescription } from './ui/alert';
import { Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FileUploadState, ProcessedFitData } from '../types/fit';
import { fitProcessor } from '../utils/fitParser';

interface UploadPageProps {
  onAnalyze: (file1Data: ProcessedFitData | null, file2Data: ProcessedFitData | null) => void;
}

export function UploadPage({ onAnalyze }: UploadPageProps) {
  const [file1State, setFile1State] = useState<FileUploadState>({
    file: null,
    data: null,
    loading: false,
    error: null,
    fileName: ''
  });

  const [file2State, setFile2State] = useState<FileUploadState>({
    file: null,
    data: null,
    loading: false,
    error: null,
    fileName: ''
  });

  const processFile = useCallback(async (
    file: File, 
    setState: React.Dispatch<React.SetStateAction<FileUploadState>>
  ) => {
    setState(prev => ({
      ...prev,
      file,
      fileName: file.name,
      loading: true,
      error: null,
      data: null
    }));

    try {
      const data = await fitProcessor.processFile(file);
      setState(prev => ({
        ...prev,
        loading: false,
        data,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to process file',
        data: null
      }));
    }
  }, []);

  const handleFile1Select = useCallback((file: File) => {
    processFile(file, setFile1State);
  }, [processFile]);

  const handleFile2Select = useCallback((file: File) => {
    processFile(file, setFile2State);
  }, [processFile]);

  const handleAnalyze = useCallback(() => {
    onAnalyze(file1State.data, file2State.data);
  }, [file1State.data, file2State.data, onAnalyze]);

  const canAnalyze = file1State.data || file2State.data;
  const hasErrors = file1State.error || file2State.error;
  const isLoading = file1State.loading || file2State.loading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <Activity className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">FIT File Analyzer</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Upload two .FIT files from your training sessions to visualize and analyze your performance data. 
              Each file can contain different metrics - we'll combine them intelligently.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Upload Training Files</span>
              {canAnalyze && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Section */}
            <div className="grid md:grid-cols-2 gap-6">
              <FileUpload
                fileState={file1State}
                onFileSelect={handleFile1Select}
                label="Training File 1"
              />
              <FileUpload
                fileState={file2State}
                onFileSelect={handleFile2Select}
                label="Training File 2"
              />
            </div>

            {/* Status Messages */}
            {hasErrors && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please fix the errors above before proceeding with analysis.
                </AlertDescription>
              </Alert>
            )}

            {canAnalyze && !hasErrors && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Files processed successfully! Ready for analysis.
                </AlertDescription>
              </Alert>
            )}

            {/* Instructions */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-medium text-sm">Instructions:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Upload at least one .FIT file to proceed</li>
                <li>• Files can contain partial data (e.g., one with power, another with heart rate)</li>
                <li>• Supported metrics: Power, Heart Rate, Speed, Cadence, Elevation</li>
                <li>• GPS data is optional and not required for analysis</li>
              </ul>
            </div>

            {/* Analyze Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleAnalyze}
                disabled={!canAnalyze || hasErrors || isLoading}
                size="lg"
                className="px-8"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Processing...
                  </>
                ) : (
                  'Analyze Training Data'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}