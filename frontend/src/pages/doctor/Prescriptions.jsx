import React, { useState, useEffect } from 'react';
import { Pill, Plus, X, Search, FileText, Download } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const DoctorPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  
  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/prescriptions');
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
      header: 'Prescription ID',
      key: 'prescriptionId',
      render: (row) => <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">#{row._id.substring(row._id.length - 8).toUpperCase()}</span>
    },
    {
      header: 'Patient Info',
      key: 'patient',
      render: (row) => {
        const patientName = row.patient?.name || `${row.patient?.firstName || ''} ${row.patient?.lastName || ''}`.trim() || 'Unknown';
        const initial = patientName.charAt(0).toUpperCase() || 'P';
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold uppercase shadow-sm border border-blue-100">
              {initial}
            </div>
            <div>
              <div className="font-bold text-slate-900">{patientName}</div>
              <div className="text-xs text-slate-500">Rx Record</div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Date & Time',
      key: 'createdAt',
      render: (row) => {
        const d = new Date(row.createdAt);
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-800">
              {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-xs text-slate-500 mt-0.5">
              {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Medicines',
      key: 'medicines',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
          {row.medicines?.slice(0, 2).map((med, idx) => (
            <span key={idx} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full text-xs font-medium">{med.name}</span>
          ))}
          {row.medicines?.length > 2 && (
            <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-xs font-medium">+{row.medicines.length - 2} more</span>
          )}
        </div>
      )
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => (
        <Button 
          size="sm" 
          variant="outline" 
          className="flex items-center gap-1"
          onClick={() => {
            if (row.pdfPath) {
              window.open(`http://localhost:5000${row.pdfPath}`, '_blank');
            } else {
              alert('PDF not available for this prescription.');
            }
          }}
        >
          <Download size={14} className="mr-1" /> Download PDF
        </Button>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prescription History</h1>
          <p className="text-sm text-slate-500 mt-1">Review all digital prescriptions and clinical instructions.</p>
        </div>
      </div>

      <div className="h-[600px]">
        <DataTable 
          columns={columns} 
          data={prescriptions} 
          loading={loading}
          emptyIcon={Pill}
          emptyTitle="No prescriptions found"
        />
      </div>
    </div>
  );
};

export default DoctorPrescriptions;
