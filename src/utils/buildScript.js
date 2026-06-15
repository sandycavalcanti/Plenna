const fs = require('fs');

const filePath = './src/constants/config.js';

let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'devMode = true',
  'devMode = false'
);

fs.writeFileSync(filePath, content);