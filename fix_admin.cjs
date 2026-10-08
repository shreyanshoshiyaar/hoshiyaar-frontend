const fs = require('fs');
const file = 'src/components/Learn/pages/LearnDashboard.jsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/if \(status === 'locked'\) \{/g, "if (status === 'locked' && !isAdmin) {");

fs.writeFileSync(file, code);
console.log('Fixed admin bypass');
