const PDFDocument = require("pdfkit");
const fs = require("fs");

const generatePDF = (prescription, filePath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(20).text("PRESCRIPTION", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Patient ID: ${prescription.patientId}`);
    doc.text(`Doctor ID: ${prescription.doctorId}`);
    doc.text(`Date: ${new Date().toDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text("Medicines:");
    doc.moveDown();

    prescription.medicines.forEach((m, i) => {
      doc.fontSize(12).text(
        `${i + 1}. ${m.medicineName} | ${m.dosage} | ${m.frequency} | ${m.duration}`
      );
      doc.text(`Instruction: ${m.instruction || "N/A"}`);
      doc.moveDown();
    });

    doc.moveDown();
    doc.text(`Notes: ${prescription.notes || "None"}`);

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};

module.exports = { generatePDF };