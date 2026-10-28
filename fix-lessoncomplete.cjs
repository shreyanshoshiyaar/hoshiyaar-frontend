const fs = require('fs');
let content = fs.readFileSync('src/components/Learn/pages/LessonComplete.jsx', 'utf8');

content = content.replace(
  /for \(const qid of unique\) \{\s*if \(\!userId\) break;\s*await reviewSvc\.saveIncorrect\(\{ userId, questionId: qid, moduleId: String\(moduleNumber\) \}\);\s*\}/,
  wait Promise.all(unique.map(qid => 
              userId ? reviewSvc.saveIncorrect({ userId, questionId: qid, moduleId: String(moduleNumber) }) : Promise.resolve()
            ));
);

fs.writeFileSync('src/components/Learn/pages/LessonComplete.jsx', content, 'utf8');
console.log('Fixed LessonComplete.jsx parallelization');
