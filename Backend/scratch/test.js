const PDFDocument = require('pdfkit');
const fs = require('fs');

async function test() {
  return new Promise((resolve, reject) => {
    try {
      console.log('Generating simple PDF...');
      const doc = new PDFDocument();
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync('test.pdf', buffer);
        console.log('PDF saved! Size:', buffer.length);
        resolve();
      });
      doc.text('Hello Oasis');
      doc.end();
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });
}

test();
