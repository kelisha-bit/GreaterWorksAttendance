// Fix: Removed the import statement from `../types` as this file is the source of truth for these types and the import was causing declaration conflicts.

export enum Gender {
  Male = 'Male',
  Female = 'Female',
}

export enum MembershipType {
  Adult = 'Adult',
  Youth = 'Youth',
  Child = 'Child',
  Visitor = 'Visitor',
}

export enum Department {
  Pastoral = 'Pastoral Team',
  Ushers = 'Ushers',
  Choir = 'Choir',
  Media = 'Media & Tech',
  Children = "Children's Ministry",
  None = 'None',
}

export enum EventType {
  SundayService = 'Sunday Service',
  PrayerMeeting = 'Prayer Meeting',
  DepartmentMeeting = 'Department Meeting',
  SpecialEvent = 'Special Event',
}

export enum UserRole {
    Admin = 'Admin',
    Leader = 'Leader',
    Viewer = 'Viewer',
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
}

export interface Member {
  id: string;
  fullName: string;
  gender: Gender;
  phone: string;
  email?: string;
  department: Department;
  membershipType: MembershipType;
  profilePhotoUrl?: string;
}

export interface AttendanceSession {
  id: string;
  name: string;
  date: string; // ISO string format
  eventType: EventType;
  department?: Department;
  notes?: string;
}

export interface AttendanceRecord {
  sessionId: string;
  memberId: string;
  present: boolean;
}