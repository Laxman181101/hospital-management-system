import React, { useState, useEffect } from 'react';
import { FileText, Search, DollarSign, CheckCircle, Plus, Receipt, Activity, CreditCard, Trash2, Edit, X } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const StaffBilling = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' or 'collect'
  const [billTypeFilter, setBillTypeFilter] = useState('All');
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isViewInvoiceOpen, setIsViewInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Bill generation state
  const [billData, setBillData] = useState({
    patient: '',
    discount: 0,
    tax: 0,
    paymentMethod: 'cash',
    paymentStatus: 'unpaid'
  });
  const [lineItems, setLineItems] = useState([{ description: '', amount: '', quantity: 1 }]);

  // Collect payment state
  const [collectData, setCollectData] = useState({
    module: 'Pharmacy',
    referenceId: '',
    amount: '',
    paymentMethod: 'cash',
    patient: '',
    notes: ''
  });

  const [stats, setStats] = useState({
    totalBills: 0,
    unpaidAmount: 0,
    collectedToday: 0
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'invoices') {
        const [invRes, patRes] = await Promise.all([
          api.get('/api/v1/billing'),
          api.get('/api/v1/patients')
        ]);
        const fetchedInvoices = invRes.data.data || [];
        setInvoices(fetchedInvoices);
        const patientsData = Array.isArray(patRes.data) ? patRes.data : (patRes.data.data || []);
        setPatients(patientsData);
        
        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        let todayBills = 0;
        let unpaid = 0;
        let collected = 0;
        
        fetchedInvoices.forEach(inv => {
          if (inv.createdAt && inv.createdAt.split('T')[0] === today) todayBills++;
          if (inv.paymentStatus === 'unpaid' || inv.paymentStatus === 'partially_paid') {
            unpaid += inv.totalAmount || 0; // Assuming totalAmount exists, otherwise we'd need to calculate from items
          } else if (inv.paymentStatus === 'paid' && inv.createdAt && inv.createdAt.split('T')[0] === today) {
            collected += inv.totalAmount || 0;
          }
        });
        
        setStats({ totalBills: todayBills, unpaidAmount: unpaid, collectedToday: collected });
      } else {
        const [txnRes, patRes] = await Promise.all([
          api.get('/api/v1/billing/transactions'),
          api.get('/api/v1/patients')
        ]);
        setTransactions(txnRes.data.data || []);
        const patientsData = Array.isArray(patRes.data) ? patRes.data : (patRes.data.data || []);
        setPatients(patientsData);
      }
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to fetch billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async (id) => {
    try {
      await api.patch(`/api/v1/billing/${id}/payment`, { paymentStatus: 'paid' });
      addToast('success', 'Invoice marked as paid');
      fetchData();
    } catch (err) {
      addToast('error', 'Failed to update payment status');
    }
  };

  // Line Items handlers
  const handleItemChange = (index, field, value) => {
    const newItems = [...lineItems];
    newItems[index][field] = value;
    setLineItems(newItems);
  };
  const addItem = () => setLineItems([...lineItems, { description: '', amount: '', quantity: 1 }]);
  const removeItem = (index) => setLineItems(lineItems.filter((_, i) => i !== index));

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...billData,
        items: lineItems.map(item => ({
          description: item.description,
          amount: Number(item.amount),
          quantity: Number(item.quantity)
        }))
      };
      await api.post('/api/v1/billing', payload);
      addToast('success', 'Bill generated successfully');
      setIsGenerateModalOpen(false);
      setBillData({ patient: '', discount: 0, tax: 0, paymentMethod: 'cash', paymentStatus: 'unpaid' });
      setLineItems([{ description: '', amount: '', quantity: 1 }]);
      fetchData();
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to generate bill');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...collectData,
        amount: Number(collectData.amount)
      };
      await api.post('/api/v1/billing/collect-payment', payload);
      addToast('success', 'Payment collected successfully');
      setCollectData({ module: 'Pharmacy', referenceId: '', amount: '', paymentMethod: 'cash', patient: '', notes: '' });
      fetchData();
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to collect payment');
    } finally {
      setSubmitting(false);
    }
  };

  const openViewInvoice = (inv) => {
    setSelectedInvoice(inv);
    setIsViewInvoiceOpen(true);
  };

  const handleDownloadInvoice = async (id) => {
    try {
      addToast('info', 'Downloading invoice...');
      const res = await api.get(`/api/v1/billing/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      addToast('error', 'Failed to download invoice');
    }
  };

  const calculateSubtotal = () => lineItems.reduce((sum, item) => sum + ((Number(item.amount) || 0) * (Number(item.quantity) || 1)), 0);
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal - (Number(billData.discount) || 0) + (Number(billData.tax) || 0);
  };

  const invoiceColumns = [
    {
      header: 'Invoice Info',
      accessor: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.invoiceNumber || `INV-${row._id.slice(-6).toUpperCase()}`}</p>
          <p className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</p>
        </div>
      )
    },
    { header: 'Patient', accessor: (row) => <span className="font-medium text-slate-700">{row.patient?.name || row.patient?.firstName + ' ' + row.patient?.lastName || 'Unknown'}</span> },
    {
      header: 'Source',
      accessor: (row) => row.admission ? <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200">IPD</Badge> : <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">OPD</Badge>
    },
    {
      header: 'Summary',
      accessor: (row) => <span className="text-sm text-slate-600">{row.items?.length || 0} items</span>
    },
    {
      header: 'Total Amount',
      accessor: (row) => (
        <div className="flex items-center text-slate-900 font-bold">
          <DollarSign size={14} className="text-slate-400 mr-1" />
          <span>{row.totalAmount || row.items?.reduce((s,i) => s+(i.amount*i.quantity),0)}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (row) => {
        const variants = { unpaid: 'danger', partially_paid: 'warning', paid: 'success', refunded: 'default' };
        return <Badge variant={variants[row.paymentStatus] || 'default'}>{row.paymentStatus || 'unpaid'}</Badge>;
      }
    },
    { header: 'Method', accessor: (row) => <span className="text-xs font-medium uppercase text-slate-500">{row.paymentMethod}</span> },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="border-slate-200 hover:bg-slate-50 py-1 px-2 text-xs" onClick={() => openViewInvoice(row)}>
            View
          </Button>
          <Button size="sm" variant="outline" className="border-slate-200 hover:bg-slate-50 py-1 px-2 text-xs" onClick={() => handleDownloadInvoice(row._id)}>
            Download
          </Button>
          {row.paymentStatus !== 'paid' && (
            <Button size="sm" className="bg-teal-50 text-teal-600 hover:bg-teal-100 py-1 px-2 text-xs" onClick={() => handleUpdatePayment(row._id)}>
              Mark Paid
            </Button>
          )}
        </div>
      )
    }
  ];

  const transactionColumns = [
    {
      header: 'Transaction ID',
      accessor: (row) => (
        <div>
          <p className="font-medium text-slate-900 font-mono text-xs">{row.transactionId || `TXN-${row._id.slice(-8).toUpperCase()}`}</p>
          <p className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</p>
        </div>
      )
    },
    {
      header: 'Module',
      accessor: (row) => <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">{row.module}</Badge>
    },
    { header: 'Patient', accessor: (row) => <span className="font-medium text-slate-700">{row.patient?.name || row.patient?.firstName + ' ' + row.patient?.lastName || 'Unknown'}</span> },
    { header: 'Ref ID', accessor: (row) => <span className="text-xs text-slate-500">{row.referenceId || '-'}</span> },
    {
      header: 'Amount',
      accessor: (row) => (
        <div className="flex items-center text-green-600 font-bold">
          <DollarSign size={14} className="mr-1" />
          <span>{row.amount}</span>
        </div>
      )
    },
    { header: 'Method', accessor: (row) => <span className="text-xs font-medium uppercase text-slate-500 flex items-center gap-1"><CreditCard size={12}/> {row.paymentMethod}</span> }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Stats */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Billing & Payments</h1>
            <p className="text-slate-500">Manage invoices and collect payments from decentralized modules</p>
          </div>
          {activeTab === 'invoices' && (
            <Button className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2 shadow-sm" onClick={() => setIsGenerateModalOpen(true)}>
              <Plus size={20} /> Generate New Bill
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 flex items-center gap-4 bg-white border border-slate-200">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Receipt size={24} /></div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Bills Today</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalBills}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 bg-white border border-slate-200">
            <div className="p-3 bg-red-50 rounded-lg text-red-600"><Activity size={24} /></div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Unpaid Amount</p>
              <p className="text-2xl font-bold text-slate-900">₹{stats.unpaidAmount}</p>
            </div>
          </Card>
          <Card className="p-5 flex items-center gap-4 bg-white border border-slate-200">
            <div className="p-3 bg-green-50 rounded-lg text-green-600"><DollarSign size={24} /></div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Collected Today</p>
              <p className="text-2xl font-bold text-slate-900">₹{stats.collectedToday}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/50 rounded-t-xl px-2 pt-2">
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors relative rounded-t-lg ${activeTab === 'invoices' ? 'bg-white text-teal-700 border-t border-l border-r border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('invoices')}
        >
          Invoices
          {activeTab === 'invoices' && <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-white" />}
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm transition-colors relative rounded-t-lg ${activeTab === 'collect' ? 'bg-white text-teal-700 border-t border-l border-r border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('collect')}
        >
          Collect Module Payment
          {activeTab === 'collect' && <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-white" />}
        </button>
      </div>

      <Card className="p-0 overflow-hidden border border-slate-200">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-slate-100 rounded"></div>)}
            </div>
          </div>
        ) : activeTab === 'invoices' ? (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700">Bill Type:</span>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {['All', 'OPD', 'IPD'].map(tab => (
                  <button
                    key={tab}
                    className={`px-4 py-1 text-sm font-medium rounded-md transition-colors ${billTypeFilter === tab ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    onClick={() => setBillTypeFilter(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <DataTable 
              columns={invoiceColumns} 
              data={invoices.filter(inv => {
                if (billTypeFilter === 'IPD') return !!inv.admission;
                if (billTypeFilter === 'OPD') return !inv.admission;
                return true;
              })} 
              searchPlaceholder="Search invoices..." 
              searchKeys={['patient.name', 'invoiceNumber']} 
            />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row">
            {/* Quick Form */}
            <div className="w-full lg:w-1/3 p-6 border-r border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus size={18} className="text-teal-600"/> Record Collection</h3>
              <form onSubmit={handleCollectPayment} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Module *</label>
                  <select value={collectData.module} onChange={e => setCollectData({...collectData, module: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white text-sm">
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Appointment">Appointment</option>
                    <option value="IPD_Deposit">IPD Deposit</option>
                    <option value="IPD_Final_Bill">IPD Final Bill</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Patient *</label>
                  <select value={collectData.patient} onChange={e => setCollectData({...collectData, patient: e.target.value})} required className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white text-sm">
                    <option value="">-- Select Patient --</option>
                    {patients.map(p => <option key={p._id} value={p._id}>{p.name || p.firstName + ' ' + p.lastName}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Reference ID</label>
                  <input type="text" value={collectData.referenceId} onChange={e => setCollectData({...collectData, referenceId: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm" placeholder="e.g. LAB-1029" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Amount *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400">₹</span>
                      <input type="number" value={collectData.amount} onChange={e => setCollectData({...collectData, amount: e.target.value})} required min="1" className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Method</label>
                    <select value={collectData.paymentMethod} onChange={e => setCollectData({...collectData, paymentMethod: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white text-sm">
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="insurance">Insurance</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Notes</label>
                  <input type="text" value={collectData.notes} onChange={e => setCollectData({...collectData, notes: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm" />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-teal-600 hover:bg-teal-700 text-sm py-2">
                  {submitting ? 'Processing...' : 'Record Payment'}
                </Button>
              </form>
            </div>
            {/* Transactions Table */}
            <div className="w-full lg:w-2/3">
              <DataTable columns={transactionColumns} data={transactions} searchPlaceholder="Search transactions..." searchKeys={['patient.name', 'module', 'referenceId']} />
            </div>
          </div>
        )}
      </Card>

      {/* Generate Bill Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Receipt className="text-teal-600"/> Generate Invoice</h2>
              <button onClick={() => setIsGenerateModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full"><X size={20} /></button>
            </div>
            
            <form id="bill-form" onSubmit={handleGenerateBill} className="p-6 overflow-y-auto flex-1 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Select Patient *</label>
                  <select value={billData.patient} onChange={e => setBillData({...billData, patient: e.target.value})} required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => <option key={p._id} value={p._id}>{p.name || p.firstName + ' ' + p.lastName}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Initial Payment Status</label>
                  <select value={billData.paymentStatus} onChange={e => setBillData({...billData, paymentStatus: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-slate-800">Line Items</h3>
                  <Button type="button" size="sm" variant="outline" className="text-teal-600 border-teal-200 hover:bg-teal-50 text-xs py-1 h-auto" onClick={addItem}>
                    <Plus size={14} className="mr-1"/> Add Row
                  </Button>
                </div>
                <div className="space-y-3">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-1">
                        <input type="text" placeholder="Description (e.g. Consultation Fee)" required value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm" />
                      </div>
                      <div className="w-32">
                        <input type="number" placeholder="Amount (₹)" required min="0" value={item.amount} onChange={e => handleItemChange(idx, 'amount', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm" />
                      </div>
                      <div className="w-24">
                        <input type="number" placeholder="Qty" required min="1" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm" />
                      </div>
                      <button type="button" onClick={() => removeItem(idx)} disabled={lineItems.length === 1} className={`p-2 rounded ${lineItems.length === 1 ? 'text-slate-300' : 'text-red-400 hover:bg-red-50 hover:text-red-600'}`}>
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Payment Method (if paying now)</label>
                    <select value={billData.paymentMethod} onChange={e => setBillData({...billData, paymentMethod: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{calculateSubtotal()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-600">
                    <span>Discount (₹):</span>
                    <input type="number" value={billData.discount} onChange={e => setBillData({...billData, discount: e.target.value})} className="w-24 px-2 py-1 border border-slate-300 rounded text-right" min="0"/>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-600 pb-3 border-b border-slate-200">
                    <span>Tax (₹):</span>
                    <input type="number" value={billData.tax} onChange={e => setBillData({...billData, tax: e.target.value})} className="w-24 px-2 py-1 border border-slate-300 rounded text-right" min="0"/>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold text-slate-900">
                    <span>Total:</span>
                    <span>₹{calculateTotal()}</span>
                  </div>
                </div>
              </div>

            </form>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setIsGenerateModalOpen(false)}>Cancel</Button>
              <Button type="submit" form="bill-form" disabled={submitting} className="bg-teal-600 hover:bg-teal-700 px-8">Generate Invoice</Button>
            </div>
          </div>
        </div>
      )}

      {/* View Invoice Drawer */}
      {isViewInvoiceOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-end z-50">
          <div className="bg-white shadow-2xl w-full max-w-lg h-full flex flex-col animate-in slide-in-from-right">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Invoice Details</h2>
              <button onClick={() => setIsViewInvoiceOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedInvoice.invoiceNumber || `INV-${selectedInvoice._id.slice(-6).toUpperCase()}`}</h3>
                  <p className="text-sm text-slate-500">Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                </div>
                <Badge variant={selectedInvoice.paymentStatus === 'paid' ? 'success' : selectedInvoice.paymentStatus === 'partially_paid' ? 'warning' : 'danger'}>
                  {selectedInvoice.paymentStatus || 'unpaid'}
                </Badge>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Patient Details</p>
                <p className="font-bold text-slate-900">{selectedInvoice.patient?.name || selectedInvoice.patient?.firstName + ' ' + selectedInvoice.patient?.lastName}</p>
                <p className="text-sm text-slate-600">{selectedInvoice.patient?.mobile}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">Line Items</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-3 font-medium">Description</th>
                        <th className="p-3 font-medium text-center">Qty</th>
                        <th className="p-3 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3">{item.description}</td>
                          <td className="p-3 text-center">{item.quantity}</td>
                          <td className="p-3 text-right">₹{item.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{selectedInvoice.totalAmount - (selectedInvoice.tax || 0) + (selectedInvoice.discount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Discount:</span>
                  <span>₹{selectedInvoice.discount || 0}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Tax:</span>
                  <span>₹{selectedInvoice.tax || 0}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span>₹{selectedInvoice.totalAmount}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={() => handleDownloadInvoice(selectedInvoice._id)}>
                Download Invoice
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StaffBilling;
