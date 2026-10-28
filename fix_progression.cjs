const fs = require('fs');
let content = fs.readFileSync('src/components/Learn/pages/LearnDashboard.jsx', 'utf8');

content = content.replace(
  /let status = isCompleted \? "completed" : "active";/g,
  (match, offset, str) => {
    if (offset < str.length / 2) {
      return let status = "locked";\nif (isCompleted) {\n  status = "completed";\n} else if (isPaywallLocked) {\n  status = "locked";\n} else if (index === firstIncompleteGlobal) {\n  status = "active";\n};
    } else {
      return let status = "locked";\nif (isCompleted) {\n  status = "completed";\n} else if (isPaywallLocked) {\n  status = "locked";\n} else if (index === firstIncompleteForUnit) {\n  status = "active";\n};
    }
  }
);

fs.writeFileSync('src/components/Learn/pages/LearnDashboard.jsx', content, 'utf8');
console.log('LearnDashboard progression restored.');
