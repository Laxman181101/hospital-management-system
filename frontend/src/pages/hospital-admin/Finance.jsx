import React, { useState } from 'react';
import { DollarSign, Plus, Download, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

const mockFinanceData = [
  { id: 'TRX-9001', date: '2023-10-24', description: 'Staff Payroll - Oct', category: 'Payroll', amount: 45000, type: 'expense', status: 'completed' },
  { id: 'TRX-9002', date: '2023-10-23', description: 'Pharmacy Supplier', category: 'Inventory', amount: 12500, type: 'expense', status: 'pending' },
  { id: 'TRX-9003', date: '2023-10-22', description: 'Patient Billing Collection', category: 'Revenue', amount: 8400, type: 'income', status: 'completed' },
  { id: 'TRX-9004', date: '2023-10-20', description: 'Equipment Maintenance', category: 'Maintenance', amount: 3200, type: 'expense', status: 'completed' },
];

const Finance = () => {
  const [data] = useState(mockFinanceData);
  
  const columns = [
    {
      header: 'Transaction ID',
      accessor: (row) => <span className="font-semibold text-slate-900">{row.id}</span>
    },
    {
      header: 'Date',
      accessor: (row) => <span className="text-sm text-slate-500">{new Date(row.date).toLocaleDateString()}</span>
    },
    {
      header: 'Description',
      accessor: (row) => <span className="font-medium text-slate-700">{row.description}</span>
    },
    {
      header: 'Category',
      accessor: 'category'
    },
    {
      header: 'Type',
      accessor: (row) => (
        <div className="flex items-center gap-1">
          {row.type === 'income' ? (
            <ArrowDownRight size={14} className="text-emerald-500" />
          ) : (
            <ArrowUpRight size={14} className="text-rose-500" />
          )}
          <span className={`text-sm font-medium capitalize ${row.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
            {row.type}
          </span>
        </div>
      )
    },
    {
      header: 'Amount',
      accessor: (row) => (
        <span className={`font-bold ${row.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {row.type === 'income' ? '+' : '-'}₹{row.amount.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.status === 'completed' ? 'success' : 'warning'}>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: () => (
        <Button size="sm" variant="outline" className="px-2 py-1 text-xs">
          View
        </Button>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight capitalize">
            Finance & Payroll
          </h1>
          <p className="text-sm text-slate-500 mt-2">Manage hospital expenses, staff payroll, and financial reports.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download size={18} /> Export
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2">
            <Plus size={18} /> Add Transaction
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-800">Total Income (Oct)</p>
            <h3 className="text-2xl font-bold text-emerald-900">₹142,500</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-200/50 rounded-xl flex items-center justify-center text-emerald-700">
            <ArrowDownRight size={24} />
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-rose-800">Total Expenses (Oct)</p>
            <h3 className="text-2xl font-bold text-rose-900">₹85,400</h3>
          </div>
          <div className="w-12 h-12 bg-rose-200/50 rounded-xl flex items-center justify-center text-rose-700">
            <ArrowUpRight size={24} />
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-800">Net Profit (Oct)</p>
            <h3 className="text-2xl font-bold text-indigo-900">₹57,100</h3>
          </div>
          <div className="w-12 h-12 bg-indigo-200/50 rounded-xl flex items-center justify-center text-indigo-700">
            <DollarSign size={24} />
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border border-slate-200">
        {data.length === 0 ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <EmptyState 
              icon={DollarSign} 
              title="No financial records found" 
              description="Add a transaction to get started." 
              className="border-none bg-transparent"
            />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Search transactions..."
            searchKeys={['id', 'description', 'category']}
          />
        )}
      </Card>
    </div>
  );
};

export default Finance;
