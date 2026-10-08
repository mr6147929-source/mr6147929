import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FooterSectionItem } from '../types';
import { footerService } from '../services/FooterService';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = () => {
  const { localizeFooterSection } = useLanguage();
  const [sections, setSections] = useState<FooterSectionItem[]>([]);
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);

  const loadFooterData = async () => {
    const data = await footerService.getFooterSections();
    setSections(data);
  };

  useEffect(() => {
    loadFooterData();
    const handleUpdate = () => loadFooterData();
    window.addEventListener('footer-sections-updated', handleUpdate);
    return () => {
      window.removeEventListener('footer-sections-updated', handleUpdate);
    };
  }, []);

  const toggleSection = (id: string) => {
    setOpenSectionId(prev => (prev === id ? null : id));
  };

  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-2 md:mt-8 pb-20 md:pb-0 text-slate-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
        {/* Compact Expandable Accordion with ONLY the 5 clickable options */}
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
          {sections.map(sec => {
            const isOpen = openSectionId === sec.id;
            const localizedSec = localizeFooterSection(sec);
            return (
              <div key={sec.id} className="transition-colors">
                <button
                  type="button"
                  onClick={() => toggleSection(sec.id)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:text-[#065367] transition-colors"
                  aria-expanded={isOpen}
                >
                  <span>{localizedSec.title}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#065367]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-3.5 pb-3 pt-1 text-xs text-slate-600 leading-relaxed bg-slate-50/50 border-t border-slate-100 space-y-2">
                    <p className="whitespace-pre-line">{localizedSec.content}</p>

                    {sec.id === 'social_media' && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <a
                          href="https://facebook.com/ekshorokom"
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:border-[#065367] hover:text-[#065367] rounded font-medium transition-colors"
                        >
                          Facebook
                        </a>
                        <a
                          href="https://instagram.com/ekshorokom"
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:border-[#065367] hover:text-[#065367] rounded font-medium transition-colors"
                        >
                          Instagram
                        </a>
                        <a
                          href="https://tiktok.com/@ekshorokom"
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:border-[#065367] hover:text-[#065367] rounded font-medium transition-colors"
                        >
                          TikTok
                        </a>
                        <a
                          href="https://youtube.com/@ekshorokom"
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:border-[#065367] hover:text-[#065367] rounded font-medium transition-colors"
                        >
                          YouTube
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Minimal Bottom Copyright Bar (No Admin Link or Button) */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>© {new Date().getFullYear()} Eksho Rokom</span>
        </div>
      </div>
    </footer>
  );
};
