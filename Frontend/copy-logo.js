const fs = require('fs');
const path = require('path');

const src = '/home/flashey/.gemini/antigravity/brain/aa878f83-35e7-417c-9662-1e42fefad09e/oasis_logo_1779668170265.png';
const dest1 = path.join(__dirname, 'public/oasis-logo.png');
const dest2 = path.join(__dirname, 'public/images/logo.png');

try {
  // Ensure target directories exist
  fs.mkdirSync(path.dirname(dest1), { recursive: true });
  fs.mkdirSync(path.dirname(dest2), { recursive: true });

  // Copy files
  fs.copyFileSync(src, dest1);
  console.log(`Successfully copied to ${dest1}`);
  
  fs.copyFileSync(src, dest2);
  console.log(`Successfully copied to ${dest2}`);
} catch (err) {
  console.error('Error during copy:', err);
  process.exit(1);
}
