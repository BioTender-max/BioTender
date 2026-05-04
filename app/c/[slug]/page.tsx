import Link from 'next/link';
import { notFound } from 'next/navigation';
import categories from '../../../data/categories.json';
import categorySlugs from '../../../data/category-slugs.json';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// 反向映射：slug -> category
function buildSlugToCategoryMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [name, slug] of Object.entries(categorySlugs)) {
    map[slug] = name;
  }
  return map;
}

const slugToCategoryMap = buildSlugToCategoryMap();

// 根据 slug 查找分类名（使用 category-slugs.json 作为单一真相源）
function findCategoryBySlug(slug: string): string | null {
  return slugToCategoryMap[slug] || null;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const categoryName = findCategoryBySlug(slug);

  if (!categoryName) {
    return {
      title: '分类不存在',
    };
  }

  const items = categories[categoryName as keyof typeof categories] || [];
  return {
    title: `${categoryName} - BioTender`,
    description: `${categoryName} 分类下的 ${items.length} 条资源`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const categoryName = findCategoryBySlug(slug);

  if (!categoryName) {
    notFound();
  }

  const items = categories[categoryName as keyof typeof categories] || [];

  return (
    <>
      {/* 导航栏 */}
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
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        {/* 标题区 */}
        <div className="mb-8">
          <Link href="/" className="text-[var(--chrome-3)] hover:text-white transition-colors text-sm">
            ← 返回首页
          </Link>
          <h1 className="bt-hero-title text-5xl md:text-6xl font-light mt-4 mb-3">
            {categoryName}
          </h1>
          <p className="text-[var(--chrome-3)]">
            共 {items.length} 条资源
          </p>
        </div>

        {/* 搜索框 */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="搜索此分类下的资源..."
            className="bt-search w-full px-6 py-4 rounded-full placeholder-[var(--chrome-4)] focus:outline-none"
            id="category-search"
            data-category={categoryName}
          />
        </div>

        {/* 资源列表 */}
        <div className="space-y-4" id="items-list">
          {items.map((item: any, idx: number) => {
            const title = item.title || item.name || item.url || '未命名资源';

            return (
              <div
                key={idx}
                className="bt-panel rounded-xl p-6 transition-all duration-300 item-card"
                data-title={title.toLowerCase()}
              >
                <h3 className="text-lg font-semibold text-white mb-3">
                  {title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--chrome-3)] truncate max-w-md">
                    {item.url}
                  </span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-white/15 hover:border-white/30 text-white rounded-full transition-colors duration-200 text-sm font-medium"
                  >
                    打开链接
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* 无搜索结果提示 */}
        <div id="no-results" className="hidden text-center py-12">
          <p className="text-[var(--chrome-3)] text-lg">未找到匹配的资源</p>
        </div>

        {/* 搜索脚本 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const searchInput = document.getElementById('category-search');
                const itemCards = document.querySelectorAll('.item-card');
                const noResults = document.getElementById('no-results');

                searchInput.addEventListener('input', function(e) {
                  const query = e.target.value.toLowerCase().trim();
                  let visibleCount = 0;

                  itemCards.forEach(card => {
                    const title = card.getAttribute('data-title') || '';
                    if (title.includes(query)) {
                      card.style.display = 'block';
                      visibleCount++;
                    } else {
                      card.style.display = 'none';
                    }
                  });

                  noResults.style.display = visibleCount === 0 ? 'block' : 'none';
                });
              })();
            `,
          }}
        />
      </main>
    </>
  );
}

// 生成静态路由（使用 category-slugs.json 作为单一真相源）
export async function generateStaticParams() {
  const slugs = Object.values(categorySlugs);

  // 诊断输出
  console.log('\n=== 分类页静态路由生成诊断 ===');
  console.log(`分类总数: ${Object.keys(categorySlugs).length}`);
  console.log(`generateStaticParams 总数: ${slugs.length}`);
  console.log(`所有 slugs:`, slugs);
  console.log('=============================\n');

  return slugs.map((slug) => ({
    slug: slug,
  }));
}
