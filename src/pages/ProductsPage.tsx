import React, { useEffect, useState } from 'react';
import { Search, Filter, SlidersHorizontal, X } from 'lucide-react';
import { Category, Product } from '../types';
import { productService } from '../services/ProductService';
import { categoryService } from '../services/CategoryService';
import { ProductCard } from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';

interface ProductsPageProps {
  navigate: (path: string) => void;
  initialCategoryId?: string;
  initialSearchQuery?: string;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  navigate,
  initialCategoryId,
  initialSearchQuery,
}) => {
  const { language, localizeCategory } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategoryId || 'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery || '');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'name_asc'>('newest');
  const [maxPrice, setMaxPrice] = useState<number>(600);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    setSelectedCategory(initialCategoryId || 'all');
  }, [initialCategoryId]);

  useEffect(() => {
    setSearchQuery(initialSearchQuery || '');
  }, [initialSearchQuery]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await categoryService.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Error loading categories', err);
      }
    };
    loadCategories();
    window.addEventListener('categories-updated', loadCategories);
    return () => window.removeEventListener('categories-updated', loadCategories);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const prods = await productService.getProducts({
          categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
          search: searchQuery,
          maxPrice,
          sort: sortBy,
        });
        setProducts(prods);
      } catch (err) {
        console.error('Error fetching products', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    const handleProductsUpdated = () => fetchProducts();
    window.addEventListener('products-updated', handleProductsUpdated);
    return () => window.removeEventListener('products-updated', handleProductsUpdated);
  }, [selectedCategory, searchQuery, sortBy, maxPrice]);

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSortBy('newest');
    setMaxPrice(600);
  };

  const getCategoryDisplayName = (catId: string) => {
    const found = categories.find(c => c.id === catId);
    if (!found) return catId;
    return localizeCategory(found).name;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block space-y-5">
          {/* Category Filter */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
                {language === 'bn' ? 'ক্যাটাগরি' : 'Categories'}
              </h3>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="text-[11px] text-[#065367] hover:underline font-normal lowercase"
                >
                  {language === 'bn' ? 'রিসেট' : 'reset'}
                </button>
              )}
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-between ${
                  selectedCategory === 'all'
                    ? 'bg-[#065367] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{language === 'bn' ? 'সকল পণ্য' : 'All Products'}</span>
              </button>

              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-between ${
                    selectedCategory === cat.id
                      ? 'bg-[#065367] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{localizeCategory(cat).name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
                {language === 'bn' ? 'সর্বোচ্চ মূল্য' : 'Max Price'}
              </h3>
              <span className="text-xs font-bold text-[#065367] tabular-nums text-right min-w-[72px]">
                ৳{maxPrice.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="600"
              step="20"
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#065367] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>৳100</span>
              <span>৳600</span>
            </div>
          </div>

          {/* Reset Action */}
          <button
            onClick={clearAllFilters}
            className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            {language === 'bn' ? 'সব ফিল্টার মুছুন' : 'Clear All Filters'}
          </button>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-5">
          {/* Top Bar: Search, Sort & Mobile Filter Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={
                  language === 'bn'
                    ? 'পণ্য খুঁজুন (যেমন: পিভিসি বোর্ড, ছুরি, সিমেন্ট)...'
                    : 'Search products (e.g., PVC Board, Knife, Cement)...'
                }
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#065367]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
              >
                <Filter className="w-3.5 h-3.5 text-[#065367]" />
                <span>{language === 'bn' ? 'ফিল্টার' : 'Filters'}</span>
              </button>

              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-[#065367]"
                >
                  <option value="newest">
                    {language === 'bn' ? 'নতুন পণ্য আগে' : 'Newest First'}
                  </option>
                  <option value="price_asc">
                    {language === 'bn' ? 'মূল্য: কম থেকে বেশি' : 'Price: Low to High'}
                  </option>
                  <option value="price_desc">
                    {language === 'bn' ? 'মূল্য: বেশি থেকে কম' : 'Price: High to Low'}
                  </option>
                  <option value="name_asc">
                    {language === 'bn' ? 'নাম: A থেকে Z' : 'Name: A to Z'}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {(selectedCategory !== 'all' || searchQuery || maxPrice < 600) && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">
                {language === 'bn' ? 'সক্রিয় ফিল্টার:' : 'Active Filters:'}
              </span>

              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                  {language === 'bn' ? 'ক্যাটাগরি:' : 'Category:'}{' '}
                  {getCategoryDisplayName(selectedCategory)}
                  <button onClick={() => setSelectedCategory('all')}>
                    <X className="w-3 h-3 text-slate-500 hover:text-slate-900" />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                  {language === 'bn' ? 'কিওয়ার্ড:' : 'Keyword:'} "{searchQuery}"
                  <button onClick={() => setSearchQuery('')}>
                    <X className="w-3 h-3 text-slate-500 hover:text-slate-900" />
                  </button>
                </span>
              )}

              {maxPrice < 600 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                  {language === 'bn' ? `৳${maxPrice}-এর নিচে` : `Under ৳${maxPrice}`}
                  <button onClick={() => setMaxPrice(600)}>
                    <X className="w-3 h-3 text-slate-500 hover:text-slate-900" />
                  </button>
                </span>
              )}

              <button
                onClick={clearAllFilters}
                className="text-[#065367] hover:underline font-semibold ml-1 text-xs"
              >
                {language === 'bn' ? 'সব রিসেট করুন' : 'Reset All'}
              </button>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-slate-50 rounded-lg h-72 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-lg p-8">
              <p className="text-sm font-semibold text-slate-700">
                {language === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'bn'
                  ? 'অন্য কোনো শব্দ দিয়ে খুঁজুন অথবা ফিল্টার রিসেট করে চেষ্টা করুন।'
                  : 'Try searching with another keyword or resetting the filter options.'}
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-[#065367] rounded-md hover:bg-[#086982]"
              >
                {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
              </button>
            </div>
          ) : (
            <div>
              <div className="text-xs text-slate-500 mb-3 font-medium">
                {language === 'bn'
                  ? `${products.length}টি পণ্য দেখানো হচ্ছে`
                  : `Showing ${products.length} ${
                      products.length === 1 ? 'product' : 'products'
                    }`}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onViewDetails={id => navigate(`product?id=${id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div className="w-72 max-w-full bg-white h-full p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'bn' ? 'ফিল্টার' : 'Filters'}
                </h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-700 mb-2">
                  {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                </h4>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setMobileFilterOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium ${
                      selectedCategory === 'all'
                        ? 'bg-[#065367] text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {language === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setMobileFilterOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium ${
                        selectedCategory === cat.id
                          ? 'bg-[#065367] text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {localizeCategory(cat).name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <h4 className="text-xs font-semibold uppercase text-slate-700">
                    {language === 'bn' ? 'সর্বোচ্চ মূল্য' : 'Max Price'}
                  </h4>
                  <span className="text-xs font-bold text-[#065367]">৳{maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="600"
                  step="20"
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#065367]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-2.5 text-xs font-semibold bg-[#065367] text-white rounded-md"
              >
                {language === 'bn' ? 'ফিল্টার প্রয়োগ করুন' : 'Apply Filters'}
              </button>
              <button
                onClick={() => {
                  clearAllFilters();
                  setMobileFilterOpen(false);
                }}
                className="w-full py-2.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md"
              >
                {language === 'bn' ? 'সব রিসেট করুন' : 'Reset All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
