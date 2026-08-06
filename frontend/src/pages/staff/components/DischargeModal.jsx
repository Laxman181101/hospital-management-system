import React, { useState, useRef } from 'react';
import { X, FileText, Printer, AlertCircle, CheckCircle, Receipt, DollarSign, Edit } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import api from '../../../services/api';
import { useToast } from '../../../context/ToastContext';

const DischargeModal = ({ admission, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  
  // 'confirm' -> 'review' -> 'done'
  const [step, setStep] = useState('confirm');
  
  // Billing States
  const [draftBill, setDraftBill] = useState(null);
  const [billingError, setBillingError] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountAmount, setDiscountAmount] = useState(0);
  
  const printRef = useRef();

  const lengthOfStay = Math.max(1, Math.ceil((new Date() - new Date(admission.admissionDate)) / (1000 * 60 * 60 * 24)));

  const handleDischarge = async () => {
    setLoading(true);
    try {
      const res = await api.patch(`/api/v1/ward/admissions/${admission._id}/discharge`, {
        dischargeNotes: notes
      });
      
      const bill = res.data?.data?.draftBill || res.data?.draftBill;
      const error = res.data?.errors;
      
      setDraftBill(bill);
      if (bill?.discount) setDiscountAmount(bill.discount);
      setBillingError(error);
      
      showToast('Patient discharged successfully', 'success');
      
      if (onSuccess) onSuccess();
      setStep('review');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to discharge patient', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentStatus = async (status) => {
    if (!draftBill) return;
    setPaymentLoading(true);
    try {
      await api.patch(`/api/v1/billing/${draftBill._id}/payment`, { 
        paymentStatus: status, 
        paymentMethod,
        discount: Number(discountAmount) || 0
      });
      setDraftBill(prev => ({
        ...prev, 
        discount: Number(discountAmount) || 0,
        payableAmount: Math.max(0, prev.totalAmount - (Number(discountAmount) || 0) + (prev.tax || 0))
      }));
      showToast(`Bill marked as ${status.replace('_', ' ')}`, 'success');
      setStep('done');
    } catch (err) {
      showToast('Failed to update payment status', 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  if (step === 'done') {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-indigo-50">
            <h3 className="text-lg font-bold text-indigo-900">Discharge Summary</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="p-8 overflow-y-auto" ref={printRef}>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Hospital Discharge Summary</h1>
              <p className="text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Patient Details</h4>
                <p className="text-lg font-medium text-slate-900">{admission.patient?.name}</p>
                <p className="text-slate-600">ID: {admission.patient?._id}</p>
                <p className="text-slate-600">Gender: {admission.patient?.gender || 'N/A'}</p>
                <p className="text-slate-600">Contact: {admission.patient?.phone || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Admission Details</h4>
                <p className="text-slate-600"><span className="font-medium text-slate-900">Ward:</span> {admission.ward?.wardName}</p>
                <p className="text-slate-600"><span className="font-medium text-slate-900">Bed:</span> {admission.bedNumber}</p>
                <p className="text-slate-600"><span className="font-medium text-slate-900">Admitted:</span> {new Date(admission.admissionDate).toLocaleDateString()}</p>
                <p className="text-slate-600"><span className="font-medium text-slate-900">Discharged:</span> {new Date().toLocaleDateString()}</p>
                <p className="text-slate-600"><span className="font-medium text-slate-900">Length of Stay:</span> {lengthOfStay} days</p>
              </div>
            </div>

            <div className="mb-8 border-t border-slate-100 pt-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Primary Care Team</h4>
              <p className="text-slate-600"><span className="font-medium text-slate-900">Doctor in Charge:</span> Dr. {admission.primaryDoctor?.firstName || ''} {admission.primaryDoctor?.lastName || 'Unassigned'}</p>
              <p className="text-slate-600"><span className="font-medium text-slate-900">Primary Nurse:</span> {admission.primaryNurse?.firstName || 'Unassigned'}</p>
            </div>
            
            <div className="mb-8 border-t border-slate-100 pt-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Discharge Notes</h4>
              <p className="text-slate-700 whitespace-pre-wrap">{notes || 'No specific discharge notes provided.'}</p>
            </div>
          </div>
          
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={handlePrint}><Printer className="w-4 h-4 mr-2" /> Print Summary</Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-teal-50 text-teal-900">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-bold">Discharge Bill — {admission.patient?.name}</h3>
            </div>
            <button onClick={onClose} className="text-teal-600 hover:text-teal-800"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm text-slate-500">Invoice {draftBill?.invoiceNumber || 'Draft'}</p>
                <p className="font-medium text-slate-900">{admission.ward?.wardName} - Bed {admission.bedNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Length of Stay</p>
                <p className="font-bold text-slate-900">{lengthOfStay} Days</p>
              </div>
            </div>

            {billingError || !draftBill ? (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-center">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-amber-900 mb-2">Automatic bill calculation failed</h4>
                <p className="text-amber-700 mb-4">{billingError?.message || "Could not generate draft bill. The patient has been discharged in the system."}</p>
                <Button onClick={() => window.location.href = '/staff/billing'}>Go to Billing to Create Manually</Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-4 font-medium">Description</th>
                        <th className="p-4 font-medium text-center">Qty</th>
                        <th className="p-4 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {draftBill.items?.map((item, idx) => (
                        <tr key={idx} className={item.amount < 0 ? 'bg-green-50/30' : ''}>
                          <td className="p-4 flex items-center gap-2">
                            {item.amount < 0 ? <CheckCircle className="w-4 h-4 text-green-500"/> : null}
                            <span className={item.amount < 0 ? 'text-green-700 font-medium' : 'text-slate-700'}>{item.description}</span>
                          </td>
                          <td className="p-4 text-center">{item.quantity}</td>
                          <td className={`p-4 text-right font-medium ${item.amount < 0 ? 'text-green-600' : 'text-slate-900'}`}>
                            {item.amount < 0 ? '-' : ''}₹{Math.abs(item.amount)}
                          </td>
                        </tr>
                      ))}
                      {draftBill.items?.length === 0 && (
                        <tr>
                          <td colSpan="3" className="p-8 text-center text-slate-500 italic">No line items found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  
                  <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Discount:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">₹</span>
                          <input 
                            type="number" 
                            min="0"
                            className="w-20 px-2 py-1 text-right border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-teal-400"
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Tax:</span>
                        <span className="font-medium text-slate-700">₹{draftBill.tax || 0}</span>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Final Payable Amount</p>
                      <p className="text-4xl font-black text-teal-600">₹{Math.max(0, draftBill.totalAmount - (Number(discountAmount) || 0) + (draftBill.tax || 0))}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-3">Payment Collection</p>
                  <div className="flex flex-wrap gap-3 items-center">
                    <select 
                      value={paymentMethod} 
                      onChange={e => setPaymentMethod(e.target.value)} 
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white min-w-[150px]"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="insurance">Insurance</option>
                    </select>
                    <Button 
                      className="bg-teal-600 hover:bg-teal-700" 
                      onClick={() => handlePaymentStatus('paid')} 
                      disabled={paymentLoading}
                    >
                      {paymentLoading ? 'Processing...' : 'Mark Fully Paid'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-slate-300 text-slate-700 hover:bg-slate-50" 
                      onClick={() => { setStep('done'); }} 
                      disabled={paymentLoading}
                    >
                      Leave Unpaid — Bill Later
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Confirm Discharge
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900">
            <FileText className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold">Discharge Patient</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-indigo-50 p-4 rounded-xl">
            <p className="text-sm font-medium text-indigo-900 mb-1">{admission.patient?.name}</p>
            <div className="text-xs text-indigo-700 space-y-1">
              <p>Ward: {admission.ward?.wardName} • Bed: {admission.bedNumber}</p>
              <p>Admitted: {new Date(admission.admissionDate).toLocaleDateString()} ({lengthOfStay} days ago)</p>
            </div>
          </div>

          <div className="bg-amber-50 p-3 rounded-lg flex gap-3 items-start border border-amber-100">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Final Vitals Check</p>
              <p className="text-xs text-amber-700">Ensure the patient's vitals are recorded before completing discharge.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Discharge Notes / Summary</label>
            <textarea
              className="w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm px-4 py-2.5"
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Enter final notes, medications, or instructions..."
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button onClick={handleDischarge} disabled={loading}>{loading ? 'Discharging...' : 'Confirm Discharge'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DischargeModal;
