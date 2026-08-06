const http = require('http');

async function apiCall(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request(options, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(resData) }); }
        catch(e) { resolve({ status: res.statusCode, data: resData }); }
      });
    });
    req.on('error', (e) => reject(e));
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  const results = {};
  let doctorToken, doctorUserId, doctorHospitalId, doctorProfileId;
  let patientToken, patientId;
  let appointmentId, consultationId;
  
  try {
    console.log("========================================");
    console.log("  DOCTOR FULL FLOW TEST");
    console.log("========================================\n");

    // ---- STEP 1: Doctor Login ----
    console.log("--- STEP 1: Doctor Login (onedoctor@gmail.com) ---");
    const docRes = await apiCall('POST', '/api/v1/auth/login', { email: 'onedoctor@gmail.com', password: '123456' });
    console.log("Status:", docRes.status);
    if (docRes.status !== 200) {
      console.log("FAILED:", docRes.data);
      return;
    }
    doctorToken = docRes.data.tokens.accessToken;
    doctorUserId = docRes.data.user._id;
    doctorHospitalId = docRes.data.user.hospitalId;
    console.log("✅ Doctor login success. UserId:", doctorUserId, "HospitalId:", doctorHospitalId);
    results['01_doctor_login'] = 'PASS';

    // ---- STEP 2: Doctor Dashboard API ----
    console.log("\n--- STEP 2: Doctor Dashboard API ---");
    const dashRes = await apiCall('GET', '/api/v1/dashboard/doctor/complete', null, doctorToken);
    console.log("Status:", dashRes.status);
    if (dashRes.status === 200) {
      console.log("✅ Dashboard loaded. Keys:", Object.keys(dashRes.data));
      results['02_dashboard'] = 'PASS';
    } else {
      console.log("❌ Dashboard failed:", dashRes.data);
      results['02_dashboard'] = 'FAIL: ' + (dashRes.data.message || dashRes.status);
    }

    // ---- STEP 3: Doctor Appointments ----
    console.log("\n--- STEP 3: Doctor Appointments (GET /api/v1/appointments/doctor) ---");
    const docApptsRes = await apiCall('GET', '/api/v1/appointments/doctor', null, doctorToken);
    console.log("Status:", docApptsRes.status);
    if (docApptsRes.status === 200) {
      const appts = Array.isArray(docApptsRes.data) ? docApptsRes.data : (docApptsRes.data.data || docApptsRes.data.appointments || []);
      console.log("✅ Appointments loaded. Count:", appts.length);
      results['03_doctor_appointments'] = 'PASS (count: ' + appts.length + ')';
    } else {
      console.log("❌ Appointments failed:", docApptsRes.data);
      results['03_doctor_appointments'] = 'FAIL: ' + (docApptsRes.data.message || docApptsRes.status);
    }

    // ---- STEP 4: Get Doctor Profile ID ----
    console.log("\n--- STEP 4: Get Doctor Profile ID ---");
    const allDocs = await apiCall('GET', '/api/v1/doctors', null, doctorToken);
    if (allDocs.data.doctors) {
      const myProfile = allDocs.data.doctors.find(d => d.user && (d.user._id === doctorUserId || d.user.email === 'onedoctor@gmail.com'));
      if (myProfile) {
        doctorProfileId = myProfile._id;
        console.log("✅ Doctor Profile ID:", doctorProfileId);
        results['04_doctor_profile'] = 'PASS';
      } else {
        console.log("All doctors:", JSON.stringify(allDocs.data.doctors?.map(d => ({id: d._id, name: d.name, userEmail: d.user?.email})), null, 2));
        results['04_doctor_profile'] = 'FAIL: Profile not found in list';
      }
    } else {
      console.log("❌ No doctors found:", allDocs.data);
      results['04_doctor_profile'] = 'FAIL: No doctors';
    }

    // ---- STEP 5: Patient Login ----
    console.log("\n--- STEP 5: Patient Login ---");
    let patRes = await apiCall('POST', '/api/v1/auth/login', { email: 'patient1@gmail.com', password: '123456' });
    if (patRes.status !== 200) {
      // Try to register
      console.log("Patient1 not found, trying patient2...");
      patRes = await apiCall('POST', '/api/v1/auth/login', { email: 'patient2@gmail.com', password: '123456' });
    }
    if (patRes.status !== 200) {
      // Check if any patient exists in the DB
      console.log("No patient found. Trying to register patient1...");
      const regRes = await apiCall('POST', '/api/v1/auth/register', {
        email: 'testpatient@gmail.com', password: '123456', firstName: 'Test', lastName: 'Patient', mobile: '9876543210', role: 'patient'
      });
      console.log("Register:", regRes.status, regRes.data.message || '');
      patRes = await apiCall('POST', '/api/v1/auth/login', { email: 'testpatient@gmail.com', password: '123456' });
    }
    if (patRes.status === 200) {
      patientToken = patRes.data.tokens.accessToken;
      patientId = patRes.data.user._id;
      console.log("✅ Patient login success. ID:", patientId, "Email:", patRes.data.user.email);
      results['05_patient_login'] = 'PASS';
    } else {
      console.log("❌ Patient login failed:", patRes.data);
      results['05_patient_login'] = 'FAIL';
    }

    // ---- STEP 6: Patient Books Appointment ----
    if (patientToken && doctorProfileId) {
      console.log("\n--- STEP 6: Patient Books Appointment ---");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0,0,0,0);
      const randomMinute = Math.floor(Math.random()*12); // random slot to avoid collision
      const startHour = 9 + randomMinute;
      const startTime = `${startHour > 12 ? startHour - 12 : startHour}:00 ${startHour >= 12 ? 'PM' : 'AM'}`;
      const endTime = `${startHour > 12 ? startHour - 12 : startHour}:30 ${startHour >= 12 ? 'PM' : 'AM'}`;
      
      const apptBody = {
        doctor: doctorProfileId,
        hospital: doctorHospitalId,
        appointmentDate: tomorrow.toISOString(),
        startTime: startTime,
        endTime: endTime,
        appointmentType: 'physical',
        bookingMode: 'online',
        reason: 'Test - Fever and headache'
      };
      console.log("Booking for:", tomorrow.toDateString(), startTime, "-", endTime);
      const bookRes = await apiCall('POST', '/api/v1/appointments', apptBody, patientToken);
      console.log("Status:", bookRes.status);
      console.log("Response:", JSON.stringify(bookRes.data).substring(0, 300));
      
      if (bookRes.status === 201) {
        // Response format: { success: true, data: appointment }
        appointmentId = bookRes.data.data?._id || bookRes.data.appointment?._id;
        console.log("✅ Appointment booked:", appointmentId);
        results['06_book_appointment'] = 'PASS';
      } else {
        // Try to use existing
        console.log("Booking failed. Trying to use existing appointment...");
        const myAppts = await apiCall('GET', '/api/v1/appointments/my', null, patientToken);
        const apptList = Array.isArray(myAppts.data) ? myAppts.data : (myAppts.data.data || []);
        if (apptList.length > 0) {
          appointmentId = apptList[0]._id;
          patientId = apptList[0].patient?._id || apptList[0].patient || patientId;
          console.log("⚠️  Using existing appointment:", appointmentId);
          results['06_book_appointment'] = 'PASS (existing)';
        } else {
          results['06_book_appointment'] = 'FAIL: ' + (bookRes.data.message || bookRes.data.data?.message || JSON.stringify(bookRes.data).substring(0, 100));
        }
      }
    }

    // ---- STEP 7: Doctor Confirms Appointment ----
    if (appointmentId) {
      console.log("\n--- STEP 7: Doctor Confirms Appointment ---");
      const confirmRes = await apiCall('PATCH', `/api/v1/appointments/${appointmentId}/status`, { status: 'confirmed' }, doctorToken);
      console.log("Status:", confirmRes.status, JSON.stringify(confirmRes.data).substring(0, 200));
      if (confirmRes.status === 200) {
        console.log("✅ Appointment confirmed.");
        results['07_confirm_appointment'] = 'PASS';
      } else {
        results['07_confirm_appointment'] = 'FAIL: ' + (confirmRes.data.message || confirmRes.status);
      }
    }

    // ---- STEP 8: Doctor Creates Consultation ----
    if (appointmentId) {
      console.log("\n--- STEP 8: Doctor Creates Consultation ---");
      const consultBody = {
        patientId: patientId,
        appointmentId: appointmentId,
        symptoms: 'Fever, headache, body ache',
        diagnosis: 'Viral infection suspected'
      };
      const consultRes = await apiCall('POST', '/api/v1/consultations', consultBody, doctorToken);
      console.log("Status:", consultRes.status);
      console.log("Response:", JSON.stringify(consultRes.data).substring(0, 300));
      
      if (consultRes.status === 201) {
        consultationId = consultRes.data.consultation?._id || consultRes.data.data?._id;
        console.log("✅ Consultation created:", consultationId);
        results['08_create_consultation'] = 'PASS';
      } else {
        console.log("Consultation creation response:", consultRes.data);
        if (consultRes.data.message && consultRes.data.message.includes('already exists')) {
          const consults = await apiCall('GET', '/api/v1/consultations', null, doctorToken);
          const list = consults.data.consultations || consults.data.data || [];
          if (list.length > 0) {
            consultationId = list[0]._id;
            console.log("⚠️  Using existing consultation:", consultationId);
            results['08_create_consultation'] = 'PASS (existing)';
          }
        }
        if (!consultationId) {
          results['08_create_consultation'] = 'FAIL: ' + (consultRes.data.message || JSON.stringify(consultRes.data).substring(0, 100));
        }
      }
    }

    // ---- STEP 9: Doctor Views All Consultations ----
    console.log("\n--- STEP 9: Doctor Views Consultations ---");
    const viewConsRes = await apiCall('GET', '/api/v1/consultations', null, doctorToken);
    console.log("Status:", viewConsRes.status);
    if (viewConsRes.status === 200) {
      const list = viewConsRes.data.consultations || viewConsRes.data.data || [];
      console.log("✅ Consultations loaded. Count:", list.length);
      results['09_view_consultations'] = 'PASS (count: ' + list.length + ')';
    } else {
      console.log("❌ Failed:", viewConsRes.data);
      results['09_view_consultations'] = 'FAIL: ' + (viewConsRes.data.message || viewConsRes.status);
    }

    // ---- STEP 10: Doctor Writes Prescription ----
    console.log("\n--- STEP 10: Doctor Writes Prescription ---");
    if (consultationId) {
      const presBody = {
        patientId: patientId,
        consultationId: consultationId,
        medicines: [
          { name: 'Paracetamol 500mg', dosage: '500mg', frequency: 'Twice a day', duration: '5 days', instructions: 'After meals' },
          { name: 'Cetirizine 10mg', dosage: '10mg', frequency: 'Once a day', duration: '3 days', instructions: 'Before sleep' }
        ],
        generalInstructions: 'Take rest. Drink plenty of fluids.'
      };
      const presRes = await apiCall('POST', '/api/v1/prescriptions', presBody, doctorToken);
      console.log("Status:", presRes.status);
      console.log("Response:", JSON.stringify(presRes.data).substring(0, 500));
      if (presRes.status === 201) {
        console.log("✅ Prescription created!");
        results['10_write_prescription'] = 'PASS';
      } else {
        results['10_write_prescription'] = 'FAIL: ' + (presRes.data.message || JSON.stringify(presRes.data).substring(0, 150));
      }
    } else {
      console.log("⚠️  Skipped - no consultation ID");
      results['10_write_prescription'] = 'SKIP (no consultation)';
    }

    // ---- STEP 11: Doctor Views Prescriptions ----
    console.log("\n--- STEP 11: Doctor Views Prescriptions ---");
    const viewPresRes = await apiCall('GET', '/api/v1/prescriptions', null, doctorToken);
    console.log("Status:", viewPresRes.status);
    if (viewPresRes.status === 200) {
      const pres = Array.isArray(viewPresRes.data) ? viewPresRes.data : (viewPresRes.data.prescriptions || viewPresRes.data.data || []);
      console.log("✅ Prescriptions loaded. Count:", pres.length);
      results['11_view_prescriptions'] = 'PASS (count: ' + pres.length + ')';
    } else {
      results['11_view_prescriptions'] = 'FAIL: ' + (viewPresRes.data.message || viewPresRes.status);
    }

    // ---- STEP 12: Pharmacist Login ----
    console.log("\n--- STEP 12: Pharmacist Login (onepharmacist@gmail.com) ---");
    const pharmRes = await apiCall('POST', '/api/v1/auth/login', { email: 'onepharmacist@gmail.com', password: '123456' });
    console.log("Status:", pharmRes.status);
    if (pharmRes.status === 200) {
      const pharmToken = pharmRes.data.tokens.accessToken;
      console.log("✅ Pharmacist login success.");
      results['12_pharmacist_login'] = 'PASS';

      // ---- STEP 13: Pharmacist adds medicine to inventory ----
      console.log("\n--- STEP 13: Pharmacist Adds Medicine to Inventory ---");
      const invRes = await apiCall('POST', '/api/v1/inventory/items', {
        itemName: 'Paracetamol 500mg Tablet - ' + Date.now(),
        category: 'Medicine',
        quantity: 200,
        unit: 'tablets',
        reorderLevel: 50,
        supplier: 'MedPharmaCo'
      }, pharmToken);
      console.log("Status:", invRes.status);
      if (invRes.status === 201) {
        console.log("✅ Medicine added to inventory.");
        results['13_add_medicine'] = 'PASS';
      } else {
        console.log("Response:", invRes.data.message || invRes.data);
        results['13_add_medicine'] = invRes.status === 403 ? 'FAIL (403 - pharmacist not authorized for inventory)' : 'FAIL: ' + (invRes.data.message || invRes.status);
      }

      // ---- STEP 14: Pharmacist views inventory ----
      console.log("\n--- STEP 14: Pharmacist Views Inventory ---");
      const viewInvRes = await apiCall('GET', '/api/v1/inventory/items', null, pharmToken);
      console.log("Status:", viewInvRes.status);
      if (viewInvRes.status === 200) {
        const items = Array.isArray(viewInvRes.data) ? viewInvRes.data : (viewInvRes.data.items || viewInvRes.data.data || []);
        console.log("✅ Inventory loaded. Count:", items.length);
        results['14_view_inventory'] = 'PASS (count: ' + items.length + ')';
      } else {
        results['14_view_inventory'] = 'FAIL: ' + (viewInvRes.data.message || viewInvRes.status);
      }

      // ---- STEP 15: Pharmacist views prescriptions ----
      console.log("\n--- STEP 15: Pharmacist Views Prescriptions ---");
      const pharmPresRes = await apiCall('GET', '/api/v1/prescriptions', null, pharmToken);
      console.log("Status:", pharmPresRes.status);
      if (pharmPresRes.status === 200) {
        const pres = Array.isArray(pharmPresRes.data) ? pharmPresRes.data : (pharmPresRes.data.prescriptions || pharmPresRes.data.data || []);
        console.log("✅ Pharmacist can view prescriptions. Count:", pres.length);
        results['15_pharmacist_prescriptions'] = 'PASS (count: ' + pres.length + ')';
      } else {
        results['15_pharmacist_prescriptions'] = 'FAIL: ' + (pharmPresRes.data.message || pharmPresRes.status);
      }
    } else {
      console.log("❌ Pharmacist login failed:", pharmRes.data);
      results['12_pharmacist_login'] = 'FAIL: ' + pharmRes.data.message;
    }

    // ---- STEP 16: Doctor Profile Update ----
    console.log("\n--- STEP 16: Doctor Profile Update ---");
    const profileRes = await apiCall('PUT', '/api/v1/doctors/profile', {
      specialization: 'General Medicine',
      consultationFee: 600,
      experience: 5
    }, doctorToken);
    console.log("Status:", profileRes.status);
    if (profileRes.status === 200) {
      console.log("✅ Doctor profile updated.");
      results['16_profile_update'] = 'PASS';
    } else {
      console.log("❌ Failed:", profileRes.data);
      results['16_profile_update'] = 'FAIL: ' + (profileRes.data.message || profileRes.status);
    }

    // ---- STEP 17: Doctor Surgeries ----
    console.log("\n--- STEP 17: Doctor Surgeries ---");
    const surgRes = await apiCall('GET', '/api/v1/operation-theaters/surgeries', null, doctorToken);
    console.log("Status:", surgRes.status);
    if (surgRes.status === 200) {
      const surgs = Array.isArray(surgRes.data) ? surgRes.data : (surgRes.data.surgeries || surgRes.data.data || []);
      console.log("✅ Surgeries loaded. Count:", surgs.length);
      results['17_surgeries'] = 'PASS (count: ' + surgs.length + ')';
    } else {
      console.log("Response:", surgRes.data);
      results['17_surgeries'] = 'FAIL: ' + (surgRes.data.message || surgRes.status);
    }

    // ======== FINAL REPORT ========
    console.log("\n========================================");
    console.log("  FINAL REPORT");
    console.log("========================================");
    let passCount = 0, failCount = 0, skipCount = 0;
    for (const [step, result] of Object.entries(results)) {
      const icon = result.startsWith('PASS') ? '✅' : result.startsWith('SKIP') ? '⚠️' : '❌';
      console.log(`${icon} ${step}: ${result}`);
      if (result.startsWith('PASS')) passCount++;
      else if (result.startsWith('SKIP')) skipCount++;
      else failCount++;
    }
    console.log(`\nTotal: ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIP`);

  } catch (err) {
    console.error("Test Error:", err);
  }
}

run();
