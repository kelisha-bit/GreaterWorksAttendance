import { Member, AttendanceSession, AttendanceRecord, Gender, MembershipType, Department, EventType } from '../types';

export const mockMembers: Member[] = [
  { id: 'GWCC-001', fullName: 'John Doe', gender: Gender.Male, phone: '0244123456', department: Department.Pastoral, membershipType: MembershipType.Adult, profilePhotoUrl: 'https://picsum.photos/seed/john/200' },
  { id: 'GWCC-002', fullName: 'Jane Smith', gender: Gender.Female, phone: '0244654321', email: 'jane.s@example.com', department: Department.Choir, membershipType: MembershipType.Adult, profilePhotoUrl: 'https://picsum.photos/seed/jane/200' },
  { id: 'GWCC-003', fullName: 'Kwame Nkrumah', gender: Gender.Male, phone: '0208111222', department: Department.Ushers, membershipType: MembershipType.Adult, profilePhotoUrl: 'https://picsum.photos/seed/kwame/200' },
  { id: 'GWCC-004', fullName: 'Ama Serwaa', gender: Gender.Female, phone: '0555987654', department: Department.Media, membershipType: MembershipType.Youth, profilePhotoUrl: 'https://picsum.photos/seed/ama/200' },
  { id: 'GWCC-005', fullName: 'David Mensah', gender: Gender.Male, phone: '0277333444', department: Department.Children, membershipType: MembershipType.Adult, profilePhotoUrl: 'https://picsum.photos/seed/david/200' },
  { id: 'GWCC-006', fullName: 'Grace Osei', gender: Gender.Female, phone: '0266555888', department: Department.Choir, membershipType: MembershipType.Youth, profilePhotoUrl: 'https://picsum.photos/seed/grace/200' },
  { id: 'GWCC-007', fullName: 'Michael Baah', gender: Gender.Male, phone: '0501239876', department: Department.Ushers, membershipType: MembershipType.Adult, profilePhotoUrl: 'https://picsum.photos/seed/michael/200' },
  { id: 'GWCC-008', fullName: 'Esther Adjei', gender: Gender.Female, phone: '0233456123', department: Department.None, membershipType: MembershipType.Visitor, profilePhotoUrl: 'https://picsum.photos/seed/esther/200' },
];

const today = new Date();
const lastSunday = new Date(today);
lastSunday.setDate(today.getDate() - today.getDay());
const twoSundaysAgo = new Date(lastSunday);
twoSundaysAgo.setDate(lastSunday.getDate() - 7);


export const mockSessions: AttendanceSession[] = [
  { id: 'SESS-001', name: 'Sunday Service', date: lastSunday.toISOString(), eventType: EventType.SundayService, notes: 'Special guest speaker today.' },
  { id: 'SESS-002', name: 'Mid-Week Prayer', date: new Date(lastSunday.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), eventType: EventType.PrayerMeeting },
  { id: 'SESS-003', name: 'Sunday Service', date: twoSundaysAgo.toISOString(), eventType: EventType.SundayService },
  { id: 'SESS-004', name: 'Choir Rehearsal', date: new Date(lastSunday.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), eventType: EventType.DepartmentMeeting, department: Department.Choir, notes: 'Preparing for the Christmas concert.' },
];

export const mockRecords: AttendanceRecord[] = [
  // Session 1
  { sessionId: 'SESS-001', memberId: 'GWCC-001', present: true },
  { sessionId: 'SESS-001', memberId: 'GWCC-002', present: true },
  { sessionId: 'SESS-001', memberId: 'GWCC-003', present: false },
  { sessionId: 'SESS-001', memberId: 'GWCC-004', present: true },
  { sessionId: 'SESS-001', memberId: 'GWCC-005', present: true },
  { sessionId: 'SESS-001', memberId: 'GWCC-006', present: false },
  { sessionId: 'SESS-001', memberId: 'GWCC-007', present: true },
  { sessionId: 'SESS-001', memberId: 'GWCC-008', present: true },
  // Session 3
  { sessionId: 'SESS-003', memberId: 'GWCC-001', present: true },
  { sessionId: 'SESS-003', memberId: 'GWCC-002', present: true },
  { sessionId: 'SESS-003', memberId: 'GWCC-003', present: true },
  { sessionId: 'SESS-003', memberId: 'GWCC-004', present: false },
  { sessionId: 'SESS-003', memberId: 'GWCC-005', present: true },
  { sessionId: 'SESS-003', memberId: 'GWCC-006', present: true },
  { sessionId: 'SESS-003', memberId: 'GWCC-007', present: true },
  { sessionId: 'SESS-003', memberId: 'GWCC-008', present: false },
  // Session 4
  { sessionId: 'SESS-004', memberId: 'GWCC-002', present: true },
  { sessionId: 'SESS-004', memberId: 'GWCC-006', present: true },
];