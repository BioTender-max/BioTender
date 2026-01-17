'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import FileUploader from '@/components/pca-umap-viewer/FileUploader';
import PCAPlot from '@/components/pca-umap-viewer/PCAPlot';
import { parseExpressionData, detectDataLayout, ExpressionData, DataLayout, DetectedLayout } from '@/src/utils/expressionParser';

export default function PCAUMAPViewerPage() {
  const [data, setData] = useState<ExpressionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<DetectedLayout | null>(null);
  const [selectedGroupColumn, setSelectedGroupColumn] = useState<string>('');
  const [algorithm, setAlgorithm] = useState<'pca' | 'umap'>('pca');

  const handleFileLoad = useCallback((content: string, fileName: string) => {
    setError(null);
    
    try {
      // 检测数据布局
      const detectedLayout = detectDataLayout(content);
      setLayout(detectedLayout);

      // 解析数据
      const result = parseExpressionData(content, detectedLayout.layout);
      
      if ('error' in result) {
        setError(result.error);
        setData(null);
        setLayout(null);
      } else {
        setData(result);
        // 默认选择第一个非数据列作为分组列
        const nonDataColumns = result.nonDataColumns;
        if (nonDataColumns.length > 0) {
          setSelectedGroupColumn(nonDataColumns[0]);
        }
      }
    } catch (err) {
      setError(`解析失败: ${err instanceof Error ? err.message : String(err)}`);
      setData(null);
      setLayout(null);
    }
  }, []);

  const exportPlot = () => {
    if (!data) return;
    
    // 这里会由PCAPlot组件处理导出逻辑
    // 通过ref调用子组件的导出方法
  };

  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-cyan-300">
              BioTender
            </Link>
            <div className="flex gap-6">
              <Link href="/" className="text-gray-300 hover:text-cyan-300 transition-colors">
                Home
              </Link>
              <Link href="/all" className="text-gray-300 hover:text-cyan-300 transition-colors">
                All
              </Link>
              <Link href="/tools" className="text-gray-300 hover:text-cyan-300 transition-colors">
                Tools
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Expression PCA/UMAP Viewer（表达数据降维可视化）
            </h1>
            <p className="text-gray-400">
              纯前端基因表达数据降维分析，支持PCA算法，交互式散点图可视化
            </p>
          </div>

          {/* File Upload */}
          <FileUploader onFileLoad={handleFileLoad} />

          {/* Error Display */}
          {error && (
            <div className="glass rounded-lg p-6 mb-6 border border-red-500/50 bg-red-500/10">
              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">解析错误</h3>
                  <p className="text-gray-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Layout Detection Result */}
          {layout && (
            <div className="glass rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">数据布局检测</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">检测到的布局</p>
                  <p className="text-lg font-bold text-cyan-400">
                    {layout?.layout === 'samples-as-rows' ? '行=样本，列=基因' : 
                     layout?.layout === 'features-as-rows' ? '行=基因，列=样本' :
                     '单细胞数据格式'}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">样本/细胞数量</p>
                  <p className="text-lg font-bold text-white">{layout?.sampleCount}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">特征/基因数量</p>
                  <p className="text-lg font-bold text-white">{layout?.featureCount}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">数据类型</p>
                  <p className="text-lg font-bold text-green-400">
                    {layout?.isSingleCell ? '单细胞数据' : '表达矩阵'}
                  </p>
                </div>
              </div>
              
              {layout?.isSingleCell && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-300">
                    ✨ 检测到单细胞数据格式！将自动识别预计算的UMAP/tSNE坐标和细胞类型信息
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          {data && (
            <div className="glass rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">分析设置</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Algorithm Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">算法</label>
                  <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value as 'pca' | 'umap')}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    disabled
                  >
                    <option value="pca">PCA（主成分分析）</option>
                    <option value="umap" disabled>UMAP（即将推出）</option>
                  </select>
                </div>

                {/* Group Column Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">分组列</label>
                  <select
                    value={selectedGroupColumn}
                    onChange={(e) => setSelectedGroupColumn(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="">无分组</option>
                    {data.nonDataColumns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* PCA Plot */}
          {data && (
            <PCAPlot 
              data={data} 
              groupColumn={selectedGroupColumn} 
              algorithm={algorithm}
            />
          )}

          {/* Usage Instructions */}
          {!data && (
            <div className="glass rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">使用说明</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
                <div>
                  <h4 className="font-medium text-cyan-300 mb-2">文件格式要求</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>支持 CSV/TSV 格式（自动识别分隔符）</li>
                    <li>支持两种数据布局：行=样本/列=基因 或 行=基因/列=样本</li>
                    <li>第一行应为列名（表头）</li>
                    <li>数值列应为数字格式</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-cyan-300 mb-2">功能特性</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>自动检测数据布局方向</li>
                    <li>纯前端PCA降维分析</li>
                    <li>交互式散点图（hover查看详情）</li>
                    <li>支持分组着色显示</li>
                    <li>图表导出功能</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-cyan-300 mb-2">示例格式</h4>
                  <div className="bg-slate-800/50 rounded p-3 text-xs font-mono">
                    <div>sample_id,gene1,gene2,gene3,group</div>
                    <div>sample1,5.2,3.1,7.8,A</div>
                    <div>sample2,1.8,6.3,4.2,B</div>
                    <div>sample3,4.5,2.9,6.1,A</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-cyan-300 mb-2">性能说明</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>纯前端处理，数据不上传服务器</li>
                    <li>推荐文件大小 &lt;50MB</li>
                    <li>支持最大1000个样本的分析</li>
                    <li>大文件处理可能需要几秒钟</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}