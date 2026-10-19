import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { servicesApi } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Printer, CheckCircle, FileText, Wrench } from 'lucide-react';

export const ReceiptModal = ({ isOpen, onClose, jobId }) => {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && jobId) {
      setLoading(true);
      servicesApi.getReceipt(jobId)
        .then(res => setReceipt(res.data))
        .catch(err => console.error("Failed to load receipt:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, jobId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Garage Service Receipt & Inspection Summary" maxWidth="max-w-3xl">
      {loading ? (
        <div className="py-16"><LoadingSpinner size="lg" /></div>
      ) : !receipt ? (
        <div className="py-12 text-center text-xs text-slate-500">Receipt unavailable.</div>
      ) : (
        <div className="space-y-6 text-xs text-slate-800 print:text-black">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Wrench className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">TRACK AUTOMOTIVE</h2>
              </div>
              <p className="text-slate-500 text-[11px]">Automotive Maintenance & Diagnostic Center</p>
              <p className="text-slate-500 text-[11px]">Email: service@trackautomotive.com | Tel: +1 (555) 0100</p>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm font-bold bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                RECEIPT #{receipt.job_id}
              </span>
              <p className="text-slate-500 text-[11px] mt-1.5">Date: {receipt.date}</p>
            </div>
          </div>

          {/* Client & Vehicle Meta */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p className="font-semibold text-slate-900 uppercase text-[10px] tracking-wider mb-1">Customer</p>
              <p className="font-bold text-slate-900">{receipt.customer?.name}</p>
              <p className="text-slate-600">{receipt.customer?.email}</p>
              <p className="text-slate-600">{receipt.customer?.phone || 'No phone recorded'}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 uppercase text-[10px] tracking-wider mb-1">Vehicle Details</p>
              <p className="font-bold text-slate-900">
                {receipt.vehicle?.year} {receipt.vehicle?.make} {receipt.vehicle?.model}
              </p>
              <p className="font-mono text-slate-800">Plate: <strong>{receipt.vehicle?.license_plate}</strong></p>
              <p className="text-slate-600">Odometer: {receipt.vehicle?.current_mileage?.toLocaleString()} km</p>
            </div>
          </div>

          {/* Service Performed */}
          <div>
            <h4 className="font-bold text-slate-900 mb-1 text-xs">Service Package</h4>
            <p className="text-slate-700 bg-slate-100 p-2.5 rounded-lg">{receipt.title}</p>
            {receipt.action_taken && (
              <p className="text-slate-600 text-[11px] mt-2 whitespace-pre-line">
                <strong>Work Performed:</strong> {receipt.action_taken}
              </p>
            )}
          </div>

          {/* Replacement Parts Table */}
          {receipt.parts && receipt.parts.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 mb-2 text-xs">Parts & Materials Supplied</h4>
              <table className="w-full border border-slate-200 rounded-lg overflow-hidden text-left text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-2 font-semibold">Part Description</th>
                    <th className="p-2 font-semibold">Part Number</th>
                    <th className="p-2 text-center font-semibold">Qty</th>
                    <th className="p-2 text-right font-semibold">Unit Price</th>
                    <th className="p-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipt.parts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 font-medium">{p.name}</td>
                      <td className="p-2 font-mono text-slate-500 text-[11px]">{p.part_number || '—'}</td>
                      <td className="p-2 text-center">{p.quantity}</td>
                      <td className="p-2 text-right">${p.unit_price}</td>
                      <td className="p-2 text-right font-semibold">${p.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Inspection Items Checklist */}
          {receipt.inspections && receipt.inspections.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 mb-2 text-xs">Multipoint Inspection Results</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {receipt.inspections.map((insp, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{insp.item}</p>
                      <p className="text-[11px] text-slate-500">Result: {insp.result}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      insp.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' :
                      insp.status === 'ATTENTION' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {insp.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Service Advice */}
          {receipt.next_service?.advice && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                Next Service Recommendation
              </p>
              <p className="text-blue-800 text-xs">{receipt.next_service.advice}</p>
              {(receipt.next_service.next_km || receipt.next_service.next_date) && (
                <p className="text-[11px] text-blue-600 font-semibold mt-1">
                  Due: {receipt.next_service.next_km ? `${receipt.next_service.next_km.toLocaleString()} km` : ''} 
                  {receipt.next_service.next_km && receipt.next_service.next_date ? ' or ' : ''}
                  {receipt.next_service.next_date || ''} (whichever comes first)
                </p>
              )}
            </div>
          )}

          {/* Financial Breakdown */}
          <div className="border-t border-slate-200 pt-4 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Parts Subtotal:</span>
                <span className="font-medium">${receipt.financials?.parts_subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Labor Charge:</span>
                <span className="font-medium">${receipt.financials?.labor_fee}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax ({receipt.financials?.tax_rate}%):</span>
                <span className="font-medium">${receipt.financials?.tax_amount}</span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-blue-600">${receipt.financials?.total_amount_payable}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Payment Mode:</span>
                <span className="font-semibold text-slate-800">{receipt.financials?.payment_mode}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 print:hidden">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ReceiptModal;
