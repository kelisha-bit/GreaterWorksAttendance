import React, { useState, useMemo, useEffect, useRef } from 'react';
// Fix: Import MembershipType to use in component logic.
import { AttendanceRecord, AttendanceSession, Department, EventType, Member, UserRole, MembershipType } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Modal from './common/Modal';
import { PlusIcon, QrcodeIcon } from './icons';

// This tells TypeScript that a 'Html5Qrcode' variable will be available globally,
// as it's loaded from a script tag in index.html.
declare var Html5Qrcode: any;


interface AttendanceTrackingProps {
  members: Member[];
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  setSessions: React.Dispatch<React.SetStateAction<AttendanceSession[]>>;
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  currentRole: UserRole;
}

const SessionForm: React.FC<{onSave: (session: Omit<AttendanceSession, 'id'>) => void; onCancel: () => void}> = ({ onSave, onCancel }) => {
    const [name, setName] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [eventType, setEventType] = useState<EventType>(EventType.SundayService);
    const [department, setDepartment] = useState<Department | undefined>(undefined);
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, date: new Date(date).toISOString(), eventType, department: eventType === EventType.DepartmentMeeting ? department : undefined, notes });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Session Name / Title</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g., Sunday Service" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Event Type</label>
                <select value={eventType} onChange={e => setEventType(e.target.value as EventType)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                    {Object.values(EventType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            {eventType === EventType.DepartmentMeeting && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <select value={department} onChange={e => setDepartment(e.target.value as Department)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                        <option value="">Select a Department</option>
                        {Object.values(Department).filter(d => d !== Department.None).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    rows={3}
                    placeholder="e.g., Special guest speaker, combined service, etc."
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" 
                />
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Create Session</Button>
            </div>
        </form>
    )
};

const AttendanceTaker: React.FC<{
    session: AttendanceSession;
    members: Member[];
    records: AttendanceRecord[];
    onSave: (updatedRecords: AttendanceRecord[]) => void;
    onBack: () => void;
    currentRole: UserRole;
}> = ({ session, members, records, onSave, onBack, currentRole }) => {
    
    const relevantMembers = useMemo(() => {
        if (session.department) {
            return members.filter(m => m.department === session.department);
        }
        return members.filter(m => m.membershipType !== MembershipType.Visitor); // Default to non-visitors for general services
    }, [members, session]);

    const [attendance, setAttendance] = useState<Map<string, boolean>>(() => {
        const map = new Map<string, boolean>();
        relevantMembers.forEach(member => {
            const record = records.find(r => r.sessionId === session.id && r.memberId === member.id);
            map.set(member.id, record?.present ?? false);
        });
        return map;
    });

    const [isScanning, setIsScanning] = useState(false);
    const [lastScannedMemberId, setLastScannedMemberId] = useState<string | null>(null);
    const [scanMessage, setScanMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const scannerRef = useRef<any>(null);
    
    useEffect(() => {
        if (isScanning) {
            setScanMessage(null); // Clear previous messages when starting
            const scanner = new Html5Qrcode('qr-scanner-container');
            scannerRef.current = scanner;

            const onScanSuccess = (decodedText: string) => {
                const member = relevantMembers.find(m => m.id === decodedText);
                if (member) {
                    handleToggle(member.id, true); // Mark as present
                    setLastScannedMemberId(member.id);
                    setScanMessage({ type: 'success', text: `Success: ${member.fullName} marked as present.` });
                    
                    const memberRow = document.getElementById(`member-row-${member.id}`);
                    memberRow?.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Clear visual feedback after a delay
                    setTimeout(() => setLastScannedMemberId(null), 2000);
                    setTimeout(() => setScanMessage(null), 3000);
                } else {
                    setScanMessage({ type: 'error', text: `Error: Member ID "${decodedText}" not found in this session's list.` });
                    setTimeout(() => setScanMessage(null), 3000);
                }
            };

            const onScanFailure = (error: string) => { /* मौन रहना सबसे अच्छा है */ };

            scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                onScanSuccess,
                onScanFailure
            ).catch((err: any) => {
                setScanMessage({ type: 'error', text: `Failed to start scanner: ${err.message}` });
                setIsScanning(false);
            });
        } else if (scannerRef.current?.isScanning) {
            scannerRef.current.stop().catch((err: any) => console.error('Failed to stop the scanner.', err));
        }

        return () => {
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch((err: any) => console.error('Failed to stop scanner on cleanup.', err));
            }
        };
    }, [isScanning, relevantMembers]);
    
    const handleToggle = (memberId: string, forcePresent?: boolean) => {
        setAttendance(prev => {
            const newMap = new Map(prev);
            newMap.set(memberId, forcePresent === true ? true : !newMap.get(memberId));
            return newMap;
        });
    };

    const handleSaveClick = () => {
        if (currentRole === UserRole.Viewer) return;
        setIsConfirmModalOpen(true);
    };

    const handleConfirmSave = () => {
        const updatedRecords: AttendanceRecord[] = [];
        attendance.forEach((present, memberId) => {
            updatedRecords.push({ sessionId: session.id, memberId, present });
        });
        onSave(updatedRecords);
        setIsConfirmModalOpen(false);
        onBack();
    };

    const presentCount = Array.from(attendance.values()).filter(Boolean).length;
    const total = attendance.size;

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                 <div>
                    <h2 className="text-xl font-bold text-gw-dark">{session.name}</h2>
                    <p className="text-gray-500">{new Date(session.date).toLocaleDateString()}</p>
                    {session.notes && <p className="text-sm text-gray-600 mt-1 italic">Note: {session.notes}</p>}
                 </div>
                 <Button onClick={onBack} variant="secondary">&larr; Back to Sessions</Button>
            </div>
            
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-4">
                <div className="text-lg">
                    <span className="font-bold text-green-600">{presentCount}</span> Present / <span className="font-bold">{total}</span> Total
                </div>
                 <div className="flex items-center gap-4">
                    {currentRole !== UserRole.Viewer && (
                        <>
                            <Button 
                                onClick={() => setIsScanning(prev => !prev)} 
                                icon={<QrcodeIcon className="h-5 w-5"/>}
                                variant={isScanning ? 'secondary' : 'primary'}
                            >
                                {isScanning ? 'Stop Scanning' : 'Scan QR Code'}
                            </Button>
                            <Button onClick={handleSaveClick}>Save Attendance</Button>
                        </>
                    )}
                </div>
            </div>
            
            {isScanning && (
                <div className="my-4 p-4 border rounded-lg bg-gray-100 shadow-inner">
                    <div id="qr-scanner-container" className="w-full max-w-sm mx-auto"></div>
                    {scanMessage && (
                        <p className={`text-center mt-2 font-medium ${scanMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                            {scanMessage.text}
                        </p>
                    )}
                </div>
            )}

            <div className="overflow-y-auto max-h-[60vh]">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {relevantMembers.map(member => (
                            <tr 
                                key={member.id} 
                                id={`member-row-${member.id}`}
                                className={`${lastScannedMemberId === member.id ? 'bg-green-200' : ''} transition-colors duration-500`}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {member.fullName} <span className="text-gray-500 font-normal">({member.id})</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <button 
                                        onClick={() => handleToggle(member.id)} 
                                        disabled={currentRole === UserRole.Viewer}
                                        className={`px-4 py-2 text-sm font-semibold rounded-full w-28 transition-colors ${
                                            attendance.get(member.id) 
                                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                                        } ${currentRole === UserRole.Viewer ? 'cursor-not-allowed' : ''}`}
                                    >
                                        {attendance.get(member.id) ? 'Present' : 'Absent'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Confirm Attendance"
            >
                <div className="text-center">
                    <p className="text-lg text-gray-700 mb-6">
                        Are you sure you want to save these attendance records for this session?
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmSave}>
                            Yes, Save Records
                        </Button>
                    </div>
                </div>
            </Modal>
        </Card>
    )

};


const AttendanceTracking: React.FC<AttendanceTrackingProps> = ({ members, sessions, records, setSessions, setRecords, currentRole }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);

    const sortedSessions = useMemo(() => {
        return [...sessions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sessions]);

    const handleSaveSession = (sessionData: Omit<AttendanceSession, 'id'>) => {
        const newSession: AttendanceSession = {
            ...sessionData,
            id: `SESS-${Date.now()}`
        };
        setSessions(prev => [newSession, ...prev]);
        setIsModalOpen(false);
        setSelectedSession(newSession); // Go directly to taking attendance for the new session
    };

    const handleSaveAttendance = (updatedSessionRecords: AttendanceRecord[]) => {
        const otherRecords = records.filter(r => r.sessionId !== selectedSession!.id);
        setRecords([...otherRecords, ...updatedSessionRecords]);
    };

    if (selectedSession) {
        return <AttendanceTaker 
            session={selectedSession} 
            members={members} 
            records={records} 
            onSave={handleSaveAttendance} 
            onBack={() => setSelectedSession(null)}
            currentRole={currentRole}
        />
    }

    return (
        <div className="p-4 md:p-8 space-y-6">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gw-dark">Attendance Tracking</h1>
                    <p className="text-gray-500">Create a new session or take attendance for an existing one.</p>
                </div>
                 {currentRole === UserRole.Admin && (
                    <Button onClick={() => setIsModalOpen(true)} icon={<PlusIcon className="h-5 w-5"/>}>
                        Create New Session
                    </Button>
                 )}
            </header>
            
            <Card>
                <h2 className="text-xl font-bold text-gw-dark mb-4">Attendance Sessions</h2>
                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                    {sortedSessions.map(session => {
                        const sessionRecords = records.filter(r => r.sessionId === session.id);
                        const presentCount = sessionRecords.filter(r => r.present).length;
                        return (
                            <div key={session.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">{session.name}</p>
                                    <p className="text-sm text-gray-500">{new Date(session.date).toLocaleDateString()} &bull; {session.eventType} {session.department ? `(${session.department})`: ''}</p>
                                    {session.notes && <p className="text-sm text-gray-600 mt-1 italic">Note: {session.notes}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gw-dark">{presentCount} <span className="font-normal text-gray-500">Present</span></p>
                                    <Button variant="secondary" className="mt-1 !py-1 !px-3" onClick={() => setSelectedSession(session)}>
                                        {currentRole === UserRole.Viewer
                                            ? 'View Attendance'
                                            : (sessionRecords.length > 0 ? 'View/Edit' : 'Take Attendance')
                                        }
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>

             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Attendance Session">
                <SessionForm onSave={handleSaveSession} onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default AttendanceTracking;