const fs = require('fs');
const path = 'src/components/Learn/pages/LearnDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// The block we want to hide has this specific navigate call
const search1 = `navigate("/subscription");`;
const search2 = `navigate('/subscription');`;

// Let's replace the whole block by finding it explicitly
// We'll just change the text 'Pro' to 'Pro (Hidden)' and CSS class 'hidden'
content = content.replace(
  /className=\{(.*?text-amber-600.*?)hover:bg-amber-50.*?\}/g,
  'className={`hidden`}'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Links hidden safely.');
