const fs = require('fs');
let content = fs.readFileSync('src/components/features/ExamMode/ExamDashboard.jsx', 'utf8');

content = content.replace(
  /setShowPaywallModal\(true\);/g,
  '/* setShowPaywallModal(true); bypassed */'
);

fs.writeFileSync('src/components/features/ExamMode/ExamDashboard.jsx', content, 'utf8');
console.log('ExamDashboard fixed.');
