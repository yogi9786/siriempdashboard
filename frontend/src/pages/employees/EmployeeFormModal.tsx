import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../context/ToastContext';
import { Compass, User, Briefcase, Phone, Sparkles } from 'lucide-react';
import api from '../../api/client';

export interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeToEdit?: any | null;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employeeToEdit,
}) => {
  const { success, error: toastError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    employee_code: '',
    full_name: '',
    phone: '',
    email: '',
    date_of_joining: new Date().toISOString().split('T')[0],
    designation: 'Sales Executive',
    department: 'Sales Department',
    status: 'active',
    is_outdoor_marketing_employee: false,
    profile_photo_url: '',
    notes: '',
  });

  useEffect(() => {
    if (employeeToEdit) {
      setFormData({
        employee_code: employeeToEdit.employee_code || '',
        full_name: employeeToEdit.full_name || '',
        phone: employeeToEdit.phone || '',
        email: employeeToEdit.email || '',
        date_of_joining: employeeToEdit.date_of_joining || new Date().toISOString().split('T')[0],
        designation: employeeToEdit.designation || 'Sales Executive',
        department: employeeToEdit.department || (employeeToEdit.is_outdoor_marketing_employee ? 'Outdoor Marketing' : 'Sales Department'),
        status: employeeToEdit.status || 'active',
        is_outdoor_marketing_employee: employeeToEdit.is_outdoor_marketing_employee || false,
        profile_photo_url: employeeToEdit.profile_photo_url || '',
        notes: employeeToEdit.notes || '',
      });
    } else {
      setFormData({
        employee_code: '',
        full_name: '',
        phone: '',
        email: '',
        date_of_joining: new Date().toISOString().split('T')[0],
        designation: 'Sales Executive',
        department: 'Sales Department',
        status: 'active',
        is_outdoor_marketing_employee: false,
        profile_photo_url: '',
        notes: '',
      });
    }
  }, [employeeToEdit, isOpen]);

  const handleDepartmentChange = (dept: string) => {
    const isOutdoor = dept === 'Outdoor Marketing';
    setFormData((prev) => ({
      ...prev,
      department: dept,
      is_outdoor_marketing_employee: isOutdoor,
      designation: isOutdoor && prev.designation === 'Sales Executive' ? 'Field Marketing Executive' : prev.designation,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toastError('Please enter the employee full name.');
      return;
    }

    setIsLoading(true);
    try {
      const isOutdoor = formData.department === 'Outdoor Marketing' || formData.is_outdoor_marketing_employee;

      const payload = {
        ...formData,
        full_name: formData.full_name.trim(),
        employee_code: formData.employee_code.trim() || undefined,
        phone: formData.phone.trim() || '',
        email: formData.email.trim() || null,
        designation: formData.designation.trim() || (isOutdoor ? 'Field Marketing Executive' : 'Sales Executive'),
        department: formData.department.trim() || 'Sales Department',
        is_outdoor_marketing_employee: isOutdoor,
        profile_photo_url: formData.profile_photo_url.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (employeeToEdit) {
        await api.put(`/api/v1/employees/${employeeToEdit.id}`, payload);
        success(`Staff member ${payload.full_name} updated successfully.`);
      } else {
        await api.post('/api/v1/employees', payload);
        success('Staff member registered successfully.');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to save employee profile.';
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeToEdit ? 'Edit Showroom Employee' : 'Register Showroom Employee'}
      subtitle={employeeToEdit ? `Updating profile for ${employeeToEdit.full_name}` : 'Add staff to showroom workforce roster'}
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isLoading}>
            {employeeToEdit ? 'Save Changes' : 'Register Employee'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Basic Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9A782F] pb-1 border-b border-[#EFECE3]">
            <User className="w-3.5 h-3.5 text-[#C6A45C]" />
            <span>Personal Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              placeholder="e.g. THAGGELLAPPA"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              autoFocus
            />
            <Input
              label="Badge Code (Optional)"
              placeholder="Auto-generated if left blank"
              value={formData.employee_code}
              onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
              disabled={!!employeeToEdit}
              helperText={employeeToEdit ? 'Badge code is locked' : 'Auto-generated if left blank'}
            />
          </div>
        </div>

        {/* Section 2: Role & Department */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9A782F] pb-1 border-b border-[#EFECE3]">
            <Briefcase className="w-3.5 h-3.5 text-[#C6A45C]" />
            <span>Role & Showroom Assignment</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Department *"
              value={formData.department}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              options={[
                { value: 'Sales Department', label: 'Sales Department (Floor Staff)' },
                { value: 'Marketing', label: 'Marketing' },
                { value: 'Outdoor Marketing', label: 'Outdoor Marketing (Field Rep)' },
              ]}
            />
            <Input
              label="Designation"
              placeholder="e.g. Sales Executive"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            />
          </div>

          {formData.department === 'Outdoor Marketing' && (
            <div className="p-3 rounded-xl bg-[#F4EEDC] border border-[#DFCFA6] flex items-center gap-2.5 text-xs text-[#9A782F] font-semibold">
              <Compass className="w-4 h-4 text-[#C6A45C] shrink-0" />
              <span>Marked as Field Marketer • Target areas, customer leads, and campaigns can be assigned.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Joining Date"
              type="date"
              value={formData.date_of_joining}
              onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
            />
            <Select
              label="Roster Status *"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'active', label: 'Active on Duty' },
                { value: 'inactive', label: 'Inactive / On Leave' },
              ]}
            />
          </div>
        </div>

        {/* Section 3: Contact & Remarks */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9A782F] pb-1 border-b border-[#EFECE3]">
            <Phone className="w-3.5 h-3.5 text-[#C6A45C]" />
            <span>Contact Details & Notes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              placeholder="e.g. 9845112233"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. staff@sirisamruddhi.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <Input
            label="Internal Notes (Optional)"
            placeholder="e.g. Counter #2 Gold Section"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
};
