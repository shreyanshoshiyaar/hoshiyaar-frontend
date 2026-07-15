const fs = require('fs');
const path = require('path');

const targetFile = 'D:/hoshiyaar/hoshiyaar/Hoshiyaar-frontend-main/src/components/games/CompassChallenge.jsx';

if (fs.existsSync(targetFile)) {
    fs.unlinkSync(targetFile);
    console.log('Successfully deleted CompassChallenge.jsx');
} else {
    console.log('File does not exist');
}
