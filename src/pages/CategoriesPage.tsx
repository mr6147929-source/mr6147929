import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Category } from '../types';
import { categoryService } from '../services/CategoryService';
import { productService } from '../services/ProductService';
import { useLanguage } from '../context/LanguageContext';

interface CategoriesPageProps {
  navigate: (path: string) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ navigate }) => {
  const { language, localizeCategory } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategoriesAndCounts = async () => {
      try {
        const [cats, allProds] = await Promise.all([
          categoryService.getCategories(),
          productService.getProducts(),
        ]);

        const counts: Record<string, number> = {};
        for (const cat of cats) {
          counts[cat.id] = allProds.filter(p => p.categoryId === cat.id).length;
        }

        setCategories(cats);
        setCategoryCounts(counts);
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategoriesAndCounts();
    window.addEventListener('products-updated', loadCategoriesAndCounts);
    window.addEventListener('categories-updated', loadCategoriesAndCounts);
    return () => {
      window.removeEventListener('products-updated', loadCategoriesAndCounts);
      window.removeEventListener('categories-updated', loadCategoriesAndCounts);
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
      {/* Compact Header */}
      <div className="border-b border-slate-200 pb-2.5">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          {language === 'bn' ? 'পণ্যের ক্যাটাগরি' : 'Product Categories'}
        </h1>
        <p className="text-xs text-slate-500">
          {language === 'bn'
            ? 'পণ্য দেখতে যেকোনো একটি ক্যাটাগরি নির্বাচন করুন'
            : 'Select a category to browse products'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-slate-100 rounded-lg h-36 animate-pulse" />
          ))}
        </div>
      ) : (
        /* Compact 2-column grid on mobile */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {categories.map(cat => {
            const count = categoryCounts[cat.id] || 0;
            const localizedCat = localizeCategory(cat);
            return (
              <div
                key={cat.id}
                onClick={() => navigate(`products?category=${cat.id}`)}
                className="group bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-[#065367] hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col"
              >
                {/* Compact Category Image */}
                <div className="h-24 sm:h-28 bg-slate-100 relative overflow-hidden">
                  <img
                    src={cat.image}
                    alt={localizedCat.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-1.5 right-1.5 text-[10px] font-semibold bg-white/90 text-slate-700 px-1.5 py-0.5 rounded shadow-2xs">
                    {language === 'bn'
                      ? `${count}টি পণ্য`
                      : `${count} ${count === 1 ? 'product' : 'products'}`}
                  </span>
                </div>

                {/* Compact Category Info */}
                <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2 flex-1">
                  <h2 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-[#065367] transition-colors line-clamp-2 leading-tight">
                    {localizedCat.name}
                  </h2>
                  <ArrowRight className="w-3.5 h-3.5 text-[#065367] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
