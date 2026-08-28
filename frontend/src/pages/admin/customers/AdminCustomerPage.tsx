import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  Search,
  Filter,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Plus,
} from 'lucide-react';
import { Customer, Branch } from '../../../types';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useAdminBranch } from '../../../context/AdminBranchContext';
import { useToast } from '../../../context/ToastContext';
import api from '../../../api/client';

export const AdminCustomerPage: React.FC = () => {
  const { branches, selectedBranchId } = useAdminBranch();
  const { success, error: toastError } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>(selectedBranchId?.toString() || 'all');

  // Add Customer Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addName, setAddName] = useState<string>('');
  const [addPhone, setAddPhone] = useState<string>('');
  const [addEmail, setAddEmail] = useState<string>('');
  const [addCity, setAddCity] = useState<string>('');
  const [addAddress, setAddAddress] = useState<string>('');
  const [addBranchId, setAddBranchId] = useState<string>('1');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, any> = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (branchFilter !== 'all') params.branch_id = parseInt(branchFilter);

      const res = await api.get<Customer[]>('/api/v1/admin/customers', { params });
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
      toastError('Failed to fetch customer directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, branchFilter]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post('/api/v1/admin/customers', {
        branch_id: parseInt(addBranchId),
        full_name: addName.trim(),
        phone: addPhone.trim(),
        email: addEmail.trim() || undefined,
        city: addCity.trim() || undefined,
        address: addAddress.trim() || undefined,
      });
      success(`Customer ${addName} registered successfully.`);
      setShowAddModal(false);
      setAddName('');
      setAddPhone('');
      setAddEmail('');
      setAddCity('');
      setAddAddress('');
      fetchCustomers();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to register customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EBE6DC] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#526F91] bg-[#EDF2F8] px-2.5 py-1 rounded-full border border-[#C6D4E3]">
              Enterprise CRM Hub
            </span>
            <span className="text-xs text-[#8A8479] font-medium">{customers.length} Registered Patrons</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1D1D1B] tracking-tight mt-1">
            Customer Directory (All Branches)
          </h1>
          <p className="text-xs text-[#8A8479] font-medium mt-0.5">
            Centralized patron records, relationship profiles, and showroom footfall tracking
          </p>
        </div>

        <Button onClick={() => setShowAddModal(true)} icon={<Plus className="w-4 h-4" />}>
          + Register Customer
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-[#E4DFD4] rounded-2xl shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8A8479] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers by name, phone number, or city..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs text-[#1D1D1B] placeholder-[#8A8479] focus:outline-none focus:border-[#7E22CE]"
          />
        </div>

        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="px-3 py-2 bg-[#FAF8F3] border border-[#E4DFD4] rounded-xl text-xs font-bold text-[#1D1D1B] focus:outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="all">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id.toString()}>
              {b.name} Showroom
            </option>
          ))}
        </select>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-[#E4DFD4] rounded-3xl p-6 shadow-[0_4px_18px_rgba(40,35,25,0.045)]">
        {isLoading ? (
          <LoadingSpinner message="Loading customer directory..." />
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="No customer records matched your query."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF8F3] border-b border-[#E4DFD4] text-[#5E5A52] uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">City / Area</th>
                  <th className="px-4 py-3">Origin Showroom</th>
                  <th className="px-4 py-3 text-right">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DC] font-medium">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF8F3] transition-colors">
                    <td className="px-4 py-3.5 font-bold text-[#1D1D1B]">{c.full_name}</td>
                    <td className="px-4 py-3.5 font-mono text-[#8A8479]">{c.phone}</td>
                    <td className="px-4 py-3.5 text-[#5E5A52]">{c.email || '—'}</td>
                    <td className="px-4 py-3.5 text-[#5E5A52]">{c.city || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-[#FAF8F3] border border-[#D8B4FE] text-[#7E22CE] font-bold text-[10px]">
                        {c.branch_name || 'Showroom'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-[#8A8479] font-mono">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          title="Register Customer"
        >
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <Input
              label="Customer Full Name"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="e.g. Smt. Lakshmi Devi"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Phone Number"
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                placeholder="e.g. 9845012345"
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="e.g. lakshmi@gmail.com"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="City / Locality"
                value={addCity}
                onChange={(e) => setAddCity(e.target.value)}
                placeholder="e.g. Bangalore"
              />
              <Select
                label="Registered Showroom Branch"
                value={addBranchId}
                onChange={(e) => setAddBranchId(e.target.value)}
                options={branches.map((b) => ({ value: b.id.toString(), label: `${b.name} Showroom` }))}
              />
            </div>

            <Input
              label="Physical Address"
              value={addAddress}
              onChange={(e) => setAddAddress(e.target.value)}
              placeholder="Street, Landmark, Pincode"
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EBE6DC]">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Save Customer
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
