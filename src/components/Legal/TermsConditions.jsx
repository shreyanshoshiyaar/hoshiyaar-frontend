import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsConditions = () => {
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
        <h1 className="flex-grow text-center text-lg font-black text-blue-900 uppercase tracking-tight mr-10">Terms & Conditions</h1>
      </div>

      {/* Content */}
      <div className="pt-24 px-6 space-y-8 text-blue-900/80">
        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">1. Acceptance of Terms</h2>
          <p className="text-sm font-medium leading-relaxed">
            By accessing or using Hoshiyaar Academy, you agree to be bound by these Terms and Conditions and all applicable laws and regulations.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">2. Use License</h2>
          <p className="text-sm font-medium leading-relaxed">
            Permission is granted to use the materials on Hoshiyaar Academy for personal, non-commercial transitory learning only. This is the grant of a license, not a transfer of title.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">3. User Conduct</h2>
          <p className="text-sm font-medium leading-relaxed">
            Users agree not to:
          </p>
          <ul className="list-disc pl-5 text-sm font-medium space-y-2">
            <li>Use the service for any illegal purpose.</li>
            <li>Attempt to gain unauthorized access to the system.</li>
            <li>Share account credentials with others.</li>
            <li>Engage in any activity that disrupts the service.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">4. Intellectual Property</h2>
          <p className="text-sm font-medium leading-relaxed">
            All content on Hoshiyaar Academy, including text, graphics, logos, and software, is the property of Hoshiyaar Academy and is protected by copyright laws.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">5. Disclaimer</h2>
          <p className="text-sm font-medium leading-relaxed">
            The materials on Hoshiyaar Academy are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">6. Modifications</h2>
          <p className="text-sm font-medium leading-relaxed">
            Hoshiyaar Academy may revise these terms of service at any time without notice. By using this service you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">7. Contact Us</h2>
          <p className="text-sm font-medium leading-relaxed">
            If you have any questions about these Terms and Conditions, please contact us at cg.hoshiyaar@gmail.com or call us at 7021970672.
          </p>
        </section>

        <div className="pt-10 pb-20 text-center opacity-30">
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Last Updated: May 2026</p>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
