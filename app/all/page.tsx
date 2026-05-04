'use client';

import { useState } from 'react';
import Link from 'next/link';
import links from '../../data/links.json';
import categorySlugs from '../../data/category-slugs.json';

export default function AllPage() {
  const slugs = categorySlugs as Record<string, string>;
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLinks = links.filter((link) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      link.title.toLowerCase().includes(query) ||
      link.category.toLowerCase().includes(query)
    );
  });

  return (
    <>
      {/* 导航栏 */}
      <nav className="bt-nav fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/BioTender" className="flex items-center gap-3">
              <span className="bt-mark" />
              <span className="bt-word">BioTender</span>
            </Link>
            <div className="flex gap-6">
              <Link href="/BioTender" className="bt-link">
                Home
              </Link>
              <Link href="/BioTender/all" className="bt-link-active">
                All
              </Link>
              <Link href="/BioTender/tools" className="bt-link">
                Tools
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* 标题区 */}
        <div className="mb-8">
          <h1 className="bt-hero-title text-5xl md:text-6xl font-light mb-3">
            全部资源
          </h1>
          <p className="text-[var(--chrome-3)]">
            共 {links.length} 条资源
          </p>
        </div>

        {/* 搜索框 */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="搜索全部资源..."
            className="bt-search w-full px-6 py-4 rounded-full placeholder-[var(--chrome-4)] focus:outline-none text-lg"
            id="all-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* 资源列表 */}
        <div className="space-y-4" id="all-items-list">
          {filteredLinks.map((link, idx) => (
            <div
              key={idx}
              className="bt-panel rounded-xl p-6 transition-all duration-300 all-item-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {link.title}
                  </h3>
                  <Link
                    href={`/c/${slugs[link.category]}`}
                    className="bt-chip inline-block text-xs px-2 py-1 rounded-full mb-2 transition-colors"
                  >
                    {link.category}
                  </Link>
                  <p className="text-sm text-[var(--chrome-3)] truncate">
                    {link.url}
                  </p>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border border-white/15 hover:border-white/30 text-white rounded-full transition-colors duration-200 text-sm font-medium whitespace-nowrap"
                >
                  打开链接
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* 无搜索结果提示 */}
        {filteredLinks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[var(--chrome-3)] text-lg">未找到匹配的资源</p>
          </div>
        )}
      </main>
    </>
  );
}
