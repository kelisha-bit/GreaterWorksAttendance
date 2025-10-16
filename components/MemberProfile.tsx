import React, { useMemo, useState } from 'react';
import { Member, AttendanceSession, AttendanceRecord } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import { QrcodeIcon } from './icons';
import QrCodeModal from './common/QrCodeModal';

interface MemberProfileProps {
  member: Member;
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  onBack: () => void;
}

const MemberProfile: React.FC<MemberProfileProps> = ({ member, sessions, records, onBack }) => {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const memberAttendance = useMemo(() => {
    return sessions
      .map(session => {
        const record = records.find(r => r.sessionId === session.id && r.memberId === member.id);
        // Only include sessions where this member was expected (or has a record)
        // For department meetings, only include if the member is in that department
        if(session.department && session.department !== member.department) {
            return null;
        }
        return {
          date: new Date(session.date).toLocaleDateString(),
          sessionName: session.name,
          eventType: session.eventType,
          present: record?.present ?? false, // Default to absent if no record found
        };
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [member, sessions, records]);

  const attendanceRate = useMemo(() => {
    if (memberAttendance.length === 0) return 0;
    const presentCount = memberAttendance.filter(a => a.present).length;
    return ((presentCount / memberAttendance.length) * 100).toFixed(0);
  }, [memberAttendance]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gw-dark">Member Profile</h1>
        <Button onClick={onBack} variant="secondary">
          &larr; Back to Member List
        </Button>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="flex flex-col items-center text-center">
                <img 
                    src={member.profilePhotoUrl || `https://picsum.photos/seed/${member.id}/200`} 
                    alt={member.fullName}
                    className="h-32 w-32 rounded-full object-cover mb-4 shadow-lg"
                />
                <h2 className="text-2xl font-bold text-gw-dark">{member.fullName}</h2>
                <div className="flex items-center gap-2 text-gray-500">
                    <span>{member.id}</span>
                    <button 
                        onClick={() => setIsQrModalOpen(true)}
                        className="hover:text-gw-gold" 
                        title="Show QR Code"
                    >
                        <QrcodeIcon className="h-5 w-5" />
                    </button>
                </div>
                 <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <span className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {member.membershipType}
                    </span>
                    <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                        {member.department}
                    </span>
                </div>
            </Card>
             <Card>
                <h3 className="text-lg font-bold text-gw-dark mb-2">Contact Information</h3>
                <p className="text-gray-700"><strong>Phone:</strong> {member.phone}</p>
                <p className="text-gray-700"><strong>Email:</strong> {member.email || 'N/A'}</p>
                <p className="text-gray-700"><strong>Gender:</strong> {member.gender}</p>
            </Card>
        </div>
        
        {/* Right Column */}
        <div className="lg:col-span-2">
            <Card>
                 <h3 className="text-xl font-bold text-gw-dark mb-4">Attendance History</h3>
                 <div className="mb-4 text-center">
                    <p className="text-4xl font-bold text-gw-gold">{attendanceRate}%</p>
                    <p className="text-gray-500">Overall Attendance Rate</p>
                 </div>
                 <div className="overflow-y-auto max-h-96 border-t">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {memberAttendance.map((att, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{att.date}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{att.sessionName}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            att.present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {att.present ? 'Present' : 'Absent'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </Card>
        </div>
      </div>
      <QrCodeModal member={isQrModalOpen ? member : null} onClose={() => setIsQrModalOpen(false)} />
    </div>
  );
};

export default MemberProfile;
