'use client';

import Link from 'next/link';

export default function ToolsPage() {
  const tools = [
    {
      title: '分子交互可视化工具',
      description: '使用 Mol* 官方查看器加载和可视化蛋白质结构（支持 PDB/mmCIF 格式）',
      path: '/tools/interaction-visualizer',
      icon: '🔬',
    },
    {
      title: '分子互作分析工具',
      description: '纯前端分析 PDB 文件中的分子相互作用（疏水、氢键、水桥等）',
      path: '/tools/interaction-analyzer',
      icon: '🧬',
    },
    {
      title: 'mmCIF → PDB',
      description: '纯前端将 mmCIF 文件转换为 PDB 格式，支持 .cif/.mmcif 文件',
      path: '/tools/mmcif-to-pdb',
      icon: '🔄',
    },
    {
      title: 'DEG Interpreter',
      description: '上传 DEG 表 → QC + 火山图 + Top 基因（支持 CSV/TSV）',
      path: '/tools/deg-interpreter',
      icon: '📊',
    },
    {
      title: 'Expression PCA/UMAP Viewer',
      description: '纯前端基因表达数据降维可视化，支持CSV/TSV，交互式散点图',
      path: '/tools/pca-umap-viewer',
      icon: '📈',
    },
  ];

  return (
    <>
      {/* Navigation */}
      <nav className="bt-nav fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <span className="bt-mark" />
              <span className="bt-word">BioTender</span>
            </Link>
            <div className="flex gap-6">
              <Link href="/" className="bt-link">
                Home
              </Link>
              <Link href="/all" className="bt-link">
                All
              </Link>
              <Link
                href="/tools"
                className="bt-link-active"
              >
                Tools
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-12 text-center">
            <h1 className="bt-hero-title text-5xl md:text-7xl font-light mb-5">
              分子生物学工具集
            </h1>
            <p className="text-lg text-[var(--chrome-3)]">
              探索蛋白质结构、分子相互作用与生物信息学分析工具
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tools.map((tool) => (
              <Link
                key={tool.path}
                href={tool.path}
                className="bt-panel rounded-xl p-6 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{tool.icon}</div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-[var(--chrome)] transition-colors">
                      {tool.title}
                    </h2>
                    <p className="text-[var(--chrome-3)] text-sm">
                      {tool.description}
                    </p>
                  </div>
                  <svg
                    className="w-6 h-6 text-[var(--chrome-4)] group-hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

          {/* Coming Soon Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-white mb-6">即将推出</h2>
            <div className="bt-panel rounded-xl p-6 opacity-70">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4">
                  <div className="text-3xl mb-2">🧪</div>
                  <h3 className="text-white font-medium mb-1">分子对接</h3>
                  <p className="text-[var(--chrome-3)] text-sm">AutoDock Vina 集成</p>
                </div>
                <div className="p-4">
                  <div className="text-3xl mb-2">📊</div>
                  <h3 className="text-white font-medium mb-1">轨迹分析</h3>
                  <p className="text-[var(--chrome-3)] text-sm">MD 动力学轨迹可视化</p>
                </div>
                <div className="p-4">
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="text-white font-medium mb-1">结合模式预测</h3>
                  <p className="text-[var(--chrome-3)] text-sm">AI 驱动的亲和力预测</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
