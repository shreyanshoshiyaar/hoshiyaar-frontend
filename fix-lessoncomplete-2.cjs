const fs = require('fs');
let content = fs.readFileSync('src/components/Learn/pages/LessonComplete.jsx', 'utf8');

content = content.replace(
  /await Promise\.all\(unique\.map/g,
  'Promise.all(unique.map'
);

fs.writeFileSync('src/components/Learn/pages/LessonComplete.jsx', content, 'utf8');
console.log('Optimized LessonComplete.jsx further');
