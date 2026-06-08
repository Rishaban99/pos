import type { SalesReceipt, TerminalSettings } from '../types';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(symbol: string, amount: number): string {
  return `${symbol}${amount.toFixed(2)}`;
}

function lineRow(label: string, value: string, bold = false): string {
  const weight = bold ? '700' : '600';
  return `
    <tr>
      <td style="padding:2px 0;font-weight:${weight};text-align:left;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:2px 0;font-weight:${weight};text-align:right;white-space:nowrap;vertical-align:top;">${escapeHtml(value)}</td>
    </tr>`;
}

function sectionTitle(title: string): string {
  return `<div class="section">${escapeHtml(title)}</div>`;
}

function divider(): string {
  return '<div class="rule"></div>';
}

export function buildThermalReceiptDocument(
  receipt: SalesReceipt,
  currencySymbol: string,
  options?: {
    printerType?: TerminalSettings['printerType'];
    stationId?: string;
  }
): string {
  const is58mm = options?.printerType === 'Thermal 58mm';
  const pageWidth = is58mm ? '58mm' : '80mm';
  const bodyWidth = is58mm ? '52mm' : '72mm';
  const baseFont = is58mm ? '11px' : '13px';
  const titleFont = is58mm ? '15px' : '18px';
  const totalFont = is58mm ? '14px' : '16px';

  const dateStr = new Date(receipt.timestamp).toLocaleString();
  const station = options?.stationId ? `Station: ${options.stationId}` : '';

  const roomLines = receipt.rooms
    .map((room) => {
      const nightly = room.pricePerNight + (room.boardPlanPricePerNight || 0);
      const lineTotal = nightly * room.nights - room.discountAmount;
      const board =
        room.boardPlan && room.boardPlan !== 'Room Only'
          ? `<div class="sub">Board: ${escapeHtml(room.boardPlan)}</div>`
          : '';
      const discount =
        room.discountAmount > 0
          ? `<div class="sub">Discount: -${money(currencySymbol, room.discountAmount)}</div>`
          : '';

      return `
        <div class="item">
          <table class="row">
            ${lineRow(`Rm ${room.roomNumber} - ${room.name}`, money(currencySymbol, lineTotal), true)}
          </table>
          <div class="sub">${room.nights} night${room.nights > 1 ? 's' : ''} x ${money(currencySymbol, nightly)}</div>
          ${board}
          ${discount}
        </div>`;
    })
    .join('');

  const foodLines = receipt.foods
    .map((food) => {
      const total = food.price * food.quantity;
      return `
        <div class="item">
          <table class="row">
            ${lineRow(food.name, money(currencySymbol, total), true)}
          </table>
          <div class="sub">Qty ${food.quantity} x ${money(currencySymbol, food.price)}</div>
        </div>`;
    })
    .join('');

  const amenityLines = (receipt.amenities ?? [])
    .map((amenity) => {
      const total = amenity.price * amenity.quantity;
      return `
        <div class="item">
          <table class="row">
            ${lineRow(amenity.name, money(currencySymbol, total), true)}
          </table>
          <div class="sub">Qty ${amenity.quantity} x ${money(currencySymbol, amenity.price)}</div>
        </div>`;
    })
    .join('');

  const roomsBase = receipt.rooms.reduce(
    (sum, room) => sum + (room.pricePerNight + (room.boardPlanPricePerNight || 0)) * room.nights,
    0
  );
  const foodServiceCharge =
    receipt.foodServiceCharge ?? (receipt.foodCharges > 0 ? receipt.foodCharges * 0.1 : 0);

  const totals = [
    roomsBase > 0 ? lineRow('Room Charges', money(currencySymbol, roomsBase)) : '',
    receipt.roomDiscount > 0
      ? lineRow('Room Discount', `-${money(currencySymbol, receipt.roomDiscount)}`)
      : '',
    receipt.foodCharges > 0 ? lineRow('Food Subtotal', money(currencySymbol, receipt.foodCharges)) : '',
    (receipt.amenityCharges ?? 0) > 0
      ? lineRow('Amenities', money(currencySymbol, receipt.amenityCharges ?? 0))
      : '',
    receipt.foodCharges > 0
      ? lineRow('Food Service Charge', money(currencySymbol, foodServiceCharge))
      : '',
    receipt.tax > 0 ? lineRow('Tax', money(currencySymbol, receipt.tax)) : '',
  ]
    .filter(Boolean)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Receipt ${escapeHtml(receipt.invoiceNumber)}</title>
  <style>
    @page {
      size: ${pageWidth} auto;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      color: #000 !important;
      background: transparent !important;
    }

    html, body {
      width: ${pageWidth};
      margin: 0;
      padding: 0;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: "Courier New", Courier, "Lucida Console", monospace;
      font-size: ${baseFont};
      font-weight: 700;
      line-height: 1.35;
      -webkit-font-smoothing: none;
      font-smooth: never;
      text-rendering: geometricPrecision;
    }

    .receipt {
      width: ${bodyWidth};
      margin: 0 auto;
      padding: 3mm 2mm 4mm;
    }

    .center { text-align: center; }

    .title {
      font-size: ${titleFont};
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .subtitle {
      font-size: ${baseFont};
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .meta {
      font-size: ${baseFont};
      font-weight: 600;
      margin-top: 2px;
    }

    .rule {
      border-top: 2px solid #000;
      margin: 6px 0;
    }

    .section {
      font-size: ${baseFont};
      font-weight: 700;
      text-transform: uppercase;
      margin: 8px 0 4px;
    }

    .item { margin-bottom: 6px; }

    .sub {
      font-size: ${baseFont};
      font-weight: 600;
      padding-left: 2px;
      margin-top: 1px;
    }

    table.row {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    table.row td:first-child { width: 68%; }
    table.row td:last-child { width: 32%; }

    table.totals {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin-top: 4px;
    }

    .grand {
      font-size: ${totalFont};
      font-weight: 700;
      margin-top: 4px;
    }

    .footer {
      margin-top: 8px;
      font-size: ${baseFont};
      font-weight: 700;
      text-transform: uppercase;
    }

    .thanks {
      margin-top: 6px;
      font-size: ${baseFont};
      font-weight: 600;
      text-transform: none;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="center">
      <div class="title">Luxe Haven Resort</div>
      <div class="subtitle">Front Desk &amp; Dining POS</div>
      <div class="meta">777 Hospitality Blvd, Suite A</div>
      <div class="meta">Tel: +1 (555) 019-2831</div>
      ${station ? `<div class="meta">${escapeHtml(station)}</div>` : ''}
    </div>

    ${divider()}

    <table class="row">
      ${lineRow('Invoice', receipt.invoiceNumber, true)}
      ${lineRow('Date', dateStr)}
      ${receipt.billNumber ? lineRow('Folio', receipt.billNumber, true) : ''}
      ${receipt.customer ? lineRow('Guest', receipt.customer.name, true) : ''}
      ${receipt.customer?.phone ? lineRow('Tel', receipt.customer.phone) : ''}
      ${lineRow('Payment', 'CASH', true)}
    </table>

    ${receipt.rooms.length > 0 ? `${divider()}${sectionTitle('Room Lodgings')}${roomLines}` : ''}
    ${receipt.foods.length > 0 ? `${divider()}${sectionTitle('Food & Beverages')}${foodLines}` : ''}
    ${(receipt.amenities ?? []).length > 0 ? `${divider()}${sectionTitle('Amenities')}${amenityLines}` : ''}

    ${divider()}

    <table class="totals">
      ${totals}
    </table>

    <table class="totals grand">
      ${lineRow('FINAL TOTAL', money(currencySymbol, receipt.total), true)}
      ${lineRow('Cash Tendered', money(currencySymbol, receipt.cashReceived), true)}
      ${lineRow('Change', money(currencySymbol, receipt.cashChange), true)}
    </table>

    ${divider()}

    <div class="center footer">PAID - CASH ONLY</div>
    <div class="center thanks">Thank you for visiting us!</div>
  </div>
</body>
</html>`;
}

export function printThermalReceipt(
  _receipt: SalesReceipt,
  _currencySymbol: string,
  _options?: {
    printerType?: TerminalSettings['printerType'];
    stationId?: string;
  }
): void {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=360,height=720');

  if (!printWindow) {
    window.print();
    return;
  }

  //const html = buildThermalReceiptDocument(receipt, currencySymbol, options);
  //printWindow.document.open();
  // printWindow.document.write(html);
  //printWindow.document.close();

  printWindow.onafterprint = () => {
    printWindow.close();
  };

  const triggerPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  printWindow.onload = triggerPrint;
  setTimeout(triggerPrint, 300);
}
