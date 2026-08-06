import React, { useState, useEffect } from 'react';
import { CreditCard, Download, ExternalLink, RefreshCw } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      // Try payment/history first, fallback to payments/history based on typical API naming
      try {
         const res = await api.get('/api/payments/history');
         setPayments(res.data.payments || res.data.data?.payments || res.data.data || []);
      } catch (err) {
         throw err;
      }
    } catch (error) {
      addToast('error', 'Failed to fetch payment history');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleDownloadReceipt = async (paymentId) => {
    try {
      let res;
      try {
        res = await api.get(`/api/payments/${paymentId}/download-receipt`, { responseType: 'blob' });
      } catch (err) {
        throw err;
      }
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      addToast('error', 'Failed to download receipt');
    }
  };

  const columns = [
    {
      header: 'Transaction Date',
      key: 'createdAt',
      sortable: true,
      render: (row) => new Date(row.createdAt || row.paidAt).toLocaleDateString()
    },
    {
      header: 'Amount',
      key: 'amount',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-slate-900">
          ₹{row.amount}
        </span>
      )
    },
    {
      header: 'Payment Method',
      key: 'paymentMethod',
      render: (row) => (
        <span className="capitalize text-slate-700">
          {row.paymentMethod || 'Online'}
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (row) => (
        <Badge status={row.status === 'paid' ? 'completed' : row.status}>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => {
        if (row.status === 'paid' || row.status === 'completed') {
          return (
            <Button 
              variant="outline"
              className="text-xs py-1.5 px-3 flex items-center gap-1"
              onClick={() => handleDownloadReceipt(row._id)}
            >
              <Download size={14} /> Receipt
            </Button>
          );
        } else if (row.status === 'pending') {
          return (
            <Button 
              className="text-xs py-1.5 px-3 flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white border-transparent"
            >
              Pay Now <ExternalLink size={14} />
            </Button>
          );
        }
        return <span className="text-xs text-slate-400">-</span>;
      }
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payment History</h1>
          <p className="text-sm text-slate-500 mt-1">View past transactions, download receipts, and manage pending payments.</p>
        </div>
        <Button variant="outline" onClick={fetchPayments} className="flex items-center gap-2">
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>

      <div className="h-[600px]">
        <DataTable 
          columns={columns} 
          data={payments} 
          loading={loading}
          keyField="_id"
          emptyIcon={CreditCard}
          emptyTitle="No payments found"
          emptyDescription="You haven't made any payments or have any pending transactions."
        />
      </div>
    </div>
  );
};

export default Payments;
