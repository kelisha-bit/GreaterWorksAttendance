/**
 * Ministry Service
 * 
 * Handles all Firestore operations related to ministries
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  arrayUnion, 
  arrayRemove,
  serverTimestamp,
  Timestamp,
  getCountFromServer,
  limit,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { createMinistry } from '../models/MinistryModel';
import { safeQuery, safeGetDoc, setupListener } from './firestoreHandler.mjs';

// Collection references
const MINISTRIES_COLLECTION = 'ministries';
const USERS_COLLECTION = 'users';

/**
 * Verifies user permissions for ministry operations.
 * @param {string} [ministryId] - Optional ministry ID to check for leadership.
 * @returns {Promise<{currentUser: object, userRole: string, ministryRef: object, existingMinistry: object}>}
 * @private
 */
const _verifyUserPermissions = async (ministryId = null) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required: Please log in.');
  }

  await currentUser.getIdToken(true); // Force token refresh

  const userDocRef = doc(db, USERS_COLLECTION, currentUser.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    throw new Error('User profile not found.');
  }

  const userRole = userDoc.data().role;
  let ministryRef = null;
  let existingMinistry = null;

  if (ministryId) {
    ministryRef = doc(db, MINISTRIES_COLLECTION, ministryId);
    const ministryDoc = await getDoc(ministryRef);
    if (!ministryDoc.exists()) {
      throw new Error('Ministry not found.');
    }
    existingMinistry = ministryDoc.data();
  }

  return { currentUser, userRole, ministryRef, existingMinistry };
};


/**
 * Get all ministries
 * @returns {Promise<Array>} Array of ministry objects
 */
export const getAllMinistries = async () => {
  try {
    const ministries = await safeQuery({
      collectionPath: MINISTRIES_COLLECTION,
      orderByFields: [{ field: 'name', direction: 'asc' }],
      useCache: true
    });
    
    return ministries;
  } catch (error) {
    console.error('Error getting ministries:', error);
    throw error;
  }
};

/**
 * Get ministries by type
 * @param {string} type - Ministry type
 * @returns {Promise<Array>} Array of ministry objects
 */
export const getMinistryByType = async (type) => {
  try {
    const ministries = await safeQuery({
      collectionPath: MINISTRIES_COLLECTION,
      whereConditions: [{ field: 'type', operator: '==', value: type }],
      orderByFields: [{ field: 'name', direction: 'asc' }],
      useCache: true
    });
    
    return ministries;
  } catch (error) {
    console.error(`Error getting ministries of type ${type}:`, error);
    throw error;
  }
};

/**
 * Get a ministry by ID
 * @param {string} ministryId - Ministry ID
 * @returns {Promise<Object|null>} Ministry object or null if not found
 */
export const getMinistryById = async (ministryId) => {
  try {
    const ministry = await safeGetDoc({
      docPath: `${MINISTRIES_COLLECTION}/${ministryId}`,
      useCache: true
    });
    
    return ministry;
  } catch (error) {
    console.error(`Error getting ministry ${ministryId}:`, error);
    throw error;
  }
};

/**
 * Get ministries for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of ministry objects
 */
export const getMinistryByUserId = async (userId) => {
  try {
    if (!userId) {
      console.error('getMinistryByUserId called without a userId');
      return [];
    }
    
    // First query for ministries where user is a member
    const memberMinistries = await safeQuery({
      collectionPath: MINISTRIES_COLLECTION,
      whereConditions: [['members', 'array-contains', userId]],
      useCache: true
    });
    
    // Then query for ministries where user is a leader
    const leaderMinistries = await safeQuery({
      collectionPath: MINISTRIES_COLLECTION,
      whereConditions: [['leaders', 'array-contains', userId]],
      useCache: true
    });
    
    // Combine and remove duplicates
    const combinedMinistries = [...memberMinistries];
    
    // Add leader ministries that aren't already in the combined list
    leaderMinistries.forEach(ministry => {
      if (!combinedMinistries.some(m => m.id === ministry.id)) {
        combinedMinistries.push(ministry);
      }
    });
    
    return combinedMinistries;
  } catch (error) {
    console.error(`Error getting ministries for user ${userId}:`, error);
    return []; // Return empty array instead of throwing to prevent UI crashes
  }
};

/**
 * Create a new ministry
 * @param {Object} ministryData - Ministry data
 * @returns {Promise<Object>} Created ministry object
 */
export const createNewMinistry = async (ministryData) => {
  try {
    const { currentUser, userRole } = await _verifyUserPermissions();

    if (userRole !== 'admin' && userRole !== 'leader') {
      console.error('Permission denied: User role is', userRole);
      throw new Error('You do not have permission to create ministries.');
    }

    const ministryRef = doc(collection(db, MINISTRIES_COLLECTION));
    const newMinistry = createMinistry({
      ...ministryData,
      id: ministryRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: currentUser.uid,
      members: [currentUser.uid],
      leaders: [currentUser.uid],
    });

    await setDoc(ministryRef, newMinistry);

    return {
      ...newMinistry,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error creating ministry:', error);
    throw error;
  }
};

/**
 * Update a ministry
 * @param {string} ministryId - Ministry ID
 * @param {Object} ministryData - Updated ministry data
 * @returns {Promise<Object>} Updated ministry object
 */
export const updateMinistry = async (ministryId, ministryData) => {
  try {
    const { currentUser, userRole, ministryRef, existingMinistry } = await _verifyUserPermissions(ministryId);

    if (userRole !== 'admin' && !existingMinistry.leaders.includes(currentUser.uid)) {
      console.error('Permission denied: User is not an admin or ministry leader.');
      throw new Error('You do not have permission to update this ministry.');
    }

    const { id, createdAt, ...updateData } = ministryData;
    updateData.updatedAt = serverTimestamp();

    await updateDoc(ministryRef, updateData);

    return await getMinistryById(ministryId);
  } catch (error) {
    console.error(`Error updating ministry ${ministryId}:`, error);
    throw error;
  }
};

/**
 * Add a member to a ministry
 * @param {string} ministryId - Ministry ID
 * @param {string} userId - User ID to add
 * @returns {Promise<void>}
 */
export const addMinistryMember = async (ministryId, userId) => {
  try {
    const ministryRef = doc(db, MINISTRIES_COLLECTION, ministryId);
    
    await updateDoc(ministryRef, {
      members: arrayUnion(userId),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error adding member ${userId} to ministry ${ministryId}:`, error);
    throw error;
  }
};

/**
 * Remove a member from a ministry
 * @param {string} ministryId - Ministry ID
 * @param {string} userId - User ID to remove
 * @returns {Promise<void>}
 */
export const removeMinistryMember = async (ministryId, userId) => {
  try {
    const ministryRef = doc(db, MINISTRIES_COLLECTION, ministryId);
    
    await updateDoc(ministryRef, {
      members: arrayRemove(userId),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error removing member ${userId} from ministry ${ministryId}:`, error);
    throw error;
  }
};

/**
 * Add a leader to a ministry
 * @param {string} ministryId - Ministry ID
 * @param {string} userId - User ID to add as leader
 * @returns {Promise<void>}
 */
export const addMinistryLeader = async (ministryId, userId) => {
  try {
    const ministryRef = doc(db, MINISTRIES_COLLECTION, ministryId);
    
    await updateDoc(ministryRef, {
      leaders: arrayUnion(userId),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error adding leader ${userId} to ministry ${ministryId}:`, error);
    throw error;
  }
};

/**
 * Remove a leader from a ministry
 * @param {string} ministryId - Ministry ID
 * @param {string} userId - User ID to remove as leader
 * @returns {Promise<void>}
 */
export const removeMinistryLeader = async (ministryId, userId) => {
  try {
    const ministryRef = doc(db, MINISTRIES_COLLECTION, ministryId);
    
    await updateDoc(ministryRef, {
      leaders: arrayRemove(userId),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error removing leader ${userId} from ministry ${ministryId}:`, error);
    throw error;
  }
};

/**
 * Add an announcement to a ministry
 * @param {string} ministryId - Ministry ID
 * @param {Object} announcement - Announcement object
 * @returns {Promise<Object>} Updated ministry with new announcement
 */
export const addMinistryAnnouncement = async (ministryId, announcement) => {
  try {
    const ministryRef = doc(db, MINISTRIES_COLLECTION, ministryId);
    const ministry = await getMinistryById(ministryId);
    
    if (!ministry) {
      throw new Error(`Ministry ${ministryId} not found`);
    }
    
    const newAnnouncement = {
      id: Date.now().toString(),
      ...announcement,
      createdAt: serverTimestamp()
    };
    
    const announcements = ministry.announcements || [];
    
    await updateDoc(ministryRef, {
      announcements: [...announcements, newAnnouncement],
      updatedAt: serverTimestamp()
    });
    
    return getMinistryById(ministryId);
  } catch (error) {
    console.error(`Error adding announcement to ministry ${ministryId}:`, error);
    throw error;
  }
};

/**
 * Add a resource to a ministry
 * @param {string} ministryId - Ministry ID
 * @param {Object} resource - Resource object
 * @returns {Promise<Object>} Updated ministry with new resource
 */
export const addMinistryResource = async (ministryId, resource) => {
  try {
    const ministryRef = doc(db, MINISTRIES_COLLECTION, ministryId);
    const ministry = await getMinistryById(ministryId);
    
    if (!ministry) {
      throw new Error(`Ministry ${ministryId} not found`);
    }
    
    const newResource = {
      id: Date.now().toString(),
      ...resource,
      createdAt: serverTimestamp()
    };
    
    const resources = ministry.resources || [];
    
    await updateDoc(ministryRef, {
      resources: [...resources, newResource],
      updatedAt: serverTimestamp()
    });
    
    return getMinistryById(ministryId);
  } catch (error) {
    console.error(`Error adding resource to ministry ${ministryId}:`, error);
    throw error;
  }
};

/**
 * Set up a real-time listener for a ministry
 * @param {string} ministryId - Ministry ID
 * @param {Function} onUpdate - Callback for updates
 * @param {Function} onError - Callback for errors
 * @returns {Function} Unsubscribe function
 */
export const subscribeToMinistry = (ministryId, onUpdate, onError) => {
  if (!ministryId) {
    console.error('Ministry ID is required for subscription');
    return () => {};
  }
  
  return setupListener(
    MINISTRIES_COLLECTION,
    {
      whereConditions: [['__name__', '==', ministryId]],
      limitCount: 1
    },
    (results) => {
      if (results && results.length > 0) {
        onUpdate(results[0]);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error(`Error in ministry subscription for ${ministryId}:`, error);
      if (onError) onError(error);
    }
  );
};

/**
 * Get the count of members in a ministry
 * @param {string} ministryId - Ministry ID
 * @returns {Promise<number>} Number of members in the ministry
 */
export const getMinistryMembersCount = async (ministryId) => {
  try {
    const ministryRef = doc(db, MINISTRIES_COLLECTION, ministryId);
    const ministryDoc = await getDoc(ministryRef);
    
    if (!ministryDoc.exists()) {
      throw new Error('Ministry not found');
    }
    
    const ministryData = ministryDoc.data();
    return ministryData.members ? ministryData.members.length : 0;
  } catch (error) {
    console.error('Error getting ministry members count:', error);
    throw error;
  }
};

/**
 * Get upcoming events for a ministry
 * @param {string} ministryId - Ministry ID
 * @param {number} limit - Maximum number of events to return
 * @returns {Promise<Array>} Array of upcoming events
 */
export const getUpcomingEvents = async (ministryId, limit = 5) => {
  try {
    const now = new Date();
    const eventsQuery = query(
      collection(db, 'events'),
      where('ministryId', '==', ministryId),
      where('startTime', '>=', now),
      orderBy('startTime', 'asc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(eventsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore Timestamp to Date
      startTime: doc.data().startTime?.toDate(),
      endTime: doc.data().endTime?.toDate()
    }));
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    throw error;
  }
};

/**
 * Get user's role in a specific ministry
 * @param {string} ministryId - Ministry ID
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} User's role or null if not in ministry
 */
export const getUserMinistryRole = async (ministryId, userId) => {
  try {
    const ministry = await getMinistryById(ministryId);
    
    if (!ministry) {
      throw new Error(`Ministry ${ministryId} not found`);
    }
    
    if (ministry.leaders && ministry.leaders.includes(userId)) {
      return 'leader';
    } else if (ministry.members && ministry.members.includes(userId)) {
      return 'member';
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting user role for ${userId} in ministry ${ministryId}:`, error);
    throw error;
  }
};