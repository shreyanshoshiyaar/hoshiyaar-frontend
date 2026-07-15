const { execSync } = require('child_process');
const fs = require('fs');

try {
  const content = execSync('git show HEAD:src/components/admin/AdminPanel.jsx', {
    cwd: 'd:\\hoshiyaar\\hoshiyaar\\Hoshiyaar-frontend-main',
    encoding: 'utf8'
  });
  fs.writeFileSync('d:\\hoshiyaar\\hoshiyaar\\Hoshiyaar-frontend-main\\src\\components\\admin\\AdminPanel.jsx', content);
  console.log('Successfully restored AdminPanel.jsx from git');
} catch (e) {
  console.error('Failed to restore:', e.message);
}
