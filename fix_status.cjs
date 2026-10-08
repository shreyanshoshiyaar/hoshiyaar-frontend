const fs = require('fs');
const file = 'src/components/Learn/pages/LearnDashboard.jsx';
let code = fs.readFileSync(file, 'utf8');

const regex1 = /let status = "locked";\s*if \(isAdmin\) \{\s*status = isCompleted \? "completed" : "active";\s*\} else if \(isPaywallLocked\) \{\s*status = "locked";\s*\} else \{\s*if \(isCompleted\) \{\s*status = "completed";\s*\} else if \(isPurchased \|\| index === firstIncompleteGlobal\) \{\s*status = "active";\s*\}\s*\}/g;
const replacement1 = `let status = "locked";
                                if (isCompleted) {
                                  status = "completed";
                                } else if (isPaywallLocked) {
                                  status = "locked";
                                } else if (index === firstIncompleteGlobal) {
                                  status = "active";
                                }`;
code = code.replace(regex1, replacement1);

const regex2 = /let status = "locked";\s*if \(isAdmin\) \{\s*status = isCompleted \? "completed" : "active";\s*\} else if \(isPaywallLocked\) \{\s*status = "locked";\s*\} else \{\s*if \(isCompleted\) \{\s*status = "completed";\s*\} else if \(isPurchased \|\| index === firstIncompleteForUnit\) \{\s*status = "active";\s*\}\s*\}/g;
const replacement2 = `let status = "locked";
                                       if (isCompleted) {
                                         status = "completed";
                                       } else if (isPaywallLocked) {
                                         status = "locked";
                                       } else if (index === firstIncompleteForUnit) {
                                         status = "active";
                                       }`;
code = code.replace(regex2, replacement2);

fs.writeFileSync(file, code);
console.log('Fixed status logic');
