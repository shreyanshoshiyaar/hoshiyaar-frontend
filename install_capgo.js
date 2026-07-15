const { execSync } = require('child_process');
try {
  console.log('Installing @capgo/capacitor-updater...');
  const output = execSync('npm install @capgo/capacitor-updater', { 
    cwd: 'D:/hoshiyaar/hoshiyaar/Hoshiyaar-frontend-main', 
    encoding: 'utf-8' 
  });
  console.log(output);
} catch (error) {
  console.error('Failed:', error.message);
  if (error.stdout) console.error('STDOUT:', error.stdout);
  if (error.stderr) console.error('STDERR:', error.stderr);
}
