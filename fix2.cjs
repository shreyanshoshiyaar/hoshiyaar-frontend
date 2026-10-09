const fs = require('fs');
const path = 'src/components/Learn/pages/LearnDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// Use string literals to avoid escape issues
content = content.replace("className={`hidden`}}", 'className="hidden"');

fs.writeFileSync(path, content, 'utf8');
