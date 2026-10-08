const fs = require('fs');
const file = 'src/components/layout/HomePage.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add 'For CBSE 6-8th Classes'
const logoRegex = /(<img\s+src=\{HoshiyaarLogo\}[\s\S]*?\/>)/;
const logoReplacement = `$1\n\n        {/* New Text: For CBSE 6-8th Classes */}\n        <div className="bg-amber-100 text-amber-800 text-[10.5px] xs:text-[11.5px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full border border-amber-300 mt-0.5 mb-1.5 shadow-xs z-20 relative">\n          For CBSE 6-8th Classes\n        </div>`;
code = code.replace(logoRegex, logoReplacement);

// 2. Increase mascot size
const mascotRegex = /w-\[125px\] xs:w-\[138px\] sm:w-\[145px\] h-\[148px\] xs:h-\[162px\] sm:h-\[172px\]/g;
const mascotReplacement = 'w-[160px] xs:w-[175px] sm:w-[190px] h-[190px] xs:h-[210px] sm:h-[230px]';
code = code.replace(mascotRegex, mascotReplacement);

// 3. Remove 'Why kids love HoshiYaar?' container, but keep WhatsApp
// The container starts at: {/* "Why kids love HoshiYaar?" Feature Card Container */}
// and ends after the WhatsApp button.
const fullBlockRegex = /\{\/\* "Why kids love HoshiYaar\?" Feature Card Container \*\/\}[\s\S]*?(<button\s+type="button"\s+onClick=\{handleWhatsAppClick\}[\s\S]*?<\/button>)\s*<\/div>/;
const replacement = `{/* WhatsApp Support Button at Bottom */}\n        <div className="w-full mt-4">\n          $1\n        </div>`;
code = code.replace(fullBlockRegex, replacement);

fs.writeFileSync(file, code);
console.log('Modifications applied');
