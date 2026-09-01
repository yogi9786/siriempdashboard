import { CustomerActivity, CustomerDetailItem } from '../types';

/**
 * Parses the breakdown string (JSON array or legacy pipe-delimited text)
 * into a structured array of CustomerDetailItem.
 */
export const parseCustomerBreakdown = (
  breakdownStr?: string | null,
  fallbackCount: number = 1,
  defaultStatus: string = 'Walkin',
  fallbackName?: string,
  fallbackPhone?: string,
  fallbackDob?: string,
  fallbackAnniv?: string,
  fallbackVal?: number
): CustomerDetailItem[] => {
  if (fallbackCount === 0) return [];

  if (breakdownStr && breakdownStr.trim()) {
    try {
      const parsed = JSON.parse(breakdownStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          id: item.id || idx + 1,
          name: item.name || '',
          phone: item.phone || '',
          dob: item.dob || '',
          anniversary: item.anniversary || '',
          status: item.status || defaultStatus || 'Walkin',
          product_value: item.product_value !== undefined && item.product_value !== null ? item.product_value : '',
          notes: item.notes || '',
        }));
      }
    } catch {
      // Legacy pipe-separated breakdown string format
      const parts = breakdownStr.split('|').map((s) => s.trim());
      if (parts.length > 0) {
        return parts.map((part, idx) => {
          let st = part;
          const colonIdx = part.indexOf(':');
          if (colonIdx !== -1) {
            st = part.substring(colonIdx + 1).trim();
          }
          return {
            id: idx + 1,
            name: idx === 0 && fallbackName && !fallbackName.startsWith('Customer Interaction') ? fallbackName : '',
            phone: idx === 0 ? fallbackPhone || '' : '',
            dob: idx === 0 ? fallbackDob || '' : '',
            anniversary: idx === 0 ? fallbackAnniv || '' : '',
            status: st || defaultStatus || 'Walkin',
            product_value: idx === 0 && fallbackVal ? fallbackVal : '',
            notes: '',
          };
        });
      }
    }
  }

  // Fallback generation based on count
  return Array.from({ length: Math.max(1, fallbackCount) }, (_, i) => ({
    id: i + 1,
    name: i === 0 && fallbackName && !fallbackName.startsWith('Customer Interaction') ? fallbackName : '',
    phone: i === 0 ? fallbackPhone || '' : '',
    dob: i === 0 ? fallbackDob || '' : '',
    anniversary: i === 0 ? fallbackAnniv || '' : '',
    status: defaultStatus || 'Walkin',
    product_value: i === 0 && fallbackVal ? fallbackVal : '',
    notes: '',
  }));
};

/**
 * Export customer activity list to a CSV spreadsheet file.
 */
export const exportCustomerActivitiesToCSV = (
  activities: CustomerActivity[],
  filenamePrefix: string = 'Siri_Samruddhi_Customers'
) => {
  const rows: string[][] = [
    [
      'Activity ID',
      'Activity Date',
      'Showroom Branch',
      'Employee Code',
      'Employee Name',
      'Customer Number / Sequence',
      'Customer Name',
      'Phone Number',
      'Date of Birth (DOB)',
      'Anniversary Date',
      'Status / Outcome',
      'Product Value (INR)',
      'Customer Notes',
      'Overall Activity Notes',
    ],
  ];

  activities.forEach((act) => {
    const items = parseCustomerBreakdown(
      act.breakdown,
      act.customers_count || 1,
      act.status,
      act.customer_name,
      act.phone_number,
      act.dob,
      act.anniversary,
      act.product_value
    );

    if (items.length === 0) {
      // 0 customer count record
      rows.push([
        act.id.toString(),
        act.activity_date || '',
        act.branch_name || act.branch_code || '',
        act.employee_code || '',
        act.employee_name || '',
        '0',
        act.customer_name || 'No Walk-in',
        act.phone_number || '',
        act.dob || '',
        act.anniversary || '',
        act.status || 'Walkin',
        (act.product_value || 0).toString(),
        '',
        act.notes || '',
      ]);
    } else {
      items.forEach((item, idx) => {
        rows.push([
          act.id.toString(),
          act.activity_date || '',
          act.branch_name || act.branch_code || '',
          act.employee_code || '',
          act.employee_name || '',
          `Customer #${idx + 1}`,
          item.name || (idx === 0 ? act.customer_name || 'Walk-in Customer' : `Customer #${idx + 1}`),
          item.phone || (idx === 0 ? act.phone_number || '' : ''),
          item.dob || (idx === 0 ? act.dob || '' : ''),
          item.anniversary || (idx === 0 ? act.anniversary || '' : ''),
          item.status || act.status || 'Walkin',
          (item.product_value !== '' && item.product_value !== undefined ? item.product_value : idx === 0 ? act.product_value || 0 : 0).toString(),
          item.notes || '',
          idx === 0 ? act.notes || '' : '',
        ]);
      });
    }
  });

  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = (cell ?? '').toString().replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    )
    .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Returns a human-friendly string summary of customer breakdown without any raw JSON.
 */
export const formatCleanBreakdownText = (
  breakdownStr?: string | null,
  fallbackStatus: string = 'Attended'
): string => {
  if (!breakdownStr || !breakdownStr.trim()) return fallbackStatus;
  const trimmed = breakdownStr.trim();
  
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const items = parseCustomerBreakdown(trimmed, 1, fallbackStatus);
      if (items && items.length > 0) {
        const summaries = items
          .filter((it) => it.name || it.status)
          .map((it) => (it.name ? `${it.name} (${it.status})` : it.status));
        if (summaries.length > 0) {
          return summaries.slice(0, 3).join(', ');
        }
      }
    } catch {
      return fallbackStatus;
    }
  }

  // If text contains raw JSON markers, sanitize
  if (trimmed.includes('{') || trimmed.includes('[')) {
    return fallbackStatus;
  }

  return trimmed;
};
