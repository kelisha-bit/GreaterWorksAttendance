import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

export const useAttendanceSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(collection(db, 'attendance_sessions'), (snapshot) => {
      try {
        const sessionsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort client-side by date (descending)
        sessionsList.sort((a, b) => new Date(b.date) - new Date(a.date));
        setSessions(sessionsList);
        setError(null);
      } catch (err) {
        console.error('Error processing sessions:', err);
        setError('Failed to process sessions data');
        toast.error('Failed to load sessions');
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error('Error fetching sessions:', err);
      setError('Failed to load sessions');
      toast.error('Failed to load sessions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createSession = useCallback(async (sessionData) => {
    try {
      const newSession = {
        ...sessionData,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'attendance_sessions'), newSession);
      toast.success('Session created successfully');
      return docRef.id;
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
      throw error;
    }
  }, []);

  const deleteSession = useCallback(async (sessionId) => {
    try {
      // Delete all attendance records for this session first
      const recordsQuery = query(
        collection(db, 'attendance_records'),
        where('sessionId', '==', sessionId)
      );
      const recordsSnapshot = await getDocs(recordsQuery);
      
      const deletePromises = recordsSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      // Delete the session itself
      await deleteDoc(doc(db, 'attendance_sessions', sessionId));
      
      toast.success('Session deleted successfully');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
      throw error;
    }
  }, []);

  return { sessions, loading, error, createSession, deleteSession };
};

export const useAttendanceRecords = (sessionId) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      query(collection(db, 'attendance_records'), where('sessionId', '==', sessionId)),
      (snapshot) => {
        try {
          const recordsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setRecords(recordsList);
          setError(null);
        } catch (err) {
          console.error('Error processing records:', err);
          setError('Failed to process attendance records');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching attendance records:', err);
        setError('Failed to load attendance records');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  const markAttendance = useCallback(async (memberId) => {
    if (!sessionId) {
      throw new Error('No session selected');
    }

    try {
      // Check if already marked
      if (records.some(r => r.memberId === memberId)) {
        toast.error('Member already marked present');
        return;
      }

      const attendanceRecord = {
        sessionId,
        memberId,
        markedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'attendance_records'), attendanceRecord);
      toast.success('Attendance marked successfully');
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
      throw error;
    }
  }, [sessionId, records]);

  return { records, loading, error, markAttendance };
};

export const useMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(collection(db, 'members'), (snapshot) => {
      try {
        const membersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMembers(membersList);
        setError(null);
      } catch (err) {
        console.error('Error processing members:', err);
        setError('Failed to process members data');
        toast.error('Failed to load members');
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error('Error fetching members:', err);
      setError('Failed to load members');
      toast.error('Failed to load members');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getMemberById = useCallback((memberId) => {
    return members.find(m => m.memberId === memberId || m.id === memberId);
  }, [members]);

  const getMemberByDocumentId = useCallback((documentId) => {
    return members.find(m => m.id === documentId);
  }, [members]);

  return { 
    members, 
    loading, 
    error, 
    getMemberById, 
    getMemberByDocumentId 
  };
};

export const useAllAttendanceRecords = () => {
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(collection(db, 'attendance_records'), (snapshot) => {
      try {
        const recordsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllRecords(recordsList);
        setError(null);
      } catch (err) {
        console.error('Error processing all records:', err);
        setError('Failed to process attendance records');
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error('Error fetching all attendance records:', err);
      setError('Failed to load attendance records');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getAttendanceCountForSession = useCallback((sessionId) => {
    return allRecords.filter(record => record.sessionId === sessionId).length;
  }, [allRecords]);

  return { allRecords, loading, error, getAttendanceCountForSession };
};

export const useAttendanceFilters = (members, records) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

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

  const getFilteredMembers = useCallback(() => {
    let filtered = members;

    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.memberId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDepartment && filterDepartment !== 'All') {
      filtered = filtered.filter(m =>
        Array.isArray(m.department)
          ? m.department.includes(filterDepartment)
          : m.department === filterDepartment
      );
    }

    return filtered;
  }, [members, searchTerm, filterDepartment]);

  const isPresent = useCallback((member) => {
    return records.some(r => r.memberId === member.memberId);
  }, [records]);

  const getPresentMembers = useCallback(() => {
    return members.filter(m => isPresent(m));
  }, [members, isPresent]);

  return {
    searchTerm,
    setSearchTerm,
    filterDepartment,
    setFilterDepartment,
    departments,
    getFilteredMembers,
    isPresent,
    getPresentMembers
  };
};
