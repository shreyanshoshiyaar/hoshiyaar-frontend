const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'McqPage.jsx',
  'FillupsPage.jsx',
  'RearrangePage.jsx',
  'DescriptivePage.jsx',
  '../pages/ConceptPage.jsx'
];

const basePath = path.join(__dirname, 'src', 'components', 'Learn', 'quiz');

filesToUpdate.forEach(file => {
  const filePath = path.join(basePath, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file}, not found`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace undoActive fallback
  content = content.replace(
    /navigate\('\/learn\?go=dashboard'\);/g,
    `navigate(isRevisionModeFromUrl ? '/revision' : '/learn?go=dashboard');`
  );

  // Replace onQuit and handleBack final fallback
  content = content.replace(
    /navigate\(\`\/learn\$\{query \? '\?' \+ query : ''\}\`\);/g,
    `navigate(isRevisionModeFromUrl ? \`/revision\${query ? '?' + query : ''}\` : \`/learn\${query ? '?' + query : ''}\`);`
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`No changes needed in ${file}`);
  }
});
