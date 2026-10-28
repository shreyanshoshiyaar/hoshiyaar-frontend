import React, { useState } from 'react';
import { vibrateLight, vibrateSuccess } from '../../utils/vibrationService.js';
import apiClient from '../../services/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';

const REPORT_OPTIONS = [
  'The answer is wrong',
  'Spelling or words',
  'Picture problem',
  'Sound problem',
  'Something else'
];

export default function ReportProblemModal({
  isOpen,
  onClose,
  itemId = '',
  moduleId = '',
  chapterId = '',
  questionText = '',
  screenName = ''
}) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSelectOption = (opt) => {
    vibrateLight();
    setSelectedCategory(opt);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedCategory || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await apiClient.post('/reports', {
        itemId: itemId || 'Unknown',
        moduleId: moduleId || '',
        chapterId: chapterId || '',
        screen: screenName || itemId || 'Question Screen',
        questionText: questionText || '',
        category: selectedCategory,
        details: details.trim(),
        userId: user?._id || null,
        userName: user?.name || user?.username || 'Student',
        userPhone: user?.phone || ''
      });

      vibrateSuccess();
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSelectedCategory('');
        setDetails('');
        setIsSubmitting(false);
        onClose();
      }, 1400);
    } catch (err) {
      console.error('[ReportProblemModal] Error sending report:', err);
      setIsSubmitting(false);
      // Still close gracefully with friendly message
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1400);
    }
  };

  const displayScreen = screenName || itemId || 'C1.P0';

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-7 shadow-2xl border-t sm:border border-slate-200 transform transition-all duration-300 max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top drag handle indicator */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />

        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mb-3 shadow-inner">
              ✓
            </div>
            <h3 
              style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
              className="text-2xl font-black text-slate-800 mb-1"
            >
              Report Sent!
            </h3>
            <p className="text-sm font-semibold text-slate-500">
              Thank you for helping us improve Hoshiyaar!
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-left mb-4">
              <h2 
                style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
                className="text-2xl sm:text-[26px] font-black text-[#101F33] tracking-tight leading-tight"
              >
                Report a problem
              </h2>
              <p className="text-sm font-semibold text-slate-500 mt-1">
                Screen {displayScreen}. Thank you for helping!
              </p>
            </div>

            {/* Options List */}
            <div className="flex flex-col gap-2.5 mb-5">
              {REPORT_OPTIONS.map((opt) => {
                const isSelected = selectedCategory === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full py-3 px-4 rounded-[18px] text-left font-bold text-sm sm:text-base border-2 transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#1F6FE5] bg-[#EFF6FF] text-[#1F6FE5] shadow-xs ring-2 ring-[#1F6FE5]/20'
                        : 'border-[#CBD5E1] bg-white text-[#101F33] hover:border-slate-400 active:scale-[0.99]'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#1F6FE5] text-white flex items-center justify-center text-xs font-black shadow-2xs">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Optional Comment Input */}
            <div className="mb-5 text-left">
              <label 
                htmlFor="report-details"
                className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5"
              >
                Tell us more (optional)
              </label>
              <textarea
                id="report-details"
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Give us a clue..."
                className="w-full p-3 rounded-[16px] border-2 border-[#CBD5E1] focus:border-[#1F6FE5] focus:ring-2 focus:ring-[#1F6FE5]/20 outline-none text-sm text-slate-800 font-medium resize-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedCategory || isSubmitting}
                style={{ fontFamily: "var(--f-display, 'Fredoka', sans-serif)" }}
                className={`w-full py-3.5 rounded-[18px] font-black text-base sm:text-lg tracking-wide transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 ${
                  selectedCategory && !isSubmitting
                    ? 'bg-[#1F6FE5] hover:bg-[#185BC5] text-white active:scale-[0.99] shadow-md'
                    : 'bg-[#E2E8F0] text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send report</span>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-slate-500 hover:text-slate-700 text-xs sm:text-sm font-bold text-center cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
