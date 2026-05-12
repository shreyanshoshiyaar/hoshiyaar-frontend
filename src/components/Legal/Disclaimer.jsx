import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../ui/BackButton.jsx';

const Disclaimer = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8">
          <BackButton onClick={() => navigate(-1)} />
          <h1 className="text-3xl font-extrabold text-gray-900">Disclaimer</h1>
        </div>

        <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
          <p className="text-sm text-gray-400 italic">Last Updated: May 12, 2026</p>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">1. Educational Content</h2>
            <p>
              The information provided on Hoshiyaar (the "Platform") is for general educational purposes only. While we strive to provide accurate and up-to-date content, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the information, products, services, or related graphics contained on the Platform for any purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">2. No Guarantee of Results</h2>
            <p>
              Hoshiyaar does not guarantee specific academic results, test scores, or grades as a result of using our services. Success in learning depends on various factors, including individual effort, previous knowledge, and consistency.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">3. External Links</h2>
            <p>
              Through this Platform, you may be able to link to other websites (such as YouTube or social media) which are not under the control of Hoshiyaar. We have no control over the nature, content, and availability of those sites. The inclusion of any links does not necessarily imply a recommendation or endorse the views expressed within them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">4. Technical Performance</h2>
            <p>
              Every effort is made to keep the Platform up and running smoothly. However, Hoshiyaar takes no responsibility for, and will not be liable for, the Platform being temporarily unavailable due to technical issues beyond our control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">5. Limitation of Liability</h2>
            <p>
              In no event will we be liable for any loss or damage including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from loss of data or profits arising out of, or in connection with, the use of this Platform.
            </p>
          </section>

          <section className="pt-6 border-t border-gray-100">
            <p className="font-bold">Contact Us</p>
            <p>If you have any questions regarding this disclaimer, please contact us at:</p>
            <a href="mailto:support@hoshiyaar.info" className="text-blue-600 font-bold hover:underline">support@hoshiyaar.info</a>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
