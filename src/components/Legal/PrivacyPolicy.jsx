import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 active:scale-95 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="flex-grow text-center text-lg font-black text-blue-900 uppercase tracking-tight mr-10">Privacy Policy</h1>
      </div>

      {/* Content */}
      <div className="pt-24 px-6 space-y-8 text-blue-900/80">
        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">1. Information We Collect</h2>
          <p className="text-sm font-medium leading-relaxed">
            Hoshiyaar Academy ("we", "us", or "our") collects information to provide better services to all our users. We collect:
          </p>
          <ul className="list-disc pl-5 text-sm font-medium space-y-2">
            <li>Account Information: Name, email, phone number, and password when you register.</li>
            <li>Profile Information: School name, board, class level, and date of birth.</li>
            <li>Usage Information: Points earned, progress in lessons, and quiz results.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">2. How We Use Information</h2>
          <p className="text-sm font-medium leading-relaxed">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-5 text-sm font-medium space-y-2">
            <li>Provide, maintain, and improve our services.</li>
            <li>Personalize your learning experience.</li>
            <li>Maintain the global and school-specific leaderboards.</li>
            <li>Communicate with you about updates or support.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">3. Data Sharing</h2>
          <p className="text-sm font-medium leading-relaxed">
            We do not share your personal information with companies, organizations, or individuals outside of Hoshiyaar Academy except in the following cases:
          </p>
          <ul className="list-disc pl-5 text-sm font-medium space-y-2">
            <li>With your consent.</li>
            <li>For leaderboard visibility (username and school name are visible to other users).</li>
            <li>For legal reasons (to meet any applicable law, regulation, or legal process).</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">4. Security</h2>
          <p className="text-sm font-medium leading-relaxed">
            We work hard to protect Hoshiyaar Academy and our users from unauthorized access to or unauthorized alteration, disclosure, or destruction of information we hold.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">5. Contact Us</h2>
          <p className="text-sm font-medium leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at support@hoshiyaar.info.
          </p>
        </section>

        <div className="pt-10 pb-20 text-center opacity-30">
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Last Updated: May 2026</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
