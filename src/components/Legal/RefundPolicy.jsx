import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../ui/BackButton.jsx';

const RefundPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8">
          <BackButton onClick={() => navigate(-1)} />
          <h1 className="text-3xl font-extrabold text-gray-900">Refund Policy</h1>
        </div>

        <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
          <p className="text-sm text-gray-400 italic">Last Updated: May 12, 2026</p>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">1. Subscription Services</h2>
            <p>
              Hoshiyaar provides digital educational content and services. Due to the digital nature of our products, once a subscription is activated or content is accessed, we generally do not offer refunds except under specific circumstances outlined below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">2. Refund Eligibility</h2>
            <p>
              You may be eligible for a refund if:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You were charged twice for the same subscription period due to a technical error.</li>
              <li>The Platform was completely inaccessible for a significant period (more than 48 consecutive hours) due to our technical failure.</li>
              <li>A refund is requested within 24 hours of a new subscription purchase, and no premium content has been accessed.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">3. Non-Refundable Items</h2>
            <p>
              Refunds will not be issued for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Change of mind after accessing the learning modules.</li>
              <li>Dissatisfaction with educational content if the content matches the descriptions provided.</li>
              <li>Account termination due to violation of our Terms of Service.</li>
              <li>Partial months of service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">4. Request Process</h2>
            <p>
              To request a refund, please email <span className="font-bold">cg.hoshiyaar@gmail.com</span> with your account details, transaction ID, and the reason for the refund request. Our team will review your request and respond within 3-5 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">5. Processing Refunds</h2>
            <p>
              If approved, refunds will be processed via the original payment method used during the purchase. It may take 7-10 business days for the credit to appear on your statement, depending on your bank or payment provider.
            </p>
          </section>

          <section className="pt-6 border-t border-gray-100">
            <p className="font-bold">Contact Us</p>
            <p>For any refund-related queries, reach out to us at:</p>
            <div className="flex flex-col gap-2 mt-2">
              <a href="mailto:cg.hoshiyaar@gmail.com" className="text-blue-600 font-bold hover:underline">cg.hoshiyaar@gmail.com</a>
              <span className="text-gray-700 font-bold">Phone: 7021970672</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
