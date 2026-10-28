const fs = require('fs');
let content = fs.readFileSync('src/components/Learn/pages/LessonComplete.jsx', 'utf8');

const oldStr = `            for (const qid of unique) {
              if (!userId) break;
              await reviewSvc.saveIncorrect({ userId, questionId: qid, moduleId: String(moduleNumber) });
            }`;

const newStr = `            if (userId) {
              await Promise.all(unique.map(qid => reviewSvc.saveIncorrect({ userId, questionId: qid, moduleId: String(moduleNumber) }).catch(err => console.warn(err))));
            }`;

content = content.replace(oldStr, newStr);
fs.writeFileSync('src/components/Learn/pages/LessonComplete.jsx', content, 'utf8');
console.log('Fixed LessonComplete.jsx');
