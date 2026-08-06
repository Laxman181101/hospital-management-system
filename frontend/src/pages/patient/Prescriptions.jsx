import React, { useState, useEffect } from 'react';
import { Pill, User, Clock, FileText, Download } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const { addToast } = useToast();

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/prescriptions/patient/me');
      setPrescriptions(res.data.data || []);
    } catch (err) {
      addToast('error', 'Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const columns = [
    {
      header: 'Date',
      key: 'date',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800">{new Date(row.date || row.createdAt).toLocaleDateString()}</div>
          <div className="text-sm text-slate-500">{new Date(row.date || row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      )
    },
    {
      header: 'Doctor',
      key: 'doctorName',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
            {(row.doctorName || row.doctor?.name)?.charAt(0) || 'D'}
          </div>
          <span className="font-medium text-slate-900">{row.doctorName || row.doctor?.name}</span>
        </div>
      )
    },
    {
      header: 'Medicines',
      key: 'medicines',
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.medicines?.length || 0} prescribed
        </span>
      )
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => (
        <Button 
          variant="outline" 
          className="text-xs py-1.5 px-3"
          onClick={() => setSelectedPrescription(row)}
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Prescriptions</h1>
        <p className="text-sm text-slate-500 mt-1">View your past prescriptions and medication instructions.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className={`transition-all duration-300 ${selectedPrescription ? 'lg:w-1/2' : 'w-full'}`}>
          <div className="h-[600px]">
            <DataTable 
              columns={columns} 
              data={prescriptions} 
              loading={loading}
              keyField="_id"
              emptyIcon={Pill}
              emptyTitle="No prescriptions found"
              emptyDescription="You don't have any prescriptions on record yet."
            />
          </div>
        </div>

        {selectedPrescription && (
          <div className="lg:w-1/2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
              <div className="bg-indigo-600 p-6 text-white flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-1">Prescription Details</h3>
                  <div className="flex items-center gap-4 text-indigo-100 text-sm">
                    <span className="flex items-center gap-1"><Clock size={14} /> {new Date(selectedPrescription.date || selectedPrescription.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><User size={14} /> {selectedPrescription.doctorName || selectedPrescription.doctor?.name}</span>
                  </div>
                </div>
                <button className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors" title="Download PDF (Mock)">
                  <Download size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Prescribed Medicines</h4>
                  {selectedPrescription.medicines?.length > 0 ? (
                    <div className="space-y-4">
                      {selectedPrescription.medicines.map((med, idx) => (
                        <div key={idx} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                            <Pill size={20} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{med.name}</div>
                            <div className="text-sm text-slate-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                              <span><strong className="text-slate-700">Dosage:</strong> {med.dosage}</span>
                              <span><strong className="text-slate-700">Frequency:</strong> {med.frequency}</span>
                              <span><strong className="text-slate-700">Duration:</strong> {med.duration}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No specific medicines listed.</p>
                  )}
                </div>

                {(selectedPrescription.instructions || selectedPrescription.generalInstructions) && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <FileText size={16} /> Doctor's Instructions
                    </h4>
                    <p className="text-sm text-slate-700 bg-yellow-50 p-4 rounded-xl border border-yellow-100 whitespace-pre-line">
                      {selectedPrescription.instructions || selectedPrescription.generalInstructions}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end pt-4">
                  <Button variant="outline" onClick={() => setSelectedPrescription(null)}>
                    Close Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Prescriptions;
