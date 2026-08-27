import React, { ReactNode } from 'react';

export interface TableProps {
  headers: ReactNode[];
  children: ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ headers, children, className = '' }) => {
  return (
    <div className={`w-full overflow-x-auto rounded-lg border border-neutral-200 bg-white ${className}`}>
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase tracking-wider text-xs font-semibold">
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className="px-4 py-3 whitespace-nowrap font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 text-black">{children}</tbody>
      </table>
    </div>
  );
};

export const TableRow: React.FC<{ children: ReactNode; className?: string; onClick?: () => void }> = ({
  children,
  className = '',
  onClick,
}) => (
  <tr
    onClick={onClick}
    className={`hover:bg-neutral-50 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </tr>
);

export const TableCell: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
