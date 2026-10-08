const fs = require('fs');
const file = 'src/components/Learn/pages/LearnDashboard.jsx';
let code = fs.readFileSync(file, 'utf8');

// Remove the !isAdmin bypass for progression
code = code.replace(/if \(status === 'locked' && !isAdmin\) \{/g, "if (status === 'locked') {");

// Allow PathNode to always capture clicks so it triggers the warning even when visually 'disabled'
code = code.replace(/onClick=\{disabled \? undefined : onClick\}/g, "onClick={onClick}");

fs.writeFileSync(file, code);
console.log('Fixed!');
