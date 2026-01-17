'use client';

import { useCallback, useState } from 'react';

interface FileUploaderProps {
  onFileLoad: (content: string, fileName: string) => void;
}

export default function FileUploader({ onFileLoad }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.name.match(/\.(csv|tsv|txt)$/i)) {
      alert('请上传 CSV、TSV 或 TXT 格式的文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileLoad(content, file.name);
    };
    reader.readAsText(file);
  }, [onFileLoad]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div className="glass rounded-lg p-8 mb-6">
      <h2 className="text-xl font-semibold text-white mb-4">上传数据文件</h2>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver 
            ? 'border-cyan-500 bg-cyan-500/10' 
            : 'border-gray-600 hover:border-cyan-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center gap-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
          <div>
            <p className="text-lg font-medium text-white mb-2">
              拖拽文件到此处或点击选择
            </p>
            <p className="text-sm text-gray-400">
              支持 CSV、TSV、TXT 格式，最大 50MB
            </p>
          </div>
          
          <label className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors font-medium cursor-pointer">
            选择文件
            <input
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-400">
        <p><span className="font-medium text-cyan-300">提示：</span>文件内容将在浏览器中本地处理，不会上传到任何服务器。</p>
      </div>
    </div>
  );
}