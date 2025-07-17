import React, { useState, useMemo } from 'react';
import { UploadPage } from './components/UploadPage';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { ProcessedFitData } from './types/fit';
import { combineFileData } from './utils/dataCombiner';

type AppState = 'upload' | 'analysis';

function App() {
  const [currentState, setCurrentState] = useState<AppState>('upload');
  const [file1Data, setFile1Data] = useState<ProcessedFitData | null>(null);
  const [file2Data, setFile2Data] = useState<ProcessedFitData | null>(null);

  const combinedData = useMemo(() => {
    return combineFileData(file1Data, file2Data);
  }, [file1Data, file2Data]);

  const handleAnalyze = (data1: ProcessedFitData | null, data2: ProcessedFitData | null) => {
    setFile1Data(data1);
    setFile2Data(data2);
    setCurrentState('analysis');
  };

  const handleNewUpload = () => {
    setFile1Data(null);
    setFile2Data(null);
    setCurrentState('upload');
  };

  return (
    <div className="min-h-screen">
      {currentState === 'upload' ? (
        <UploadPage onAnalyze={handleAnalyze} />
      ) : (
        <AnalysisDashboard 
          combinedData={combinedData} 
          onNewUpload={handleNewUpload} 
        />
      )}
    </div>
  );
}

export default App;