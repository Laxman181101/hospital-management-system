const fs = require('fs');
const path = 'c:/Users/laxma/hms/frontend/src/pages/doctor/Appointments.jsx';
let code = fs.readFileSync(path, 'utf8');

const originalBlock = `        render: (row) => {
          const isVirtual = ['video', 'chat', 'audio'].includes(row.appointmentType);
          const isActive = row.status === 'pending' || row.status === 'confirmed';`;

const newBlock = `        render: (row) => {
          const isVirtual = ['video', 'chat', 'audio'].includes(row.appointmentType);
          const isActive = row.status === 'pending' || row.status === 'confirmed';
          const isConfirmed = row.status === 'confirmed';`;

code = code.replace(originalBlock, newBlock);

const originalButton1 = `              {isVirtual && isActive && (
                <Button
                  size="sm"
                  className={\`text-xs py-1 px-2.5 flex items-center gap-1 shadow-sm \${
                    row.appointmentType === 'video'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }\`}`;

const newButton1 = `              {isVirtual && isActive && (
                <Button
                  size="sm"
                  disabled={!isConfirmed}
                  title={!isConfirmed ? 'Waiting for receptionist confirmation' : (row.appointmentType === 'video' ? 'Start Call' : 'Chat')}
                  className={\`text-xs py-1 px-2.5 flex items-center gap-1 shadow-sm \${
                    !isConfirmed 
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70' 
                      : (row.appointmentType === 'video' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white')
                  }\`}`;

code = code.replace(originalButton1, newButton1);

const originalButton2 = `              {isActive && (
                <Button size="sm" onClick={() => handleStartConsultation(row)} className="bg-indigo-600 hover:bg-indigo-700 text-xs py-1.5 px-3.5 text-white font-semibold shadow-sm">
                  Consult
                </Button>
              )}`;

const newButton2 = `              {isActive && (
                <Button 
                  size="sm" 
                  disabled={!isConfirmed}
                  title={!isConfirmed ? 'Waiting for receptionist confirmation' : 'Consult Patient'}
                  onClick={() => handleStartConsultation(row)} 
                  className={\`text-xs py-1.5 px-3.5 font-semibold shadow-sm \${
                    !isConfirmed
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }\`}
                >
                  Consult
                </Button>
              )}`;

code = code.replace(originalButton2, newButton2);

fs.writeFileSync(path, code);
console.log('Done replacing buttons');
