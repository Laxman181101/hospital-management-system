import React, { useState, useEffect } from 'react';
import { X, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import api from '../../../services/api';
import Skeleton from '../../../components/ui/Skeleton';
import EmptyState from '../../../components/ui/EmptyState';

const VitalsChartDrawer = ({ admission, onClose }) => {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVitals = async () => {
      try {
        // FIX: use correct endpoint GET /ward/admissions/:allocationId/vitals
        const res = await api.get(`/api/v1/ward/admissions/${admission._id}/vitals`);
        // Assuming the API returns an array of vitals, ordered by date or we should sort them
        const data = res.data?.data || [];
        setVitals(data.sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt)));
      } catch (err) {
        console.error('Failed to fetch vitals', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (admission?._id) {
      fetchVitals();
    }
  }, [admission]);

  const formatData = () => {
    return vitals.map(v => ({
      ...v,
      timeLabel: new Date(v.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateLabel: new Date(v.recordedAt).toLocaleDateString(),
      sys: v.bloodPressure ? parseInt(v.bloodPressure.split('/')[0]) : null,
      dia: v.bloodPressure ? parseInt(v.bloodPressure.split('/')[1]) : null,
    }));
  };

  const chartData = formatData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm">
          <p className="font-medium text-slate-900 mb-1">{label}</p>
          {payload.map(p => (
            <p key={p.dataKey} style={{ color: p.color }}>
              {p.name}: <span className="font-medium">{p.value}</span> {p.unit}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[60] w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-indigo-50">
        <div>
          <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
            <Activity className="w-5 h-5" /> Vitals History
          </h3>
          <p className="text-xs text-indigo-700 mt-1">{admission.patient?.name || `${admission.patient?.firstName || ''} ${admission.patient?.lastName || ''}`.trim() || 'Patient'} (Bed {admission.bedNumber})</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white/50 p-2 rounded-full"><X className="w-5 h-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : vitals.length === 0 ? (
          <EmptyState icon={Activity} title="No Vitals Recorded" description="No vitals history found for this admission." />
        ) : (
          <>
            {/* Heart Rate Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div> Heart Rate (bpm)
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#94a3b8" fontSize={12} domain={['dataMin - 10', 'dataMax + 10']} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceArea y1={60} y2={100} fill="#f0fdf4" fillOpacity={0.5} strokeOpacity={0} />
                    <Line type="monotone" dataKey="heartRate" name="HR" stroke="#f43f5e" strokeWidth={3} activeDot={{ r: 6 }} unit="bpm" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SpO2 Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500"></div> Oxygen Saturation (%)
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#94a3b8" fontSize={12} domain={[85, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceArea y1={95} y2={100} fill="#f0fdf4" fillOpacity={0.5} strokeOpacity={0} />
                    <Line type="monotone" dataKey="oxygenSaturation" name="SpO2" stroke="#06b6d4" strokeWidth={3} activeDot={{ r: 6 }} unit="%" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Vitals History Table */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-4">Reading History</h4>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date & Time</th>
                      <th className="px-4 py-3 font-medium">BP</th>
                      <th className="px-4 py-3 font-medium">HR</th>
                      <th className="px-4 py-3 font-medium">SpO2</th>
                      <th className="px-4 py-3 font-medium">Temp</th>
                      <th className="px-4 py-3 font-medium">RR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...chartData].reverse().map((v, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-600">
                          <span className="font-medium">{v.dateLabel}</span> {v.timeLabel}
                        </td>
                        <td className="px-4 py-3 text-slate-900">{v.bloodPressure || '-'}</td>
                        <td className="px-4 py-3 text-slate-900">
                          <span className={v.heartRate > 100 || v.heartRate < 60 ? 'text-amber-600 font-medium' : ''}>{v.heartRate || '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-900">
                          <span className={v.oxygenSaturation < 95 ? 'text-amber-600 font-medium' : ''}>{v.oxygenSaturation ? `${v.oxygenSaturation}%` : '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-900">{v.temperature ? `${v.temperature}°C` : '-'}</td>
                        <td className="px-4 py-3 text-slate-900">{v.respiratoryRate || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VitalsChartDrawer;
