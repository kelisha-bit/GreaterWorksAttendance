import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  User,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  UserCheck,
  Filter,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const Visitors = () => {
  const navigate = useNavigate();
  const { isLeader, currentUser } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    firstTime: 0,
    returning: 0,
    converted: 0,
    needsFollowUp: 0
  });

  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male',
    phoneNumber: '',
    email: '',
    address: '',
    visitDate: new Date().toISOString().split('T')[0],
    visitType: 'First Time',
    howDidYouHear: '',
    interestedInMembership: false,
    prayerRequest: '',
    followUpStatus: 'Pending',
    notes: ''
  });

  const visitTypes = ['First Time', 'Second Visit', 'Third Visit', 'Regular Visitor'];
  const followUpStatuses = ['Pending', 'Contacted', 'Scheduled', 'Completed', 'No Response'];
  const hearAboutOptions = [
    'Friend/Family',
    'Social Media',
    'Google Search',
    'Drove By',
    'Event/Program',
    'Other'
  ];

  useEffect(() => {
    fetchVisitors();
  }, []);

  useEffect(() => {
    filterVisitors();
  }, [searchTerm, visitors, filterStatus]);

  useEffect(() => {
    calculateStats();
  }, [visitors]);

  const fetchVisitors = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'visitors'));
      let visitorsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by visit date (most recent first)
      visitorsList.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
      
      setVisitors(visitorsList);
      setFilteredVisitors(visitorsList);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      toast.error('Failed to load visitors');
    } finally {
      setLoading(false);
    }
  };

  const filterVisitors = () => {
    let filtered = [...visitors];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(visitor =>
        visitor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.phoneNumber.includes(searchTerm) ||
        visitor.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      switch (filterStatus) {
        case 'first-time':
          filtered = filtered.filter(v => v.visitType === 'First Time');
          break;
        case 'returning':
          filtered = filtered.filter(v => v.visitType !== 'First Time' && !v.convertedToMember);
          break;
        case 'converted':
          filtered = filtered.filter(v => v.convertedToMember);
          break;
        case 'needs-followup':
          filtered = filtered.filter(v => 
            v.followUpStatus === 'Pending' || v.followUpStatus === 'Scheduled'
          );
          break;
      }
    }

    setFilteredVisitors(filtered);
  };

  const calculateStats = () => {
    const stats = {
      total: visitors.length,
      firstTime: visitors.filter(v => v.visitType === 'First Time').length,
      returning: visitors.filter(v => v.visitType !== 'First Time' && !v.convertedToMember).length,
      converted: visitors.filter(v => v.convertedToMember).length,
      needsFollowUp: visitors.filter(v => 
        v.followUpStatus === 'Pending' || v.followUpStatus === 'Scheduled'
      ).length
    };
    setStats(stats);
  };

  const generateVisitorId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `V${timestamp}${random}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phoneNumber || !formData.visitDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const visitorData = {
        fullName: formData.fullName,
        gender: formData.gender,
        phoneNumber: formData.phoneNumber,
        email: formData.email || '',
        address: formData.address || '',
        visitDate: formData.visitDate,
        visitType: formData.visitType,
        howDidYouHear: formData.howDidYouHear,
        interestedInMembership: formData.interestedInMembership,
        prayerRequest: formData.prayerRequest || '',
        followUpStatus: formData.followUpStatus,
        notes: formData.notes || '',
        convertedToMember: false,
        recordedBy: currentUser.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editMode && selectedVisitor) {
        await updateDoc(doc(db, 'visitors', selectedVisitor.id), visitorData);
        toast.success('Visitor updated successfully');
      } else {
        visitorData.visitorId = generateVisitorId();
        await addDoc(collection(db, 'visitors'), visitorData);
        toast.success('Visitor registered successfully');
      }

      fetchVisitors();
      closeModal();
    } catch (error) {
      console.error('Error saving visitor:', error);
      toast.error('Failed to save visitor');
    }
  };

  const handleEdit = (visitor) => {
    setSelectedVisitor(visitor);
    setFormData({
      fullName: visitor.fullName,
      gender: visitor.gender,
      phoneNumber: visitor.phoneNumber,
      email: visitor.email || '',
      address: visitor.address || '',
      visitDate: visitor.visitDate,
      visitType: visitor.visitType,
      howDidYouHear: visitor.howDidYouHear || '',
      interestedInMembership: visitor.interestedInMembership || false,
      prayerRequest: visitor.prayerRequest || '',
      followUpStatus: visitor.followUpStatus,
      notes: visitor.notes || ''
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (visitorId) => {
    if (!window.confirm('Are you sure you want to delete this visitor record?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'visitors', visitorId));
      toast.success('Visitor deleted successfully');
      fetchVisitors();
    } catch (error) {
      console.error('Error deleting visitor:', error);
      toast.error('Failed to delete visitor');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedVisitor(null);
    setFormData({
      fullName: '',
      gender: 'Male',
      phoneNumber: '',
      email: '',
      address: '',
      visitDate: new Date().toISOString().split('T')[0],
      visitType: 'First Time',
      howDidYouHear: '',
      interestedInMembership: false,
      prayerRequest: '',
      followUpStatus: 'Pending',
      notes: ''
    });
  };

  const getFollowUpStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Contacted':
        return 'bg-blue-100 text-blue-800';
      case 'Scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'No Response':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysSinceVisit = (visitDate) => {
    const today = new Date();
    const visit = new Date(visitDate);
    const diffTime = Math.abs(today - visit);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLeader) {
    return (
      <div className="card text-center py-12">
        <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
        <p className="text-gray-600">Only administrators and leaders can access visitor management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Visitor Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center space-x-2"
        >
          <UserPlus className="w-5 h-5" />
          <span>Register Visitor</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">Total Visitors</p>
              <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <User className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">First Time</p>
              <p className="text-3xl font-bold text-green-900">{stats.firstTime}</p>
            </div>
            <UserPlus className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-semibold">Returning</p>
              <p className="text-3xl font-bold text-purple-900">{stats.returning}</p>
            </div>
            <Clock className="w-10 h-10 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-semibold">Converted</p>
              <p className="text-3xl font-bold text-orange-900">{stats.converted}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-orange-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-semibold">Needs Follow-up</p>
              <p className="text-3xl font-bold text-red-900">{stats.needsFollowUp}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">All Visitors</option>
              <option value="first-time">First Time Only</option>
              <option value="returning">Returning Visitors</option>
              <option value="converted">Converted to Members</option>
              <option value="needs-followup">Needs Follow-up</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visitors List */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            All Visitors ({filteredVisitors.length})
          </h2>
        </div>

        {filteredVisitors.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No visitors found</p>
            {!searchTerm && (
              <button
                onClick={() => setShowModal(true)}
                className="text-church-gold hover:text-church-darkGold mt-2"
              >
                Register your first visitor
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Visitor ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Visit Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Follow-up</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitors.map((visitor) => {
                  const daysSince = getDaysSinceVisit(visitor.visitDate);
                  const needsUrgentFollowUp = daysSince > 7 && visitor.followUpStatus === 'Pending';
                  
                  return (
                    <tr key={visitor.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-mono text-gray-600">{visitor.visitorId}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{visitor.fullName}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{visitor.phoneNumber}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(visitor.visitDate).toLocaleDateString()}
                        <span className="text-xs text-gray-500 block">{daysSince} days ago</span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {visitor.visitType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${getFollowUpStatusColor(visitor.followUpStatus)}`}>
                          {visitor.followUpStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {visitor.convertedToMember ? (
                          <span className="flex items-center space-x-1 text-green-600">
                            <UserCheck className="w-4 h-4" />
                            <span className="text-xs">Member</span>
                          </span>
                        ) : needsUrgentFollowUp ? (
                          <span className="flex items-center space-x-1 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs">Urgent</span>
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">Active</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/visitors/${visitor.id}`)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(visitor)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(visitor.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register/Edit Visitor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editMode ? 'Edit Visitor' : 'Register New Visitor'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
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

                  <div className="sm:col-span-2">
                    <label className="label">Address (Optional)</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="input-field"
                      placeholder="Street, City, Region"
                    />
                  </div>
                </div>
              </div>

              {/* Visit Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Visit Date *</label>
                    <input
                      type="date"
                      value={formData.visitDate}
                      onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Visit Type *</label>
                    <select
                      value={formData.visitType}
                      onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                      className="input-field"
                      required
                    >
                      {visitTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">How Did You Hear About Us?</label>
                    <select
                      value={formData.howDidYouHear}
                      onChange={(e) => setFormData({ ...formData, howDidYouHear: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select...</option>
                      {hearAboutOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Follow-up Status</label>
                    <select
                      value={formData.followUpStatus}
                      onChange={(e) => setFormData({ ...formData, followUpStatus: e.target.value })}
                      className="input-field"
                    >
                      {followUpStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.interestedInMembership}
                        onChange={(e) => setFormData({ ...formData, interestedInMembership: e.target.checked })}
                        className="w-4 h-4 text-church-gold focus:ring-church-gold border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Interested in Church Membership</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Prayer Request (Optional)</label>
                    <textarea
                      value={formData.prayerRequest}
                      onChange={(e) => setFormData({ ...formData, prayerRequest: e.target.value })}
                      className="input-field"
                      rows="3"
                      placeholder="Any prayer requests or special needs..."
                    />
                  </div>

                  <div>
                    <label className="label">Notes (Optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="input-field"
                      rows="3"
                      placeholder="Additional notes about the visitor..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editMode ? 'Update Visitor' : 'Register Visitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visitors;
