import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../ui/BackButton.jsx';

const Disclaimer = () => {
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
                Disclaimer
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
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Educational & Service Disclaimer</h2>
            <p className="text-xs text-gray-500 mt-1">Last Updated: October 2026</p>
          </div>

        {/* Content */}
        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">1</span>
              <span>General Educational Purpose</span>
            </h2>
            <p>
              The digital learning content, stories, diagnostic quizzes, and revision exercises on Hoshiyaar (the "Platform") are developed solely for supplementary educational and self-study purposes. Content is mapped to the standard NCERT and Central Board of Secondary Education (CBSE) syllabus for Classes 6, 7, and 8.
            </p>
            <p>
              While our academic team takes rigorous care to ensure factual precision and pedagogical clarity, Hoshiyaar makes no representations or warranties, express or implied, regarding the exhaustive completeness, official curriculum revisions made by individual schools, or absolute accuracy of external reference materials.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">2</span>
              <span>Chapter Exam Mode & AI-Assisted Evaluation</span>
            </h2>
            <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 text-amber-950 text-xs leading-relaxed space-y-1.5">
              <p className="font-bold">Notice Regarding Automated AI Scoring:</p>
              <p>
                Chapter Exam Mode features automated artificial intelligence models designed to evaluate subjective, short-answer, and descriptive student responses against model NCERT rubrics.
              </p>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>AI evaluations, marks, and feedback provided on the Platform are intended strictly as formative practice guidance to help students identify conceptual blind spots and improve answer composition.</li>
              <li>AI scoring does not represent, replace, or guarantee scores awarded by human school educators, CBSE internal assessments, or official board examiners.</li>
              <li>Hoshiyaar shall not be held responsible for discrepancies between automated mock scoring and school examination marks.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">3</span>
              <span>No Guarantee of Academic Outcomes</span>
            </h2>
            <p>
              Hoshiyaar does not guarantee specific ranks, percentages, grades, or school test results as a consequence of using our digital passes or interactive modules. Academic success depends on an array of individual learner factors, including study discipline, homework consistency, personal foundational understanding, and classroom instruction.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">4</span>
              <span>Affiliation Disclaimer</span>
            </h2>
            <p>
              Hoshiyaar Academy is an independent educational product operated by Creative Garage. We are not officially affiliated with, endorsed by, or sponsored by the Central Board of Secondary Education (CBSE), the National Council of Educational Research and Training (NCERT), or any governmental department of education. All trademarked curriculum references are used solely in a descriptive capacity to indicate curriculum alignment.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">5</span>
              <span>Technical Availability</span>
            </h2>
            <p>
              Every reasonable effort is made to maintain continuous 24/7 server uptime and uninterrupted access to unlocked chapters. However, Hoshiyaar assumes no liability for temporary downtime resulting from maintenance windows, cloud hosting interruptions, third-party internet service provider disruptions, or force majeure events.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-gray-100">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-black">6</span>
              <span>Contact Us</span>
            </h2>
            <p>For questions or clarifications regarding this disclaimer, reach out to us at:</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-2 text-xs">
              <a href="mailto:cg.hoshiyaar@gmail.com" className="font-bold text-blue-600 hover:underline">
                Email: cg.hoshiyaar@gmail.com
              </a>
              <span className="text-gray-500">•</span>
              <span className="font-bold text-gray-800">WhatsApp / Phone: +91 831 053 2323</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
);
};

export default Disclaimer;
