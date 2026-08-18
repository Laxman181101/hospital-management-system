import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  TrendingUp, DollarSign, Building2, AlertCircle, RefreshCw,
  CheckCircle2, CreditCard, Activity
} from 'lucide-react';
import { superAdminService } from '../../services/super-admin.service';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const STATUS_COLORS = {
  paid: '#10b981',
  success: '#10b981',
  pending: '#f59e0b',
  failed: '#ef4444',
  refunded: '#6366f1',
};

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('monthly');

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await superAdminService.getAnalytics({ range });
      setData(res);
    } catch (err) {
      console.error('Failed to load platform analytics:', err);
      setError(err.response?.data?.message || err.message || 'Unable to load platform analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.summary || {};
  const revenueOverview = data?.revenueOverview || [];
  const revenueByHospital = data?.revenueByHospital || [];
  const statusDistribution = data?.statusDistribution || [];

  const totalStatusCount = statusDistribution.reduce((acc, curr) => acc + curr.count, 0);

  const pieChartData = statusDistribution.map((item) => {
    const statusLabel = item.status ? item.status.toUpperCase() : 'UNKNOWN';
    const percentage = totalStatusCount > 0 ? ((item.count / totalStatusCount) * 100).toFixed(1) : 0;
    return {
      name: statusLabel,
      value: item.count,
      percentage: `${percentage}%`,
      color: STATUS_COLORS[item.status] || '#94a3b8',
      totalAmount: item.totalAmount,
    };
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header with Title & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time database metrics across all onboarded hospitals and transactions</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="monthly">Monthly (Last 6 Months)</option>
            <option value="yearly">Yearly (Current Year)</option>
            <option value="all">All Time</option>
          </select>

          <Button variant="secondary" size="sm" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-800 text-sm">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-3 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Total Platform Revenue</p>
              {loading ? (
                <div className="h-7 w-28 bg-slate-200 rounded animate-pulse mt-1"></div>
              ) : (
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                  ₹{(summary.totalRevenue || 0).toLocaleString('en-IN')}
                </h3>
              )}
              <p className="text-xs font-medium text-slate-500 flex items-center mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                {summary.totalPaymentsCount || 0} Successful Transactions
              </p>
            </div>
          </div>
        </Card>

        {/* Total Hospitals */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Total Hospitals</p>
              {loading ? (
                <div className="h-7 w-16 bg-slate-200 rounded animate-pulse mt-1"></div>
              ) : (
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{summary.totalHospitals || 0}</h3>
              )}
              <p className="text-xs font-medium text-slate-500 mt-1">
                Active: {summary.activeHospitals || 0} • Inactive: {summary.inactiveHospitals || 0}
              </p>
            </div>
          </div>
        </Card>

        {/* Active Hospitals */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Active Tenants</p>
              {loading ? (
                <div className="h-7 w-16 bg-slate-200 rounded animate-pulse mt-1"></div>
              ) : (
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{summary.activeHospitals || 0}</h3>
              )}
              <p className="text-xs font-medium text-emerald-600 flex items-center mt-1">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                {summary.totalHospitals > 0
                  ? `${Math.round(((summary.activeHospitals || 0) / summary.totalHospitals) * 100)}% Operational`
                  : '0% Operational'}
              </p>
            </div>
          </div>
        </Card>

        {/* Subscription Status Notice */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">SaaS Subscription Status</p>
              <h3 className="text-sm font-bold text-amber-800 mt-0.5">Subscription Billing: N/A</h3>
              <p className="text-xs text-slate-500 mt-1 leading-snug">
                Metrics calculated from live database payments & hospital records.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Middle Section: Revenue Overview & Payment Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Overview Line/Area Chart (7 cols) */}
        <Card className="lg:col-span-7 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Revenue Overview (INR ₹)</h2>
                <p className="text-xs text-slate-400">Monthly payment collection trend from database</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {loading ? (
                <div className="w-full h-full bg-slate-100 rounded-lg animate-pulse"></div>
              ) : revenueOverview.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                  <Activity className="w-8 h-8 mb-2 text-slate-300" />
                  No revenue records found for the selected period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueOverview} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                    />
                    <RechartsTooltip formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      dot={{ r: 4, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </Card>

        {/* Payment Status Distribution (5 cols) */}
        <Card className="lg:col-span-5 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Payment Status Distribution</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real transaction status breakdown</p>

            <div className="relative h-56 w-full mt-4 flex items-center justify-center">
              {loading ? (
                <div className="w-full h-full bg-slate-100 rounded-lg animate-pulse"></div>
              ) : pieChartData.length === 0 ? (
                <div className="text-slate-400 text-xs">No payment status records</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={82}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val, name) => [`${val} Payments`, name]} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-slate-900">{totalStatusCount}</span>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Transactions</span>
                  </div>
                </>
              )}
            </div>

            {/* Status Legends */}
            <div className="space-y-2 mt-4 px-2">
              {pieChartData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                    <span className="font-medium text-slate-700">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {entry.value} ({entry.percentage}) — ₹{(entry.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Section: Top Hospitals by Revenue */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Hospital Revenue Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Actual revenue generated per onboarded hospital tenant</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : revenueByHospital.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No hospital revenue transactions recorded for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Hospital Name</th>
                  <th className="py-3 px-4 text-center">Transactions</th>
                  <th className="py-3 px-4 text-right">Total Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {revenueByHospital.map((hospital) => (
                  <tr key={hospital.hospitalId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div>{hospital.hospitalName}</div>
                        {hospital.hospitalCode && (
                          <div className="text-xs text-slate-400 font-normal">Code: {hospital.hospitalCode}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                      {hospital.transactionCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ₹{(hospital.revenue || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Analytics;
