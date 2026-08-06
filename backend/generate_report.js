const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ margin: 50 });
const outputPath = path.join(__dirname, 'Developer_Summary_Report.pdf');
const writeStream = fs.createWriteStream(outputPath);

doc.pipe(writeStream);

// Title
doc.fontSize(20).font('Helvetica-Bold').text('Developer Contribution Summary Report', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(14).font('Helvetica').text('Hospital Management System (HMS) Backend', { align: 'center' });
doc.moveDown(2);

// Introduction
doc.fontSize(12).font('Helvetica').text('This report outlines the core modules and key features developed for the Hospital Management System (HMS) backend.', { align: 'justify' });
doc.moveDown(1.5);

// Module 1
doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text('1. Authentication & Security Module (auth)');
doc.fontSize(12).font('Helvetica').fillColor('black').text('Role: System foundation for security and access control.');
doc.moveDown(0.5);
doc.list([
    'JWT Authentication: Implemented secure token-based login and token refreshing.',
    'Role-Based Access Control (RBAC): Middleware for role separation (super_admin, hospital_admin, doctor, patient, billing_admin).',
    'Multi-Tenancy Support: Data isolation using hospitalId to run multiple hospitals on one system.'
]);
doc.moveDown(1);

// Module 2
doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text('2. Billing & Invoicing Module (billing)');
doc.fontSize(12).font('Helvetica').fillColor('black').text('Role: Handles hospital revenue and patient payment flow.');
doc.moveDown(0.5);
doc.list([
    'Dynamic Calculations: Auto-calculates total amount, discount, tax/GST, and payableAmount.',
    'PDF Invoice Generation: On-the-fly professional PDF receipt generation using pdfkit.',
    'Smart Search Logic: Regex-based patient name search for quick billing.',
    'Cross-Module Sync: Automatically updates Appointment status when a bill is marked as paid.'
]);
doc.moveDown(1);

// Module 3
doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text('3. Financial & Payroll Module (finance)');
doc.fontSize(12).font('Helvetica').fillColor('black').text('Role: Tracks overall hospital income and expenses.');
doc.moveDown(0.5);
doc.list([
    'Expense Management: Tracks utility bills, equipment maintenance, and general expenses.',
    'Payroll System: Flow for staff salary, bonuses, and deductions.',
    'Profitability Tracking: Aggregates data to show net profitability of the hospital.'
]);
doc.moveDown(1);

// Module 4
doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text('4. Doctor Management Module (doctor)');
doc.fontSize(12).font('Helvetica').fillColor('black').text('Role: Digitizes doctor working details.');
doc.moveDown(0.5);
doc.list([
    'Profile Management: Manages qualifications, specialization, and experience.',
    'Availability & Fees: APIs to set working schedules and consultation fees.'
]);
doc.moveDown(1);

// Module 5
doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text('5. Consultation Module (consultation)');
doc.fontSize(12).font('Helvetica').fillColor('black').text('Role: Digital record of doctor-patient checkups.');
doc.moveDown(0.5);
doc.list([
    'Clinical Records: Securely saves and fetches diagnosis, symptoms, and medical notes.'
]);
doc.moveDown(1);

// Module 6
doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text('6. Video Consultation Module (video-consultation)');
doc.fontSize(12).font('Helvetica').fillColor('black').text('Role: Enables telemedicine and remote health services.');
doc.moveDown(0.5);
doc.list([
    'Meeting Link Generation: Dynamically generates unique video meeting links (e.g., Jitsi/WebRTC) for online appointments.'
]);
doc.moveDown(1);

// Module 7
doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text('7. Laboratory Module (laboratory)');
doc.fontSize(12).font('Helvetica').fillColor('black').text('Role: Pathology and test reports management.');
doc.moveDown(0.5);
doc.list([
    'Lab Requests Tracking: Tracks test status (Pending, Completed).',
    'Report Uploading: Uploads final test PDFs and links them to patient profiles.'
]);
doc.moveDown(1);

// Module 8
doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text('8. Ward Management Module (ward)');
doc.fontSize(12).font('Helvetica').fillColor('black').text('Role: Hospital capacity and rooms management.');
doc.moveDown(0.5);
doc.list([
    'Bed Availability Tracking: Real-time availability check for different ward types (ICU, General).'
]);
doc.moveDown(1);

// Module 9
doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text('9. Inventory Management Module (inventory)');
doc.fontSize(12).font('Helvetica').fillColor('black').text('Role: Tracks hospital medical and general stock.');
doc.moveDown(0.5);
doc.list([
    'Stock Tracking: Tracks current quantity of equipment and daily items.',
    'Supply Chain: Adds new items and deducts stock upon usage.'
]);
doc.moveDown(2);

// Summary
doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text('Key Architecture Highlights');
doc.moveDown(0.5);
doc.fontSize(12).font('Helvetica-Oblique').fillColor('black').text('"Implemented a Micro-service oriented approach. All 9 modules are loosely coupled but perfectly synchronized (e.g., Billing updates Appointment and Finance). Leveraged advanced Node.js capabilities including strict RBAC for security and dynamic PDF generation for user experience."');

doc.end();

writeStream.on('finish', () => {
    console.log('PDF Generated Successfully at: ' + outputPath);
});
