import React, { createContext, useContext, useState, useEffect } from 'react';
import { Category, DeliveryAreaType, FooterSectionItem, OrderStatus, Product } from '../types';
import { INITIAL_FOOTER_SECTIONS, INITIAL_PRODUCTS } from '../data/mockData';

export type Language = 'bn' | 'en';

const LANGUAGE_STORAGE_KEY = 'eksho_rokom_language';
const DEFAULT_EN_ANNOUNCEMENT =
  'Craft Materials & DIY Supplies for Miniature Making · Nationwide Home Delivery Across Bangladesh';
const DEFAULT_BN_ANNOUNCEMENT =
  'মিনিয়েচার ও ক্রাফট তৈরির সকল উপকরণ · সারা বাংলাদেশে হোম ডেলিভারি';

const CATEGORY_BN_MAP: Record<string, { name: string; description: string }> = {
  'cat-miniature': {
    name: 'মিনিয়েচার ও ডায়োরামা উপকরণ',
    description:
      'আর্কিটেকচারাল ডায়োরামা ও স্কেল মডেলের জন্য মিনিয়েচার ইট, গাছ, ঘাস এবং টেক্সচার সামগ্রী।',
  },
  'cat-sheets': {
    name: 'ক্রাফট শিট ও বোর্ড',
    description:
      'হাই-ডেনসিটি পিভিসি ফোম বোর্ড, বালসা উড শিট, সানবোর্ড এবং অ্যাক্রিলিক প্যানেল।',
  },
  'cat-tools': {
    name: 'প্রিসিশন ক্রাফট টুলস',
    description:
      'প্রফেশনাল হবি ছুরি, টুইজার, স্কেল রুলার, কাটিং ম্যাট এবং নিডল ফাইল সেট।',
  },
  'cat-adhesives': {
    name: 'অ্যাডহেসিভ ও গ্লু',
    description:
      'স্পেশালিস্ট মডেল সিমেন্ট, ক্লিয়ার পিভিএ গ্লু, ইনস্ট্যান্ট অ্যাডহেসিভ এবং ফাইন-টিপ অ্যাপ্লিকেটর।',
  },
};

const PRODUCT_BN_MAP: Record<string, { name: string; description: string }> = {
  'prod-pvc-2mm': {
    name: 'হাই-ডেনসিটি হোয়াইট পিভিসি ফোম বোর্ড (২ মিমি, A3 সাইজ)',
    description:
      'উন্নত মানের ২ মিমি সাদা পিভিসি ফোম বোর্ড, যা মিনিয়েচার আর্কিটেকচারাল দেয়াল, ডায়োরামা এবং সূক্ষ্ম কাটিং কাজের জন্য আদর্শ। উভয় পাশ মসৃণ ম্যাট ফিনিশ, বাঁকা হয় না এবং সহজেই নিখুঁতভাবে কাটা যায়।',
  },
  'prod-pvc-3mm': {
    name: 'হাই-ডেনসিটি হোয়াইট পিভিসি ফোম বোর্ড (৩ মিমি, A3 সাইজ)',
    description:
      'মজবুত ৩ মিমি পিভিসি ফোম বোর্ড, যা মডেলের বেস, মিনিয়েচার বিল্ডিং ফ্রেমিং এবং ক্রাফট প্রজেক্টের জন্য তৈরি। সাধারণ ইউটিলিটি ছুরি দিয়ে সহজেই কাটা যায়।',
  },
  'prod-balsa-sheets': {
    name: 'হালকা বালসা উড শিট (৫ পিসের প্যাক, ২ মিমি x ১০০ মিমি x ৩০০ মিমি)',
    description:
      'বাছাইকৃত ফাইন-গ্রেইন বালসা কাঠের শিট। অত্যন্ত হালকা কিন্তু মজবুত; ব্রিজ মডেল, আর্কিটেকচারাল ট্রাস, বিমানের ফ্রেম এবং মিনিয়েচার কাঠের কাজের জন্য উপযুক্ত।',
  },
  'prod-knife-pro': {
    name: 'প্রফেশনাল মেটাল ক্রাফট হবি ছুরি (৫টি অতিরিক্ত ব্লেডসহ)',
    description:
      'নন-স্লিপ টেক্সচার্ড অ্যালুমিনিয়াম হ্যান্ডেল ও মজবুত ব্রাস চাকযুক্ত প্রফেশনাল ক্রাফট ছুরি। সূক্ষ্ম কাটিং ও স্টেনসিল কাজের জন্য সাথে রয়েছে ৫টি অতি-ধারালো #১১ কার্বন স্টিল ব্লেড।',
  },
  'prod-tweezers-set': {
    name: 'প্রিসিশন অ্যান্টি-স্ট্যাটিক স্টেইনলেস টুইজার সেট (বাঁকা ও সোজা)',
    description:
      'সূক্ষ্ম নিডল পয়েন্টযুক্ত ২টি স্টেইনলেস টুইজারের সেট। মিনিয়েচার গাছপালা, ইট এবং ছোট স্কেলের অংশগুলো নিখুঁতভাবে বসানোর জন্য অপরিহার্য।',
  },
  'prod-cutting-mat': {
    name: 'সেলফ-হিলিং ক্রাফট কাটিং ম্যাট (A4 গ্রিন গ্রিড)',
    description:
      '৫-স্তর বিশিষ্ট সেলফ-হিলিং পিভিসি কাটিং ম্যাট, যা টেবিলের উপরিভাগ রক্ষা করে এবং ব্লেডের ধার দীর্ঘস্থায়ী করে। এতে ১ সেমি গ্রিড, কোণ গাইড (৩০°, ৪৫°, ৬০°) এবং স্কেল দাগাঙ্কিত রয়েছে।',
  },
  'prod-mini-bricks': {
    name: 'আর্কিটেকচারাল মিনিয়েচার মাটির লাল ইট (১০০ পিস প্যাক, স্কেল ১:২৪ / ১:৩৫)',
    description:
      'বাস্তবসম্মত ডায়োরামা, ডলহাউস এবং আর্কিটেকচারাল মডেলের জন্য আসল পোড়ামাটির তৈরি মিনিয়েচার ইট। পিভিএ গ্লু বা মিনিয়েচার মর্টার পেস্ট দিয়ে সহজেই জোড়া লাগানো যায়।',
  },
  'prod-static-grass': {
    name: 'স্ট্যাটিক গ্রাস টাফটস - ওয়াইল্ড মিডো গ্রিন (৮০টি ক্লাস্টার)',
    description:
      'প্রাকৃতিক সবুজ রঙের সেলফ-অ্যাডহেসিভ মিনিয়েচার ঘাসের গুচ্ছ। ডায়োরামা বেস, রেলওয়ে লেআউট বা আর্কিটেকচারাল ল্যান্ডস্কেপে সরাসরি লাগানো যায়।',
  },
  'prod-scale-trees': {
    name: 'স্কেল মডেল আর্কিটেকচারাল গাছের প্যাক (১০টি সবুজ গাছ, ৫–৯ সেমি)',
    description:
      'তারের কাঠামো ও সবুজ ফলিয়াজযুক্ত হাতে তৈরি মিনিয়েচার গাছ। ১:৫০, ১:৭৫ এবং ১:১০০ স্কেলের আর্কিটেকচার প্রেজেন্টেশন ও ডায়োরামার জন্য উপযুক্ত।',
  },
  'prod-model-cement': {
    name: 'প্রিসিশন মডেল সিমেন্ট ও ইনস্ট্যান্ট ক্রাফট অ্যাডহেসিভ (৫০ মিলি নিডল বোতল)',
    description:
      'সূক্ষ্ম মেটাল নিডল টিপযুক্ত মডেল সিমেন্ট, যা কোনো বাড়তি দাগ ছাড়াই প্লাস্টিক, অ্যাক্রিলিক এবং স্টাইরিন দ্রুত ও নিখুঁতভাবে জোড়া লাগায়।',
  },
  'prod-craft-pva': {
    name: 'ক্লিয়ার ক্রাফট পিভিএ উড ও পেপার গ্লু (১২০ মিলি)',
    description:
      'নন-টক্সিক ও অ্যাসিড-মুক্ত ক্লিয়ার ড্রাইং পিভিএ ক্রাফট গ্লু। বালসা কাঠ, কার্ডবোর্ড, পেপারক্রাফট এবং ডায়োরামা ল্যান্ডস্কেপিংয়ের জন্য আদর্শ; শুকানোর পর স্বচ্ছ হয়ে যায়।',
  },
  'prod-needle-files': {
    name: 'মিনিয়েচার মেটাল নিডল ফাইল সেট (৬টি ভিন্ন প্রোফাইল)',
    description:
      'ফ্ল্যাট, রাউন্ড, হাফ-রাউন্ড, ট্রায়াঙ্গেল এবং স্কয়ার প্রোফাইলসহ ৬টি হাই-কার্বন অ্যালয় মিনিয়েচার ফাইল সেট। মিনিয়েচার কাটিং ফিনিশিং, বালসা শেপিং এবং থ্রিডি প্রিন্ট পরিষ্কারের জন্য উপযুক্ত।',
  },
};

const FOOTER_BN_MAP: Record<FooterSectionItem['id'], { title: string; content: string }> = {
  social_media: {
    title: 'আমাদের সোশ্যাল মিডিয়া',
    content:
      'মিনিয়েচার টিউটোরিয়াল, নতুন পণ্যের আপডেট এবং ডিআইওয়াই ক্রাফট আইডিয়ার জন্য Facebook, Instagram, TikTok এবং YouTube-এ @ekshorokom ফলো করুন।',
  },
  return_policy: {
    title: 'রিটার্ন পলিসি',
    content:
      'ডেলিভারির সময় ক্ষতিগ্রস্ত বা ত্রুটিপূর্ণ পণ্য পেলে ডেলিভারির ৩ দিনের মধ্যে পরিবর্তন করে নেওয়া যাবে। অনুগ্রহ করে পার্সেল খোলার সময় একটি আনবক্সিং ভিডিও বা পরিষ্কার ছবি সংরক্ষণ করুন।',
  },
  terms_conditions: {
    title: 'শর্তাবলী',
    content:
      'অগ্রিম ডেলিভারি চার্জ পরিশোধের পর অর্ডার কনফার্ম করা হয়। পণ্যের বাকি মূল্য (COD Amount) পার্সেল ডেলিভারির সময় পরিশোধযোগ্য।',
  },
  contact_details: {
    title: 'যোগাযোগের তথ্য',
    content:
      'ফোন ও হোয়াটসঅ্যাপ: 01700-000000 / 01800-000000 | ইমেইল: hello@ekshorokom.com | ঠিকানা: ঢাকা, বাংলাদেশ (প্রতিদিন সকাল ১০:০০টা – রাত ০৮:০০টা)।',
  },
  about_us: {
    title: 'আমাদের সম্পর্কে',
    content:
      'একশো রকম (Eksho Rokom) বাংলাদেশের একটি বিশেষায়িত ক্রাফট ম্যাটেরিয়ালস ও ডিআইওয়াই সাপ্লাই স্টোর, যেখানে আর্কিটেকচারাল মডেলিং শিট, প্রিসিশন টুলস এবং মিনিয়েচার ডায়োরামা উপকরণ পাওয়া যায়।',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  localizeCategory: (cat: Category) => { name: string; description: string };
  localizeProduct: (prod: Product) => { name: string; description: string };
  localizeProductNameById: (productId: string, fallbackName: string) => string;
  localizeFooterSection: (sec: FooterSectionItem) => { title: string; content: string };
  localizeAnnouncement: (text: string) => string;
  localizeArea: (area: DeliveryAreaType | string) => string;
  localizeOrderStatus: (status: OrderStatus) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === 'bn' || stored === 'en') {
        return stored;
      }
    } catch {
      // ignore
    }
    // Default language for new users: বাংলা ('bn')
    return 'bn';
  });

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      document.documentElement.lang = language === 'bn' ? 'bn' : 'en';
    } catch {
      // ignore
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const localizeCategory = (cat: Category) => {
    if (language === 'bn' && CATEGORY_BN_MAP[cat.id]) {
      return CATEGORY_BN_MAP[cat.id];
    }
    return { name: cat.name, description: cat.description };
  };

  const localizeProduct = (prod: Product) => {
    if (language === 'bn' && PRODUCT_BN_MAP[prod.id]) {
      const initialProd = INITIAL_PRODUCTS.find(p => p.id === prod.id);
      const nameUnchanged = !initialProd || prod.name === initialProd.name;
      const descUnchanged = !initialProd || prod.description === initialProd.description;
      return {
        name: nameUnchanged ? PRODUCT_BN_MAP[prod.id].name : prod.name,
        description: descUnchanged ? PRODUCT_BN_MAP[prod.id].description : prod.description,
      };
    }
    return { name: prod.name, description: prod.description };
  };

  const localizeProductNameById = (productId: string, fallbackName: string) => {
    if (language === 'bn' && PRODUCT_BN_MAP[productId]) {
      const initialProd = INITIAL_PRODUCTS.find(p => p.id === productId);
      if (!initialProd || fallbackName === initialProd.name) {
        return PRODUCT_BN_MAP[productId].name;
      }
    }
    return fallbackName;
  };

  const localizeFooterSection = (sec: FooterSectionItem) => {
    if (language === 'bn' && FOOTER_BN_MAP[sec.id]) {
      const initialSec = INITIAL_FOOTER_SECTIONS.find(s => s.id === sec.id);
      const titleUnchanged = !initialSec || sec.title === initialSec.title;
      const contentUnchanged = !initialSec || sec.content === initialSec.content;
      return {
        title: titleUnchanged ? FOOTER_BN_MAP[sec.id].title : sec.title,
        content: contentUnchanged ? FOOTER_BN_MAP[sec.id].content : sec.content,
      };
    }
    return { title: sec.title, content: sec.content };
  };

  const localizeAnnouncement = (text: string) => {
    if (language === 'bn' && text.trim() === DEFAULT_EN_ANNOUNCEMENT) {
      return DEFAULT_BN_ANNOUNCEMENT;
    }
    return text;
  };

  const localizeArea = (area: DeliveryAreaType | string) => {
    if (language === 'en') return area;
    switch (area) {
      case 'Dhaka City':
        return 'ঢাকা সিটি';
      case 'Dhaka Sub Urban':
        return 'ঢাকা সাব-আরবান';
      case 'Outside Dhaka':
        return 'ঢাকার বাইরে';
      default:
        return area;
    }
  };

  const localizeOrderStatus = (status: OrderStatus) => {
    if (language === 'en') return status;
    switch (status) {
      case 'Pending':
        return 'পেন্ডিং';
      case 'Confirmed':
        return 'কনফার্মড';
      case 'Processing':
        return 'প্রসেসিং';
      case 'Shipped':
        return 'শিপড';
      case 'Delivered':
        return 'ডেলিভারড';
      case 'Cancelled':
        return 'বাতিল';
      default:
        return status;
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        localizeCategory,
        localizeProduct,
        localizeProductNameById,
        localizeFooterSection,
        localizeAnnouncement,
        localizeArea,
        localizeOrderStatus,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
