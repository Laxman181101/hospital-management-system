import React, { useState, useEffect } from 'react';
import { Package, FileText, AlertTriangle, Activity, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/ui/DataTable';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMedicines: 0,
    lowStockCount: 0,
    totalOrders: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockMedicines, setLowStockMedicines] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [medicinesRes, ordersRes] = await Promise.all([
          api.get('/api/v1/pharmacy/medicines'),
          api.get('/api/v1/pharmacy/orders')
        ]);

        const medicines = medicinesRes.data.data || [];
        const orders = ordersRes.data.data || [];

        const lowStock = medicines.filter(m => m.stockQuantity <= 10);
        
        setStats({
          totalMedicines: medicines.length,
          lowStockCount: lowStock.length,
          totalOrders: orders.length,
          pendingOrders: orders.filter(o => o.status === 'Pending').length
        });

        setRecentOrders(orders.slice(0, 5));
        setLowStockMedicines(lowStock.slice(0, 5));

      } catch (err) {
        console.error("Failed to load pharmacist dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const lowStockColumns = [
    { header: 'Medicine', accessor: 'name' },
    { header: 'Category', accessor: 'category' },
    { 
      header: 'Stock', 
      accessor: (row) => (
        <Badge variant="danger" className="text-xs">
          {row.stockQuantity} Left
        </Badge>
      )
    },
    { 
      header: 'Action', 
      accessor: (row) => (
        <button 
          onClick={() => navigate('/pharmacist/inventory')}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Update Stock
        </button>
      )
    }
  ];

  const recentOrderColumns = [
    { 
      header: 'Order Info', 
      accessor: (row) => (
        <div>
          <p className="font-medium text-slate-800">
            {(row.patient?.user ? `${row.patient.user.firstName || ''} ${row.patient.user.lastName || ''}`.trim() : '') ||
             (row.patient?.firstName ? `${row.patient.firstName} ${row.patient.lastName || ''}`.trim() : '') ||
             row.patient?.name ||
             'Patient'}
          </p>
          <p className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</p>
        </div>
      )
    },
    { 
      header: 'Items', 
      accessor: (row) => (
        <span className="text-sm text-slate-600">{row.medicines?.length || 0} items</span>
      )
    },
    { 
      header: 'Status', 
      accessor: (row) => (
        <Badge variant={row.status === 'Pending' ? 'warning' : row.status === 'Dispensed' ? 'success' : 'danger'}>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Action',
      accessor: (row) => (
        <button 
          onClick={() => navigate('/pharmacist/orders')}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          View Order
        </button>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pharmacy Dashboard</h1>
          <p className="text-slate-500 mt-2">Overview of inventory and orders.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-white border-l-4 border-indigo-500 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Medicines</p>
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-slate-900">{stats.totalMedicines}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-l-4 border-red-500 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Low Stock Alerts</p>
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-slate-900">{stats.lowStockCount}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-l-4 border-teal-500 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Orders</p>
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-slate-900">{stats.totalOrders}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border-l-4 border-amber-500 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Orders</p>
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-slate-900">{stats.pendingOrders}</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" /> Low Stock Items
            </h2>
            <button onClick={() => navigate('/pharmacist/inventory')} className="text-sm text-indigo-600 font-medium hover:text-indigo-800">
              View Inventory
            </button>
          </div>
          <div className="p-0 flex-1">
            <DataTable 
              columns={lowStockColumns} 
              data={lowStockMedicines} 
              loading={loading}
              emptyMessage="No medicines are running low on stock."
            />
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText size={18} className="text-teal-500" /> Recent Orders
            </h2>
            <button onClick={() => navigate('/pharmacist/orders')} className="text-sm text-indigo-600 font-medium hover:text-indigo-800">
              View All Orders
            </button>
          </div>
          <div className="p-0 flex-1">
            <DataTable 
              columns={recentOrderColumns} 
              data={recentOrders} 
              loading={loading}
              emptyMessage="No recent orders."
            />
          </div>
        </Card>
      </div>

    </div>
  );
};

export default Dashboard;
