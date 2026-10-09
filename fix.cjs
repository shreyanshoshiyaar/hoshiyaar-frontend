const fs = require('fs');
const path = 'src/components/Learn/pages/LearnDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace('className={`hidden`}}', 'className="hidden"');
fs.writeFileSync(path, content, 'utf8');
