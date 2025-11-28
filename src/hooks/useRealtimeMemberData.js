import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

export const useRealtimeMemberData = (memberId) => {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch member details with real-time updates
  useEffect(() => {
    if (!memberId) return;

    setLoading(true);
    setError(null);

    // Set up real-time listener for member document
    const unsubscribe = onSnapshot(
      doc(db, 'members', memberId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setMember({ id: docSnapshot.id, ...docSnapshot.data() });
          setError(null);
        } else {
          setError('Member not found');
          setMember(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching member data:', err);
        setError('Failed to load member data');
        setLoading(false);
        toast.error('Failed to load member data');
      }
    );

    return () => unsubscribe();
  }, [memberId]);

  const refreshMemberData = useCallback(async () => {
    if (!memberId) return;
    
    try {
      const memberDoc = await getDoc(doc(db, 'members', memberId));
      if (memberDoc.exists()) {
        setMember({ id: memberDoc.id, ...memberDoc.data() });
      }
    } catch (err) {
      console.error('Error refreshing member data:', err);
      toast.error('Failed to refresh member data');
    }
  }, [memberId]);

  return { member, loading, error, refreshMemberData };
};

export const useRealtimeAttendance = (memberId, memberCode) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const normalizeId = (value) => {
      if (typeof value !== 'string') return '';
      const trimmed = value.trim();
      return trimmed.length ? trimmed : '';
    };

    const identifiers = [normalizeId(memberId), normalizeId(memberCode)]
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);

    if (identifiers.length === 0) {
      setAttendanceRecords([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribeSessions;
    let unsubscribeRecords;

    // Set up real-time listeners for attendance sessions and records
    unsubscribeSessions = onSnapshot(
      query(collection(db, 'attendance_sessions'), orderBy('date', 'desc')),
      (snapshot) => {
        const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const recordsQuery = identifiers.length === 1
          ? query(collection(db, 'attendance_records'), where('memberId', '==', identifiers[0]))
          : query(collection(db, 'attendance_records'), where('memberId', 'in', identifiers));

        if (unsubscribeRecords) unsubscribeRecords();

        unsubscribeRecords = onSnapshot(
          recordsQuery,
          (recordsSnapshot) => {
            const records = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const combinedData = sessions.map(session => {
              const record = records.find(r => r.sessionId === session.id);
              const isPresent = !!record;
              return {
                sessionId: session.id,
                sessionName: session.name || session.sessionName || 'Unknown Session',
                date: session.date,
                eventType: session.eventType || 'Service',
                present: isPresent,
                checkInTime: record?.checkInTime || record?.markedAt || null,
                notes: record?.notes || ''
              };
            });

            setAttendanceRecords(combinedData);
            setError(null);
            setLoading(false);
          },
          (err) => {
            console.error('Error fetching attendance records:', err);
            setError('Failed to load attendance data');
            setLoading(false);
          }
        );
      },
      (err) => {
        console.error('Error fetching attendance sessions:', err);
        setError('Failed to load attendance sessions');
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribeRecords) unsubscribeRecords();
      if (unsubscribeSessions) unsubscribeSessions();
    };
  }, [memberId, memberCode]);

  return { attendanceRecords, loading, error };
};

export const useRealtimeContributions = (memberId, options = {}) => {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const memberCode = typeof options.memberCode === 'string'
      ? options.memberCode.trim()
      : options.memberCode;
    const memberName = typeof options.memberName === 'string'
      ? options.memberName.trim()
      : options.memberName;

    const identifiers = [
      { key: 'byDocId', field: 'memberId', value: memberId },
      { key: 'byCode', field: 'memberId', value: memberCode },
      { key: 'byName', field: 'memberName', value: memberName }
    ];

    const seen = new Set();
    const activeIdentifiers = identifiers
      .filter(({ value }) => Boolean(value))
      .filter(({ field, value }) => {
        const dedupeKey = `${field}:${value}`;
        if (seen.has(dedupeKey)) {
          return false;
        }
        seen.add(dedupeKey);
        return true;
      });

    if (activeIdentifiers.length === 0) {
      setContributions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let isMounted = true;
    const latestData = activeIdentifiers.reduce((acc, { key }) => {
      acc[key] = [];
      return acc;
    }, {});

    const handleError = (err) => {
      console.error('Error fetching contributions:', err);
      if (isMounted) {
        setError('Failed to load contribution data');
        setLoading(false);
        toast.error('Failed to load contribution data');
      }
    };

    const mergeAndSet = () => {
      if (!isMounted) return;
      const combined = Object.values(latestData).flat();
      const uniqueMap = new Map();
      combined.forEach(contribution => {
        uniqueMap.set(contribution.id, contribution);
      });
      const sortedContributions = Array.from(uniqueMap.values()).sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setContributions(sortedContributions);
      setError(null);
      setLoading(false);
    };

    const unsubscribes = activeIdentifiers.map(({ key, field, value }) => {
      const contributionsQuery = query(
        collection(db, 'contributions'),
        where(field, '==', value)
      );

      return onSnapshot(
        contributionsQuery,
        (snapshot) => {
          latestData[key] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          mergeAndSet();
        },
        handleError
      );
    });

    return () => {
      isMounted = false;
      unsubscribes.forEach(unsub => unsub && unsub());
    };
  }, [memberId, options.memberCode, options.memberName]);

  return { contributions, loading, error };
};

export const useRealtimeNotes = (memberId) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!memberId) return;

    setLoading(true);

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'member_notes'),
        where('memberId', '==', memberId)
      ),
      (snapshot) => {
        const notesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort by createdAt (descending)
        const sortedNotes = notesList.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setNotes(sortedNotes);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching notes:', err);
        setError('Failed to load notes');
        setLoading(false);
        toast.error('Failed to load notes');
      }
    );

    return () => unsubscribe();
  }, [memberId]);

  return { notes, loading, error };
};

export const useRealtimeEvents = (memberId, memberCode) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const normalizeId = (value) => {
      if (typeof value !== 'string') return '';
      const trimmed = value.trim();
      return trimmed.length ? trimmed : '';
    };

    const identifiers = [normalizeId(memberId), normalizeId(memberCode)]
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);

    if (identifiers.length === 0) {
      setEvents([]);
      setError(null);
      setLoading(false);
      return;
    }

    const normalizeDateValue = (value) => {
      if (!value) return null;
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
      }
      if (typeof value.toDate === 'function') {
        const converted = value.toDate();
        return isNaN(converted.getTime()) ? null : converted;
      }
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const enhanceEventData = (event) => {
      const startDate = normalizeDateValue(event.startDate || event.date);
      const endDate = normalizeDateValue(event.endDate || event.startDate || event.date);
      const displayDate = startDate || endDate || null;
      const registrationDeadline = normalizeDateValue(event.registrationDeadline);
      const formattedTime = event.time 
        || (event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` 
          : event.startTime || event.endTime || null);

      return {
        ...event,
        name: event.name || event.title || 'Untitled Event',
        title: event.title || event.name || 'Untitled Event',
        description: event.description || event.details || '',
        type: event.type || event.eventType || 'service',
        startDate,
        endDate,
        date: displayDate,
        registrationDeadline,
        location: event.location || event.address || 'TBA',
        time: formattedTime,
        eventType: event.eventType || event.type || 'service'
      };
    };

    setLoading(true);
    let unsubscribeEvents;
    let unsubscribeRegistrations;

    const eventsQuery = query(collection(db, 'events'), orderBy('startDate', 'desc'));

    unsubscribeEvents = onSnapshot(
      eventsQuery,
      (eventsSnapshot) => {
        const allEvents = eventsSnapshot.docs.map(doc => enhanceEventData({ id: doc.id, ...doc.data() }));

        const registrationsQuery = identifiers.length === 1
          ? query(collection(db, 'event_registrations'), where('memberId', '==', identifiers[0]))
          : query(collection(db, 'event_registrations'), where('memberId', 'in', identifiers));

        if (unsubscribeRegistrations) unsubscribeRegistrations();

        unsubscribeRegistrations = onSnapshot(
          registrationsQuery,
          (registrationsSnapshot) => {
            const registrations = registrationsSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                registeredAt: normalizeDateValue(data.registeredAt),
                attendedAt: normalizeDateValue(data.attendedAt)
              };
            });

            const sortedRegistrations = registrations.sort((a, b) => {
              const aTime = a.registeredAt ? a.registeredAt.getTime() : 0;
              const bTime = b.registeredAt ? b.registeredAt.getTime() : 0;
              return bTime - aTime;
            });

            const now = new Date();
            const eventsWithParticipation = allEvents.map(event => {
              const eventDate = event.date ? normalizeDateValue(event.date) : null;
              const registration = sortedRegistrations.find(reg => reg.eventId === event.id);
              const isUpcoming = eventDate ? eventDate > now : false;
              const isPast = eventDate ? eventDate <= now : false;

              return {
                ...event,
                registered: !!registration,
                attended: registration?.attended || false,
                registrationStatus: registration?.status || 'not_registered',
                registeredAt: registration?.registeredAt || null,
                role: registration?.role || 'attendee',
                isUpcoming,
                isPast
              };
            }).sort((a, b) => {
              const aTime = a.date ? new Date(a.date).getTime() : 0;
              const bTime = b.date ? new Date(b.date).getTime() : 0;
              return bTime - aTime;
            });

            setEvents(eventsWithParticipation);
            setError(null);
            setLoading(false);
          },
          (err) => {
            console.error('Error fetching event registrations:', err);
            setError('Failed to load event registrations');
            setLoading(false);
          }
        );
      },
      (err) => {
        console.error('Error fetching events:', err);
        setError('Failed to load events');
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribeRegistrations) unsubscribeRegistrations();
      if (unsubscribeEvents) unsubscribeEvents();
    };
  }, [memberId, memberCode]);

  return { events, loading, error };
};
