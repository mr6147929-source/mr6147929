import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, CheckCircle, Send } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const ContactPage: React.FC = () => {
  const { language } = useLanguage();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !message.trim()) return;
    setSubmitted(true);
    setName('');
    setMobile('');
    setMessage('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-1.5 max-w-2xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {language === 'bn' ? 'যোগাযোগ ও কাস্টমার সাপোর্ট' : 'Contact & Customer Support'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          {language === 'bn'
            ? 'আমাদের পণ্য, পাইকারি অর্ডার বা কাস্টম চাহিদা সম্পর্কে কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।'
            : 'Have a question about our products, bulk orders, or custom requirements? Reach out to us.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
        {/* Contact Info Cards */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {language === 'bn' ? 'সরাসরি যোগাযোগ' : 'Direct Contact'}
            </h3>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#065367]/10 text-[#065367] flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">
                    {language === 'bn' ? 'হটলাইন ও হোয়াটসঅ্যাপ:' : 'Hotline & WhatsApp:'}
                  </span>
                  <span className="font-bold text-slate-900">01700-000000</span>
                  <span className="text-slate-500 block text-xs">01800-000000</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#065367]/10 text-[#065367] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">
                    {language === 'bn' ? 'ইমেইল:' : 'Email:'}
                  </span>
                  <span className="font-semibold text-slate-900">hello@ekshorokom.com</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#065367]/10 text-[#065367] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">
                    {language === 'bn' ? 'অফিস ও ওয়্যারহাউস:' : 'Office & Warehouse:'}
                  </span>
                  <span className="text-slate-900">
                    {language === 'bn'
                      ? 'ধানমন্ডি / মিরপুর রোড, ঢাকা, বাংলাদেশ'
                      : 'Dhanmondi / Mirpur Road, Dhaka, Bangladesh'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#065367]/10 text-[#065367] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">
                    {language === 'bn' ? 'সময়সূচী:' : 'Hours:'}
                  </span>
                  <span className="text-slate-900">
                    {language === 'bn'
                      ? 'সকাল ১০:০০টা – রাত ০৮:০০টা (প্রতিদিন)'
                      : '10:00 AM – 08:00 PM (Daily)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Channels */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {language === 'bn' ? 'সোশ্যাল মিডিয়া (@ekshorokom)' : 'Social Media (@ekshorokom)'}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href="https://facebook.com/ekshorokom"
                target="_blank"
                rel="noreferrer"
                className="p-2 border border-slate-200 rounded hover:border-[#065367] text-slate-700 font-medium text-center"
              >
                Facebook
              </a>
              <a
                href="https://instagram.com/ekshorokom"
                target="_blank"
                rel="noreferrer"
                className="p-2 border border-slate-200 rounded hover:border-[#065367] text-slate-700 font-medium text-center"
              >
                Instagram
              </a>
              <a
                href="https://tiktok.com/@ekshorokom"
                target="_blank"
                rel="noreferrer"
                className="p-2 border border-slate-200 rounded hover:border-[#065367] text-slate-700 font-medium text-center"
              >
                TikTok
              </a>
              <a
                href="https://youtube.com/@ekshorokom"
                target="_blank"
                rel="noreferrer"
                className="p-2 border border-slate-200 rounded hover:border-[#065367] text-slate-700 font-medium text-center"
              >
                YouTube
              </a>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="md:col-span-7 bg-white p-5 sm:p-7 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-0.5">
            {language === 'bn' ? 'বার্তা পাঠান' : 'Send an Inquiry'}
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            {language === 'bn'
              ? 'নিচের ফর্মটি পূরণ করে পাঠিয়ে দিন, আমাদের টিম দ্রুত আপনার সাথে যোগাযোগ করবে।'
              : 'Fill out the form below and our team will get back to you promptly.'}
          </p>

          {submitted ? (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-1.5">
              <CheckCircle className="w-7 h-7 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-bold text-emerald-900">
                {language === 'bn' ? 'বার্তাটি পাওয়া গেছে!' : 'Message Received!'}
              </h4>
              <p className="text-xs text-emerald-700">
                {language === 'bn'
                  ? 'একশো রকমের সাথে যোগাযোগ করার জন্য ধন্যবাদ। আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।'
                  : 'Thank you for contacting Eksho Rokom. Our team will reach out to you shortly.'}
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-2 text-xs font-semibold text-emerald-800 underline"
              >
                {language === 'bn' ? 'আরেকটি বার্তা পাঠান' : 'Send another message'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {language === 'bn' ? 'আপনার নাম' : 'Your Name'}{' '}
                  <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'bn' ? 'যেমন: সাকিব আল হাসান' : 'e.g., Sakib Al Hasan'}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#065367]/20 focus:border-[#065367]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'}{' '}
                  <span className="text-rose-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder={language === 'bn' ? 'যেমন: 01712345678' : 'e.g., 01712345678'}
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#065367]/20 focus:border-[#065367]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {language === 'bn' ? 'আপনার বার্তা বা জিজ্ঞাসা' : 'Message or Inquiries'}{' '}
                  <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={
                    language === 'bn'
                      ? 'আপনার প্রয়োজনীয় পণ্য বা জিজ্ঞাসা সম্পর্কে বিস্তারিত লিখুন...'
                      : 'Tell us about the products or specifications you need...'
                  }
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#065367]/20 focus:border-[#065367]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-[#065367] hover:bg-[#086982] rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'বার্তা পাঠান' : 'Submit Message'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
