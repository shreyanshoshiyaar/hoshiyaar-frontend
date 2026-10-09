const fs = require('fs');
const path = 'src/components/Learn/pages/LearnDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// Hide Mobile Drawer Pro Link
const mobileTarget = 'className={`flex items-center gap-4 py-3 px-4 rounded-xl text-lg font-bold transition-colors text-amber-600 hover:bg-amber-50`}';
content = content.replace(mobileTarget, 'className="hidden"');

// Hide Desktop Sidebar Pro Link
const desktopTarget = "className={`flex items-center gap-3 py-2 px-3.5 rounded-xl text-base font-bold transition-colors ${activeTab === 'subscription' ? 'bg-[#2563EB] text-white shadow-md' : 'text-amber-600 hover:bg-amber-50'}`}";
content = content.replace(desktopTarget, 'className="hidden"');

fs.writeFileSync(path, content, 'utf8');
console.log('Links successfully hidden.');
