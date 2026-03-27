import { ReceiptData } from '../types';
import { formatCurrency } from '../utils/receiptUtils';

interface ReceiptProps {
  receiptData: ReceiptData;
  showActions?: boolean;
  onPrint?: () => void;
  onDownload?: () => void;
  onClose?: () => void;
}

export default function Receipt({
  receiptData,
  showActions = false,
  onPrint,
  onDownload,
  onClose
}: ReceiptProps) {
  const { id, transactionNumber, date, type, customerName, items, subtotal, tax, total, notes } = receiptData;

  const getTypeBadgeColor = () => {
    switch (type) {
      case 'SALE':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'RESTOCK':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'RETURN':
        return 'bg-gradient-to-r from-orange-500 to-red-500';
      case 'ADJUSTMENT':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Receipt Content - This is what gets printed */}
      <div id={`receipt-${id}`} className="bg-white rounded-xl border-2 border-border-light overflow-hidden">
        {/* Header */}
        <div className="receipt-header text-center py-6 px-4 border-b-2 border-dashed border-border-medium">
          <h1 className="company-name font-orbitron text-2xl font-bold text-text-primary mb-1">
            Carangian Variety Store
          </h1>
          <p className="text-xs text-text-muted font-rajdhani">San Jose, Northern Samar | 09985464005</p>
          <div className="mt-3">
            <span className={`inline-block px-4 py-1.5 rounded-lg text-xs font-bold font-rajdhani text-white ${getTypeBadgeColor()}`}>
              {type} RECEIPT
            </span>
          </div>
        </div>

        {/* Receipt Info */}
        <div className="receipt-body px-4 py-4">
          <div className="info-row">
            <span className="text-text-muted font-rajdhani font-semibold">Receipt #:</span>
            <span className="text-text-primary font-rajdhani font-bold">{transactionNumber}</span>
          </div>
          <div className="info-row">
            <span className="text-text-muted font-rajdhani font-semibold">Date:</span>
            <span className="text-text-secondary font-rajdhani">{date}</span>
          </div>
          {customerName && (
            <div className="info-row">
              <span className="text-text-muted font-rajdhani font-semibold">Customer:</span>
              <span className="text-text-primary font-rajdhani font-bold">{customerName}</span>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="px-4">
          <table className="items-table w-full">
            <thead>
              <tr>
                <th className="text-left text-xs font-rajdhani font-bold text-text-secondary uppercase">Item</th>
                <th className="text-center text-xs font-rajdhani font-bold text-text-secondary uppercase">Qty</th>
                <th className="text-right text-xs font-rajdhani font-bold text-text-secondary uppercase">Price</th>
                <th className="text-right text-xs font-rajdhani font-bold text-text-secondary uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="text-left">
                    <div className="font-rajdhani font-semibold text-text-primary text-sm">{item.name}</div>
                  </td>
                  <td className="text-center">
                    <span className="font-rajdhani font-bold text-text-secondary">{item.quantity}</span>
                  </td>
                  <td className="text-right">
                    <span className="font-rajdhani text-text-secondary">{formatCurrency(item.unitPrice)}</span>
                  </td>
                  <td className="text-right">
                    <span className="font-rajdhani font-bold text-text-primary">{formatCurrency(item.total)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="totals-section px-4 py-4 border-t-2 border-dashed border-border-medium">
          <div className="total-row">
            <span className="text-text-muted font-rajdhani font-semibold">Subtotal:</span>
            <span className="font-rajdhani text-text-secondary">{formatCurrency(subtotal)}</span>
          </div>
          <div className="total-row">
            <span className="text-text-muted font-rajdhani font-semibold">Tax (0%):</span>
            <span className="font-rajdhani text-text-secondary">{formatCurrency(tax)}</span>
          </div>
          <div className="total-row grand-total">
            <span className="text-text-primary font-rajdhani font-bold">TOTAL:</span>
            <span className="font-orbitron text-xl font-bold text-neon-blue">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className="px-4 py-3">
            <div className="text-xs text-text-muted font-rajdhani font-semibold uppercase mb-1">Notes:</div>
            <p className="text-sm text-text-secondary font-rajdhani">{notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="receipt-footer text-center py-4 px-4 border-t-2 border-dashed border-border-medium mt-2">
          <p className="thank-you font-orbitron text-base font-bold text-text-primary">
            THANK YOU!
          </p>
          <p className="footer-note font-rajdhani text-xs text-text-muted mt-1">
            Transaction recorded in Inventory Management System
          </p>
          <div className="barcode mt-3">
            <div className="barcode-text font-rajdhani text-xs text-text-muted">
              {transactionNumber}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex gap-3 mt-6">
          {onPrint && (
            <button
              onClick={onPrint}
              className="btn-primary flex-1 px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-rajdhani font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className="btn-secondary flex-1 px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-rajdhani font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="btn-secondary px-4 py-3 rounded-xl font-rajdhani font-semibold"
            >
              Close
            </button>
          )}
        </div>
      )}
    </div>
  );
}
