import fs from 'fs';
import https from 'https';
import path from 'path';

const imageUrl = 'https://res.cloudinary.com/dcxlzfyfp/image/upload/v1780577830/img-to-link/hcrzxapafswdy7xat2d4.jpg';
const resDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');

const mipmapFolders = [
  'mipmap-hdpi',
  'mipmap-mdpi',
  'mipmap-xhdpi',
  'mipmap-xxhdpi',
  'mipmap-xxxhdpi'
];

const fileNames = [
  'ic_launcher.webp',
  'ic_launcher_foreground.webp',
  'ic_launcher_round.webp'
];

https.get(imageUrl, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed to download image: ${res.statusCode}`);
    return;
  }

  const data = [];
  res.on('data', chunk => data.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(data);
    
    let successCount = 0;
    mipmapFolders.forEach(folder => {
      const folderPath = path.join(resDir, folder);
      if (fs.existsSync(folderPath)) {
        fileNames.forEach(fileName => {
          const filePath = path.join(folderPath, fileName);
          fs.writeFileSync(filePath, buffer);
          successCount++;
        });
      }
    });
    
    console.log(`Successfully updated ${successCount} Android app icon files!`);
  });
}).on('error', (err) => {
  console.error(`Error downloading image: ${err.message}`);
});
