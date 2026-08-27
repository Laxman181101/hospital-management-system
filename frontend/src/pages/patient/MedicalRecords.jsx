import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Download, UploadCloud, AlertCircle, File, Eye, X } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/ui/Badge';

const MedicalRecords = () => {
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('reports');
  const { addToast } = useToast();

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/patients/records/me');
      setRecords(res.data.data);
    } catch (err) {
      addToast('error', 'Failed to fetch medical records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !file) return addToast('error', 'Please provide a title and a file');
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('report', file);

    try {
      setUploading(true);
      await api.post('/api/v1/patients/reports/upload', formData);
      addToast('success', 'Report uploaded successfully');
      setTitle('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchRecords(); // Refresh the list
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  const reportColumns = [
    {
      header: 'Report Title',
      key: 'title',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <File size={20} />
          </div>
          <span className="font-medium text-slate-900">{row.title}</span>
        </div>
      )
    },
    {
      header: 'Uploaded On',
      key: 'uploadedAt',
      sortable: true,
      render: (row) => new Date(row.uploadedAt).toLocaleDateString()
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <a 
          href={row.filePath} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Eye size={14} /> View Document
        </a>
      )
    }
  ];

  const historyColumns = [
    {
      header: 'Condition',
      key: 'condition',
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-800">{row.condition}</span>
    },
    {
      header: 'Diagnosed Date',
      key: 'diagnosedDate',
      sortable: true,
      render: (row) => new Date(row.diagnosedDate).toLocaleDateString()
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (row) => <Badge status={row.status}>{row.status}</Badge>
    },
    {
      header: 'Notes',
      key: 'notes',
      render: (row) => <span className="text-sm text-slate-500 max-w-xs truncate block">{row.notes || '-'}</span>
    }
  ];

  const consultationColumns = [
    {
      header: 'Date',
      key: 'createdAt',
      sortable: true,
      render: (row) => new Date(row.createdAt).toLocaleDateString()
    },
    {
      header: 'Doctor',
      key: 'doctor.name',
      render: (row) => (
        <span className="font-medium text-slate-900">
          Dr. {row.doctor?.name || 'Unknown'}
        </span>
      )
    },
    {
      header: 'Diagnosis',
      key: 'diagnosis',
      render: (row) => <span className="text-slate-800 font-medium">{row.diagnosis || '-'}</span>
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => (
        <Button variant="outline" size="sm" className="text-xs" onClick={() => setSelectedConsultation(row)}>
          View Notes
        </Button>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Medical Records</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your health history and medical reports.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'reports' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Medical Reports
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Health History
            </button>
            <button 
              onClick={() => setActiveTab('consultations')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'consultations' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Consultation Notes
            </button>
          </div>

          <div className="h-[500px]">
            {activeTab === 'reports' && (
              <DataTable 
                columns={reportColumns}
                data={records?.reports || []}
                loading={loading}
                keyField="_id"
                emptyIcon={FileText}
                emptyTitle="No reports uploaded"
                emptyDescription="You don't have any medical reports yet. Upload one using the form."
              />
            )}
            {activeTab === 'history' && (
              <DataTable 
                columns={historyColumns}
                data={records?.medicalHistory || []}
                loading={loading}
                keyField="_id"
                emptyIcon={AlertCircle}
                emptyTitle="No health history"
                emptyDescription="No past medical conditions have been recorded for you."
              />
            )}
            {activeTab === 'consultations' && (
              <DataTable 
                columns={consultationColumns}
                data={records?.consultations || []}
                loading={loading}
                keyField="_id"
                emptyIcon={FileText}
                emptyTitle="No consultation records"
                emptyDescription="You haven't had any consultations recorded yet."
              />
            )}
          </div>
        </div>

        {/* Upload Form */}
        <div className="lg:w-96">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <UploadCloud className="text-indigo-600" />
              Upload New Report
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Document Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Blood Test Results"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Upload File (PDF, JPG, PNG)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600 justify-center mt-2">
                      <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                        <span>Upload a file</span>
                        <input 
                          type="file" 
                          className="sr-only" 
                          accept=".pdf,.jpg,.jpeg,.png"
                          ref={fileInputRef}
                          onChange={(e) => setFile(e.target.files[0])}
                          required
                        />
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {file ? file.name : "or drag and drop"}
                    </p>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full mt-4" isLoading={uploading} disabled={loading}>
                Upload Document
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* View Consultation Modal */}
      {selectedConsultation && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white shrink-0">
              <div>
                <h2 className="text-xl font-bold">Consultation Notes</h2>
                <p className="text-indigo-200 text-sm">{new Date(selectedConsultation.createdAt).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedConsultation(null)} className="p-2 text-white/80 hover:text-white rounded-full"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                  D
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Dr. {selectedConsultation.doctor?.name || selectedConsultation.doctor?.user?.firstName || 'Unknown'}</h3>
                  <p className="text-sm text-slate-500">{selectedConsultation.doctor?.specialization}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Symptoms & Complaints</h4>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedConsultation.symptoms || selectedConsultation.complaints || 'No symptoms recorded'}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Clinical Notes & Observations</h4>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedConsultation.clinicalNotes || selectedConsultation.observations || 'No clinical notes recorded'}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Diagnosis</h4>
                <p className="text-indigo-800 font-medium bg-indigo-50 p-3 rounded-lg border border-indigo-100">{selectedConsultation.diagnosis || 'No diagnosis recorded'}</p>
              </div>
              
              {selectedConsultation.followUpDate && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Follow Up</h4>
                  <p className="text-emerald-800 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <span className="font-bold mr-2">{new Date(selectedConsultation.followUpDate).toLocaleDateString()}</span> 
                    {selectedConsultation.followUpRecommendations && <span>- {selectedConsultation.followUpRecommendations}</span>}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end shrink-0">
              <Button variant="outline" onClick={() => setSelectedConsultation(null)}>Close</Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MedicalRecords;
