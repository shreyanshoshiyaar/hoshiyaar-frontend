const fs = require('fs');
const file = 'src/components/Learn/pages/LearnDashboard.jsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /\{isLocked \? \(\s*<LockIcon \/>\s*\) : isDifficult \? \(/;
const replacement = `{isPaywallLocked ? (\n              <LockIcon />\n            ) : isDifficult ? (`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync(file, code);
    console.log("Fixed LockIcon rendering");
} else {
    console.log("Regex didn't match");
}
