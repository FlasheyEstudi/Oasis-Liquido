const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

try {
  console.log('Copying static assets to standalone folder...');
  copyFolderSync(
    path.join(__dirname, '../.next/static'),
    path.join(__dirname, '../.next/standalone/.next/static')
  );
  
  console.log('Copying public folder to standalone folder...');
  copyFolderSync(
    path.join(__dirname, '../public'),
    path.join(__dirname, '../.next/standalone/public')
  );
  
  console.log('Assets copied successfully!');
} catch (error) {
  console.error('Error copying assets:', error);
  process.exit(1);
}
