const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function login(email, password) {
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
    return res.data.tokens.accessToken;
  } catch (err) {
    console.error(`Login failed for ${email}:`, err.response?.data || err.message);
    return null;
  }
}

async function checkEndpoint(name, url, token, method = 'GET') {
  try {
    const res = await axios({
      method,
      url: `${BASE_URL}${url}`,
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ ${name} [${res.status}]`);
    return { success: true, data: res.data };
  } catch (err) {
    console.error(`❌ ${name} failed: [${err.response?.status}]`, err.response?.data?.message || err.message);
    return { success: false, error: err.response?.data || err.message };
  }
}

async function runTests() {
  console.log('--- TESTING RECEPTIONIST FLOW ---');
  const recToken = await login('onereceptionist@gmail.com', '123456');
  if (recToken) {
    await checkEndpoint('Staff Dashboard Data', '/dashboard/staff', recToken);
    await checkEndpoint('Ward - Get Wards', '/ward/wards', recToken);
    await checkEndpoint('Ward - Get Admissions', '/ward/admissions', recToken);
    await checkEndpoint('Ward - Admission Requests', '/ward/admission-requests', recToken);
    await checkEndpoint('Billing - Invoices', '/billing', recToken);
  } else {
    console.log("Failed to login receptionist");
  }

  console.log('\n--- TESTING DOCTOR FLOW ---');
  const docToken = await login('onedoctor@gmail.com', '123456');
  if (docToken) {
    await checkEndpoint('Doctor Dashboard Complete', '/dashboard/doctor/complete', docToken);
    
    // Appointments require date param on doctor side
    const today = new Date().toISOString().split('T')[0];
    await checkEndpoint('Doctor Appointments', `/appointments/doctor?date=${today}`, docToken);
    
    await checkEndpoint('Patients List', '/patients', docToken);
  } else {
    console.log("Failed to login doctor");
  }
}

runTests();
