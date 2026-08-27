import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Users,
  MapPin,
  FileText,
  UserPlus,
  Plus,
  Search,
  Filter,
  Trash2,
  Phone,
  Calendar,
  Layers,
  Award,
  UserCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { KPICard } from '../../components/ui/KPICard';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  OutdoorMarketingOverview,
  OutdoorMarketingArea,
  OutdoorMarketingCustomer,
  OutdoorMarketingScheme,
  Employee,
} from '../../types';
import api from '../../api/client';

export const OutdoorMarketingPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [overview, setOverview] = useState<OutdoorMarketingOverview | null>(null);

  // Lists
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [outdoorEmployees, setOutdoorEmployees] = useState<Employee[]>([]);
  const [outdoorCustomers, setOutdoorCustomers] = useState<OutdoorMarketingCustomer[]>([]);
  const [outdoorSchemes, setOutdoorSchemes] = useState<OutdoorMarketingScheme[]>([]);
  const [outdoorAreas, setOutdoorAreas] = useState<OutdoorMarketingArea[]>([]);

  // Modals State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [showAddSchemeModal, setShowAddSchemeModal] = useState<boolean>(false);
  const [showAddAreaModal, setShowAddAreaModal] = useState<boolean>(false);
  const [showAssignStaffModal, setShowAssignStaffModal] = useState<boolean>(false);

  // Form states
  const [custForm, setCustForm] = useState({
    marketing_employee_id: '',
    customer_name: '',
    phone: '',
    area_name: '',
    scheme_name: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Lead',
    notes: '',
  });

  const [schemeForm, setSchemeForm] = useState({
    employee_id: '',
    scheme_name: '',
    description: '',
    area: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [areaForm, setAreaForm] = useState({
    area_name: '',
    location: '',
    assigned_employee_id: '',
    activity_date: new Date().toISOString().split('T')[0],
    status: 'Planned',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [overviewRes, employeesRes, custRes, schemesRes, areasRes] = await Promise.all([
        api.get<OutdoorMarketingOverview>('/api/v1/outdoor-marketing/overview'),
        api.get<Employee[]>('/api/v1/employees'),
        api.get<OutdoorMarketingCustomer[]>('/api/v1/outdoor-marketing/customers'),
        api.get<OutdoorMarketingScheme[]>('/api/v1/outdoor-marketing/schemes'),
        api.get<OutdoorMarketingArea[]>('/api/v1/outdoor-marketing/areas'),
      ]);

      setOverview(overviewRes.data);
      setAllEmployees(employeesRes.data);
      const outdoorStaff = employeesRes.data.filter((e) => e.is_outdoor_marketing_employee || e.department === 'Outdoor Marketing');
      setOutdoorEmployees(outdoorStaff);
      setOutdoorCustomers(custRes.data);
      setOutdoorSchemes(schemesRes.data);
      setOutdoorAreas(areasRes.data);

      if (outdoorStaff.length > 0) {
        setCustForm((prev) => ({ ...prev, marketing_employee_id: outdoorStaff[0].id.toString() }));
        setSchemeForm((prev) => ({ ...prev, employee_id: outdoorStaff[0].id.toString() }));
        setAreaForm((prev) => ({ ...prev, assigned_employee_id: outdoorStaff[0].id.toString() }));
      }
    } catch (err) {
      console.error('Failed to load outdoor marketing data:', err);
      toastError('Failed to fetch outdoor marketing module data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.marketing_employee_id || !custForm.customer_name.trim() || !custForm.area_name.trim()) {
      toastError('Please fill in required customer details.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/v1/outdoor-marketing/customers', {
        marketing_employee_id: parseInt(custForm.marketing_employee_id),
        customer_name: custForm.customer_name.trim(),
        phone: custForm.phone.trim() || '—',
        area_name: custForm.area_name.trim(),
        scheme_name: custForm.scheme_name.trim() || null,
        date: custForm.date,
        status: custForm.status,
        notes: custForm.notes.trim() || null,
      });

      success('Outdoor customer lead recorded.');
      setShowAddCustomerModal(false);
      setCustForm({
        marketing_employee_id: outdoorEmployees[0]?.id.toString() || '',
        customer_name: '',
        phone: '',
        area_name: '',
        scheme_name: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Lead',
        notes: '',
      });
      fetchData();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to save customer lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemeForm.employee_id || !schemeForm.scheme_name.trim() || !schemeForm.area.trim()) {
      toastError('Please fill in required scheme details.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/v1/outdoor-marketing/schemes', {
        employee_id: parseInt(schemeForm.employee_id),
        scheme_name: schemeForm.scheme_name.trim(),
        description: schemeForm.description.trim() || null,
        area: schemeForm.area.trim(),
        date: schemeForm.date,
        notes: schemeForm.notes.trim() || null,
      });

      success('Promoted scheme logged.');
      setShowAddSchemeModal(false);
      setSchemeForm({
        employee_id: outdoorEmployees[0]?.id.toString() || '',
        scheme_name: '',
        description: '',
        area: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchData();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to save scheme.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaForm.area_name.trim() || !areaForm.location.trim()) {
      toastError('Please fill in area name and location.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/v1/outdoor-marketing/areas', {
        area_name: areaForm.area_name.trim(),
        location: areaForm.location.trim(),
        assigned_employee_id: areaForm.assigned_employee_id ? parseInt(areaForm.assigned_employee_id) : null,
        activity_date: areaForm.activity_date,
        status: areaForm.status,
        notes: areaForm.notes.trim() || null,
      });

      success('Outdoor marketing area added.');
      setShowAddAreaModal(false);
      setAreaForm({
        area_name: '',
        location: '',
        assigned_employee_id: '',
        activity_date: new Date().toISOString().split('T')[0],
        status: 'Planned',
        notes: '',
      });
      fetchData();
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to create area.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center bg-white border border-[#E8E6E1] rounded-2xl">
        <LoadingSpinner message="Loading outdoor marketing module..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Light Emerald Sage Hero Banner */}
      <div className="relative bg-gradient-to-br from-[#FAF8F3] via-white to-[#F0F7F4] border border-[#C5E3D5] rounded-3xl p-6 sm:p-8 shadow-xs text-[#1D1D1B] overflow-hidden">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#23815F]/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            {/* Showroom Badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5] flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#23815F] animate-pulse" />
                <span>Field Operations</span>
              </span>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-[#23815F] border border-[#C5E3D5] shadow-2xs">
                {outdoorEmployees.length} Field Marketers
              </span>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1B] tracking-tight flex items-center gap-2.5">
                <Compass className="w-6 h-6 text-[#23815F]" />
                <span>Outdoor Marketing & Field Campaigns</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#5E5A52] font-medium mt-1 max-w-2xl">
                Manage outdoor canvassing zones, gold savings promotional campaigns, and field customer leads for <span className="font-bold text-[#23815F] underline decoration-[#23815F]/30 underline-offset-2">Showroom Territory</span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0 flex-wrap">
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#23815F] hover:bg-[#1B694C] text-white text-xs font-bold shadow-sm transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Record Lead</span>
            </button>
            <button
              onClick={() => setShowAddSchemeModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8F4EE] hover:bg-[#D5EADB] text-[#23815F] text-xs font-bold border border-[#C5E3D5] shadow-2xs transition-all cursor-pointer"
            >
              <Award className="w-4 h-4 text-[#23815F]" />
              <span>+ Add Scheme</span>
            </button>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          UNIFIED OVERVIEW & FIELD MARKETING DASHBOARD
      ---------------------------------------------------- */}
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
            <span className="text-[11px] font-semibold text-[#5E5A52] uppercase block mb-1">
              Outdoor Staff
            </span>
            <div className="text-2xl font-extrabold text-[#1D1D1B]">{overview?.total_outdoor_employees || 0}</div>
          </div>

          <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
            <span className="text-[11px] font-semibold text-[#5E5A52] uppercase block mb-1">
              Areas Covered
            </span>
            <div className="text-2xl font-extrabold text-[#1D1D1B]">{overview?.areas_covered || 0}</div>
          </div>

          <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
            <span className="text-[11px] font-semibold text-[#5E5A52] uppercase block mb-1">
              Leads Generated
            </span>
            <div className="text-2xl font-extrabold text-[#1D1D1B]">{overview?.customers_generated || 0}</div>
          </div>

          <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs">
            <span className="text-[11px] font-semibold text-[#5E5A52] uppercase block mb-1">
              Leads Closed
            </span>
            <div className="text-2xl font-extrabold text-[#23815F]">{overview?.customers_closed || 0}</div>
          </div>

          <div className="bg-white border border-[#C5E3D5] rounded-2xl p-4 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-[#5E5A52] uppercase block mb-1">
              Schemes Promoted
            </span>
            <div className="text-2xl font-extrabold text-[#9A782F]">{overview?.schemes_promoted || 0}</div>
          </div>
        </div>

        {/* Quick Roster Snapshot (Light surface with green accents) */}
        <div className="bg-gradient-to-br from-[#FAF8F3] via-white to-[#F0F7F4] border border-[#C5E3D5] rounded-3xl p-5 sm:p-6 shadow-xs text-[#1D1D1B] space-y-4">
          <h3 className="text-sm font-bold text-[#1D1D1B] flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#23815F]" />
            <span>Field Representatives ({outdoorEmployees.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {outdoorEmployees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => navigate(`/employees/${emp.id}`)}
                className="p-3.5 rounded-2xl bg-white border border-[#C5E3D5] hover:border-[#23815F] hover:bg-[#FAFDFB] transition-all cursor-pointer flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5] flex items-center justify-center font-extrabold text-xs shadow-2xs">
                    {emp.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1D1D1B]">{emp.full_name}</p>
                    <p className="text-[10px] text-[#5E5A52] font-mono">{emp.employee_code}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#23815F] bg-[#E8F4EE] border border-[#C5E3D5] px-2.5 py-1 rounded-full shadow-2xs">
                  Profile →
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Outdoor Staff Table */}
        <div className="bg-white border border-[#C5E3D5] rounded-3xl overflow-hidden shadow-xs text-[#1D1D1B]">
          <div className="p-4 sm:p-5 border-b border-[#C5E3D5] bg-[#FAF8F3] flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-[#1D1D1B] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#23815F]" />
              <span>Outdoor Marketing Personnel</span>
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5]">
              {outdoorEmployees.length} Staff Members
            </span>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF8F3]/60 border-b border-[#C5E3D5] text-[#5E5A52] uppercase tracking-wider font-bold text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Staff Name</th>
                <th className="px-5 py-3.5">Badge Code</th>
                <th className="px-5 py-3.5">Designation</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBF3EE] font-medium">
              {outdoorEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  className="hover:bg-[#F0F7F4] transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5 font-bold text-[#1D1D1B]">{emp.full_name}</td>
                  <td className="px-5 py-3.5 font-mono text-[#5E5A52]">
                    <span className="px-2 py-0.5 rounded-md bg-[#E8F4EE] border border-[#C5E3D5] text-[#23815F] font-bold text-[10px]">
                      {emp.employee_code}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#5E5A52]">{emp.designation}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        emp.status === 'active'
                          ? 'bg-[#E8F4EE] text-[#23815F] border border-[#C5E3D5]'
                          : 'bg-[#FAF8F3] text-[#8A8479] border border-[#E4DFD4]'
                      }`}
                    >
                      {emp.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="px-3 py-1 bg-[#E8F4EE] hover:bg-[#23815F] hover:text-white text-[#23815F] font-bold rounded-xl text-xs border border-[#C5E3D5] shadow-2xs transition-all cursor-pointer">
                      View Profile →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>



      {/* Modal: Add Customer */}
      <Modal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        title="Record Outdoor Customer Lead"
        subtitle="Log prospective buyer contact from field campaigns"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowAddCustomerModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateCustomer} isLoading={isSubmitting}>
              Save Lead
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <Select
            label="Staff Representative *"
            value={custForm.marketing_employee_id}
            onChange={(e) => setCustForm({ ...custForm, marketing_employee_id: e.target.value })}
            options={outdoorEmployees.map((emp) => ({
              value: emp.id.toString(),
              label: `${emp.full_name} (${emp.employee_code})`,
            }))}
          />
          <Input
            label="Customer Full Name *"
            value={custForm.customer_name}
            onChange={(e) => setCustForm({ ...custForm, customer_name: e.target.value })}
            placeholder="e.g. Ramesh Gowda"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              type="tel"
              value={custForm.phone}
              onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
              placeholder="e.g. 9845012345"
            />
            <Input
              label="Campaign Area *"
              value={custForm.area_name}
              onChange={(e) => setCustForm({ ...custForm, area_name: e.target.value })}
              placeholder="e.g. Yelahanka Market"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Interested Scheme"
              value={custForm.scheme_name}
              onChange={(e) => setCustForm({ ...custForm, scheme_name: e.target.value })}
              placeholder="e.g. Siri Samruddhi Gold Plan"
            />
            <Select
              label="Status"
              value={custForm.status}
              onChange={(e) => setCustForm({ ...custForm, status: e.target.value })}
              options={[
                { value: 'Lead', label: 'Lead' },
                { value: 'Interested', label: 'Interested' },
                { value: 'Closed', label: 'Closed' },
                { value: 'Lost', label: 'Lost' },
              ]}
            />
          </div>
          <Input
            label="Notes"
            value={custForm.notes}
            onChange={(e) => setCustForm({ ...custForm, notes: e.target.value })}
            placeholder="e.g. Inquired about bridal jewellery"
          />
        </form>
      </Modal>

      {/* Modal: Add Scheme */}
      <Modal
        isOpen={showAddSchemeModal}
        onClose={() => setShowAddSchemeModal(false)}
        title="Log Promoted Scheme"
        subtitle="Record schemes promoted in outdoor campaigns"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowAddSchemeModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateScheme} isLoading={isSubmitting}>
              Save Scheme
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateScheme} className="space-y-4">
          <Select
            label="Promoted By *"
            value={schemeForm.employee_id}
            onChange={(e) => setSchemeForm({ ...schemeForm, employee_id: e.target.value })}
            options={outdoorEmployees.map((emp) => ({
              value: emp.id.toString(),
              label: `${emp.full_name} (${emp.employee_code})`,
            }))}
          />
          <Input
            label="Scheme Plan Name *"
            value={schemeForm.scheme_name}
            onChange={(e) => setSchemeForm({ ...schemeForm, scheme_name: e.target.value })}
            placeholder="e.g. 11-Month Gold Scheme"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Campaign Area *"
              value={schemeForm.area}
              onChange={(e) => setSchemeForm({ ...schemeForm, area: e.target.value })}
              placeholder="e.g. Sahakara Nagar"
              required
            />
            <Input
              label="Date"
              type="date"
              value={schemeForm.date}
              onChange={(e) => setSchemeForm({ ...schemeForm, date: e.target.value })}
            />
          </div>
          <Input
            label="Description / Target"
            value={schemeForm.description}
            onChange={(e) => setSchemeForm({ ...schemeForm, description: e.target.value })}
            placeholder="e.g. Festive discount offer"
          />
        </form>
      </Modal>

      {/* Modal: Add Area */}
      <Modal
        isOpen={showAddAreaModal}
        onClose={() => setShowAddAreaModal(false)}
        title="Assign Target Area"
        subtitle="Set up new field campaign zone"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowAddAreaModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateArea} isLoading={isSubmitting}>
              Save Area
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateArea} className="space-y-4">
          <Input
            label="Area Name *"
            value={areaForm.area_name}
            onChange={(e) => setAreaForm({ ...areaForm, area_name: e.target.value })}
            placeholder="e.g. Kolar Commercial Road"
            required
          />
          <Input
            label="Location Landmark *"
            value={areaForm.location}
            onChange={(e) => setAreaForm({ ...areaForm, location: e.target.value })}
            placeholder="e.g. Near Bus Terminal"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Assigned Staff"
              value={areaForm.assigned_employee_id}
              onChange={(e) => setAreaForm({ ...areaForm, assigned_employee_id: e.target.value })}
              options={[
                { value: '', label: 'Unassigned' },
                ...outdoorEmployees.map((emp) => ({
                  value: emp.id.toString(),
                  label: `${emp.full_name} (${emp.employee_code})`,
                })),
              ]}
            />
            <Select
              label="Status"
              value={areaForm.status}
              onChange={(e) => setAreaForm({ ...areaForm, status: e.target.value })}
              options={[
                { value: 'Planned', label: 'Planned' },
                { value: 'Active', label: 'Active' },
                { value: 'Completed', label: 'Completed' },
              ]}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
