import React from 'react';
import { Layers, Heart, Award, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import heroImg from '../assets/images/hero_craft_miniature_1790972676682.jpg';

interface AboutPageProps {
  navigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ navigate }) => {
  const { language } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#065367] bg-[#065367]/10 px-3 py-1 rounded-md">
          {language === 'bn' ? 'একশো রকম সম্পর্কে' : 'About Eksho Rokom'}
        </span>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {language === 'bn'
            ? 'মিনিয়েচার শিল্পী, নির্মাতা ও আর্কিটেকচারাল ক্রাফটারদের বিশ্বস্ত সঙ্গী'
            : 'Empowering Makers, Miniaturists & Architectural Crafters'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {language === 'bn'
            ? 'একশো রকম (Eksho Rokom) বাংলাদেশের একটি বিশেষায়িত ক্রাফট ম্যাটেরিয়ালস ও ডিআইওয়াই মিনিয়েচার সাপ্লাই ব্র্যান্ড, যা মডেলিং শিট, প্রিসিশন ব্লেড এবং ডায়োরামা উপকরণ সরবরাহ করে।'
            : "Eksho Rokom is Bangladesh's dedicated craft materials and DIY miniature supplies brand, delivering specialized modeling sheets, precision blades, and diorama accessories."}
        </p>
      </div>

      {/* Story with Image */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 items-center">
        <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-50">
          <img
            src={heroImg}
            alt="Eksho Rokom Craft Supplies"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
            {language === 'bn' ? 'আমাদের লক্ষ্য ও উদ্দেশ্য' : 'Our Mission & Craft Focus'}
          </h2>
          <p>
            {language === 'bn'
              ? 'আর্কিটেকচারাল স্কেল মডেলিং, ডায়োরামা তৈরি এবং সূক্ষ্ম ক্রাফট কাজের জন্য সঠিক পুরুত্বের শিট, মসৃণ কাটিং গ্রেইন এবং মজবুত গ্লু অপরিহার্য। সাধারণ স্টেশনারি দোকানে মানসম্মত হাই-ডেনসিটি পিভিসি ফোম বোর্ড, বালসা কাঠ কিংবা মাইক্রো কাটিং টুলস খুঁজে পাওয়া বাংলাদেশের শিক্ষার্থী ও ক্রাফটারদের জন্য সবসময়ই কঠিন ছিল।'
              : 'Architectural scale modeling, diorama building, and precision craftwork demand materials of exact thickness, smooth cutting grain, and reliable bond strength. Finding authentic high-density PVC foam boards, warp-free balsa wood, or micro cutting tools in local stationery shops has always been a bottleneck for students and makers in Bangladesh.'}
          </p>
          <p>
            {language === 'bn' ? (
              <>
                সেই অভাব পূরণ করতেই <strong>একশো রকম (Eksho Rokom)</strong>-এর যাত্রা। আমরা একই ছাদের
                নিচে উন্নত মানের মডেলিং ও ক্রাফট উপকরণ সাশ্রয়ী মূল্যে এবং সারা বাংলাদেশে দ্রুত হোম
                ডেলিভারির মাধ্যমে পৌঁছে দিচ্ছি।
              </>
            ) : (
              <>
                <strong>Eksho Rokom</strong> was founded to bridge that gap. We curate high-grade
                modeling essentials under one roof, providing transparent pricing, nationwide
                shipping, and dedicated support for creators.
              </>
            )}
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('products')}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#065367] hover:bg-[#086982] rounded-lg shadow-xs flex items-center gap-2"
            >
              <span>{language === 'bn' ? 'পণ্যসমূহ দেখুন' : 'Explore Products'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Pillars */}
      <div className="border-t border-slate-200 pt-8">
        <div className="text-center mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            {language === 'bn' ? 'আমাদের মূল বৈশিষ্ট্য' : 'Our Core Standards'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'bn'
              ? 'প্রতিটি পণ্যের মান ও সেবায় আমরা যা নিশ্চিত করি'
              : 'Craftsmanship values that guide every material we supply'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#065367]/10 flex items-center justify-center text-[#065367]">
              <Award className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {language === 'bn' ? 'নিখুঁত মানের উপকরণ' : 'Material Precision'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'bn'
                ? 'প্রফেশনাল মডেল তৈরির জন্য সঠিক পুরুত্বের সমতল বোর্ড এবং ধারালো কাটিং টুলস।'
                : 'Carefully calibrated thickness, flat board surfaces, and razor-sharp cutting edges for professional model builds.'}
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#065367]/10 flex items-center justify-center text-[#065367]">
              <Layers className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {language === 'bn' ? 'মিনিয়েচার স্পেশালিটি' : 'Miniature Specialty'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'bn'
                ? 'ডায়োরামার জন্য আসল পোড়ামাটির মিনিয়েচার ইট, স্ট্যাটিক ঘাস, স্কেল গাছ ও টেক্সচার পেস্ট।'
                : 'Authentic miniature terracotta bricks, static grass tufts, scale trees, and texture pastes for dioramas.'}
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#065367]/10 flex items-center justify-center text-[#065367]">
              <Heart className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {language === 'bn' ? 'গ্রাহকবান্ধব সেবা' : 'Maker-Centric Care'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'bn'
                ? 'আপনার প্রজেক্ট ও জুরির নির্ধারিত সময়ের মধ্যে নিরাপদ প্যাকেজিংয়ে দ্রুত ডেলিভারি সহায়তা।'
                : 'Direct guidance, secure packaging, and quick dispatch to help you meet your project juries and deadlines.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
