const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const fs = require('fs');

async function test() {
  try {
    console.log("Testing jsPDF in Node...");
    const doc = new jsPDF();
    doc.text("Hello Oasis", 10, 10);
    
    const tableData = [["Prod 1", "1", "$10.00"], ["Prod 2", "2", "$20.00"]];
    doc.autoTable({
      body: tableData,
      startY: 20
    });

    const buffer = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync('scratch/test-jspdf.pdf', buffer);
    console.log("PDF generated successfully: scratch/test-jspdf.pdf size:", buffer.length);
  } catch (e) {
    console.error("jsPDF failed:", e);
  }
}

test();
