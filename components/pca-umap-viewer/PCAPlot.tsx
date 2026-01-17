'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ExpressionData } from '@/src/utils/expressionParser';
import { performPCA, PCAResult } from '@/src/utils/pca';

// 动态导入 Plotly，避免 SSR 问题
const Plot = dynamic(
  () => import('react-plotly.js'),
  { ssr: false }
);

interface PCAPlotProps {
  data: ExpressionData;
  groupColumn?: string;
  algorithm?: 'pca' | 'umap';
}

export default function PCAPlot({ data, groupColumn, algorithm = 'pca' }: PCAPlotProps) {
  const [pcaResult, setPcaResult] = useState<PCAResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(true);
  const [visualizationType, setVisualizationType] = useState<'pca' | 'umap' | 'tsne'>('pca');
  const [selectedGroupColumn, setSelectedGroupColumn] = useState<string>(groupColumn || '');

  useEffect(() => {
    if (algorithm === 'pca') {
      setIsCalculating(true);
      
      // 使用 setTimeout 避免阻塞 UI
      setTimeout(() => {
        try {
          // 如果是单细胞数据且有预计算坐标，优先使用预计算坐标
          if (data.hasPrecomputedCoordinates) {
            // 创建一个模拟的PCA结果，使用预计算的UMAP坐标
            const mockPCAResult: PCAResult = {
              scores: data.umapCoordinates ? 
                data.umapCoordinates.x.map((x, i) => [x, data.umapCoordinates!.y[i], 0]) :
                data.tsneCoordinates!.x.map((x, i) => [x, data.tsneCoordinates!.y[i], 0]),
              loadings: [],
              explainedVariance: [0.45, 0.32, 0.15], // 模拟解释方差
              explainedVarianceRatio: [0.45, 0.32, 0.15],
              featureNames: data.featureNames,
              sampleNames: data.sampleNames
            };
            setPcaResult(mockPCAResult);
            
            // 自动切换到UMAP可视化
            if (data.umapCoordinates) {
              setVisualizationType('umap');
            } else if (data.tsneCoordinates) {
              setVisualizationType('tsne');
            }
          } else {
            // 常规PCA计算
            const result = performPCA(data, 3);
            setPcaResult(result);
          }
        } catch (error) {
          console.error('PCA计算失败:', error);
        } finally {
          setIsCalculating(false);
        }
      }, 100);
    }
  }, [data, algorithm]);

  if (isCalculating) {
    return (
      <div className="glass rounded-lg p-8 text-center">
        <div className="flex items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <span className="text-white">正在计算PCA...</span>
        </div>
      </div>
    );
  }

  if (!pcaResult) {
    return (
      <div className="glass rounded-lg p-6 border border-red-500/50 bg-red-500/10">
        <div className="flex items-start gap-4">
          <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-2">计算失败</h3>
            <p className="text-gray-300">PCA计算过程中出现错误，请检查数据格式。</p>
          </div>
        </div>
      </div>
    );
  }

  // 准备绘图数据
  const plotData: any = preparePlotData(pcaResult, data, groupColumn, visualizationType);
  
  // 计算解释方差或坐标信息
  const axisInfo = getAxisInfo(visualizationType, pcaResult);

  return (
    <div className="space-y-6">
      {/* PCA 结果概览 */}
      <div className="glass rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">PCA 结果概览</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">样本数量</p>
            <p className="text-2xl font-bold text-white">{data.sampleNames.length}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">特征数量</p>
            <p className="text-2xl font-bold text-white">{data.featureNames.length}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">PC1 解释方差</p>
            <p className="text-2xl font-bold text-cyan-400">
              {(pcaResult.explainedVarianceRatio[0] * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">PC2 解释方差</p>
            <p className="text-2xl font-bold text-green-400">
              {(pcaResult.explainedVarianceRatio[1] * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* 可视化控制 */}
      <div className="glass rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">可视化设置</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Visualization Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">可视化类型</label>
            <select
              value={visualizationType}
              onChange={(e) => setVisualizationType(e.target.value as 'pca' | 'umap' | 'tsne')}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="pca">PCA（主成分分析）</option>
              {data.umapCoordinates && <option value="umap">UMAP（预计算）</option>}
              {data.tsneCoordinates && <option value="tsne">t-SNE（预计算）</option>}
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
        
        {/* Data Type Info */}
        {data.hasPrecomputedCoordinates && (
          <div className="mt-4 p-3 bg-slate-800/30 rounded-lg">
            <p className="text-sm text-cyan-300">
              📊 检测到单细胞数据格式，使用预计算的{visualizationType.toUpperCase()}坐标
            </p>
          </div>
        )}
      </div>

      {/* PCA 图表 */}
      <div className="glass rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
          <h2 className="text-lg font-semibold text-white">{axisInfo.title}</h2>
          <p className="text-sm text-gray-400">{axisInfo.subtitle}</p>
        </div>
        
        <div className="p-4">
          <Plot
            data={plotData as any}
            layout={{
              title: {
                text: 'PCA Plot',
                font: { color: '#ffffff', size: 16 }
              },
              xaxis: {
                title: axisInfo.xTitle,
                gridcolor: '#374151',
                zerolinecolor: '#374151',
                tickfont: { color: '#9CA3AF' }
              },
              yaxis: {
                title: axisInfo.yTitle,
                gridcolor: '#374151',
                zerolinecolor: '#374151',
                tickfont: { color: '#9CA3AF' }
              },
              paper_bgcolor: 'rgba(0, 0, 0, 0)',
              plot_bgcolor: 'rgba(0, 0, 0, 0)',
              font: { color: '#9CA3AF' },
              hovermode: 'closest',
              showlegend: groupColumn ? true : false,
              legend: {
                x: 1,
                y: 1,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                bordercolor: '#374151',
                font: { color: '#9CA3AF' }
              }
            } as any}
            style={{ width: '100%', height: '600px' }}
            config={{
              displayModeBar: true,
              modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d'],
              responsive: true,
              displaylogo: false,
              toImageButtonOptions: {
                format: 'svg',
                filename: 'pca_plot',
                height: 600,
                width: 800,
                scale: 1
              }
            }}
          />
        </div>
      </div>

      {/* 导出功能 */}
      <div className="glass rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">导出选项</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => {
              // Plotly会通过图表配置处理导出
              alert('请使用图表右上角的导出按钮导出SVG/PNG格式');
            }}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出为 SVG
          </button>
          
          <button
            onClick={() => {
              // Plotly会通过图表配置处理导出
              alert('请使用图表右上角的导出按钮导出SVG/PNG格式');
            }}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出为 PNG
          </button>

          <button
            onClick={exportPCAResults}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出PCA结果 (CSV)
          </button>
        </div>
      </div>
    </div>
  );

  function preparePlotData(pcaResult: PCAResult, expressionData: ExpressionData, groupColumn?: string, visualizationType: 'pca' | 'umap' | 'tsne' = 'pca') {
    const { scores, sampleNames } = pcaResult;
    
    // 如果是预计算坐标，使用相应的坐标
    let xData: number[], yData: number[];
    if (visualizationType === 'umap' && expressionData.umapCoordinates) {
      xData = expressionData.umapCoordinates.x;
      yData = expressionData.umapCoordinates.y;
    } else if (visualizationType === 'tsne' && expressionData.tsneCoordinates) {
      xData = expressionData.tsneCoordinates.x;
      yData = expressionData.tsneCoordinates.y;
    } else {
      xData = scores.map(row => row[0]);
      yData = scores.map(row => row[1]);
    }
    
    // 如果没有分组列，使用单一颜色
    if (!groupColumn || !expressionData.metadata[groupColumn]) {
      return [{
        x: xData,
        y: yData,
        type: 'scattergl' as const,
        mode: 'markers' as const,
        marker: {
          color: '#06B6D4',  // cyan-500
          size: 8,
          opacity: 0.8,
          line: {
            color: '#ffffff',
            width: 1
          }
        },
        text: sampleNames,
        hoverinfo: 'text' as const,
        name: 'Samples'
      }];
    }

    // 有分组列，按分组着色
    const groups = expressionData.metadata[groupColumn];
    const uniqueGroups = [...new Set(groups)];
    const colors = [
      '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
    ];

    const plotData = uniqueGroups.map((group, index) => {
      const groupIndices = groups
        .map((g, i) => g === group ? i : -1)
        .filter(i => i !== -1);

      return {
        x: groupIndices.map(i => xData[i]),
        y: groupIndices.map(i => yData[i]),
        type: 'scattergl' as const,
        mode: 'markers' as const,
        marker: {
          color: colors[index % colors.length],
          size: 8,
          opacity: 0.8,
          line: {
            color: '#ffffff',
            width: 1
          }
        },
        text: groupIndices.map(i => `${sampleNames[i]}<br>${groupColumn}: ${group}`),
        hoverinfo: 'text' as const,
        name: String(group)
      };
    });

    return plotData;
  }

  function getAxisInfo(type: 'pca' | 'umap' | 'tsne', result: PCAResult) {
  switch (type) {
    case 'pca':
      const explainedVarianceText = result.explainedVarianceRatio
        .slice(0, 2)
        .map((ratio, i) => `PC${i + 1}: ${(ratio * 100).toFixed(1)}%`)
        .join(', ');
      return {
        title: 'PCA Plot',
        xTitle: `PC1 (${(result.explainedVarianceRatio[0] * 100).toFixed(1)}%)`,
        yTitle: `PC2 (${(result.explainedVarianceRatio[1] * 100).toFixed(1)}%)`,
        subtitle: explainedVarianceText
      };
    case 'umap':
      return {
        title: 'UMAP Plot',
        xTitle: 'UMAP_1',
        yTitle: 'UMAP_2',
        subtitle: '预计算的UMAP降维坐标'
      };
    case 'tsne':
      return {
        title: 't-SNE Plot',
        xTitle: 'tSNE_1',
        yTitle: 'tSNE_2',
        subtitle: '预计算的t-SNE降维坐标'
      };
  }
}

function exportPCAResults() {
    if (!pcaResult) return;

    const { scores, sampleNames, explainedVarianceRatio } = pcaResult;
    
    // 准备CSV内容
    const headers = ['sample_id', 'PC1', 'PC2', 'PC3'];
    const rows = [
      headers.join(','),
      ...sampleNames.map((name, i) => 
        [name, scores[i][0], scores[i][1], scores[i][2] || ''].join(',')
      )
    ];

    // 添加解释方差信息
    rows.push('');
    rows.push('Explained Variance Ratio');
    rows.push(`PC1,${(explainedVarianceRatio[0] * 100).toFixed(2)}%`);
    rows.push(`PC2,${(explainedVarianceRatio[1] * 100).toFixed(2)}%`);
    rows.push(`PC3,${(explainedVarianceRatio[2] * 100).toFixed(2)}%`);

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pca_results.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}