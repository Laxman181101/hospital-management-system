const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a PDF receipt using pdfkit
 * @param {object} invoiceData 
 * @returns {Promise<string>} relative path of generated PDF
 */
const generateReceipt = async (invoiceData) => {
    return new Promise((resolve, reject) => {
        try {
            const receiptsDir = path.join(__dirname, '../../../receipts');
            if (!fs.existsSync(receiptsDir)) {
                fs.mkdirSync(receiptsDir, { recursive: true });
            }

            const fileName = `${invoiceData.invoiceNumber}.pdf`;
            const filePath = path.join(receiptsDir, fileName);
            // This is the relative URL path that gets stored in DB and served statically
            const relativePath = `/receipts/${fileName}`;

            const doc = new PDFDocument({ margin: 50 });
            const writeStream = fs.createWriteStream(filePath);

            doc.pipe(writeStream);

            // Brand Header - Hospital details
            doc.fillColor('#0F766E')
               .fontSize(20)
               .text(invoiceData.hospitalName || 'City Hospital', { align: 'center' })
               .fontSize(10)
               .fillColor('#4B5563')
               .text(invoiceData.hospitalAddress || '123 Main Street, Lucknow, UP', { align: 'center' })
               .text(`Phone: ${invoiceData.hospitalPhone || '+91-9999999999'}`, { align: 'center' })
               .moveDown(1.5);

            // Divider Line
            doc.strokeColor('#E5E7EB')
               .lineWidth(1)
               .moveTo(50, doc.y)
               .lineTo(562, doc.y)
               .stroke()
               .moveDown(1.5);

            // Title
            doc.fillColor('#111827')
               .fontSize(14)
               .text('PAYMENT RECEIPT / INVOICE', { align: 'center', underline: true })
               .moveDown(1.5);

            const startY = doc.y;

            // Invoice Metadata (Left Column)
            doc.fontSize(9).fillColor('#4B5563');
            doc.text('Invoice Number:', 50, startY);
            doc.fillColor('#111827').text(invoiceData.invoiceNumber, 150, startY);

            doc.fillColor('#4B5563').text('Issued Date:', 50, startY + 15);
            doc.fillColor('#111827').text(new Date(invoiceData.issuedAt).toLocaleString(), 150, startY + 15);

            doc.fillColor('#4B5563').text('Appointment Slot:', 50, startY + 30);
            doc.fillColor('#111827').text(invoiceData.appointmentSlot || 'N/A', 150, startY + 30);

            doc.fillColor('#4B5563').text('Appointment Date:', 50, startY + 45);
            doc.fillColor('#111827').text(invoiceData.appointmentDate ? new Date(invoiceData.appointmentDate).toLocaleDateString() : 'N/A', 150, startY + 45);

            // Patient & Doctor Information (Right Column)
            doc.fillColor('#4B5563').text('Patient Name:', 320, startY);
            doc.fillColor('#111827').text(invoiceData.patientName || 'N/A', 410, startY);

            doc.fillColor('#4B5563').text('Patient Mobile:', 320, startY + 15);
            doc.fillColor('#111827').text(invoiceData.patientMobile || 'N/A', 410, startY + 15);

            doc.fillColor('#4B5563').text('Doctor Name:', 320, startY + 30);
            doc.fillColor('#111827').text(invoiceData.doctorName || 'N/A', 410, startY + 30);

            doc.fillColor('#4B5563').text('Specialization:', 320, startY + 45);
            doc.fillColor('#111827').text(invoiceData.doctorSpecialization || 'N/A', 410, startY + 45);

            doc.y = startY + 70;

            // Billing Table Header
            doc.fillColor('#F3F4F6');
            doc.rect(50, doc.y, 512, 20).fill();

            doc.fillColor('#374151').fontSize(9);
            doc.text('Description', 60, doc.y + 5, { width: 220 });
            doc.text('Qty', 280, doc.y + 5, { width: 50, align: 'center' });
            doc.text('Unit Price', 340, doc.y + 5, { width: 100, align: 'right' });
            doc.text('Total', 450, doc.y + 5, { width: 100, align: 'right' });

            doc.y += 20;

            // Itemized rows
            doc.fillColor('#111827');
            const items = invoiceData.items || [];
            items.forEach((item) => {
                doc.text(item.description, 60, doc.y + 8, { width: 220 });
                doc.text(item.quantity.toString(), 280, doc.y + 8, { width: 50, align: 'center' });
                doc.text(`Rs. ${item.unitPrice}`, 340, doc.y + 8, { width: 100, align: 'right' });
                doc.text(`Rs. ${item.totalPrice}`, 450, doc.y + 8, { width: 100, align: 'right' });
                doc.y += 22;
            });

            // Divider Line below table
            doc.strokeColor('#F3F4F6')
               .lineWidth(1)
               .moveTo(50, doc.y)
               .lineTo(562, doc.y)
               .stroke()
               .moveDown(1);

            const totalsY = doc.y;

            // Payment Status Block
            doc.fillColor('#16A34A').fontSize(11).text('Payment Status: PAID', 50, totalsY + 10);
            
            // Totals Column
            doc.fontSize(9).fillColor('#4B5563');
            doc.text('Subtotal:', 320, totalsY + 10);
            doc.fillColor('#111827').text(`Rs. ${invoiceData.subtotal}`, 450, totalsY + 10, { align: 'right', width: 100 });

            doc.fillColor('#4B5563').text('Discount:', 320, totalsY + 25);
            doc.fillColor('#111827').text(`Rs. ${invoiceData.discount || 0}`, 450, totalsY + 25, { align: 'right', width: 100 });

            doc.fillColor('#4B5563').text('Tax (0%):', 320, totalsY + 40);
            doc.fillColor('#111827').text('Rs. 0', 450, totalsY + 40, { align: 'right', width: 100 });

            doc.fontSize(10).fillColor('#111827');
            doc.text('Grand Total:', 320, totalsY + 55);
            doc.text(`Rs. ${invoiceData.totalAmount}`, 450, totalsY + 55, { align: 'right', width: 100 });

            doc.y = totalsY + 80;

            // Razorpay payment tracking ID
            if (invoiceData.razorpayPaymentId) {
                doc.fontSize(8).fillColor('#9CA3AF')
                   .text(`Razorpay Payment ID: ${invoiceData.razorpayPaymentId}`, { align: 'center' });
            }

            doc.moveDown(1.5);
            doc.fontSize(10).fillColor('#0F766E')
               .text('Thank you for choosing our Hospital. Wish you good health!', { align: 'center' });

            doc.end();

            writeStream.on('finish', () => {
                resolve(relativePath);
            });

            writeStream.on('error', (err) => {
                reject(err);
            });
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = {
    generateReceipt
};
