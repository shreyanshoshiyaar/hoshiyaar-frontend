const fs = require('fs');
const file = 'src/components/Learn/pages/LearnDashboard.jsx';
let code = fs.readFileSync(file, 'utf8');

// Replace PAID with UNLOCKED in the chapter header
code = code.replace(/(<span[^>]*bg-\[\#10B981\][^>]*>[\s\S]*?<span>.*?<\/span>\s*)PAID(\s*<\/span>)/g, '$1UNLOCKED$2');

// Add glow to the tags
code = code.replace(/className="text-\[9\.5px\] md:text-\[10\.5px\] font-extrabold tracking-wider uppercase opacity-80 border border-current rounded px-1\.5 py-\[1px\] ml-1 flex-shrink-0"/g, 'className="text-[9.5px] md:text-[10.5px] font-extrabold tracking-wider uppercase opacity-90 border border-current rounded px-1.5 py-[1px] ml-1 flex-shrink-0 shadow-[0_0_8px_currentColor]"');

fs.writeFileSync(file, code);
console.log('Done!');
