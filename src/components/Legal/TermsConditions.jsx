import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../ui/BackButton.jsx';

const TermsConditions = () => {
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
                Terms and Conditions
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
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Terms and Conditions</h2>
            <p className="text-xs text-gray-500 mt-1">Last Updated: October 2026 • Effective Date: October 1, 2026</p>
          </div>

        {/* Content */}
        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">1</span>
              <span>Acceptance of Terms</span>
            </h2>
            <p>
              Welcome to <strong>Hoshiyaar Academy</strong> ("Hoshiyaar", "Platform", "we", "us", or "our"), an educational technology platform developed and managed by <strong>Creative Garage</strong>. By registering, accessing, downloading, or using our website at <a href="https://hoshiyaar.info" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline">hoshiyaar.info</a>, our Android mobile application, or any associated features, you ("User", "Parent", "Guardian", or "Student") agree to be bound by these Terms and Conditions ("Terms"), our Privacy Policy, and our Refund Policy.
            </p>
            <p>
              If you do not agree to these Terms, you must not access or use the Platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">2</span>
              <span>Eligibility & Parental Consent</span>
            </h2>
            <p>
              Hoshiyaar is specifically designed for students in CBSE Classes 6, 7, and 8. In compliance with the <strong>Digital Personal Data Protection Act, 2023 ("DPDP Act")</strong> and applicable laws:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Users under the age of 18 must have an account registered, verified, and supervised by a parent or legal guardian.</li>
              <li>By setting up an account or completing any payment transaction, the parent or guardian represents that they have the legal authority to consent on behalf of the minor learner and accepts full responsibility for their child's use of the Platform.</li>
              <li>Verification of parental consent is conducted through mobile number OTP validation and account verification protocols.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">3</span>
              <span>Services & Curriculum Structure</span>
            </h2>
            <p>
              Hoshiyaar provides interactive, story-driven curriculum content aligned with NCERT and CBSE science standards. Our offerings include:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li><strong>Interactive Story Lessons:</strong> Multi-step concept breakdowns, diagrams, and illustrative examples.</li>
              <li><strong>Practice Exercises:</strong> Quizzes, multiple choice questions (MCQs), fill-in-the-blanks, sentence rearrangements, and descriptive questions.</li>
              <li><strong>Spaced Revision Rounds:</strong> Topic retention drills and review sessions.</li>
              <li><strong>Chapter Exam Mode:</strong> Comprehensive chapter-end assessments featuring automated AI descriptive evaluations, scoring, and question-by-question model answers.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">4</span>
              <span>Pricing, Pay Per Chapter Model & 1-Year Pass</span>
            </h2>
            <div className="bg-indigo-50/70 border border-indigo-200/90 rounded-2xl p-4 space-y-2 text-indigo-950">
              <p className="font-bold text-sm">
                ⚡ Simple Pay Per Chapter Model — No Recurring Subscriptions
              </p>
              <p className="text-xs leading-relaxed text-indigo-900">
                Hoshiyaar operates on a transparent, pay-as-you-study model. You only pay for the specific chapters you wish to unlock.
              </p>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li><strong>Free Preview:</strong> The first level/lesson in every single chapter across Class 6, 7, and 8 is completely free to preview and experience with zero obligation.</li>
              <li><strong>Price per Chapter:</strong> Access to an entire chapter is available at <strong>₹50 per chapter</strong> (or as explicitly displayed at the time of checkout). All subscription and chapter pass prices are subject to change without prior notice; any price change will not affect active passes already purchased.</li>
              <li><strong>1-Year Access Pass:</strong> Purchasing a chapter unlocks <strong>365 days (1 Full Year)</strong> of unrestricted access to all lessons in that chapter and full Chapter Exam Mode from the timestamp of payment.</li>
              <li><strong>Zero Recurring Auto-Debits:</strong> All transactions are one-time charges. Hoshiyaar does not enroll users into automatic renewal debits or recurring subscriptions. Once a 1-year pass concludes, your access expires naturally without any automatic deduction.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">5</span>
              <span>Chapter Exam Mode & AI Descriptive Evaluation</span>
            </h2>
            <p>
              Chapter Exam Mode incorporates automated artificial intelligence ("AI") models to evaluate students' subjective and descriptive answers against CBSE syllabus rubrics.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>AI evaluation provides formative feedback, detailed scoring, and suggestions for improvement to assist children in mastering concepts.</li>
              <li>AI evaluation is an educational aid and does not constitute official certification, CBSE board assessment, or school examination results.</li>
              <li>Students and parents agree to use AI assessment tools solely for constructive study practice and skill enhancement.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">6</span>
              <span>Payment Processing & Security</span>
            </h2>
            <p>
              All online financial transactions are processed securely through our authorized payment gateway partner, <strong>Razorpay Software Private Limited</strong> ("Razorpay").
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Accepted payment methods include UPI (Google Pay, PhonePe, Paytm, BHIM), Indian Debit & Credit Cards (RuPay, Visa, MasterCard), and Internet Banking.</li>
              <li>Hoshiyaar does not store, collect, or have access to sensitive payment information, including card numbers, CVV codes, net banking passwords, or UPI PINs. All financial data is encrypted and handled under PCI-DSS Level 1 compliance by Razorpay.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">7</span>
              <span>User Conduct & Fair Use</span>
            </h2>
            <p>Users and learners agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Share, transfer, or resell user accounts or unlocked chapter passes to third parties.</li>
              <li>Record, scrape, crawl, download, or systematically extract question banks, storylines, illustrations, or audio content from the Platform.</li>
              <li>Attempt to bypass security features, payment verification systems, or paywalls.</li>
              <li>Engage in any activity that compromises the stability, performance, or integrity of our servers and services.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">8</span>
              <span>Intellectual Property Rights</span>
            </h2>
            <p>
              All materials available on Hoshiyaar, including but not limited to storylines, fictional scenarios, characters, graphics, sound effects, question sets, pedagogical designs, user interface code, and software algorithms, are the exclusive intellectual property of Creative Garage and are protected by Indian and international copyright and trademark laws.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">9</span>
              <span>Limitation of Liability</span>
            </h2>
            <p>
              To the maximum extent permitted by applicable law, Hoshiyaar and Creative Garage shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your access to or inability to use the Platform, any temporary server downtime, or reliance upon educational feedback. Our total aggregate liability for any claims under these Terms shall not exceed the amount actually paid by you for the specific chapter pass in question.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">10</span>
              <span>Governing Law & Jurisdiction</span>
            </h2>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka, India.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3 pt-6 border-t border-gray-100">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">11</span>
              <span>Contact Us & Grievance Redressal</span>
            </h2>
            <p>
              If you have any questions, feedback, or grievances regarding these Terms and Conditions or your user account, please contact our designated Grievance Officer:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs space-y-1.5 text-gray-700">
              <p><strong>Grievance Officer:</strong> Shreyans Bhansali</p>
              <p><strong>Entity:</strong> Creative Garage / Hoshiyaar</p>
              <p><strong>Email:</strong> <a href="mailto:cg.hoshiyaar@gmail.com" className="text-blue-600 font-bold hover:underline">cg.hoshiyaar@gmail.com</a></p>
              <p><strong>Phone / WhatsApp Support:</strong> +91 831 053 2323</p>
              <p><strong>Address:</strong> Bengaluru, Karnataka, India</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
);
};

export default TermsConditions;
