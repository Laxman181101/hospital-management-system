import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, AlertTriangle, Package, Calendar } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';

const PharmacistInventory = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '', category: 'Tablet', manufacturer: '', batchNumber: '',
    expiryDate: '', unitPrice: '', stockQuantity: ''
  });

  const categories = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Other'];

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/pharmacy/medicines');
      setMedicines(res.data.data || []);
    } catch (err) {
      addToast('error', 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/v1/pharmacy/medicines', formData);
      addToast('success', 'Medicine added to inventory successfully');
      setIsAddModalOpen(false);
      setFormData({
        name: '', category: 'Tablet', manufacturer: '', batchNumber: '',
        expiryDate: '', unitPrice: '', stockQuantity: ''
      });
      fetchMedicines();
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to add medicine');
    } finally {
      setSubmitting(false);
    }
  };

  const openUpdateModal = (medicine) => {
    setSelectedMedicine(medicine);
    setFormData({
      unitPrice: medicine.unitPrice,
      stockQuantity: medicine.stockQuantity
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateMedicine = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/api/v1/pharmacy/medicines/${selectedMedicine._id}`, {
        unitPrice: formData.unitPrice,
        stockQuantity: formData.stockQuantity
      });
      addToast('success', 'Medicine inventory updated successfully');
      setIsUpdateModalOpen(false);
      fetchMedicines();
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to update medicine');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMedicines = medicines.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          med.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? med.category === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  const columns = [
    {
      header: 'Medicine Details',
      accessor: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">{row.manufacturer}</p>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: (row) => <Badge variant="secondary" className="text-[10px]">{row.category}</Badge>
    },
    {
      header: 'Batch & Expiry',
      accessor: (row) => {
        const isExpired = new Date(row.expiryDate) < new Date();
        return (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-600 font-mono">{row.batchNumber}</span>
            <span className={`text-[10px] font-medium flex items-center gap-1 ${isExpired ? 'text-red-600' : 'text-slate-500'}`}>
              <Calendar size={10} /> 
              {new Date(row.expiryDate).toLocaleDateString()}
              {isExpired && ' (Expired)'}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Price',
      accessor: (row) => <span className="font-medium text-slate-700">₹{row.unitPrice}</span>
    },
    {
      header: 'Stock',
      accessor: (row) => {
        const isLowStock = row.stockQuantity <= 10;
        return (
          <Badge variant={isLowStock ? 'danger' : 'success'} className="flex items-center w-max gap-1">
            <Package size={12} /> {row.stockQuantity}
            {isLowStock && <AlertTriangle size={12} className="ml-1" />}
          </Badge>
        );
      }
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <Button size="sm" variant="outline" className="border-slate-200 hover:bg-slate-50 py-1 px-2 text-xs" onClick={() => openUpdateModal(row)}>
          <Edit2 size={12} className="mr-1 inline" /> Update
        </Button>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medicine Inventory</h1>
          <p className="text-slate-500 text-sm">Manage stock levels and track expiration dates.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <Plus size={16} /> Add Medicine
        </Button>
      </div>

      <Card className="p-0 border-0 shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by medicine name or batch number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:w-48 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        
        <DataTable 
          columns={columns} 
          data={filteredMedicines} 
          loading={loading} 
          emptyMessage="No medicines found in inventory." 
        />
      </Card>

      {/* Add Medicine Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Add New Medicine</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleAddMedicine} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Medicine Name <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleFormChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category <span className="text-red-500">*</span></label>
                  <select name="category" value={formData.category} onChange={handleFormChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturer</label>
                  <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleFormChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Batch Number <span className="text-red-500">*</span></label>
                  <input type="text" name="batchNumber" value={formData.batchNumber} onChange={handleFormChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date <span className="text-red-500">*</span></label>
                  <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleFormChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price (₹) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" name="unitPrice" value={formData.unitPrice} onChange={handleFormChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock <span className="text-red-500">*</span></label>
                  <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleFormChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Medicine'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Stock/Price Modal */}
      {isUpdateModalOpen && selectedMedicine && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Update Inventory</h2>
              <button onClick={() => setIsUpdateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleUpdateMedicine} className="p-6 space-y-4">
              <div>
                <p className="font-bold text-slate-900">{selectedMedicine.name}</p>
                <p className="text-xs text-slate-500">Batch: {selectedMedicine.batchNumber}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stock Quantity</label>
                <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleFormChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price (₹)</label>
                <input type="number" step="0.01" name="unitPrice" value={formData.unitPrice} onChange={handleFormChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsUpdateModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PharmacistInventory;
