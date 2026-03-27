
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Generates a unique transaction number
 * Format: RCP-XXXX (4-digit random number)
 */
export function generateTransactionNumber(): string {
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random
  return `RCP-${random}`;
}

/**
 * Formats a date for display on receipt
 */
export function formatReceiptDate(date: Date): string {
  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Formats currency for Philippine Peso
 */
export function formatCurrency(amount: number): string {
  return `₱${amount.toFixed(2)}`;
}

/**
 * Prints the receipt using browser's print dialog
 */
export function printReceipt(receiptId: string): void {
  const printContent = document.getElementById(receiptId);
  if (!printContent) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print receipts');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${generateTransactionNumber()}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Rajdhani:wght@400;600;700&display=swap');

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Rajdhani', sans-serif;
            background: #fff;
            color: #1a1a1a;
            line-height: 1.5;
          }

          .receipt-container {
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
          }

          .receipt-header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 15px;
            margin-bottom: 15px;
          }

          .company-name {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 2px;
            margin-bottom: 5px;
          }

          .receipt-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
          }

          .receipt-info {
            font-size: 12px;
            color: #666;
          }

          .receipt-body {
            margin-bottom: 15px;
          }

          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }

          .items-table th {
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 8px 0;
            border-bottom: 2px solid #000;
          }

          .items-table td {
            padding: 8px 0;
            font-size: 12px;
            border-bottom: 1px dashed #ddd;
          }

          .items-table .text-right {
            text-align: right;
          }

          .items-table .text-center {
            text-align: center;
          }

          .totals-section {
            border-top: 2px dashed #000;
            padding-top: 15px;
            margin-top: 15px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 12px;
          }

          .total-row.grand-total {
            font-size: 16px;
            font-weight: 700;
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 10px;
          }

          .receipt-footer {
            text-align: center;
            border-top: 2px dashed #000;
            padding-top: 15px;
            margin-top: 15px;
          }

          .thank-you {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
          }

          .footer-note {
            font-size: 10px;
            color: #666;
          }

          .barcode {
            margin: 15px 0;
            text-align: center;
          }

          .barcode-text {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            letter-spacing: 3px;
          }

          @media print {
            body {
              background: #fff;
            }

            .receipt-container {
              max-width: 100%;
              padding: 0;
            }

            @page {
              margin: 10mm;
              size: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          ${printContent.innerHTML}
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

/**
 * Downloads receipt as PDF
 */
export async function downloadReceiptAsPDF(receiptId: string, transactionNumber: string): Promise<void> {
  const printContent = document.getElementById(receiptId);
  if (!printContent) return;

  try {
    const canvas = await html2canvas(printContent, {
      scale: 3,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      imageTimeout: 0,
      removeContainer: true,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(`Receipt-${transactionNumber}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
}

/**
 * Downloads receipt as PNG image
 */
export async function downloadReceiptAsImage(receiptId: string, transactionNumber: string): Promise<void> {
  const printContent = document.getElementById(receiptId);
  if (!printContent) return;

  try {
    const canvas = await html2canvas(printContent, {
      scale: 3,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      imageTimeout: 0,
      removeContainer: true,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `Receipt-${transactionNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error generating image:', error);
    alert('Failed to generate image. Please try again.');
  }
}
