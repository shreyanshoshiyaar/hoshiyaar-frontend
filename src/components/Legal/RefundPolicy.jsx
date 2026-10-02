import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../ui/BackButton.jsx';

const RefundPolicy = () => {
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
                Cancellation & Refund Policy
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
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Cancellation & Refund Policy</h2>
            <p className="text-xs text-gray-500 mt-1">Last Updated: October 2026 • Effective Date: October 1, 2026</p>
          </div>

        {/* Content */}
        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">1</span>
              <span>Digital Educational Services & Free Preview</span>
            </h2>
            <p>
              Hoshiyaar Academy provides digital, interactive curriculum content, practice exercises, and Chapter Exam Mode assessments for CBSE Classes 6, 7, and 8. 
            </p>
            <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 text-emerald-950 text-xs leading-relaxed">
              <strong>✨ 100% Free Chapter Previews:</strong> We believe in complete transparency. The first level of every single chapter across all subjects is available completely free to preview and test before you make any payment. We encourage parents and students to experience the teaching style, interface, and questions prior to unlocking.
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">2</span>
              <span>General Refund Guidelines</span>
            </h2>
            <p>
              Due to the immediate digital nature of our educational software and instantaneous unlocking of chapter materials upon purchase:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Fees paid for unlocking individual chapters (e.g., ₹50 for a 1-Year Chapter Pass) are generally non-refundable once the chapter has been activated on the user account.</li>
              <li>Since payments are one-time and non-recurring, there are no ongoing monthly or annual subscriptions to cancel, and no recurring deductions will ever take place.</li>
              <li>All subscription and chapter pass prices are subject to change without prior notice; any price change will not affect active passes already purchased.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">3</span>
              <span>Circumstances Eligible for a Full Refund</span>
            </h2>
            <p>
              We are committed to fair customer practices. A 100% refund will be granted under the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li><strong>Duplicate Transaction:</strong> You were charged more than once for the same chapter due to a payment gateway lag, network failure, or duplicate click.</li>
              <li><strong>Technical Non-Delivery:</strong> Your payment was successfully deducted from your bank/UPI account, but the purchased chapter failed to unlock on the Platform, and our technical support team was unable to resolve the access within 24 hours of notification.</li>
              <li><strong>Unscheduled Extended Platform Outage:</strong> Severe technical issues on our servers causing the Platform to be completely inaccessible for more than 48 consecutive hours.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">4</span>
              <span>Non-Refundable Circumstances</span>
            </h2>
            <p>Refunds will not be issued under the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Change of mind after purchasing and completing interactive lessons or taking chapter exams.</li>
              <li>Personal disuse of the Platform after purchase, as passes remain active for 365 days.</li>
              <li>Dissatisfaction with student academic test scores in school, as performance is subject to individual effort and revision.</li>
              <li>Account suspension or termination due to violation of our Terms of Service (e.g., unauthorized data scraping or credential sharing).</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">5</span>
              <span>How to Request a Refund</span>
            </h2>
            <p>
              To request a refund under the eligible criteria above, please reach out to us within <strong>3 business days</strong> of the transaction:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs space-y-2">
              <p>1. Send an email to <a href="mailto:cg.hoshiyaar@gmail.com" className="text-blue-600 font-bold hover:underline">cg.hoshiyaar@gmail.com</a> or text us on WhatsApp at <strong className="text-gray-900">+91 831 053 2323</strong>.</p>
              <p>2. Provide your registered phone number, student username, the chapter name, transaction date, and the Razorpay Payment ID (found on your payment receipt or under the Payment History tab on the subscription page).</p>
              <p>3. Our support desk will review and respond to your request within <strong>24 to 48 business hours</strong>.</p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">6</span>
              <span>Processing & Payout Timeline</span>
            </h2>
            <p>
              Once approved, your refund will be initiated through Razorpay back to your original source of payment (UPI VPA, original credit/debit card, or bank account).
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li><strong>UPI Refunds:</strong> Typically reflect within 24 to 48 hours.</li>
              <li><strong>Card & NetBanking Refunds:</strong> Typically take 5 to 7 business days to reflect in your bank statement, subject to your issuing bank's settlement cycle.</li>
            </ul>
          </section>

          {/* Contact Section */}
          <section className="space-y-3 pt-6 border-t border-gray-100">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">7</span>
              <span>Contact Support</span>
            </h2>
            <p>
              For all payment, billing, or refund queries, contact our dedicated support desk:
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <a
                href="mailto:cg.hoshiyaar@gmail.com"
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-800 font-bold text-xs hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center gap-2"
              >
                <span>✉️</span>
                <span>cg.hoshiyaar@gmail.com</span>
              </a>
              <a
                href={`https://wa.me/918310532323?text=${encodeURIComponent('Hi! I have a query regarding a payment/refund on Hoshiyaar.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center gap-2"
              >
                <span>💬</span>
                <span>WhatsApp: +91 831 053 2323</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
);
};

export default RefundPolicy;
