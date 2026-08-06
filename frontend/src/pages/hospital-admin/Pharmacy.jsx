import React, { useState } from 'react';
import { Pill, Plus, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

const mockPharmacyData = [
  { id: 'MED-001', name: 'Amoxicillin 500mg', category: 'Antibiotics', stock: 120, status: 'in-stock', price: 15 },
  { id: 'MED-002', name: 'Paracetamol 650mg', category: 'Analgesic', stock: 15, status: 'low-stock', price: 5 },
  { id: 'MED-003', name: 'Azithromycin 250mg', category: 'Antibiotics', stock: 0, status: 'out-of-stock', price: 25 },
  { id: 'MED-004', name: 'Pantoprazole 40mg', category: 'Antacid', stock: 450, status: 'in-stock', price: 10 },
];

const Pharmacy = () => {
  const [data] = useState(mockPharmacyData);
  
  const columns = [
    {
      header: 'Medicine Name',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-teal-50 flex items-center justify-center text-teal-600">
            <Pill size={16} />
          </div>
          <span className="font-semibold text-slate-900">{row.name}</span>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category'
    },
    {
      header: 'Stock Level',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700">{row.stock} units</span>
          {row.stock <= 20 && row.stock > 0 && <AlertTriangle size={14} className="text-amber-500" />}
        </div>
      )
    },
    {
      header: 'Unit Price',
      accessor: (row) => <span className="font-medium text-slate-800">₹{row.price}</span>
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.status === 'in-stock' ? 'success' : row.status === 'low-stock' ? 'warning' : 'danger'}>
          {row.status.replace('-', ' ')}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: () => (
        <Button size="sm" variant="outline" className="px-3 py-1 text-xs">
          Edit
        </Button>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight capitalize">
            Pharmacy Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-2">Manage medicine stock, categories, and low-stock alerts.</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2">
          <Plus size={18} /> Add Medicine
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-800">Total Medicines</p>
            <h3 className="text-2xl font-bold text-indigo-900">1,245</h3>
          </div>
          <div className="w-12 h-12 bg-indigo-200/50 rounded-xl flex items-center justify-center text-indigo-700">
            <Package size={24} />
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-800">Low Stock Alerts</p>
            <h3 className="text-2xl font-bold text-amber-900">18</h3>
          </div>
          <div className="w-12 h-12 bg-amber-200/50 rounded-xl flex items-center justify-center text-amber-700">
            <AlertTriangle size={24} />
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-800">In-Stock</p>
            <h3 className="text-2xl font-bold text-emerald-900">98%</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-200/50 rounded-xl flex items-center justify-center text-emerald-700">
            <CheckCircle size={24} />
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border border-slate-200">
        {data.length === 0 ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <EmptyState 
              icon={Pill} 
              title="Inventory is empty" 
              description="Add medicines to start managing pharmacy stock." 
              className="border-none bg-transparent"
            />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Search medicines by name or category..."
            searchKeys={['name', 'category']}
          />
        )}
      </Card>
    </div>
  );
};

export default Pharmacy;
