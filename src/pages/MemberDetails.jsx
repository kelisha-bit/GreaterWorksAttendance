import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRealtimeMemberData } from '../hooks/useRealtimeMemberData';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Users, 
  Calendar, 
  User,
  MapPin,
  Cake,
  Heart,
  Briefcase,
  AlertCircle,
  Edit2,
  Download,
  FileText,
  Home,
  Church,
  Award,
  Star
} from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const MemberDetails = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { isLeader } = useAuth();
  const { member, loading, error, refreshMemberData } = useRealtimeMemberData(memberId);

  useEffect(() => {
    if (error) {
      toast.error(error);
      if (error === 'Member not found') {
        navigate('/members');
      }
    }
  }, [error, navigate]);

  const calculateAge = () => {
    if (!member?.dateOfBirth) return null;
    return differenceInYears(new Date(), new Date(member.dateOfBirth));
  };

  const exportMemberDetails = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(212, 175, 55);
    doc.text('Greater Works City Church', 14, 20);
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Member Details Report', 14, 28);
    
    // Member Basic Info
    doc.setFontSize(14);
    doc.text('Personal Information', 14, 40);
    doc.setFontSize(10);
    let yPosition = 48;
    
    const fields = [
      ['Full Name', member.fullName],
      ['Member ID', member.memberId],
      ['Gender', member.gender],
      ['Date of Birth', member.dateOfBirth ? format(new Date(member.dateOfBirth), 'MMMM dd, yyyy') : 'Not specified'],
      ['Age', calculateAge() ? `${calculateAge()} years` : 'Not specified'],
      ['Phone Number', member.phoneNumber],
      ['Email', member.email || 'Not specified'],
      ['Address', member.address || 'Not specified'],
      ['Marital Status', member.maritalStatus || 'Not specified'],
      ['Wedding Anniversary', member.weddingAnniversary ? format(new Date(member.weddingAnniversary), 'MMMM dd') : 'Not specified']
    ];

    fields.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 14, yPosition);
      yPosition += 7;
    });

    // Church Information
    yPosition += 10;
    doc.setFontSize(14);
    doc.text('Church Information', 14, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    
    const churchFields = [
      ['Department', member.department],
      ['Membership Type', member.membershipType],
      ['Membership Status', member.membershipStatus || 'Active'],
      ['Date Joined', member.dateJoined ? format(new Date(member.dateJoined), 'MMMM dd, yyyy') : format(new Date(member.createdAt), 'MMMM dd, yyyy')],
      ['Tithe Envelope Number', member.titheEnvelopeNumber || 'Not assigned'],
      ['Home Cell/Group', member.homeCell || 'Not assigned'],
      ['Baptism Status', member.baptismStatus || 'Not specified'],
      ['Baptism Date', member.baptismDate ? format(new Date(member.baptismDate), 'MMMM dd, yyyy') : 'Not specified'],
      ['Salvation Date', member.salvationDate ? format(new Date(member.salvationDate), 'MMMM dd, yyyy') : 'Not specified'],
      ['Previous Church', member.previousChurch || 'Not specified']
    ];

    churchFields.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 14, yPosition);
      yPosition += 7;
    });

    // Professional Information
    yPosition += 10;
    doc.setFontSize(14);
    doc.text('Professional Information', 14, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    
    const professionalFields = [
      ['Occupation', member.occupation || 'Not specified'],
      ['Skills/Talents', member.skills || 'Not specified'],
      ['Ministry Interests', member.ministryInterests || 'Not specified']
    ];

    professionalFields.forEach(([label, value]) => {
      const lines = doc.splitTextToSize(value, 180);
      doc.text(`${label}:`, 14, yPosition);
      yPosition += 5;
      lines.forEach(line => {
        doc.text(line, 20, yPosition);
        yPosition += 5;
      });
      yPosition += 2;
    });

    // Emergency Contact
    if (member.emergencyContactName || member.emergencyContactPhone) {
      yPosition += 10;
      doc.setFontSize(14);
      doc.text('Emergency Contact', 14, yPosition);
      yPosition += 8;
      doc.setFontSize(10);
      
      if (member.emergencyContactName) {
        doc.text(`Name: ${member.emergencyContactName}`, 14, yPosition);
        yPosition += 7;
      }
      if (member.emergencyContactPhone) {
        doc.text(`Phone: ${member.emergencyContactPhone}`, 14, yPosition);
        yPosition += 7;
      }
    }

    // Notes
    if (member.notes) {
      yPosition += 10;
      doc.setFontSize(14);
      doc.text('Additional Notes', 14, yPosition);
      yPosition += 8;
      doc.setFontSize(10);
      
      const noteLines = doc.splitTextToSize(member.notes, 180);
      noteLines.forEach(line => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 14, yPosition);
        yPosition += 5;
      });
    }
    
    doc.save(`${member.fullName}_Details.pdf`);
    toast.success('Member details exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Member not found</p>
      </div>
    );
  }

  const age = calculateAge();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={() => navigate(`/members/${memberId}`)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Profile</span>
        </button>
        <div className="flex gap-2">
          <button
            onClick={exportMemberDetails}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Details</span>
          </button>
          {isLeader && (
            <button
              onClick={() => navigate(`/members/${memberId}/edit`)}
              className="btn-primary flex items-center space-x-2"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Details</span>
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <button onClick={() => navigate('/members')} className="hover:text-gray-900">Members</button>
        <span>/</span>
        <button onClick={() => navigate(`/members/${memberId}`)} className="hover:text-gray-900">{member.fullName}</button>
        <span>/</span>
        <span className="text-gray-900 font-medium">Details</span>
      </div>

      {/* Profile Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Photo */}
          <div className="flex-shrink-0">
            {member.profilePhotoURL ? (
              <img
                src={member.profilePhotoURL}
                alt={member.fullName}
                className="w-32 h-32 rounded-full object-cover border-4 border-church-gold"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-church-gold bg-opacity-10 flex items-center justify-center border-4 border-church-gold">
                <User className="w-16 h-16 text-church-gold" />
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{member.fullName}</h1>
            <div className="flex flex-wrap gap-3 mb-4">
              <p className="text-sm text-gray-600 font-mono bg-gray-100 px-3 py-1 rounded">
                <span className="font-semibold">ID:</span> {member.memberId}
              </p>
              {member.titheEnvelopeNumber && (
                <p className="text-sm text-church-gold font-mono bg-church-lightGold px-3 py-1 rounded">
                  <span className="font-semibold">Tithe Env:</span> {member.titheEnvelopeNumber}
                </p>
              )}
              {member.membershipStatus && (
                <p className={`text-sm font-semibold px-3 py-1 rounded ${
                  member.membershipStatus === 'Active' ? 'bg-green-100 text-green-800' :
                  member.membershipStatus === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                  member.membershipStatus === 'Transferred' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {member.membershipStatus}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 text-gray-700">
                <Phone className="w-5 h-5 text-church-gold flex-shrink-0" />
                <span>{member.phoneNumber}</span>
              </div>
              
              {member.email && (
                <div className="flex items-center space-x-3 text-gray-700">
                  <Mail className="w-5 h-5 text-church-gold flex-shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-3 text-gray-700">
                <Users className="w-5 h-5 text-church-gold flex-shrink-0" />
                <span>{member.department}</span>
              </div>
              
              <div className="flex items-center space-x-3 text-gray-700">
                <User className="w-5 h-5 text-church-gold flex-shrink-0" />
                <span>{member.membershipType} • {member.gender}</span>
              </div>
              
              {member.dateOfBirth && (
                <div className="flex items-center space-x-3 text-gray-700">
                  <Cake className="w-5 h-5 text-church-gold flex-shrink-0" />
                  <span>{age} years old</span>
                </div>
              )}
              
              <div className="flex items-center space-x-3 text-gray-700">
                <Calendar className="w-5 h-5 text-church-gold flex-shrink-0" />
                <span>Joined {member.dateJoined ? format(new Date(member.dateJoined), 'MMM dd, yyyy') : format(new Date(member.createdAt), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <User className="w-6 h-6 mr-2 text-church-gold" />
          Personal Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Basic Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Full Name:</span>
                  <span className="font-medium">{member.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Member ID:</span>
                  <span className="font-medium font-mono">{member.memberId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gender:</span>
                  <span className="font-medium">{member.gender}</span>
                </div>
                {member.dateOfBirth && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date of Birth:</span>
                      <span className="font-medium">{format(new Date(member.dateOfBirth), 'MMMM dd, yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age:</span>
                      <span className="font-medium">{age} years</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Contact Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{member.phoneNumber}</span>
                </div>
                {member.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium truncate ml-2">{member.email}</span>
                  </div>
                )}
                {member.address && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-medium text-right">{member.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Family Information</h3>
              <div className="space-y-2">
                {member.maritalStatus && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Marital Status:</span>
                    <span className="font-medium">{member.maritalStatus}</span>
                  </div>
                )}
                {member.weddingAnniversary && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Anniversary:</span>
                    <span className="font-medium">{format(new Date(member.weddingAnniversary), 'MMMM dd')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Church Information Section */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Church className="w-6 h-6 mr-2 text-church-gold" />
          Church Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Membership Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium">{member.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Membership Type:</span>
                  <span className="font-medium">{member.membershipType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium px-2 py-1 rounded text-xs ${
                    member.membershipStatus === 'Active' ? 'bg-green-100 text-green-800' :
                    member.membershipStatus === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                    member.membershipStatus === 'Transferred' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {member.membershipStatus || 'Active'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date Joined:</span>
                  <span className="font-medium">
                    {member.dateJoined ? format(new Date(member.dateJoined), 'MMM dd, yyyy') : format(new Date(member.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Spiritual Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Baptism Status:</span>
                  <span className="font-medium">{member.baptismStatus || 'Not specified'}</span>
                </div>
                {member.baptismDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Baptism Date:</span>
                    <span className="font-medium">{format(new Date(member.baptismDate), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                {member.salvationDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Salvation Date:</span>
                    <span className="font-medium">{format(new Date(member.salvationDate), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                {member.previousChurch && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Previous Church:</span>
                    <span className="font-medium">{member.previousChurch}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Group Assignments</h3>
              <div className="space-y-2">
                {member.titheEnvelopeNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tithe Envelope:</span>
                    <span className="font-medium font-mono">{member.titheEnvelopeNumber}</span>
                  </div>
                )}
                {member.homeCell && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Home Cell:</span>
                    <span className="font-medium">{member.homeCell}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Information Section */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Briefcase className="w-6 h-6 mr-2 text-church-gold" />
          Professional Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {member.occupation && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Occupation</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">{member.occupation}</p>
            </div>
          )}
          
          {member.skills && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Skills & Talents</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">{member.skills}</p>
            </div>
          )}
          
          {member.ministryInterests && (
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Ministry Interests</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">{member.ministryInterests}</p>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contact Section */}
      {(member.emergencyContactName || member.emergencyContactPhone) && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <AlertCircle className="w-6 h-6 mr-2 text-red-600" />
            Emergency Contact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {member.emergencyContactName && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Contact Name</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded">{member.emergencyContactName}</p>
              </div>
            )}
            
            {member.emergencyContactPhone && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Contact Phone</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded">{member.emergencyContactPhone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Notes Section */}
      {member.notes && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-church-gold" />
            Additional Notes
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{member.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDetails;
