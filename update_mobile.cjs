const fs = require('fs');
const file = 'src/components/layout/HomePage.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Change CBSE Badge
code = code.replace(
  'For CBSE 6-8th Classes',
  'For CBSE, RBSE 6-8th Classes'
);
// Make the badge slightly bigger and more prominent
code = code.replace(
  'className="bg-amber-100 text-amber-800 text-[10.5px] xs:text-[11.5px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full border border-amber-300 mt-0.5 mb-1.5 shadow-xs z-20 relative"',
  'className="bg-amber-100 text-amber-800 text-[11px] xs:text-[12.5px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-amber-400 mt-0.5 mb-1.5 shadow-sm ring-2 ring-amber-300/50 z-20 relative"'
);


// 2. We need to split the WhatsApp button out of the vertically centered container.
// The `MobileWelcomeScreen` has a `<div className="w-full max-w-[375px] mx-auto flex flex-col items-center justify-center my-auto z-10 gap-2 xs:gap-2.5">`
// Inside that, it ends with:
//           <span className="text-lg leading-none">→</span>
//         </button>
// 
//         {/* WhatsApp Support Button at Bottom */}
// We want to insert the arrow here, close the centered div, and start a new bottom-aligned div.

const searchString = `            <span className="tracking-wide">Log in / Sign up</span>
            <span className="text-lg leading-none">→</span>
          </button>

        {/* WhatsApp Support Button at Bottom */}`;

// Let's find exactly how the arrow and button are written.
const regexLoginEnd = /(<span className="tracking-wide">Log in \/ Sign up<\/span>\s*<span className="text-lg leading-none">[^<]*<\/span>\s*<\/button>)/;

const newContent = `$1

          {/* Highlight Arrow for Login Button */}
          <div className="relative w-full flex justify-center mt-3 mb-1 sm:mb-2 animate-bounce z-10">
            <div className="flex flex-col items-center">
              <svg className="w-5 h-5 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              <span className="text-[#2563EB] font-black text-[12px] uppercase tracking-wider mt-0.5">Tap to play</span>
            </div>
          </div>
        </div>

        {/* BOTTOM FIXED CONTAINER (WhatsApp & Footer) */}
        <div className="w-full max-w-[375px] mx-auto mt-auto pb-2 z-10 flex flex-col gap-2 shrink-0">`;

code = code.replace(regexLoginEnd, newContent);

// Wait, the original code had:
//         {/* WhatsApp Support Button at Bottom */}
//         <div className="w-full mt-4">
// We need to change `mt-4` to `mt-0` since it's now pushed by `mt-auto` on the parent container.
code = code.replace(/{?\/\* WhatsApp Support Button at Bottom \*\/}?(\s*)<div className="w-full mt-4">/g, '{/* WhatsApp Support Button at Bottom */}$1<div className="w-full">');

// We also need to remove the closing `</div>` of the centered container that was previously AFTER the footer, since we closed it early.
// The structure was:
//         {/* Footer Accent Tagline with Small Stars */}
//         <div className="w-full flex items-center justify-between px-2 pt-0.5">
//            ...
//         </div>
//       </div>
// 
//       {/* Onboarding Video Modal */}
// Since we inserted a closing `</div>` early, the one after the footer will now correctly close the new BOTTOM FIXED CONTAINER!
// So we DON'T need to remove it! It perfectly matches.

fs.writeFileSync(file, code);
console.log('Mobile Welcome Screen updated successfully!');
