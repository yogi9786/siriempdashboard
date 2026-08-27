import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Building2, Compass } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export const EmployeeAddPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, selectedBranch } = useAuth();
  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    employee_code: '',
    phone: '',
    email: '',
    designation: 'Sales Executive',
    department: 'Sales Department',
    date_of_joining: new Date().toISOString().split('T')[0],
    status: 'active',
    is_outdoor_marketing_employee: false,
    profile_photo_url: '',
    notes: '',
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'department') {
      const isOutdoor = value === 'Outdoor Marketing';
      setFormData((prev) => ({
        ...prev,
        department: value,
        is_outdoor_marketing_employee: isOutdoor,
        designation: isOutdoor && prev.designation === 'Sales Executive' ? 'Field Marketing Executive' : prev.designation,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      setErrorMessage('Please enter the employee full name.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const isOutdoor = formData.department === 'Outdoor Marketing' || formData.is_outdoor_marketing_employee;

      const res = await api.post('/api/v1/employees', {
        full_name: formData.full_name.trim(),
        employee_code: formData.employee_code.trim() || null,
        phone: formData.phone.trim() || '',
        email: formData.email.trim() || null,
        designation: formData.designation.trim() || (isOutdoor ? 'Field Marketing Executive' : 'Sales Executive'),
        department: formData.department.trim() || 'Sales Department',
        date_of_joining: formData.date_of_joining || null,
        status: formData.status || 'active',
        is_outdoor_marketing_employee: isOutdoor,
        profile_photo_url: formData.profile_photo_url.trim() || null,
        notes: formData.notes.trim() || null,
      });

      success(`Employee ${res.data.full_name} added successfully.`);
      navigate(`/employees/${res.data.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to create employee.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Back Link & Heading */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/employees')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A857A] hover:text-[#536B8A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Employees</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF2F7] border border-[#C5D5E6] text-xs font-bold text-[#536B8A]">
          <Building2 className="w-3.5 h-3.5" />
          <span>Showroom: {selectedBranch?.name || user?.branch_name || 'Showroom'}</span>
        </div>
      </div>

      <div className="bg-white border border-[#E6E2D8] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1A] tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EDF2F7] border border-[#C5D5E6] text-[#536B8A] flex items-center justify-center font-bold shadow-2xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <span>Add New Employee</span>
          </h1>
          <p className="text-xs text-[#8A857A] font-medium mt-1">
            Register a staff member in <span className="font-semibold text-[#1C1C1A]">{selectedBranch?.name || user?.branch_name || 'Showroom'}</span>. Default department is auto-set to <span className="font-semibold text-[#1C1C1A]">Sales Department</span>.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-[#FDECEC] border border-[#F9C3C3] text-[#C24141] text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Name & ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Employee Full Name *"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g. THAGGELLAPPA"
              required
              autoFocus
            />

            <Input
              label="Employee ID Code (Optional)"
              name="employee_code"
              value={formData.employee_code}
              onChange={handleChange}
              placeholder="Auto-generated if left blank"
            />
          </div>

          {/* Row 2: Department & Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Department *"
              name="department"
              value={formData.department}
              onChange={handleChange}
              options={[
                { value: 'Sales Department', label: 'Sales Department (Default)' },
                { value: 'Marketing', label: 'Marketing' },
                { value: 'Outdoor Marketing', label: 'Outdoor Marketing' },
              ]}
            />

            <Input
              label="Designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              placeholder="e.g. Sales Executive"
            />
          </div>

          {/* Outdoor Marketing Note Banner */}
          {formData.department === 'Outdoor Marketing' && (
            <div className="p-3 rounded-xl bg-[#E8F4EE] border border-[#C5E3D5] flex items-center gap-2.5 text-xs text-[#23815F] font-semibold">
              <Compass className="w-4 h-4 text-[#23815F] shrink-0" />
              <span>Marked as Field Marketer • Target areas, customer leads, and schemes can be assigned.</span>
            </div>
          )}

          {/* Row 3: Joining Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date of Joining"
              name="date_of_joining"
              type="date"
              value={formData.date_of_joining}
              onChange={handleChange}
            />

            <Select
              label="Status *"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'active', label: 'Active Staff' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>

          {/* Row 4: Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#EFECE3]">
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. 9845112233"
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. staff@sirisamruddhigold.com"
            />
          </div>

          {/* Row 5: Notes & Photo URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Showroom Remarks (Optional)"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="e.g. Counter #1 Gold Section"
            />

            <Input
              label="Profile Photo URL (Optional)"
              name="profile_photo_url"
              value={formData.profile_photo_url}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EFECE3]">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/employees')}
            >
              Cancel
            </Button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#536B8A] hover:bg-[#435770] text-white text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save & Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
