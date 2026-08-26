import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, CheckCircle, XCircle, FileText, Pill, Printer, FileDown, Plus, Bed, Stethoscope, PackageCheck, Clock, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';

const PharmacistOrders = () => {
  const [activeTab, setActiveTab] = useState('prescriptions'); // 'prescriptions' | 'ipd' | 'orders'
  
  const [prescriptions, setPrescriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ipdRounds, setIpdRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Drawer/Modal states
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  
  // Fulfill Order form state
  const [inventory, setInventory] = useState([]);
  const [orderItems, setOrderItems] = useState([]); // { medicineId, medicineName, unitPrice, quantity, total }
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Print Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPrescriptions = async () => {
    try {
      const res = await api.get('/api/v1/prescriptions');
      setPrescriptions(res.data.data || []);
    } catch (err) {
      addToast('error', 'Failed to fetch incoming prescriptions');
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/api/v1/pharmacy/orders');
      setOrders(res.data.data || []);
    } catch (err) {
      addToast('error', 'Failed to fetch orders');
    }
  };

  const fetchIpdRounds = async () => {
    try {
      const res = await api.get('/api/v1/ward/ipd-rounds');
      setIpdRounds(res.data.data || []);
    } catch (err) {
      // silently fail — pharmacist may not always have IPD patients
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await api.get('/api/v1/pharmacy/medicines?inStock=true');
      setInventory(res.data.data || []);
    } catch (err) {
      addToast('error', 'Failed to fetch inventory');
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchPrescriptions(), fetchOrders(), fetchIpdRounds(), fetchInventory()]);
    setLoading(false);
  };


  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/api/v1/pharmacy/orders/${id}/status`, { status });
      addToast('success', `Order marked as ${status}`);
      if (selectedOrder && selectedOrder._id === id) {
        setSelectedOrder({ ...selectedOrder, status });
      }
      fetchOrders();
    } catch (err) {
      addToast('error', err.response?.data?.message || `Failed to mark order as ${status}`);
    }
  };

  const openViewDrawer = (order) => {
    setSelectedOrder(order);
    setIsViewDrawerOpen(true);
  };

  const openFulfillModal = (prescription) => {
    setSelectedPrescription(prescription);
    // Try to auto-map medicines based on name
    const meds = prescription.medicines || prescription.medications || [];
    const initialItems = meds.map(pm => {
      const matched = inventory.find(inv => 
        inv.name.toLowerCase().trim() === (pm.name || '').toLowerCase().trim()
      );
      const unitPrice = matched?.unitPrice || 0;
      const qty = parseInt(pm.duration) || 1;
      return { 
        _tempId: Math.random().toString(), 
        originalName: pm.name, 
        dosage: pm.dosage || pm.dose, 
        medicineId: matched?._id || '', 
        unitPrice: unitPrice, 
        quantity: qty, 
        total: unitPrice * qty 
      };
    });
    setOrderItems(initialItems.length > 0 ? initialItems : [{ _tempId: Math.random().toString(), originalName: '', medicineId: '', unitPrice: 0, quantity: 1, total: 0 }]);
    setIsFulfillModalOpen(true);
  };

  const openPrintModal = (order) => {
    setInvoiceOrder(order);
    setIsPrintModalOpen(true);
  };

  const handleInventorySelect = (index, medId) => {
    const med = inventory.find(m => m._id === medId);
    if (!med) return;
    
    const updated = [...orderItems];
    updated[index].medicineId = med._id;
    updated[index].unitPrice = med.unitPrice;
    updated[index].total = med.unitPrice * updated[index].quantity;
    setOrderItems(updated);
  };

  const handleQuantityChange = (index, qty) => {
    const q = parseInt(qty) || 1;
    const updated = [...orderItems];
    updated[index].quantity = q;
    updated[index].total = updated[index].unitPrice * q;
    setOrderItems(updated);
  };

  const addExtraItemRow = () => {
    setOrderItems([...orderItems, { _tempId: Math.random().toString(), originalName: '', medicineId: '', unitPrice: 0, quantity: 1, total: 0 }]);
  };

  const removeOrderItem = (index) => {
    const updated = [...orderItems];
    updated.splice(index, 1);
    setOrderItems(updated);
  };

  const isIpdRound = selectedPrescription && !!selectedPrescription.roundType;

  const submitOrder = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate
    const validItems = orderItems.filter(i => i.medicineId);
    if (validItems.length === 0) {
      addToast('error', 'Please select at least one medicine from inventory');
      return;
    }

    setIsSubmitting(true);
    try {
      const isIpd = isIpdRound;

      const payload = {
        patient: selectedPrescription.patient._id || selectedPrescription.patient,
        medicines: validItems.map(i => ({ medicine: i.medicineId, quantity: i.quantity })),
        status: 'Dispensed',
      };

      if (isIpd) {
        payload.ipdRound = selectedPrescription._id;
        payload.patientType = 'IPD';
        payload.paymentStatus = 'Unpaid';
        payload.paymentMethod = 'Cash'; 
      } else {
        payload.prescription = selectedPrescription._id;
        payload.patientType = 'OPD';
        payload.paymentStatus = 'Paid';
        payload.paymentMethod = paymentMethod;
      }

      const res = await api.post('/api/v1/pharmacy/orders', payload);
      addToast('success', isIpd ? 'Dawayein ward mein bhej di gayi aur bill mein add ho gayi! ✅' : 'Payment Collected & Medicines Dispensed Successfully! ✅');
      setIsFulfillModalOpen(false);
      loadData();
      
      if (!isIpd && res.data?.data) {
        // Seamlessly open standard Invoice Receipt Modal directly without raw browser popups!
        setInvoiceOrder(res.data.data);
        setIsPrintModalOpen(true);
      }
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to fulfill order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Filtering ---
  const filteredPrescriptions = prescriptions.filter(rx => {
    const pName = typeof rx.patient === 'object' ? (rx.patient?.name || rx.patient?.firstName + ' ' + rx.patient?.lastName) : '';
    const searchMatch = pName?.toLowerCase().includes(searchTerm.toLowerCase());
    return searchMatch;
  });

  const filteredOrders = orders.filter(order => {
    const pName = typeof order.patient === 'object' ? (order.patient?.name || order.patient?.firstName + ' ' + order.patient?.lastName) : '';
    const searchMatch = pName?.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filterStatus ? order.status === filterStatus : true;
    return searchMatch && statusMatch;
  });

  // --- Columns ---
  const rxColumns = [
    {
      header: 'Patient Info',
      accessor: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.patient?.name || (row.patient?.user ? `${row.patient.user.firstName || ''} ${row.patient.user.lastName || ''}`.trim() : '') || (row.patient?.firstName ? `${row.patient.firstName} ${row.patient.lastName || ''}`.trim() : '') || 'Patient'}</p>
        </div>
      )
    },
    {
      header: 'Doctor',
      accessor: (row) => <span className="text-sm text-slate-600">Dr. {row.doctor?.name || row.doctor?.user?.firstName || 'Unknown'}</span>
    },
    {
      header: 'Date',
      accessor: (row) => <span className="text-sm text-slate-600">{new Date(row.createdAt).toLocaleDateString()}</span>
    },
    {
      header: 'Prescribed Items',
      accessor: (row) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.medicines?.slice(0, 2).map((med, idx) => (
            <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs truncate max-w-[150px]">{med.name}</span>
          ))}
          {row.medicines?.length > 2 && (
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">+{row.medicines.length - 2}</span>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: (row) => {
        const matchedOrder = orders.find(o => 
          (typeof o.prescription === 'string' && o.prescription === row._id) || 
          (o.prescription && o.prescription._id === row._id)
        );
        const isDispensed = matchedOrder && matchedOrder.status === 'Dispensed';
        
        return (
          <div className="flex gap-2 items-center">
            {row.pdfPath && (
               <Button size="sm" variant="outline" className="border-slate-200 py-1 px-2 text-xs" title="Download Rx PDF" onClick={() => window.open(`http://localhost:5000${row.pdfPath}`, '_blank')}>
                 <FileDown size={14} />
               </Button>
            )}
            {isDispensed ? (
              <Badge variant="success" className="py-1 px-3 text-xs flex items-center gap-1">
                <CheckCircle size={14} /> Dispensed
              </Badge>
            ) : (
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-1 px-3 text-xs flex items-center gap-1.5 shadow-sm" onClick={() => openFulfillModal(row)}>
                <PackageCheck size={14} /> Dispense & Collect Payment
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  const orderColumns = [
    {
      header: 'Patient Info',
      accessor: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.patient?.name || 'Unknown'}</p>
          <p className="text-xs text-slate-500">{row.patient?.mobile || 'No contact'}</p>
        </div>
      )
    },
    {
      header: 'Order Date',
      accessor: (row) => <span className="text-sm text-slate-600">{new Date(row.createdAt).toLocaleDateString()}</span>
    },
    {
      header: 'Total Amount',
      accessor: (row) => <span className="font-bold text-slate-900">₹{row.totalAmount}</span>
    },
    {
      header: 'Status',
      accessor: (row) => {
        const variants = { Pending: 'warning', Dispensed: 'success', Cancelled: 'danger' };
        return <Badge variant={variants[row.status] || 'default'}>{row.status}</Badge>;
      }
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" className="border-slate-200 hover:bg-slate-50 py-1 px-2 text-xs" onClick={() => openViewDrawer(row)}>
            View
          </Button>
          {(row.status === 'Dispensed' || row.paymentStatus === 'Paid') && (
            <Button size="sm" className="bg-slate-800 text-white hover:bg-slate-900 py-1 px-2 text-xs" onClick={() => openPrintModal(row)}>
              <Printer size={14} />
            </Button>
          )}
        </div>
      )
    }
  ];

  const totalOrderValue = orderItems.reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmacy Operations</h1>
          <p className="text-slate-500 text-sm">Fulfill prescriptions and manage patient bills.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'prescriptions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Incoming Prescriptions
        </button>
        <button
          onClick={() => { setActiveTab('ipd'); fetchIpdRounds(); }}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'ipd' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Bed size={14} />
          IPD Prescriptions
          {ipdRounds.filter(r => !r.medicationsDispensed).length > 0 && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {ipdRounds.filter(r => !r.medicationsDispensed).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'orders' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Pharmacy Orders History
        </button>
      </div>

      <Card className="p-0 border-0 shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by patient name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          {activeTab === 'orders' && (
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:w-48 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Dispensed">Dispensed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          )}
        </div>
        
        {activeTab === 'prescriptions' ? (
           <DataTable 
             columns={rxColumns} 
             data={filteredPrescriptions} 
             loading={loading} 
             emptyMessage="No incoming prescriptions found." 
           />
        ) : activeTab === 'ipd' ? (
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="flex items-center justify-center py-16"><RefreshCw size={24} className="animate-spin text-indigo-400" /></div>
            ) : ipdRounds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <Bed size={36} className="opacity-30" />
                <p className="text-sm font-medium">Koi IPD round medications nahi mili</p>
              </div>
            ) : (
              ipdRounds.map(round => {
                const patientName = round.patient?.name ||
                  `${round.patient?.firstName || ''} ${round.patient?.lastName || ''}`.trim() || 'Unknown';
                const doctorName = round.doctor ? `Dr. ${round.doctor.firstName} ${round.doctor.lastName}` : 'Doctor';
                const ward = round.allocation?.ward?.wardName || 'Ward';
                const bed = round.allocation?.bedNumber || '—';
                const isDispensed = round.medicationsDispensed;

                return (
                  <div key={round._id} className="p-5 bg-white hover:bg-slate-50/80 transition-all border-b border-slate-100 last:border-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Patient + Ward + Round Info */}
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="font-bold text-slate-900 text-base">{patientName}</span>
                          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-semibold">
                            {ward} • Bed {bed}
                          </span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            round.roundType === 'Morning' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            round.roundType === 'Evening' ? 'bg-orange-50 text-orange-800 border border-orange-200' :
                            round.roundType === 'Emergency' ? 'bg-red-50 text-red-800 border border-red-200' :
                            'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          }`}>
                            {round.roundType} Round
                          </span>
                          {isDispensed ? (
                            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <PackageCheck size={12} /> Dispensed
                            </span>
                          ) : (
                            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                              Pending Dispense
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600 font-medium mt-1">
                          <span className="flex items-center gap-1.5"><Stethoscope size={13} className="text-indigo-600" /> {doctorName}</span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1.5"><Clock size={13} className="text-slate-400" /> {new Date(round.roundDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>

                        {/* Medications */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {round.medications.map((med, i) => (
                            <span key={i} className="text-xs bg-slate-50 border border-slate-200 text-slate-800 px-3 py-1.5 rounded-lg font-medium shadow-2xs">
                              <span className="font-bold text-indigo-900">{med.name}</span>
                              {med.dose && <span className="text-indigo-600 font-semibold"> ({med.dose})</span>}
                              {med.route && <span className="text-slate-600"> • {med.route}</span>}
                              {med.frequency && <span className="text-slate-600"> • {med.frequency}</span>}
                              {med.duration && <span className="text-slate-500"> • {med.duration}</span>}
                            </span>
                          ))}
                        </div>

                        {/* Dispensed info */}
                        {isDispensed && round.dispensedAt && (
                          <p className="text-xs text-emerald-700 font-semibold mt-2.5 flex items-center gap-1.5">
                            <PackageCheck size={13} />
                            Dispatched: {new Date(round.dispensedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                        )}
                      </div>

                      {/* Dispense Button */}
                      {!isDispensed && (
                        <button
                          onClick={() => openFulfillModal(round)}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm flex-shrink-0"
                        >
                          <PackageCheck size={14} />
                          Dispense & Map
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
           <DataTable 
             columns={orderColumns} 
             data={filteredOrders} 
             loading={loading} 
             emptyMessage="No orders found." 
           />
        )}
      </Card>

      {/* View Order Drawer */}
      {isViewDrawerOpen && selectedOrder && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-end z-50 transition-all duration-300">
          <div className="bg-white shadow-2xl w-full max-w-md h-full flex flex-col transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="p-6 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-tl-2xl flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold">Order Details</h2>
                <p className="text-indigo-200 text-sm opacity-90 mt-1">ID: #{selectedOrder._id?.substring(18).toUpperCase()}</p>
              </div>
              <button onClick={() => setIsViewDrawerOpen(false)} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-slate-50/50">
              
              {/* Status Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Status</p>
                  <p className="font-bold text-slate-800 text-lg">{selectedOrder.status}</p>
                </div>
                <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
                  selectedOrder.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 
                  selectedOrder.status === 'Dispensed' ? 'bg-emerald-100 text-emerald-700' : 
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedOrder.status === 'Pending' && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>}
                  {selectedOrder.status === 'Dispensed' && <CheckCircle size={16} />}
                  {selectedOrder.status === 'Cancelled' && <XCircle size={16} />}
                  {selectedOrder.status}
                </div>
              </div>

              {/* Patient Info */}
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">Patient Information</p>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner">
                    {selectedOrder.patient?.name?.charAt(0) || 'P'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-base">{selectedOrder.patient?.name || 'Unknown Patient'}</p>
                    <p className="text-sm text-slate-500">{selectedOrder.patient?.mobile || selectedOrder.patient?.user?.email || 'No contact provided'}</p>
                  </div>
                </div>
              </div>

              {/* Clinic & Doctor Info */}
              {(selectedOrder.prescription?.doctor || selectedOrder.hospitalId) && (
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">Clinic & Doctor</p>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                    {selectedOrder.hospitalId && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500">Hospital</span>
                        <span className="font-semibold text-slate-800 text-right">{selectedOrder.hospitalId.hospitalName || 'Unknown'}</span>
                      </div>
                    )}
                    {selectedOrder.prescription?.doctor && (
                      <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                        <span className="text-sm text-slate-500">Prescribing Doctor</span>
                        <span className="font-semibold text-slate-800 text-right">Dr. {selectedOrder.prescription.doctor.name || selectedOrder.prescription.doctor.firstName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">Payment Details</p>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Payment Method</p>
                    <p className="font-semibold text-slate-700">{selectedOrder.paymentMethod || 'Cash'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Payment Status</p>
                    <p className="font-semibold text-slate-700">{selectedOrder.paymentStatus || 'Pending'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 mb-1">Date</p>
                    <p className="font-semibold text-slate-700">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Prescription Items */}
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">Prescription Items ({selectedOrder.medicines?.length || 0})</p>
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <ul className="divide-y divide-slate-50">
                    {selectedOrder.medicines?.map((item, idx) => (
                      <li key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <Pill size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{item.medicine?.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">Qty: {item.quantity} × ₹{item.unitPrice || (item.totalPrice / item.quantity)}</p>
                          </div>
                        </div>
                        <div className="font-bold text-slate-900">
                          ₹{item.totalPrice}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-semibold text-slate-600">Total Amount</span>
                    <span className="text-xl font-black text-indigo-600">₹{selectedOrder.totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions Footer */}
            <div className="p-6 border-t border-slate-100 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
              {selectedOrder.status === 'Pending' ? (
                <div className="flex gap-3">
                  <Button className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-none" onClick={() => handleUpdateStatus(selectedOrder._id, 'Cancelled')}>
                    Decline
                  </Button>
                  <Button className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200" onClick={() => handleUpdateStatus(selectedOrder._id, 'Dispensed')}>
                    <CheckCircle size={18} className="mr-2" /> Mark as Dispensed
                  </Button>
                </div>
              ) : (
                <Button className="w-full bg-slate-800 hover:bg-slate-900 text-white shadow-lg shadow-slate-200" onClick={() => openPrintModal(selectedOrder)}>
                  <Printer size={18} className="mr-2" /> Print Invoice
                </Button>
              )}
            </div>
          </div>
        </div>
      , document.body)}

      {/* Fulfill Prescription Modal */}
      {isFulfillModalOpen && selectedPrescription && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Fulfill Prescription</h2>
                  <p className="text-sm text-slate-500">Patient: {selectedPrescription.patient?.name}</p>
                </div>
                <button onClick={() => setIsFulfillModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"><X size={20} /></button>
             </div>

             <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                <form id="fulfill-form" onSubmit={submitOrder} className="space-y-6">
                   <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                     <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-slate-800 text-lg">Map Medicines to Inventory</h3>
                       <Button type="button" size="sm" variant="outline" onClick={addExtraItemRow}>
                         <Plus size={14} className="mr-1" /> Add Extra Item
                       </Button>
                     </div>
                     
                     <div className="space-y-4">
                       {orderItems.map((item, index) => (
                         <div key={item._tempId} className="flex flex-col md:flex-row items-end gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg relative">
                            {orderItems.length > 1 && (
                              <button type="button" onClick={() => removeOrderItem(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><X size={16}/></button>
                            )}
                            <div className="flex-1 w-full space-y-1">
                              <label className="text-xs font-semibold text-slate-600">Doctor Prescribed</label>
                              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium truncate">
                                {item.originalName ? `${item.originalName} ${item.dosage ? '('+item.dosage+')' : ''}` : 'Added manually'}
                              </div>
                            </div>
                            
                            <div className="flex-1 w-full space-y-1">
                              <label className="text-xs font-semibold text-indigo-600">Select Inventory Item *</label>
                              <select 
                                required
                                value={item.medicineId} 
                                onChange={(e) => handleInventorySelect(index, e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                              >
                                <option value="">-- Select Medicine --</option>
                                {inventory.map(inv => (
                                  <option key={inv._id} value={inv._id}>
                                    {inv.name} (Stock: {inv.stockQuantity}) - ₹{inv.unitPrice}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="w-24 space-y-1">
                              <label className="text-xs font-semibold text-slate-600">Qty *</label>
                              <input 
                                type="number" 
                                min="1" 
                                required
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 text-center"
                              />
                            </div>

                            <div className="w-32 space-y-1">
                              <label className="text-xs font-semibold text-slate-600">Total (₹)</label>
                              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 text-right">
                                ₹{item.total}
                              </div>
                            </div>
                         </div>
                       ))}
                     </div>
                   </div>

                   {!isIpdRound && (
                     <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-3">
                           <h3 className="font-bold text-slate-800 text-lg">Payment Details</h3>
                           <div className="grid grid-cols-2 gap-3 max-w-sm">
                             {['Cash', 'Online', 'Card', 'UPI'].map(method => (
                               <label key={method} className={`cursor-pointer flex items-center justify-center p-3 rounded-lg border-2 transition-all ${paymentMethod === method ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                                 <input type="radio" name="paymentMethod" className="hidden" value={method} checked={paymentMethod === method} onChange={(e) => setPaymentMethod(e.target.value)} />
                                 {method}
                               </label>
                             ))}
                           </div>
                        </div>
                        
                        <div className="w-full md:w-64 bg-slate-900 rounded-xl p-5 text-white flex flex-col justify-center items-center text-center shadow-lg">
                          <p className="text-slate-400 text-sm font-medium mb-1">Total Bill Amount</p>
                          <p className="text-4xl font-black">₹{totalOrderValue}</p>
                          <div className="mt-4 text-xs bg-slate-800 px-3 py-1.5 rounded-full text-slate-300">
                            To be paid via {paymentMethod}
                          </div>
                        </div>
                     </div>
                   )}
                   {isIpdRound && (
                     <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between">
                       <div>
                         <h3 className="font-bold text-blue-900">IPD Order - Added to Final Bill</h3>
                         <p className="text-blue-700 text-sm">Patient payment will be collected at discharge.</p>
                       </div>
                       <div className="text-right">
                          <p className="text-blue-700 text-sm font-medium mb-1">Total Value</p>
                          <p className="text-2xl font-black text-blue-900">₹{totalOrderValue}</p>
                       </div>
                     </div>
                   )}
                </form>
             </div>

             <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 sticky bottom-0 z-10">
               <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setIsFulfillModalOpen(false)}>Cancel</Button>
               <Button type="submit" form="fulfill-form" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 px-8 flex items-center gap-2">
                 {isSubmitting ? (
                   <>
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                     <span>Processing...</span>
                   </>
                 ) : (
                   <span>Collect ₹{totalOrderValue} & Dispense</span>
                 )}
               </Button>
             </div>
           </div>
        </div>
      , document.body)}

      {/* Print Invoice Modal */}
      {isPrintModalOpen && invoiceOrder && createPortal(
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
             
             {/* Header */}
             <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 print:hidden">
               <h2 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} /> Pharmacy Invoice</h2>
               <div className="flex gap-2">
                 <Button variant="outline" size="sm" onClick={() => setIsPrintModalOpen(false)}>Close</Button>
                 <Button size="sm" onClick={() => {
                   const printContent = document.getElementById('invoice-print-area');
                   const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
                   windowPrint.document.write('<html><head><title>Pharmacy Invoice</title>');
                   windowPrint.document.write('<style>body { font-family: sans-serif; padding: 20px; } table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; } .text-right { text-align: right; } .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px;} .total-row { font-weight: bold; font-size: 1.2em; }</style>');
                   windowPrint.document.write('</head><body>');
                   windowPrint.document.write(printContent.innerHTML);
                   windowPrint.document.write('</body></html>');
                   windowPrint.document.close();
                   windowPrint.focus();
                   setTimeout(() => { windowPrint.print(); windowPrint.close(); }, 250);
                 }}>
                   <Printer size={16} className="mr-2" /> Print
                 </Button>
               </div>
             </div>

             {/* Printable Area */}
             <div className="p-8 bg-white overflow-y-auto max-h-[70vh]" id="invoice-print-area">
                <div className="header">
                   <h1 style={{ margin: 0, fontSize: '24px', textTransform: 'uppercase' }}>{invoiceOrder.hospitalId?.hospitalName || 'HOSPITAL PHARMACY'}</h1>
                   <p style={{ margin: '5px 0', color: '#555' }}>Official Medical Receipt / Tax Invoice</p>
                   {invoiceOrder.hospitalId?.address && typeof invoiceOrder.hospitalId.address === 'object' ? (
                     <p style={{ margin: '2px 0', color: '#777', fontSize: '14px' }}>
                       {[invoiceOrder.hospitalId.address.street, invoiceOrder.hospitalId.address.area, invoiceOrder.hospitalId.address.city, invoiceOrder.hospitalId.address.state, invoiceOrder.hospitalId.address.pincode].filter(Boolean).join(', ')}
                     </p>
                   ) : invoiceOrder.hospitalId?.address && (
                     <p style={{ margin: '2px 0', color: '#777', fontSize: '14px' }}>{invoiceOrder.hospitalId.address}</p>
                   )}
                </div>
                
                <table style={{ width: '100%', marginBottom: '20px', border: 'none' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: 'none', padding: '0 0 5px 0' }}><strong>Patient:</strong> {invoiceOrder.patient?.name || invoiceOrder.patient?.firstName + ' ' + invoiceOrder.patient?.lastName}</td>
                      <td style={{ border: 'none', padding: '0 0 5px 0', textAlign: 'right' }}><strong>Date:</strong> {new Date(invoiceOrder.createdAt).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                      <td style={{ border: 'none', padding: '0' }}><strong>Order ID:</strong> #{invoiceOrder._id.substring(18).toUpperCase()}</td>
                      <td style={{ border: 'none', padding: '0', textAlign: 'right' }}><strong>Payment:</strong> {invoiceOrder.paymentStatus} via {invoiceOrder.paymentMethod || 'Cash'}</td>
                    </tr>
                    {invoiceOrder.prescription?.doctor && (
                      <tr>
                        <td colSpan="2" style={{ border: 'none', padding: '5px 0 0 0', color: '#444' }}><strong>Prescribing Doctor:</strong> Dr. {invoiceOrder.prescription.doctor.name || invoiceOrder.prescription.doctor.firstName}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <table>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Medicine Name</th>
                      <th>Unit Price</th>
                      <th>Qty</th>
                      <th className="text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceOrder.medicines?.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{item.medicine?.name}</td>
                        <td>₹{item.unitPrice}</td>
                        <td>{item.quantity}</td>
                        <td className="text-right">₹{item.totalPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td colSpan="4" className="text-right" style={{ paddingTop: '15px' }}>Grand Total:</td>
                      <td className="text-right" style={{ paddingTop: '15px', color: '#10b981' }}>₹{invoiceOrder.totalAmount}</td>
                    </tr>
                  </tfoot>
                </table>

                <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '12px', color: '#777' }}>
                   <p>Thank you for choosing our services. Wish you a speedy recovery!</p>
                   <p>This is a computer generated invoice and requires no signature.</p>
                </div>
             </div>

           </div>
        </div>
      , document.body)}

    </div>
  );
};

export default PharmacistOrders;
