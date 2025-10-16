import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Member, Department, Gender, MembershipType, UserRole } from '../types';
import { PlusIcon, QrcodeIcon } from './icons';
import Button from './common/Button';
import Card from './common/Card';
import Modal from './common/Modal';
import QrCodeModal from './common/QrCodeModal';

// This tells TypeScript that a 'QRCode' variable will be available globally,
// as it's loaded from a script tag in index.html.
declare var QRCode: any;

interface MemberManagementProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  currentRole: UserRole;
  onViewMember: (member: Member) => void;
}

const MemberForm: React.FC<{onSave: (member: Member) => void; onCancel: () => void; existingMember?: Member}> = ({ onSave, onCancel, existingMember }) => {
    const [fullName, setFullName] = useState(existingMember?.fullName || '');
    const [gender, setGender] = useState<Gender>(existingMember?.gender || Gender.Male);
    const [phone, setPhone] = useState(existingMember?.phone || '');
    const [email, setEmail] = useState(existingMember?.email || '');
    const [department, setDepartment] = useState<Department>(existingMember?.department || Department.None);
    const [membershipType, setMembershipType] = useState<MembershipType>(existingMember?.membershipType || MembershipType.Visitor);
    const [photoPreview, setPhotoPreview] = useState<string | null>(existingMember?.profilePhotoUrl || null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            // Create a local URL for the selected file to show a preview
            setPhotoPreview(URL.createObjectURL(e.target.files[0]));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const memberData: Member = {
            id: existingMember?.id || `GWCC-${Date.now()}`,
            fullName,
            gender,
            phone,
            email,
            department,
            membershipType,
            profilePhotoUrl: photoPreview || undefined,
        };
        onSave(memberData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center space-y-2">
                <label htmlFor="photo-upload" className="cursor-pointer">
                    <img 
                        src={photoPreview || `https://ui-avatars.com/api/?name=${fullName.replace(/\s/g, '+')}&background=B8860B&color=fff`} 
                        alt="Profile Preview" 
                        className="h-24 w-24 rounded-full object-cover ring-2 ring-offset-2 ring-gw-gold" 
                    />
                </label>
                <label htmlFor="photo-upload" className="text-sm font-medium text-gw-gold hover:underline cursor-pointer">
                    Upload Profile Photo
                </label>
                <input 
                    id="photo-upload"
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoChange} 
                    className="hidden" 
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <select value={gender} onChange={e => setGender(e.target.value as Gender)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                        {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Department/Ministry</label>
                    <select value={department} onChange={e => setDepartment(e.target.value as Department)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                        {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Membership Type</label>
                    <select value={membershipType} onChange={e => setMembershipType(e.target.value as MembershipType)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                        {Object.values(MembershipType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Member</Button>
            </div>
        </form>
    );
};

const MemberManagement: React.FC<MemberManagementProps> = ({ members, setMembers, currentRole, onViewMember }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('All');
    const [membershipTypeFilter, setMembershipTypeFilter] = useState('All');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | undefined>(undefined);
    const [qrCodeMember, setQrCodeMember] = useState<Member | null>(null);

    const handleSaveMember = (member: Member) => {
        if (editingMember) {
            setMembers(members.map(m => m.id === member.id ? member : m));
        } else {
            setMembers([...members, member]);
        }
        setIsFormModalOpen(false);
        setEditingMember(undefined);
    };

    const handleEdit = (member: Member) => {
        setEditingMember(member);
        setIsFormModalOpen(true);
    };
    
    const handleAddNew = () => {
        setEditingMember(undefined);
        setIsFormModalOpen(true);
    }
    
    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            const searchMatch = m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone.includes(searchTerm);
            const departmentMatch = departmentFilter === 'All' || m.department === departmentFilter;
            const typeMatch = membershipTypeFilter === 'All' || m.membershipType === membershipTypeFilter;
            return searchMatch && departmentMatch && typeMatch;
        });
    }, [members, searchTerm, departmentFilter, membershipTypeFilter]);


    return (
        <div className="p-4 md:p-8 space-y-6">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gw-dark">Member Management</h1>
                    <p className="text-gray-500">Search, view, and register new members.</p>
                </div>
                {currentRole === UserRole.Admin && (
                    <Button onClick={handleAddNew} icon={<PlusIcon className="h-5 w-5"/>}>
                        Register New Member
                    </Button>
                )}
            </header>
            
            <Card>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full md:flex-grow border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <select
                        value={departmentFilter}
                        onChange={e => setDepartmentFilter(e.target.value)}
                        className="w-full md:w-auto border border-gray-300 rounded-md shadow-sm p-2 bg-white"
                    >
                        <option value="All">All Departments</option>
                        {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select
                        value={membershipTypeFilter}
                        onChange={e => setMembershipTypeFilter(e.target.value)}
                        className="w-full md:w-auto border border-gray-300 rounded-md shadow-sm p-2 bg-white"
                    >
                        <option value="All">All Types</option>
                        {Object.values(MembershipType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>


                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                {currentRole === UserRole.Admin && <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredMembers.map(member => (
                                <tr key={member.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full object-cover" src={member.profilePhotoUrl || `https://ui-avatars.com/api/?name=${member.fullName.replace(/\s/g, '+')}&background=B8860B&color=fff`} alt="" />
                                            </div>
                                            <div className="ml-4">
                                                <button onClick={() => onViewMember(member)} className="text-sm font-medium text-gw-gold hover:underline text-left">
                                                  {member.fullName}
                                                </button>
                                                <div className="text-sm text-gray-500">{member.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{member.phone}</div>
                                        <div className="text-sm text-gray-500">{member.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.membershipType === MembershipType.Visitor ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                            {member.membershipType}
                                        </span>
                                    </td>
                                    {currentRole === UserRole.Admin && (
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <button onClick={() => setQrCodeMember(member)} className="text-gray-500 hover:text-gw-gold p-1" title="Show QR Code">
                                                <QrcodeIcon className="h-5 w-5"/>
                                            </button>
                                            <button onClick={() => handleEdit(member)} className="text-gw-gold hover:text-gw-gold-dark ml-4">Edit</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingMember ? 'Edit Member Profile' : 'Register New Member'}>
                <MemberForm onSave={handleSaveMember} onCancel={() => setIsFormModalOpen(false)} existingMember={editingMember} />
            </Modal>
            
            <QrCodeModal member={qrCodeMember} onClose={() => setQrCodeMember(null)} />
        </div>
    );
};

export default MemberManagement;