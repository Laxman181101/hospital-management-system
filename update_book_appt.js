const fs = require('fs');
const path = 'c:/Users/laxma/hms/frontend/src/pages/patient/BookAppointment.jsx';
let code = fs.readFileSync(path, 'utf8');

// Update handleBook
const handleBookOriginal = `  const handleBook = async () => {
    if (!selectedHospital || !selectedDoctor || !selectedDate || !selectedSlot) {
      return addToast('error', 'Please fill all fields');
    }
    try {
      setLoading(true);
      await api.post('/api/v1/appointments', {
        hospital: selectedHospital._id,
        doctor: selectedDoctor._id,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        appointmentType,
        bookingMode: 'online',
        reason: reason || 'General checkup'
      });`;

const handleBookNew = `  const handleBook = async () => {
    let date = selectedDate;
    let slot = selectedSlot;
    
    if (appointmentType === 'chat') {
      const now = new Date();
      date = now.toISOString().split('T')[0];
      
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const modifier = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const startTime = \`\${String(hours).padStart(2, '0')}:\${minutes} \${modifier}\`;
      
      now.setMinutes(now.getMinutes() + 15);
      hours = now.getHours();
      const endMinutes = String(now.getMinutes()).padStart(2, '0');
      const endModifier = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const endTime = \`\${String(hours).padStart(2, '0')}:\${endMinutes} \${endModifier}\`;
      
      slot = { startTime, endTime };
    }

    if (!selectedHospital || !selectedDoctor || !date || !slot) {
      return addToast('error', 'Please fill all fields');
    }
    try {
      setLoading(true);
      await api.post('/api/v1/appointments', {
        hospital: selectedHospital._id,
        doctor: selectedDoctor._id,
        appointmentDate: date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        appointmentType,
        bookingMode: 'online',
        reason: reason || 'General checkup'
      });`;

code = code.replace(handleBookOriginal, handleBookNew);

// Update JSX layout for hiding date/slots when chat
const originalJsx = `<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>`;

const newJsx = `<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={appointmentType === 'chat' ? 'md:col-span-2 max-w-xl' : ''}>
                {appointmentType !== 'chat' && (
                  <>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
                    <input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </>
                )}
                `;

code = code.replace(originalJsx, newJsx);

// Note: Need to remove the original input date field since we wrapped it
const originalInput = `<label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
                <input 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />`;
code = code.replace(originalInput, '');

// Update right column visibility
const rightColOriginal = `<div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Available Slots</label>
                {!selectedDate ? (`;

const rightColNew = `{appointmentType !== 'chat' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Available Slots</label>
                {!selectedDate ? (`;

code = code.replace(rightColOriginal, rightColNew);

// Close the right column
const rightColCloseOriginal = `</>
                        );
                      })()
                    )}
                  </div>
                )}
              </div>
            </div>`;

const rightColCloseNew = `</>
                        );
                      })()
                    )}
                  </div>
                )}
              </div>
            )}
            </div>`;

code = code.replace(rightColCloseOriginal, rightColCloseNew);

// Update button disabled state
const btnOriginal = `<Button onClick={handleBook} isLoading={loading} disabled={!selectedDate || !selectedSlot}>
                Confirm Booking
              </Button>`;

const btnNew = `<Button onClick={handleBook} isLoading={loading} disabled={appointmentType !== 'chat' && (!selectedDate || !selectedSlot)}>
                Confirm Booking
              </Button>`;

code = code.replace(btnOriginal, btnNew);

fs.writeFileSync(path, code);
console.log('BookAppointment updated');
