/**
 * Indian Rupee (INR) and Number Formatters for Siri Samruddhi Gold Palace
 */

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCurrencyWithDecimals = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};

export const formatWeight = (grams: number | null | undefined): string => {
  if (grams === null || grams === undefined || isNaN(grams)) return '0.00 g';
  return `${grams.toFixed(2)} g`;
};

export const formatPercent = (percent: number | null | undefined): string => {
  if (percent === null || percent === undefined || isNaN(percent)) return '0.0%';
  return `${percent.toFixed(1)}%`;
};

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

export const getScoreBadgeColor = (score: number): { bg: string; text: string; label: string } => {
  if (score >= 85) {
    return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', label: 'Exceptional' };
  } else if (score >= 70) {
    return { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700', label: 'Strong' };
  } else if (score >= 50) {
    return { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', label: 'Average' };
  } else {
    return { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700', label: 'Needs Improvement' };
  }
};

export const getStatusBadgeColor = (status: string): { bg: string; text: string } => {
  switch (status.toLowerCase()) {
    case 'converted':
    case 'completed':
    case 'active':
    case 'success':
      return { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' };
    case 'pending':
    case 'interested':
    case 'medium':
      return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' };
    case 'overdue':
    case 'lost':
    case 'high':
    case 'danger':
      return { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' };
    case 'inactive':
    case 'cancelled':
    case 'low':
      return { bg: 'bg-charcoal-100 border-charcoal-200', text: 'text-charcoal-600' };
    default:
      return { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' };
  }
};

/**
 * Utility to export an array of JSON objects to CSV file in browser
 */
export const exportToCSV = (filename: string, rows: Record<string, any>[], columnHeaders?: Record<string, string>) => {
  if (!rows || !rows.length) return;

  const keys = Object.keys(rows[0]);
  const headers = columnHeaders
    ? keys.map((k) => columnHeaders[k] || k)
    : keys;

  const csvRows: string[] = [];
  csvRows.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

  for (const row of rows) {
    const values = keys.map((k) => {
      const val = row[k];
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
