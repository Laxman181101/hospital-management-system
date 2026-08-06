import React, { useState } from 'react';
import { FlaskConical, Plus, Search, Activity, FileText } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';

const mockLabData = [
  { id: 'TEST-501', name: 'Complete Blood Count (CBC)', category: 'Hematology', price: 450, status: 'active', tat: '24 hours' },
  { id: 'TEST-502', name: 'Lipid Profile', category: 'Biochemistry', price: 850, status: 'active', tat: '12 hours' },
  { id: 'TEST-503', name: 'Thyroid Function Test', category: 'Endocrinology', price: 600, status: 'inactive', tat: '24 hours' },
  { id: 'TEST-504', name: 'Urinalysis', category: 'Clinical Pathology', price: 200, status: 'active', tat: '6 hours' },
];

const Laboratory = () => {
  const [data] = useState(mockLabData);
  
  const columns = [
    {
      header: 'Test Name',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
            <FlaskConical size={16} />
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
      header: 'Price',
      accessor: (row) => <span className="font-medium text-slate-800">₹{row.price}</span>
    },
    {
      header: 'Turnaround Time',
      accessor: (row) => <span className="text-sm text-slate-500">{row.tat}</span>
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'secondary'}>
          {row.status}
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
            Laboratory Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-2">Manage diagnostic tests, categories, and pricing.</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2">
          <Plus size={18} /> Add Test
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-800">Total Tests Offered</p>
            <h3 className="text-2xl font-bold text-indigo-900">84</h3>
          </div>
          <div className="w-12 h-12 bg-indigo-200/50 rounded-xl flex items-center justify-center text-indigo-700">
            <FlaskConical size={24} />
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-teal-50 to-teal-100/50 border-teal-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-teal-800">Pending Reports</p>
            <h3 className="text-2xl font-bold text-teal-900">12</h3>
          </div>
          <div className="w-12 h-12 bg-teal-200/50 rounded-xl flex items-center justify-center text-teal-700">
            <Activity size={24} />
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-800">Test Categories</p>
            <h3 className="text-2xl font-bold text-amber-900">6</h3>
          </div>
          <div className="w-12 h-12 bg-amber-200/50 rounded-xl flex items-center justify-center text-amber-700">
            <FileText size={24} />
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border border-slate-200">
        {data.length === 0 ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <EmptyState 
              icon={FlaskConical} 
              title="No tests available" 
              description="Add a diagnostic test to build your laboratory catalog." 
              className="border-none bg-transparent"
            />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Search tests by name or category..."
            searchKeys={['name', 'category']}
          />
        )}
      </Card>
    </div>
  );
};

export default Laboratory;
