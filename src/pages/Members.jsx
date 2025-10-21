import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Upload,
  User,
  QrCode,
  Eye,
  CreditCard,
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import IDCardPrintModal from '../components/IDCardPrintModal';
import BulkIDCardPrint from '../components/BulkIDCardPrint';

const Members = () => {
  const navigate = useNavigate();
  const { isLeader, currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showIDCardModal, setShowIDCardModal] = useState(false);
  const [showBulkPrintModal, setShowBulkPrintModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male',
    phoneNumber: '',
    email: '',
    department: '',
    membershipType: 'Adult',
    membershipStatus: 'Active',
    dateOfBirth: '',
    dateJoined: new Date().toISOString().split('T')[0],
    salvationDate: '',
    weddingAnniversary: '',
    address: '',
    city: '',
    occupation: '',
    maritalStatus: '',
    homeCell: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    baptismStatus: '',
    baptismDate: '',
    previousChurch: '',
    skills: '',
    ministryInterests: '',
    notes: '',
    profilePhoto: null
  });

  const departments = [
    'All',
    'Choir',
    'Music Team',
    'Ushering and Welcome Team',
    'Financial team',
    'Media',
    'Children Ministry',
    'Youth Ministry',
    'Women Ministry',
    'Men Ministry',
    'Evangelism Team',
    'Follow Up Team',
    'Prayer Team',
    'Welfare',
    'Protocol',
    'Other'
  ];

  const membershipTypes = ['Adult', 'Youth', 'Child', 'Visitor'];

  const membershipStatuses = ['Active', 'Inactive', 'Transferred', 'Deceased'];

  const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];

  const baptismStatuses = ['Not Baptized', 'Water Baptized', 'Holy Spirit Baptized', 'Both'];

  const generateTitheEnvelopeNumber = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `TE${year}${random}`;
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [searchTerm, members]);

  const fetchMembers = async () => {
    try {
      const q = query(collection(db, 'members'), orderBy('fullName'));
      const snapshot = await getDocs(q);
      const membersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersList);
      setFilteredMembers(membersList);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    if (!searchTerm) {
      setFilteredMembers(members);
      return;
    }

    const filtered = members.filter(member =>
      member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phoneNumber.includes(searchTerm) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(member.department)
        ? member.department.some(dept => dept.toLowerCase().includes(searchTerm.toLowerCase()))
        : member.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredMembers(filtered);
  };

  const generateMemberId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `GW${timestamp}${random}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phoneNumber || !formData.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      let photoURL = null;

      // Upload profile photo if provided
      if (formData.profilePhoto) {
        const storageRef = ref(storage, `profile_photos/${currentUser.uid}/${Date.now()}_${formData.profilePhoto.name}`);
        await uploadBytes(storageRef, formData.profilePhoto);
        photoURL = await getDownloadURL(storageRef);
      }

      const memberData = {
        fullName: formData.fullName,
        gender: formData.gender,
        phoneNumber: formData.phoneNumber,
        email: formData.email || '',
        department: formData.department,
        membershipType: formData.membershipType,
        membershipStatus: formData.membershipStatus || 'Active',
        dateOfBirth: formData.dateOfBirth || '',
        dateJoined: formData.dateJoined || new Date().toISOString().split('T')[0],
        salvationDate: formData.salvationDate || '',
        weddingAnniversary: formData.weddingAnniversary || '',
        address: formData.address || '',
        city: formData.city || '',
        occupation: formData.occupation || '',
        maritalStatus: formData.maritalStatus || '',
        homeCell: formData.homeCell || '',
        emergencyContactName: formData.emergencyContactName || '',
        emergencyContactPhone: formData.emergencyContactPhone || '',
        baptismStatus: formData.baptismStatus || '',
        baptismDate: formData.baptismDate || '',
        previousChurch: formData.previousChurch || '',
        skills: formData.skills || '',
        ministryInterests: formData.ministryInterests || '',
        notes: formData.notes || '',
        profilePhotoURL: photoURL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editMode && selectedMember) {
        // Update existing member (keep existing tithe envelope number)
        await updateDoc(doc(db, 'members', selectedMember.id), memberData);
        toast.success('Member updated successfully');
      } else {
        // Add new member with auto-generated IDs
        memberData.memberId = generateMemberId();
        memberData.titheEnvelopeNumber = generateTitheEnvelopeNumber();
        await addDoc(collection(db, 'members'), memberData);
        toast.success('Member added successfully');
      }

      fetchMembers();
      closeModal();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error('Failed to save member');
    }
  };

  const handleEdit = (member) => {
    setSelectedMember(member);
    setFormData({
      fullName: member.fullName,
      gender: member.gender,
      phoneNumber: member.phoneNumber,
      email: member.email || '',
      department: member.department || [],
      membershipType: member.membershipType,
      membershipStatus: member.membershipStatus || 'Active',
      dateOfBirth: member.dateOfBirth || '',
      dateJoined: member.dateJoined || '',
      salvationDate: member.salvationDate || '',
      weddingAnniversary: member.weddingAnniversary || '',
      address: member.address || '',
      city: member.city || '',
      occupation: member.occupation || '',
      maritalStatus: member.maritalStatus || '',
      homeCell: member.homeCell || '',
      emergencyContactName: member.emergencyContactName || '',
      emergencyContactPhone: member.emergencyContactPhone || '',
      baptismStatus: member.baptismStatus || '',
      baptismDate: member.baptismDate || '',
      previousChurch: member.previousChurch || '',
      skills: member.skills || '',
      ministryInterests: member.ministryInterests || '',
      notes: member.notes || '',
      profilePhoto: null
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this member?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'members', memberId));
      toast.success('Member deleted successfully');
      fetchMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Failed to delete member');
    }
  };

  const showQRCode = (member) => {
    setSelectedMember(member);
    setShowQRModal(true);
  };

  const showIDCard = (member) => {
    setSelectedMember(member);
    setShowIDCardModal(true);
  };

  const handleBulkPrint = () => {
    if (filteredMembers.length === 0) {
      toast.error('No members to print');
      return;
    }
    setShowBulkPrintModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedMember(null);
    setFormData({
      fullName: '',
      gender: 'Male',
      phoneNumber: '',
      email: '',
      department: [],
      membershipType: 'Adult',
      membershipStatus: 'Active',
      dateOfBirth: '',
      dateJoined: new Date().toISOString().split('T')[0],
      salvationDate: '',
      weddingAnniversary: '',
      address: '',
      city: '',
      occupation: '',
      maritalStatus: '',
      homeCell: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      baptismStatus: '',
      baptismDate: '',
      previousChurch: '',
      skills: '',
      ministryInterests: '',
      notes: '',
      profilePhoto: null
    });
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('member-qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `${selectedMember.fullName}_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
        {isLeader && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleBulkPrint}
              className="btn-secondary flex items-center justify-center space-x-2"
              title="Print ID Cards"
            >
              <Printer className="w-5 h-5" />
              <span className="hidden sm:inline">Print ID Cards</span>
            </button>
            <button
              onClick={() => navigate('/members/import')}
              className="btn-secondary flex items-center justify-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>Add Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, phone, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Members List */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            All Members ({filteredMembers.length})
          </h2>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No members found</p>
            {isLeader && !searchTerm && (
              <button
                onClick={() => setShowModal(true)}
                className="text-church-gold hover:text-church-darkGold mt-2"
              >
                Add your first member
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Member ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Gender</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Department</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member, index) => (
                  <tr 
                    key={member.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 animate-fade-in-up ${
                      index < 20 ? `stagger-${index + 1}` : 'stagger-max'
                    }`}
                  >
                    <td className="py-3 px-4 text-sm font-mono text-gray-600">{member.memberId}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{member.fullName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{member.gender}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{member.phoneNumber}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {Array.isArray(member.department) ? member.department.join(', ') : member.department}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{member.membershipType}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                        member.membershipStatus === 'Active' ? 'bg-green-100 text-green-800' :
                        member.membershipStatus === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                        member.membershipStatus === 'Transferred' ? 'bg-blue-100 text-blue-800' :
                        member.membershipStatus === 'Deceased' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {member.membershipStatus || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/members/${member.id}`)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => showIDCard(member)}
                          className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                          title="Print ID Card"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => showQRCode(member)}
                          className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                          title="View QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        {isLeader && (
                          <>
                            <button
                              onClick={() => handleEdit(member)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(member.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Member Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editMode ? 'Edit Member' : 'Add New Member'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Department *</label>
                  <select
                    multiple
                    value={formData.department}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({ ...formData, department: selectedOptions });
                    }}
                    className="input-field"
                    required={formData.department.length === 0}
                    size="4"
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple departments</p>
                </div>

                <div>
                  <label className="label">Membership Type *</label>
                  <select
                    value={formData.membershipType}
                    onChange={(e) => setFormData({ ...formData, membershipType: e.target.value })}
                    className="input-field"
                    required
                  >
                    {membershipTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Membership Status *</label>
                  <select
                    value={formData.membershipStatus}
                    onChange={(e) => setFormData({ ...formData, membershipStatus: e.target.value })}
                    className="input-field"
                    required
                  >
                    {membershipStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Date of Birth (Optional)</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Date Joined Church *</label>
                  <input
                    type="date"
                    value={formData.dateJoined}
                    onChange={(e) => setFormData({ ...formData, dateJoined: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Salvation Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.salvationDate}
                    onChange={(e) => setFormData({ ...formData, salvationDate: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Wedding Anniversary (Optional)</label>
                  <input
                    type="date"
                    value={formData.weddingAnniversary}
                    onChange={(e) => setFormData({ ...formData, weddingAnniversary: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Marital Status (Optional)</label>
                  <select
                    value={formData.maritalStatus}
                    onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Status</option>
                    {maritalStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Occupation (Optional)</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Teacher, Engineer"
                  />
                </div>

                <div>
                  <label className="label">City (Optional)</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Accra, Kumasi"
                  />
                </div>

                <div>
                  <label className="label">Home Cell/Group (Optional)</label>
                  <input
                    type="text"
                    value={formData.homeCell}
                    onChange={(e) => setFormData({ ...formData, homeCell: e.target.value })}
                    className="input-field"
                    placeholder="e.g., East Legon Cell"
                  />
                </div>

                <div>
                  <label className="label">Baptism Status (Optional)</label>
                  <select
                    value={formData.baptismStatus}
                    onChange={(e) => setFormData({ ...formData, baptismStatus: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Status</option>
                    {baptismStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Baptism Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.baptismDate}
                    onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Emergency Contact Name (Optional)</label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    className="input-field"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="label">Emergency Contact Phone (Optional)</label>
                  <input
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    className="input-field"
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div>
                <label className="label">Address (Optional)</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                  placeholder="Street address or location"
                />
              </div>

              <div>
                <label className="label">Previous Church (Optional)</label>
                <input
                  type="text"
                  value={formData.previousChurch}
                  onChange={(e) => setFormData({ ...formData, previousChurch: e.target.value })}
                  className="input-field"
                  placeholder="Name of previous church attended"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Skills/Talents (Optional)</label>
                  <input
                    type="text"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Singing, Teaching, IT"
                  />
                </div>

                <div>
                  <label className="label">Ministry Interests (Optional)</label>
                  <input
                    type="text"
                    value={formData.ministryInterests}
                    onChange={(e) => setFormData({ ...formData, ministryInterests: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Choir, Youth, Media"
                  />
                </div>
              </div>

              <div>
                <label className="label">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Any additional information about the member..."
                />
              </div>

              <div>
                <label className="label">
                  <Upload className="w-4 h-4 inline mr-2" />
                  Profile Photo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.files[0] })}
                  className="input-field"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editMode ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Member QR Code</h2>
              <button onClick={() => setShowQRModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center space-y-4">
              <div className="bg-white p-4 inline-block rounded-lg border-2 border-gray-200">
                <QRCodeSVG
                  id="member-qr-code"
                  value={selectedMember.memberId}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedMember.fullName}</p>
                <p className="text-sm text-gray-600 font-mono">{selectedMember.memberId}</p>
              </div>
              <button onClick={downloadQRCode} className="btn-primary w-full">
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ID Card Print Modal */}
      {showIDCardModal && selectedMember && (
        <IDCardPrintModal
          member={selectedMember}
          onClose={() => {
            setShowIDCardModal(false);
            setSelectedMember(null);
          }}
        />
      )}

      {/* Bulk ID Card Print Modal */}
      {showBulkPrintModal && (
        <BulkIDCardPrint
          members={filteredMembers}
          onClose={() => setShowBulkPrintModal(false)}
        />
      )}
    </div>
  );
};

export default Members;
