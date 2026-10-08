const fs = require('fs');
const file = 'src/components/Learn/pages/LearnDashboard.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add state
const stateHook = 'const [showPurchasedModal, setShowPurchasedModal] = useState(false);';
const stateHookReplacement = `${stateHook}\n  const [showProgressionWarning, setShowProgressionWarning] = useState(false);`;
code = code.replace(stateHook, stateHookReplacement);

// 2. Add Modal JSX at the end, right before <PaywallModal>
const paywallModal = '{/* Paywall Subscription Modal */}';
const progressionModalJSX = `{/* Progression Warning Modal */}
      {showProgressionWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl relative border border-gray-100">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2">Lesson Locked</h3>
            <p className="text-gray-600 font-semibold mb-6">Please complete the previous lesson to continue.</p>
            <button 
              onClick={() => setShowProgressionWarning(false)}
              className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-bold transition-all active:scale-95 shadow-md"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      ${paywallModal}`;
code = code.replace(paywallModal, progressionModalJSX);

// 3. Add click logic (4 occurrences)
const searchStr = `setShowPaywallModal(true);
                                              return;
                                            }
                                            if (!canClick) return;`;

const searchRegex = /setShowPaywallModal\(true\);\s*return;\s*\}\s*if\s*\(!canClick\)\s*return;/g;

const replacementStr = `setShowPaywallModal(true);
                                              return;
                                            }
                                            if (status === 'locked' && !isAdmin) {
                                              setShowProgressionWarning(true);
                                              return;
                                            }
                                            if (!canClick) return;`;

code = code.replace(searchRegex, replacementStr);

fs.writeFileSync(file, code);
console.log('Done!');
