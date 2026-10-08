import React, { useEffect, useState, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { Category, Product } from '../types';
import { categoryService } from '../services/CategoryService';
import { productService } from '../services/ProductService';
import { ProductCard } from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';

// Hero Slider Images
import heroImg1 from '../assets/images/hero_craft_miniature_1790972676682.jpg';
import heroImg2 from '../assets/images/hero_craft_workshop_diorama_1791010530926.jpg';
import heroImg3 from '../assets/images/hero_craft_materials_display_1791010547448.jpg';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { language, localizeCategory } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const slides = [
    {
      id: 1,
      image: heroImg1,
      alt: 'Craft Materials & Miniature Supplies Workbench',
      badge:
        language === 'bn'
          ? 'মিনিয়েচার ও ডায়োরামা উপকরণ'
          : 'Miniature Supplies & Diorama',
      title:
        language === 'bn'
          ? 'আর্কিটেকচারাল মডেল ও ক্রাফট সামগ্রী'
          : 'Architectural Model & Craft Supplies',
    },
    {
      id: 2,
      image: heroImg2,
      alt: 'Scale Model Architectural Workshop',
      badge: language === 'bn' ? 'প্রিসিশন ক্রাফট টুলস' : 'Precision Craft Tools',
      title:
        language === 'bn'
          ? 'স্কেল মডেল ও নিখুঁত ক্রাফটিংয়ের জন্য তৈরি'
          : 'Built for Scale Modelers & Crafters',
    },
    {
      id: 3,
      image: heroImg3,
      alt: 'Premium Craft Sheets, Glues and Textures',
      badge: language === 'bn' ? 'পিভিসি বোর্ড ও অ্যাডহেসিভ' : 'PVC Boards & Adhesives',
      title:
        language === 'bn'
          ? 'ডিআইওয়াই ও মডেল প্রজেক্টের বিশেষায়িত উপকরণ'
          : 'Specialized Materials for DIY Projects',
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const userInteractedCategoriesRef = useRef<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Subtle occasional nudge animation on category horizontal scroll row
  useEffect(() => {
    if (categories.length === 0) return;

    const triggerSubtleNudge = () => {
      const container = categoryScrollRef.current;
      if (!container || userInteractedCategoriesRef.current) return;

      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 12) return;

      const currentPos = container.scrollLeft;
      const nudgeOffset = 44;

      if (currentPos + nudgeOffset <= maxScroll) {
        container.scrollTo({ left: currentPos + nudgeOffset, behavior: 'smooth' });
        setTimeout(() => {
          if (categoryScrollRef.current && !userInteractedCategoriesRef.current) {
            categoryScrollRef.current.scrollTo({ left: currentPos, behavior: 'smooth' });
          }
        }, 700);
      }
    };

    const initialTimer = setTimeout(triggerSubtleNudge, 2500);
    const intervalTimer = setInterval(triggerSubtleNudge, 9500);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [categories.length]);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [cats, prods] = await Promise.all([
          categoryService.getCategories(),
          productService.getFeaturedProducts(),
        ]);
        setCategories(cats);
        setFeaturedProducts(prods);
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
    const handleProductsUpdated = () => loadHomeData();
    window.addEventListener('products-updated', handleProductsUpdated);
    window.addEventListener('categories-updated', handleProductsUpdated);
    return () => {
      window.removeEventListener('products-updated', handleProductsUpdated);
      window.removeEventListener('categories-updated', handleProductsUpdated);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    } else if (diff < -40) {
      setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
    }
    touchStartX.current = null;
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-7 sm:space-y-10 pb-6">
      {/* 1. Landscape Hero Slider */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5">
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative w-full aspect-[21/9] sm:aspect-[16/7] md:aspect-[16/6] rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs group"
        >
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover select-none"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-3.5 sm:p-6">
                <div className="text-white max-w-xl">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider bg-[#065367]/85 backdrop-blur-xs text-white px-2 py-0.5 rounded">
                    {slide.badge}
                  </span>
                  <h2 className="text-xs sm:text-base lg:text-lg font-bold mt-1 text-white/95 drop-shadow-xs">
                    {slide.title}
                  </h2>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)}
            aria-label="Previous Slide"
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md backdrop-blur-xs transition-opacity opacity-70 group-hover:opacity-100"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}
            aria-label="Next Slide"
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md backdrop-blur-xs transition-opacity opacity-70 group-hover:opacity-100"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="absolute bottom-2 sm:bottom-3 right-3 sm:right-5 z-20 flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentSlide ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Horizontal Category Slider */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            {language === 'bn' ? 'ক্যাটাগরি সমূহ' : 'Categories'}
          </h2>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scrollCategories('left')}
              className="hidden sm:flex p-1 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Scroll Categories Left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scrollCategories('right')}
              className="hidden sm:flex p-1 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Scroll Categories Right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('categories')}
              className="text-xs font-semibold text-[#065367] hover:underline ml-1"
            >
              {language === 'bn' ? 'সব দেখুন' : 'View All'}
            </button>
          </div>
        </div>

        <div
          ref={categoryScrollRef}
          onTouchStart={() => {
            userInteractedCategoriesRef.current = true;
          }}
          onMouseDown={() => {
            userInteractedCategoriesRef.current = true;
          }}
          className="flex overflow-x-auto gap-2.5 sm:gap-3.5 pb-1 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map(cat => {
            const localizedCat = localizeCategory(cat);
            return (
              <div
                key={cat.id}
                onClick={() => navigate(`products?category=${cat.id}`)}
                className="group shrink-0 w-28 sm:w-32 flex flex-col items-center text-center p-2 bg-white border border-slate-200 rounded-lg hover:border-[#065367] hover:shadow-2xs transition-all cursor-pointer snap-start"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden bg-slate-50 border border-slate-100 mb-1.5 shrink-0">
                  <img
                    src={cat.image}
                    alt={localizedCat.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <h3 className="text-[11px] sm:text-xs font-semibold text-slate-800 group-hover:text-[#065367] line-clamp-2 leading-tight">
                  {localizedCat.name}
                </h3>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Featured Craft Supplies */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {language === 'bn' ? 'বাছাইকৃত পণ্য' : 'Featured Products'}
          </h2>

          <button
            onClick={() => navigate('products')}
            className="text-xs font-semibold text-[#065367] hover:underline flex items-center gap-1"
          >
            <span>{language === 'bn' ? 'সকল পণ্য' : 'All Products'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-slate-50 rounded-lg h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {featuredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={id => navigate(`product?id=${id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
