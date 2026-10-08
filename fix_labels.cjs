const fs = require('fs');
const file = 'src/components/Learn/pages/LearnDashboard.jsx';
let code = fs.readFileSync(file, 'utf8');

const regex1 = /<span>\{mod\?\.title\s*\|\|\s*".*?"\}<\/span>(\s*)<\/div>/g;
const replacement1 = `<span>{mod?.title || "—"}</span>
$1  {!isAdmin && (
$1    <span className="text-[9.5px] md:text-[10.5px] font-extrabold tracking-wider uppercase opacity-80 border border-current rounded px-1.5 py-[1px] ml-1 flex-shrink-0">
$1      {isPurchased ? 'Unlocked' : isFreeLesson ? 'Free' : 'Paid'}
$1    </span>
$1  )}
$1</div>`;

if (regex1.test(code)) {
  code = code.replace(regex1, replacement1);
  fs.writeFileSync(file, code);
  console.log('Labels updated!');
} else {
  console.log('Regex did not match!');
}
