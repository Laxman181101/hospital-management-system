import React, { useState } from 'react';
import { FileText, Plus, DollarSign, Download, MoreVertical, CreditCard } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

const mockBillingData = [
  { id: 'INV-1001', patient: 'John Doe', date: '2023-10-24', amount: 1500, status: 'paid', type: 'Consultation' },
  { id: 'INV-1002', patient: 'Jane Smith', date: '2023-10-24', amount: 4500, status: 'pending', type: 'Surgery' },
  { id: 'INV-1003', patient: 'Alice Johnson', date: '2023-10-23', amount: 800, status: 'paid', type: 'Pharmacy' },
  { id: 'INV-1004', patient: 'Robert Brown', date: '2023-10-22', amount: 1200, status: 'cancelled', type: 'Laboratory' },
];

const Billing = () => {
  const [data, setData] = useState(mockBillingData);
  
  const columns = [
    {
      header: 'Invoice ID',
      accessor: (row) => <span className="font-semibold text-slate-900">{row.id}</span>
    },
    {
      header: 'Patient Name',
      accessor: (row) => <span className="font-medium text-slate-700">{row.patient}</span>
    },
    {
      header: 'Date',
      accessor: (row) => <span className="text-sm text-slate-500">{new Date(row.date).toLocaleDateString()}</span>
    },
    {
      header: 'Type',
      accessor: 'type'
    },
    {
      header: 'Amount',
      accessor: (row) => <span className="font-bold text-slate-800">₹{row.amount}</span>
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.status === 'paid' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'}>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex gap-2">
          {row.status === 'pending' && (
            <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 px-2 py-1 text-xs flex items-center gap-1">
              <CreditCard size={12} /> Pay
            </Button>
          )}
          <Button size="sm" variant="outline" className="px-2 py-1 text-xs flex items-center gap-1">
            <Download size={12} /> PDF
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight capitalize">
            Billing & Collections
          </h1>
          <p className="text-sm text-slate-500 mt-2">Manage patient invoices, track payments and generate receipts.</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2">
          <Plus size={18} /> New Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-800">Total Revenue</p>
            <h3 className="text-2xl font-bold text-emerald-900">₹8,000</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-200/50 rounded-xl flex items-center justify-center text-emerald-700">
            <DollarSign size={24} />
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-800">Pending Payments</p>
            <h3 className="text-2xl font-bold text-amber-900">₹4,500</h3>
          </div>
          <div className="w-12 h-12 bg-amber-200/50 rounded-xl flex items-center justify-center text-amber-700">
            <FileText size={24} />
          </div>
        </Card>
        <Card className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Invoices Generated</p>
            <h3 className="text-2xl font-bold text-slate-900">124</h3>
          </div>
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
            <FileText size={24} />
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border border-slate-200">
        {data.length === 0 ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <EmptyState 
              icon={FileText} 
              title="No invoices found" 
              description="Create a new invoice to get started." 
              className="border-none bg-transparent"
            />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Search invoices by patient or ID..."
            searchKeys={['patient', 'id']}
          />
        )}
      </Card>
    </div>
  );
};

export default Billing;
