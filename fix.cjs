const fs = require('fs');
let content = fs.readFileSync('src/components/Learn/pages/LessonComplete.jsx', 'utf8');

const regex = /for \(const qid of unique\) \{[\s\S]*?saveIncorrect[\s\S]*?\}/m;
content = content.replace(regex, "await Promise.all(unique.map(qid => userId ? reviewSvc.saveIncorrect({ userId, questionId: qid, moduleId: String(moduleNumber) }) : Promise.resolve()));");

fs.writeFileSync('src/components/Learn/pages/LessonComplete.jsx', content, 'utf8');
console.log('Fixed LessonComplete.jsx via script');
