'use client';

import { useState } from 'react';
import Link from 'next/link';
import IntroOverlay from '@/components/IntroOverlay';
import categories from '../data/categories.json';
import links from '../data/links.json';
import categorySlugs from '../data/category-slugs.json';

// 随机获取 8 条推荐
function getRandomLinks(count: number) {
  const shuffled = [...links].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const categoryEntries = Object.entries(categories);
  const totalItems = links.length;
  const randomLinks = getRandomLinks(8);
  const slugs = categorySlugs as Record<string, string>;

  // 搜索过滤
  const searchResults = links.filter((link) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return [];
    return (
      link.title.toLowerCase().includes(query) ||
      link.category.toLowerCase().includes(query) ||
      link.url.toLowerCase().includes(query)
    );
  });

  // 诊断输出
  console.log('\n=== 首页分类卡片诊断 ===');
  console.log(`分类总数: ${categoryEntries.length}`);
  console.log(`category-slugs 总数: ${Object.keys(categorySlugs).length}`);
  console.log(`首页渲染的分类卡片 href 列表:`);
  categoryEntries.forEach(([name]) => {
    const slug = slugs[name];
    console.log(`  ${name} -> /c/${slug}`);
  });
  console.log('=======================\n');

  return (
    <>
      <IntroOverlay />

      {/* 导航栏 */}
      <nav className="bt-nav fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/BioTender" className="flex items-center gap-3">
              <span className="bt-mark" />
              <span className="bt-word">BioTender</span>
            </Link>
            <div className="flex gap-6">
              <Link href="/BioTender" className="bt-link-active">
                Home
              </Link>
              <Link href="/BioTender/all" className="bt-link">
                All
              </Link>
              <Link href="/BioTender/tools" className="bt-link">
                Tools
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Hero 区 */}
        <div className="text-center mb-16 min-h-[48vh] flex flex-col items-center justify-center">
          <div className="bt-kicker mb-8">AI × BIOLOGY INDEX</div>
          <h1 className="bt-hero-title text-6xl md:text-8xl font-light mb-5">
            BioTender
          </h1>
          <p className="text-xl text-[var(--chrome-2)] tracking-[0.28em] uppercase mb-4">
            AI × Biology 知识导航
          </p>
          <p className="text-[var(--chrome-3)]">
            共 {totalItems} 条资源，涵盖 {categoryEntries.length} 个分类
          </p>
        </div>

        {/* 搜索框 */}
        <div className="mb-12">
          <input
            type="text"
            placeholder="搜索资源..."
            className="bt-search w-full max-w-2xl mx-auto block px-6 py-4 rounded-full placeholder-[var(--chrome-4)] focus:outline-none text-lg"
            id="global-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* 搜索结果 */}
          {searchQuery.trim() && (
            <div className="max-w-2xl mx-auto mt-4 bt-panel rounded-2xl max-h-96 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {searchResults.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 hover:bg-white/5 transition-colors"
                    >
                      <h3 className="text-white font-medium mb-1">{link.title}</h3>
                      <p className="text-sm text-[var(--chrome-2)] mb-1">{link.category}</p>
                      <p className="text-xs text-[var(--chrome-4)] truncate">{link.url}</p>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-[var(--chrome-3)]">
                  未找到匹配的资源
                </div>
              )}
            </div>
          )}
        </div>

        {/* 分类卡片网格 */}
        <div className="mb-16">
          <div className="bt-section-rule">
            <h2 className="bt-label">分类浏览</h2>
            <span className="bt-cue">INDEX / {categoryEntries.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categoryEntries.map(([name, items]) => {
              const slug = slugs[name];
              return (
                <Link
                  key={name}
                  href={`/c/${slug}`}
                  className="bt-panel rounded-xl p-6 transition-all duration-300 group"
                >
                  <h3 className="text-lg font-semibold text-white group-hover:text-[var(--chrome)] transition-colors">
                    {name}
                  </h3>
                  <p className="text-[var(--chrome-3)] text-sm mt-2">
                    {items.length} 条资源
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 随机推荐 */}
        <div>
          <div className="bt-section-rule">
            <h2 className="bt-label">随机推荐</h2>
            <span className="bt-cue">SERENDIPITY / 08</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {randomLinks.map((link, idx) => (
              <div
                key={idx}
                className="bt-panel rounded-xl p-5 transition-all duration-300"
              >
                <h3 className="text-white font-medium mb-2 line-clamp-2">
                  {link.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="bt-chip text-xs px-2 py-1 rounded-full">
                    {link.category}
                  </span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--chrome-2)] hover:text-white transition-colors"
                  >
                    打开链接 →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
