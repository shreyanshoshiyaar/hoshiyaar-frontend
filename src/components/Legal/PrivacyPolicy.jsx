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
      <div className="pt-24 px-6 max-w-4xl mx-auto space-y-8 text-blue-900/80">
        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">1. Information We Collect</h2>
          <p className="text-sm font-medium leading-relaxed">
            Hoshiyaar Academy ("we", "us", or "our") collects information to provide better educational services to all our users. We collect:
          </p>
          <ul className="list-disc pl-5 text-sm font-medium space-y-2">
            <li>Account & Parent Information: Parent/Guardian name, contact email, mobile phone number, and password when registering an account.</li>
            <li>Learner Profile Information: Child's name or preferred username, school name, board (e.g. CBSE), class level (e.g. Class 6, 7, 8), and date of birth.</li>
            <li>Learning Progress & Usage: Points earned, completed lessons, chapter progress, streak milestones, and quiz results.</li>
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
            <li>Communicate with parents regarding learning milestones, service updates, billing, and parental consent.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-blue-600 uppercase tracking-tight">3. Data Sharing</h2>
          <p className="text-sm font-medium leading-relaxed">
            We do not sell, rent, or trade your personal information. We do not share personal information with third parties outside of Hoshiyaar Academy except in the following limited situations:
          </p>
          <ul className="list-disc pl-5 text-sm font-medium space-y-2">
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
              <li>A parent or guardian can withdraw consent at any time by emailing <a href="mailto:privacy@hoshiyaar.info" className="text-blue-600 underline font-semibold">privacy@hoshiyaar.info</a> or <a href="mailto:cg.hoshiyaar@gmail.com" className="text-blue-600 underline font-semibold">cg.hoshiyaar@gmail.com</a>, via in-app settings, or through account settings on the website. Withdrawing consent will result in the deletion of the child's account and associated personal data — across both the app and the website — except where we are required to retain limited records by law.</li>
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
              <li>Raise a grievance with our Grievance Officer / Data Protection Officer at <a href="mailto:privacy@hoshiyaar.info" className="text-blue-600 underline font-semibold">privacy@hoshiyaar.info</a> / <a href="mailto:cg.hoshiyaar@gmail.com" className="text-blue-600 underline font-semibold">cg.hoshiyaar@gmail.com</a> (Phone: +91 7021970672), and, if unresolved, escalate to the Data Protection Board of India.</li>
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
            If you have any questions or grievances regarding this Privacy Policy, please contact us at <a href="mailto:privacy@hoshiyaar.info" className="text-blue-600 underline font-semibold">privacy@hoshiyaar.info</a> or <a href="mailto:cg.hoshiyaar@gmail.com" className="text-blue-600 underline font-semibold">cg.hoshiyaar@gmail.com</a>, or call us at 7021970672.
          </p>
        </section>

        <div className="pt-10 pb-20 text-center opacity-30">
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Last Updated: September 2026</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
