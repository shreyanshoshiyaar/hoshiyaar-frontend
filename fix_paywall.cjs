const fs = require('fs');
let content = fs.readFileSync('src/components/Learn/pages/LearnDashboard.jsx', 'utf8');

content = content.replace(
  /const isPaywallLocked = !isAdmin && !isSubscribed && !isPurchased && !isFreeLesson;/g,
  'const isPaywallLocked = false;'
);

content = content.replace(
  /<a href="\/subscription" className=\{lex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all/g,
  '<a href="/subscription" className={hidden flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all'
);

content = content.replace(
  /<a href="\/subscription" onClick=\{closeDrawer\} className=\{lex items-center gap-4 p-4 rounded-2xl font-bold transition-all/g,
  '<a href="/subscription" onClick={closeDrawer} className={hidden flex items-center gap-4 p-4 rounded-2xl font-bold transition-all'
);

content = content.replace(
  /setShowPaywallModal\(true\);/g,
  '/* setShowPaywallModal(true); bypassed */'
);

fs.writeFileSync('src/components/Learn/pages/LearnDashboard.jsx', content, 'utf8');
console.log('LearnDashboard fixed.');

let redirectContent = fs.readFileSync('src/components/Learn/pages/ModuleEntryRedirect.jsx', 'utf8');
redirectContent = redirectContent.replace(
  /if \(!isUserAdmin\(user\)\) \{\s*if \(!hasAccess\) \{\s*if \(!isMounted\) return;\s*setShowPaywall\(true\);\s*setAccessChecking\(false\);\s*return;\s*\}\s*\}/g,
  '/* paywall check bypassed */'
);
fs.writeFileSync('src/components/Learn/pages/ModuleEntryRedirect.jsx', redirectContent, 'utf8');
console.log('ModuleEntryRedirect fixed.');
