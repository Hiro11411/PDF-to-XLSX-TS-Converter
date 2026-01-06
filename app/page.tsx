'use client';

import Head from 'next/head';

import React, { useState, useRef } from 'react';

import { Github, Linkedin, Instagram } from 'lucide-react';

export default function PDFProcessor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null); //meaning that it can return as file or null, both at the same time interchangable
  const [selectedFormat, setSelectedFormat] = useState<'markdown' | 'excel' | null>(null);
  const [sortOption, setSortOption] = useState<'default' | 'price' | 'unit_price' | 'quantity'>('default'); 
  const [useCustomFormat, setUseCustomFormat] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedData, setProcessedData] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  //return type
  const showMessage = (text: string, type: 'success' | 'error') => {
  setMessage({ text, type });
  
  // Auto-clear message after 5 seconds
  setTimeout(() => {
    setMessage({ text: '', type: '' });
  }, 5000);
};
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => { //file is not built in definition
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    //if file does not end with pdf, then show err
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showMessage('Please select a PDF file', 'error');
      return false;
    }
    
    if (file.size > maxSize) {
      showMessage('File size must be less than 10MB', 'error');
      return false;
    }
    
    return true;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleFile = (file: File) => {
    if (!validateFile(file)) return;
    
    setSelectedFile(file);
    setSelectedFormat(null);
    setProcessedData(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setSelectedFormat(null);
    setProcessedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = async () => {
    if (!selectedFile || !selectedFormat) return;
    
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('format', selectedFormat);
      formData.append('sortBy', sortOption)
      formData.append('customFormat', useCustomFormat.toString());

      console.log('backend data:', selectedFile.name, selectedFormat)
      
      //connecting from front end to  end calling here.
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Processing failed');
      }

      const contentType = response.headers.get('content-type');
      console.log('content type:', contentType);
      
      const blob = await response.blob();
      console.log('blob size', blob.size);

      //download triggering mechanism markdown
      const url =  URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; //points to other website
      a.download = selectedFile.name.replace('pdf', selectedFormat === 'markdown' ? '.md' : '.xlsx')
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showMessage('file has been processed', 'success')
      
    } catch (error) {
      console.log('complete err', error)
      showMessage('Error processing file: ', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  //downloading the file after inputed 

  return (
    <>
    <head>
      <title>PDF to MD/XLSX Converter</title>
    </head>
    <div className="bg-black min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-purple-400 mb-2">PDF to MD/XLSX Converter</h1>
          <p className="text-gray-400">Upload a PDF to convert it to Markdown or Excel</p>
        </div>

        {!isProcessing && !processedData && (
          <div className="bg-gray-900 rounded-lg shadow-sm p-8 mb-6 border border-gray-800">
            {/* Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-purple-400 bg-purple-900/20' : 'border-gray-700 hover:border-purple-500'
              }`}
            >
              <svg className="mx-auto h-12 w-12 text-purple-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-lg text-gray-300 mb-2">Drop your PDF here or click to browse</p>
              <p className="text-sm text-gray-500 mb-2">PDF files only, up to 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {/* Selected File Display */}
            {selectedFile && (
              <div className="mt-6 p-4 bg-black rounded-lg border border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="h-8 w-8 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button onClick={removeFile} className="text-gray-400 hover:text-gray-200">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}

            {/* Output Format Selection */}
            {selectedFile && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">Output Format</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedFormat('markdown')}
                    className={`px-6 py-3 border-2 rounded-lg transition-colors ${
                      selectedFormat === 'markdown'
                        ? 'border-purple-500 bg-purple-900/30 text-purple-300'
                        : 'border-gray-700 text-gray-400 hover:border-purple-500 hover:bg-purple-900/20'
                    }`}
                  >
                    <svg className="h-6 w-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Markdown
                  </button>
                  <button
                    onClick={() => setSelectedFormat('excel')}
                    className={`px-6 py-3 border-2 rounded-lg transition-colors ${
                      selectedFormat === 'excel'
                        ? 'border-purple-500 bg-purple-900/30 text-purple-300'
                        : 'border-gray-700 text-gray-400 hover:border-purple-500 hover:bg-purple-900/20'
                    }`}
                  >
                    <svg className="h-6 w-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Excel
                  </button>
                </div>
              </div>
            )}

            {selectedFile && selectedFormat && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">Sort By</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-gray-300 focus:border-purple-500 outline-none"
                >
                  <option value="default">Default Order</option>
                  <option value="amount">Total Amount (Lowest to Highest)</option>
                  <option value="unit_price">Unit Price (Lowest to Highest)</option>
                  <option value="quantity">Quantity (Lowest to Highest)</option>
                </select>
              </div>
            )}

            {/* NEW: Custom Format Button - Shows ONLY for Excel */}
            {selectedFile && selectedFormat === 'excel' && (
              <div className="mt-6">
                <button
                  onClick={() => setUseCustomFormat(!useCustomFormat)}
                  className={`w-full px-4 py-3 border-2 rounded-lg transition-colors ${
                    useCustomFormat
                      ? 'border-pink-500 bg-pink-900/30 text-pink-300'
                      : 'border-gray-700 text-gray-400 hover:border-pink-500 hover:bg-pink-900/20'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>
                      {useCustomFormat ? '✓ Custom Format (Winson)' : 'Use Custom Format (Winson)'}
                    </span>
                  </div>
                </button>
                {useCustomFormat && (
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Custom format will be applied to Excel output
                  </p>
                )}
              </div>
            )}

            {/* Process Button */}
            {selectedFile && selectedFormat && (
              <button
                onClick={processFile}
                className="w-full mt-6 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Process PDF
              </button>
            )}
          </div>
        )}

        {/* Processing Section */}
        {isProcessing && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 shadow-sm p-8 mb-6">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
              <h3 className="text-lg font-medium text-gray-200 mb-2">Processing your PDF...</h3>
              <p className="text-gray-400">This may take a few moments</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {processedData && !isProcessing && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-purple-400">Processing Complete!</h3>
              <span className="px-3 py-1 bg-purple-900/30 text-purple-300 border border-purple-500 rounded-full text-sm font-medium">Success</span>
            </div>
            
            {/* Preview Area */}
            <div className="bg-black rounded-lg border border-gray-800 p-6 mb-6 max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">{processedData}</pre>
            </div>

            {/* Download Button */}
            <div className="flex space-x-4">
              <button
                onClick={downloadFile}
                className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download File
              </button>
              <button
                onClick={resetApp}
                className="px-6 py-3 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors font-medium"
              >
                Process Another
              </button>
            </div>
          </div>
        )}

        {/* Message Display */}
        {message.text && (
          <div className={`mt-6 p-4 rounded-lg border ${
            message.type === 'error' 
              ? 'bg-red-900/20 text-red-300 border-red-800' 
              : 'bg-purple-900/20 text-purple-300 border-purple-800'
          }`}>
            {message.text}
          </div>
        )}
      </div>
      
      <footer className="border-t border-gray-800 mt-auto py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex justify-center gap-10 text-gray-500">
            <a 
              href="https://github.com/hiro11411" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-purple-400 transition"
              aria-label='Github'
            >
              <Github size={24} />
            </a>
            <a 
              href="https://www.linkedin.com/in/hiroaki-okumura" 
              target="_blank" 
      
              rel="noopener noreferrer"
              className="hover:text-purple-400 transition"
              aria-label='LinkedIn'
            >
              <Linkedin size={24}/>
            </a>
            <a 
              href="https://www.instagram.com/hiro111406/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-purple-400 transition"
              aria-label='Instagram'
            >
              <Instagram size={24}/>
            </a>
          </div>
          <p className="text-center text-gray-600 text-xs mt-4">
            © 2025 Hiro
          </p>
        </div>
      </footer>
    </div>
    </>
  );
};
