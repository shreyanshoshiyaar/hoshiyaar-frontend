const https = require('https');
const data = JSON.stringify({ phone: '7021970672', password: 'Sb@12345678' });
const options = {
  hostname: 'api.hoshiyaar.info',
  port: 443,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};
const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('Login response:', body);
    const parsed = JSON.parse(body);
    const token = parsed.token;
    if (token) {
       console.log('User ClassLevel:', parsed.user.classLevel);
       const boardsOpts = {
         hostname: 'api.hoshiyaar.info',
         path: '/api/curriculum/boards', // Wait, what if we send ?classLevel=class_8
         method: 'GET',
         headers: { 'Authorization': 'Bearer ' + token }
       };
       const req2 = https.request(boardsOpts, res2 => {
         let body2 = '';
         res2.on('data', d => body2 += d);
         res2.on('end', () => console.log('Boards response:', body2));
       });
       req2.end();
    } else {
       console.log('No token received');
    }
  });
});
req.on('error', e => console.error(e));
req.write(data);
req.end();
