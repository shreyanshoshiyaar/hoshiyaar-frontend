const fs = require('fs');
const path = 'src/components/Learn/pages/LearnDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

const regexGlobal = /let status = "locked";\s*if \(isCompleted\) \{\s*status = "completed";\s*\} else if \(isPaywallLocked\) \{\s*status = "locked";\s*\} else if \(index === firstIncompleteGlobal\) \{\s*status = "active";\s*\}/g;
const regexUnit = /let status = "locked";\s*if \(isCompleted\) \{\s*status = "completed";\s*\} else if \(isPaywallLocked\) \{\s*status = "locked";\s*\} else if \(index === firstIncompleteForUnit\) \{\s*status = "active";\s*\}/g;

content = content.replace(regexGlobal, 'let status = isCompleted ? "completed" : "active";');
content = content.replace(regexUnit, 'let status = isCompleted ? "completed" : "active";');

fs.writeFileSync(path, content, 'utf8');
console.log('Unlocking done');
