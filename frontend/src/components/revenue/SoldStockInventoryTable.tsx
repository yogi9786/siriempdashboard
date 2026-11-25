import React, { useState, useEffect } from 'react';
import {
  Tag,
  Search,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Scale,
  Sparkles,
  ShoppingBag,
  Building2,
} from 'lucide-react';
import api from '../../api/client';
import { StockProductCatalogItem } from '../../types';

interface SoldStockInventoryTableProps {
  branchCode?: string;
  dateFilter?: string;
  fromDate?: string;
  toDate?: string;
  initialSearch?: string;
}

export const SoldStockInventoryTable: React.FC<SoldStockInventoryTableProps> = ({
  branchCode,
  dateFilter = 'all',
  fromDate,
  toDate,
  initialSearch = '',
}) => {
  const [items, setItems] = useState<StockProductCatalogItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalSoldValue, setTotalSoldValue] = useState<number>(0);
  const [totalNetWeight, setTotalNetWeight] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>(initialSearch);
  const limit = 25;

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {
        page,
        limit,
      };
      if (branchCode && branchCode.toUpperCase() !== 'ALL') {
        params.branch_code = branchCode;
      }
      if (dateFilter && dateFilter !== 'all' && dateFilter !== 'custom') {
        params.date_filter = dateFilter;
      }
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/api/v1/products/sold/catalog', { params });
      setItems(res.data?.items || []);
      setTotalCount(res.data?.total_count || 0);
      setTotalSoldValue(res.data?.total_sold_value || 0);
      setTotalNetWeight(res.data?.total_net_weight || 0);
    } catch (err) {
      console.error('Failed to load sold stock inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [branchCode, dateFilter, fromDate, toDate, search]);

  useEffect(() => {
    fetchInventory();
  }, [branchCode, dateFilter, fromDate, toDate, page, search]);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="space-y-4">
      {/* Top Inventory Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-[#E4DFD4] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F4EE] border border-[#C5E3D5] flex items-center justify-center text-[#21845F] shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#8A8479] uppercase tracking-wider">
              Total Sold Items
            </div>
            <div className="text-xl font-black text-[#1D1D1B] font-mono">
              {totalCount.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#E4DFD4] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706] shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#8A8479] uppercase tracking-wider">
              Total Realized Revenue
            </div>
            <div className="text-xl font-black text-[#21845F] font-mono">
              ₹{Math.round(totalSoldValue).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#E4DFD4] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#8A8479] uppercase tracking-wider">
              Total Sold Net Weight
            </div>
            <div className="text-xl font-black text-[#1D1D1B] font-mono">
              {totalNetWeight.toFixed(3)} <span className="text-xs font-sans text-[#8A8479]">grams</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="bg-white border border-[#E4DFD4] rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#8A8479] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Tag No, Item Name, Staff..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl focus:outline-none focus:border-[#21845F] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-[#8A8479] font-medium whitespace-nowrap">
            Showing {totalCount === 0 ? 0 : (page - 1) * limit + 1} -{' '}
            {Math.min(page * limit, totalCount)} of {totalCount}
          </span>
          <button
            onClick={fetchInventory}
            className="p-1.5 rounded-lg border border-[#E4DFD4] bg-[#FAF8F3] hover:bg-[#F2EDE4] text-[#536B8A] transition-colors cursor-pointer"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl overflow-hidden shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F3] border-b border-[#EBE6DC] text-[#6B6559] uppercase font-bold text-[10px] tracking-wider whitespace-nowrap">
                <th className="px-4 py-3.5">Product ID (Tag)</th>
                <th className="px-4 py-3.5">Item Name & Specs</th>
                <th className="px-4 py-3.5">Purity / Type</th>
                <th className="px-4 py-3.5">Gross Wt (g)</th>
                <th className="px-4 py-3.5">Net Wt (g)</th>
                <th className="px-4 py-3.5">Making Charges (₹)</th>
                <th className="px-4 py-3.5">Counter</th>
                <th className="px-4 py-3.5">Sold Date</th>
                <th className="px-4 py-3.5">Sold Value (₹)</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Branch / Staff</th>
                <th className="px-4 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE1]">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="px-5 py-12 text-center text-[#8A8479]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#21845F]" />
                    <span className="block mt-2 font-semibold">Loading sold stock catalog...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-5 py-12 text-center text-[#8A8479]">
                    <p className="font-bold text-sm text-[#1D1D1B]">No sold stock records found.</p>
                    <p className="text-xs mt-1">
                      Try clearing search keywords or selecting a broader date filter.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#FAF9F5] transition-colors">
                    {/* Tag Number */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-xs text-[#1D1D1B] flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>#{prod.tag_no}</span>
                      </div>
                    </td>

                    {/* Item Name */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-extrabold text-[#1D1D1B] text-xs">
                        {prod.item_name}
                      </div>
                      {prod.sub_item && (
                        <div className="text-[10px] text-[#8A8479]">{prod.sub_item}</div>
                      )}
                    </td>

                    {/* Item Type / Purity */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                        {prod.item_type || '916'}
                      </span>
                    </td>

                    {/* Gross Weight */}
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                      {prod.gross_weight ? `${prod.gross_weight.toFixed(3)}g` : '—'}
                    </td>

                    {/* Net Weight */}
                    <td className="px-4 py-3 font-mono font-bold text-xs whitespace-nowrap text-[#1D1D1B]">
                      {prod.net_weight ? `${prod.net_weight.toFixed(3)}g` : '—'}
                    </td>

                    {/* Making Charges */}
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                      {prod.making_charges ? `₹${Math.round(prod.making_charges).toLocaleString('en-IN')}` : '—'}
                      {prod.mc_per_gram ? (
                        <span className="block text-[10px] text-[#8A8479]">₹{prod.mc_per_gram}/g</span>
                      ) : null}
                    </td>

                    {/* Counter */}
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-[#5E5A52]">
                      {prod.counter || '—'}
                    </td>

                    {/* Sold Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-bold text-[#1D1D1B]">
                        <Calendar className="w-3 h-3 text-[#536B8A]" />
                        <span>{prod.sold_date || '—'}</span>
                      </div>
                    </td>

                    {/* Sold Value */}
                    <td className="px-4 py-3 font-mono font-bold text-xs whitespace-nowrap text-[#21845F]">
                      {prod.sold_value ? `₹${Math.round(prod.sold_value).toLocaleString('en-IN')}` : '—'}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-[#1D1D1B] flex items-center gap-1">
                        <User className="w-3 h-3 text-[#536B8A]" />
                        <span>{prod.sold_customer_name || 'Customer'}</span>
                      </div>
                      {prod.sold_phone && (
                        <div className="text-[10px] font-mono text-[#536B8A] flex items-center gap-0.5">
                          <Phone className="w-2.5 h-2.5 text-[#21845F]" />
                          <span>{prod.sold_phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Branch & Staff */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-[#1D1D1B]">
                        <Building2 className="w-3 h-3 text-[#D97706]" />
                        <span>{prod.sold_branch_code || 'Showroom'}</span>
                      </div>
                      <div className="text-[10px] text-[#8A8479]">
                        {prod.sold_employee_name || 'Showroom Staff'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F4EE] text-[#21845F] border border-[#C5E3D5] inline-flex items-center gap-0.5">
                        SOLD
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3.5 bg-[#FAF8F3] border-t border-[#EBE6DC] flex items-center justify-between gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl border border-[#E4DFD4] bg-white hover:bg-[#FAF8F3] disabled:opacity-40 text-xs font-bold text-[#5E5A52] inline-flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-bold text-[#5E5A52]">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-xl border border-[#E4DFD4] bg-white hover:bg-[#FAF8F3] disabled:opacity-40 text-xs font-bold text-[#5E5A52] inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
