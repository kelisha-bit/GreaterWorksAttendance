import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  User,
  Edit2,
  CheckCircle,
  Clock,
  Heart,
  MessageSquare,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const VisitorProfile = () => {
  const { visitorId } = useParams();
  const navigate = useNavigate();
  const { isLeader, currentUser } = useAuth();
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState('');
  
  const [conversionData, setConversionData] = useState({
    department: '',
    membershipType: 'Adult'
  });

  const departments = [
    'Choir',
    'Ushering',
    'Media',
    'Children Ministry',
    'Youth Ministry',
    'Prayer Team',
    'Welfare',
    'Protocol',
    'Other'
  ];

  const membershipTypes = ['Adult', 'Youth', 'Child'];

  useEffect(() => {
    fetchVisitorData();
  }, [visitorId]);

  const fetchVisitorData = async () => {
    try {
      const visitorDoc = await getDoc(doc(db, 'visitors', visitorId));
      
      if (!visitorDoc.exists()) {
        toast.error('Visitor not found');
        navigate('/visitors');
        return;
      }

      const visitorData = { id: visitorDoc.id, ...visitorDoc.data() };
      setVisitor(visitorData);
      setFollowUpStatus(visitorData.followUpStatus);
    } catch (error) {
      console.error('Error fetching visitor data:', error);
      toast.error('Failed to load visitor profile');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToMember = async () => {
    if (!conversionData.department) {
      toast.error('Please select a department');
      return;
    }

    try {
      // Generate member ID
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const memberId = `GW${timestamp}${random}`;

      // Create member record
      const memberData = {
        fullName: visitor.fullName,
        gender: visitor.gender,
        phoneNumber: visitor.phoneNumber,
        email: visitor.email || '',
        address: visitor.address || '',
        department: conversionData.department,
        membershipType: conversionData.membershipType,
        memberId: memberId,
        convertedFromVisitor: true,
        visitorId: visitor.visitorId,
        conversionDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'members'), memberData);

      // Update visitor record
      await updateDoc(doc(db, 'visitors', visitorId), {
        convertedToMember: true,
        memberId: memberId,
        conversionDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      toast.success('Visitor successfully converted to member!');
      setShowConvertModal(false);
      fetchVisitorData();
    } catch (error) {
      console.error('Error converting visitor:', error);
      toast.error('Failed to convert visitor to member');
    }
  };

  const handleUpdateFollowUp = async () => {
    if (!followUpNote.trim()) {
      toast.error('Please add a follow-up note');
      return;
    }

    try {
      const followUpHistory = visitor.followUpHistory || [];
      followUpHistory.push({
        date: new Date().toISOString(),
        note: followUpNote,
        status: followUpStatus,
        recordedBy: currentUser.email
      });

      await updateDoc(doc(db, 'visitors', visitorId), {
        followUpStatus: followUpStatus,
        followUpHistory: followUpHistory,
        lastFollowUpDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      toast.success('Follow-up updated successfully');
      setShowFollowUpModal(false);
      setFollowUpNote('');
      fetchVisitorData();
    } catch (error) {
      console.error('Error updating follow-up:', error);
      toast.error('Failed to update follow-up');
    }
  };

  const getDaysSinceVisit = (visitDate) => {
    const today = new Date();
    const visit = new Date(visitDate);
    const diffTime = Math.abs(today - visit);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getFollowUpStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Contacted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Scheduled':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'No Response':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!visitor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Visitor not found</p>
      </div>
    );
  }

  const daysSince = getDaysSinceVisit(visitor.visitDate);
  const needsUrgentFollowUp = daysSince > 7 && visitor.followUpStatus === 'Pending';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/visitors')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Visitors</span>
        </button>
        {isLeader && !visitor.convertedToMember && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFollowUpModal(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Add Follow-up</span>
            </button>
            <button
              onClick={() => setShowConvertModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Convert to Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Status Alert */}
      {visitor.convertedToMember ? (
        <div className="card bg-green-50 border-2 border-green-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Converted to Member</p>
              <p className="text-sm text-green-700">
                This visitor became a member on {new Date(visitor.conversionDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-green-700">Member ID: {visitor.memberId}</p>
            </div>
          </div>
        </div>
      ) : needsUrgentFollowUp && (
        <div className="card bg-red-50 border-2 border-red-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Urgent Follow-up Required</p>
              <p className="text-sm text-red-700">
                It's been {daysSince} days since their visit. Please follow up soon!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-full bg-church-gold bg-opacity-10 flex items-center justify-center border-4 border-church-gold">
              <User className="w-16 h-16 text-church-gold" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{visitor.fullName}</h1>
                <p className="text-lg text-gray-600 font-mono mb-2">{visitor.visitorId}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {visitor.visitType}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${getFollowUpStatusColor(visitor.followUpStatus)}`}>
                    {visitor.followUpStatus}
                  </span>
                  {visitor.interestedInMembership && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                      Interested in Membership
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 text-gray-700">
                <Phone className="w-5 h-5 text-church-gold" />
                <span>{visitor.phoneNumber}</span>
              </div>
              
              {visitor.email && (
                <div className="flex items-center space-x-3 text-gray-700">
                  <Mail className="w-5 h-5 text-church-gold" />
                  <span>{visitor.email}</span>
                </div>
              )}
              
              {visitor.address && (
                <div className="flex items-center space-x-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-church-gold" />
                  <span>{visitor.address}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-3 text-gray-700">
                <Calendar className="w-5 h-5 text-church-gold" />
                <span>
                  Visited {new Date(visitor.visitDate).toLocaleDateString()}
                  <span className="text-sm text-gray-500 ml-2">({daysSince} days ago)</span>
                </span>
              </div>

              <div className="flex items-center space-x-3 text-gray-700">
                <User className="w-5 h-5 text-church-gold" />
                <span>{visitor.gender}</span>
              </div>

              {visitor.howDidYouHear && (
                <div className="flex items-center space-x-3 text-gray-700">
                  <MessageSquare className="w-5 h-5 text-church-gold" />
                  <span>Heard via: {visitor.howDidYouHear}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prayer Request */}
      {visitor.prayerRequest && (
        <div className="card bg-purple-50 border-2 border-purple-200">
          <div className="flex items-start space-x-3">
            <Heart className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 mb-2">Prayer Request</h3>
              <p className="text-purple-800">{visitor.prayerRequest}</p>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {visitor.notes && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-church-gold" />
            <span>Notes</span>
          </h3>
          <p className="text-gray-700">{visitor.notes}</p>
        </div>
      )}

      {/* Follow-up History */}
      {visitor.followUpHistory && visitor.followUpHistory.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-church-gold" />
            <span>Follow-up History</span>
          </h3>
          <div className="space-y-3">
            {visitor.followUpHistory.map((followUp, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getFollowUpStatusColor(followUp.status)}`}>
                    {followUp.status}
                  </span>
                  <span className="text-sm text-gray-600">
                    {new Date(followUp.date).toLocaleDateString()} at {new Date(followUp.date).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-700">{followUp.note}</p>
                <p className="text-xs text-gray-500 mt-2">By: {followUp.recordedBy}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Convert to Member Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Convert to Member</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="label">Select Department *</label>
                <select
                  value={conversionData.department}
                  onChange={(e) => setConversionData({ ...conversionData, department: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Choose department...</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Membership Type *</label>
                <select
                  value={conversionData.membershipType}
                  onChange={(e) => setConversionData({ ...conversionData, membershipType: e.target.value })}
                  className="input-field"
                  required
                >
                  {membershipTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This will create a new member record and mark this visitor as converted.
                  The visitor's information will be transferred to the Members section.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConvertModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConvertToMember}
                className="btn-primary"
              >
                Convert to Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {showFollowUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Follow-up Note</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="label">Follow-up Status *</label>
                <select
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="No Response">No Response</option>
                </select>
              </div>

              <div>
                <label className="label">Follow-up Note *</label>
                <textarea
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="input-field"
                  rows="4"
                  placeholder="What happened during this follow-up?"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowFollowUpModal(false);
                  setFollowUpNote('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateFollowUp}
                className="btn-primary"
              >
                Save Follow-up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorProfile;
