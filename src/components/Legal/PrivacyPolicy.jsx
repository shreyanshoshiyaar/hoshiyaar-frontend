import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../ui/BackButton.jsx';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      const token = localStorage.getItem('token');
      navigate(token ? '/more' : '/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton onClick={handleBack} />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
                HOSHIYAAR ACADEMY
              </div>
              <h1 className="text-base sm:text-xl font-black text-gray-900 tracking-tight leading-tight">
                Privacy Policy
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={handleBack}
            className="text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors hidden sm:block cursor-pointer px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            Close ✕
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xs border border-gray-200 p-6 sm:p-10 md:p-14">
          <div className="mb-8 pb-6 border-b border-gray-100">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Privacy Policy</h2>
            <p className="text-xs text-gray-500 mt-1">Last Updated: October 2026 • Effective Date: October 1, 2026</p>
          </div>

        {/* Content */}
        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">
          <section className="space-y-3">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">1. Information We Collect</h2>
          <p className="text-sm font-medium leading-relaxed">
            Hoshiyaar Academy ("we", "us", or "our") collects information to provide better educational services to all our users. We collect:
          </p>
          <ul className="list-disc pl-5 text-sm font-medium space-y-2">
            <li>Account & Parent Information: Parent/Guardian name, contact email, mobile phone number, and password when registering an account.</li>
            <li>Learner Profile Information: Child's name or preferred username, school name, board (e.g. CBSE), class level (e.g. Class 6, 7, 8), and date of birth.</li>
            <li>Learning Progress & Usage: Points earned, completed lessons, chapter progress, streak milestones, and quiz results.</li>
            <li>Billing & Transaction Data: Razorpay payment IDs, order IDs, purchase timestamps, chapter identifiers, and transaction amounts. We do NOT collect, process, or store credit/debit card numbers, CVVs, net banking credentials, or UPI PINs. All payment transactions are encrypted and processed by our certified payment partner Razorpay.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">2. How We Use Information</h2>
          <p className="text-sm font-medium leading-relaxed">
            We use the collected information solely to:
          </p>
          <ul className="list-disc pl-5 text-sm font-medium space-y-2">
            <li>Provide, maintain, and improve our gamified curriculum and learning features.</li>
            <li>Personalize the child's learning journey and track mastery over chapters.</li>
            <li>Maintain classroom and global school-specific leaderboards.</li>
            <li>Activate chapter passes (1-Year Chapter Passes), fulfill transactions, and deliver payment receipts.</li>
            <li>Communicate with parents regarding learning milestones, service updates, billing, and parental consent.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">3. Data Sharing</h2>
          <p className="text-sm font-medium leading-relaxed">
            We do not sell, rent, or trade your personal information. We do not share personal information with third parties outside of Hoshiyaar Academy except in the following limited situations:
          </p>
          <ul className="list-disc pl-5 text-sm font-medium space-y-2">
            <li>Payment Processing: With Razorpay Software Private Limited strictly to verify and process online payments under PCI-DSS Level 1 compliance.</li>
            <li>With Explicit Parental Consent: Whenever requested or agreed to by the parent/guardian.</li>
            <li>Leaderboard Visibility: Learner username, class level, and school name are visible on competitive student leaderboards.</li>
            <li>Legal & Regulatory Compliance: To comply with applicable laws, judicial orders, or governmental directives under the DPDP Act or other statutory authorities.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">4. Security</h2>
          <p className="text-sm font-medium leading-relaxed">
            We employ industry-standard technical, physical, and administrative measures to safeguard all personal data against unauthorized access, loss, misuse, or alteration. All communication is encrypted via modern Transport Layer Security (TLS/HTTPS), and passwords/credentials are securely hashed.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">5. Data Retention & Account Deletion</h2>
          <p className="text-sm font-medium leading-relaxed">
            We retain personal data only for as long as necessary to deliver our educational services or comply with statutory requirements. A parent or guardian may request account deletion at any time through our in-app Delete Account settings or by contacting our support team. Upon deletion, all personal data across the mobile app and website is permanently erased, except for records required by financial or legal audit regulations.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">6. Your Rights</h2>
          <p className="text-sm font-medium leading-relaxed">
            Under applicable data protection laws, parents, guardians, and users have the right to access, review, correct, update, or request the deletion of their personal information held by Hoshiyaar.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">7. Cookies & Local Storage</h2>
          <p className="text-sm font-medium leading-relaxed">
            We use secure local storage and essential session tokens solely for authentication and remembering learner progress. We do not use third-party tracking cookies or advertising pixels.
          </p>
        </section>

        {/* Section 8: Children's Personal Data and Parental Consent */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">
            8. Children's Personal Data and Parental Consent
          </h2>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-blue-900">8.1 Who this section covers</h3>
            <p className="text-sm font-medium leading-relaxed">
              Under the Digital Personal Data Protection Act, 2023 ("DPDP Act") and the Digital Personal Data Protection Rules, 2025, a "child" is any individual who has not completed 18 years of age. Because Hoshiyaar is built for CBSE Class 6, 7, and 8 students, the majority of our learners fall within this definition, and this section governs how we handle their personal data — whether they access Hoshiyaar by downloading the mobile app or by using the web platform at <a href="https://hoshiyaar.info" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">hoshiyaar.info</a> directly in a browser. The same consent, verification, and data-handling rules apply regardless of which surface a child uses.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-blue-900">8.2 Verifiable Parental Consent</h3>
            <p className="text-sm font-medium leading-relaxed">
              Before we collect, store, or process any personal data belonging to a child, we require verifiable consent from a parent or lawful guardian. In practice, this means:
            </p>
            <ul className="list-disc pl-5 text-sm font-medium space-y-2">
              <li>The account used by a child learner must be created and verified by a parent or guardian, not by the child directly — this applies equally whether the account is set up through the app or through the website.</li>
              <li>We verify the identity and age of the consenting parent or guardian through mobile number OTP verification tied to the parent's registered mobile number, or other government-recognised methods.</li>
              <li>We keep a record of when and how this consent was given, so we can produce evidence of it if asked by the Data Protection Board of India or the parent themselves.</li>
              <li>A parent or guardian can withdraw consent at any time by emailing <a href="mailto:cg.hoshiyaar@gmail.com" className="text-blue-600 underline font-semibold">cg.hoshiyaar@gmail.com</a>, via in-app settings, or through account settings on the website. Withdrawing consent will result in the deletion of the child's account and associated personal data — across both the app and the website — except where we are required to retain limited records by law.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-blue-900">8.3 What we do not do with children's data</h3>
            <p className="text-sm font-medium leading-relaxed">
              In line with Section 9(3) of the DPDP Act, we do not:
            </p>
            <ul className="list-disc pl-5 text-sm font-medium space-y-2">
              <li>Track or monitor a child's behaviour for the purpose of targeted advertising.</li>
              <li>Build behavioural or interest-based profiles of child users for advertising or any purpose unrelated to their learning experience within the app.</li>
              <li>Show targeted or personalised advertisements to child users.</li>
            </ul>
            <p className="text-sm font-medium leading-relaxed pt-1">
              We do use in-app learning progress data (e.g., which chapters or modules a child has completed) to personalise the learning content itself — this is treated as necessary for providing the core service, not as tracking for advertising, and is limited to that purpose.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-blue-900">8.4 Data minimisation for children's accounts</h3>
            <p className="text-sm font-medium leading-relaxed">
              We collect only what is necessary to deliver the learning experience and to communicate with the consenting parent — for example: the child's name or preferred username, class/grade, and learning progress. We do not require children to provide contact details (phone number, personal email) directly; parent contact details are used for all account-level communication, billing, and consent management.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-blue-900">8.5 Parental rights</h3>
            <p className="text-sm font-medium leading-relaxed">
              As the consenting parent or guardian, you have the right to:
            </p>
            <ul className="list-disc pl-5 text-sm font-medium space-y-2">
              <li>Review the personal data we hold about your child.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Withdraw your consent and request deletion of your child's account and data (see 8.2).</li>
              <li>Raise a grievance with our Grievance Officer / Data Protection Officer (Shreyans Bhansali, Creative Garage / Hoshiyaar) at <a href="mailto:cg.hoshiyaar@gmail.com" className="text-blue-600 underline font-semibold">cg.hoshiyaar@gmail.com</a> (Phone: +91 831 053 2323), and, if unresolved, escalate to the Data Protection Board of India.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-blue-900">8.6 Retrospective notice</h3>
            <p className="text-sm font-medium leading-relaxed">
              If your child's account was created or personal data was processed before this consent mechanism was implemented, we will separately notify you and seek fresh verifiable consent, in line with the DPDP Rules' requirement for retrospective notice on pre-existing processing.
            </p>
          </div>
        </section>

        {/* Section 9: Contact Us */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">9. Contact Us</h2>
          <p className="text-sm font-medium leading-relaxed">
            If you have any questions or grievances regarding this Privacy Policy, please contact us at <a href="mailto:cg.hoshiyaar@gmail.com" className="text-blue-600 underline font-semibold">cg.hoshiyaar@gmail.com</a>, or call us at +91 831 053 2323.
          </p>
        </section>

        <div className="pt-10 pb-6 text-center opacity-40">
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Last Updated: October 2026</p>
        </div>
      </div>
    </div>
  </div>
</div>
);
};

export default PrivacyPolicy;
