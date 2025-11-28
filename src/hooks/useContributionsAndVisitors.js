import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

// Hook for fetching contributions data
export const useContributions = () => {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      query(collection(db, 'contributions'), orderBy('date', 'desc')),
      (snapshot) => {
        try {
          const contributionsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setContributions(contributionsList);
          setError(null);
        } catch (err) {
          console.error('Error processing contributions:', err);
          setError('Failed to process contributions data');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching contributions:', err);
        setError('Failed to load contributions');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getThisMonthContributions = useCallback(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    return contributions.filter(c => c.date && c.date.startsWith(currentMonth));
  }, [contributions]);

  const getTotalContributions = useCallback(() => {
    return contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [contributions]);

  const getThisMonthTotal = useCallback(() => {
    return getThisMonthContributions().reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [getThisMonthContributions]);

  const getTopContributors = useCallback((limit = 5) => {
    const contributorTotals = {};
    contributions.forEach(c => {
      const key = c.memberId || c.memberName || 'Unknown';
      if (!contributorTotals[key]) {
        contributorTotals[key] = {
          memberId: c.memberId,
          name: c.memberName || 'Unknown',
          total: 0
        };
      }
      contributorTotals[key].total += c.amount || 0;
    });

    return Object.values(contributorTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }, [contributions]);

  return {
    contributions,
    loading,
    error,
    getThisMonthContributions,
    getTotalContributions,
    getThisMonthTotal,
    getTopContributors
  };
};

// Hook for fetching visitors data
export const useVisitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      query(collection(db, 'visitors'), orderBy('visitDate', 'desc')),
      (snapshot) => {
        try {
          const visitorsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setVisitors(visitorsList);
          setError(null);
        } catch (err) {
          console.error('Error processing visitors:', err);
          setError('Failed to process visitors data');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching visitors:', err);
        setError('Failed to load visitors');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getPendingFollowUps = useCallback(() => {
    return visitors.filter(v => 
      v.followUpStatus === 'Pending' || 
      v.followUpStatus === 'Scheduled' ||
      !v.followUpStatus
    );
  }, [visitors]);

  const getRecentVisitors = useCallback((limit = 5) => {
    return visitors.slice(0, limit);
  }, [visitors]);

  return {
    visitors,
    loading,
    error,
    getPendingFollowUps,
    getRecentVisitors
  };
};
