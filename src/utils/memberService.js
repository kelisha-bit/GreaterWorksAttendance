import { db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// Get all members
export const getMembers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'members'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting members:', error);
    throw error;
  }
};

// Update a member
export const updateMember = async (memberId, data) => {
  try {
    const memberRef = doc(db, 'members', memberId);
    await updateDoc(memberRef, data);
    return { success: true };
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
};

// Add a member to a ministry
export const addMemberToMinistry = async (memberId, ministryId) => {
  try {
    const memberRef = doc(db, 'members', memberId);
    await updateDoc(memberRef, {
      ministries: arrayUnion(ministryId)
    });
    return { success: true };
  } catch (error) {
    console.error('Error adding member to ministry:', error);
    throw error;
  }
};

// Remove a member from a ministry
export const removeMemberFromMinistry = async (memberId, ministryId) => {
  try {
    const memberRef = doc(db, 'members', memberId);
    await updateDoc(memberRef, {
      ministries: arrayRemove(ministryId)
    });
    return { success: true };
  } catch (error) {
    console.error('Error removing member from ministry:', error);
    throw error;
  }
};

// Get members by ministry
export const getMembersByMinistry = async (ministryId) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'members'));
    return querySnapshot.docs
      .filter(doc => {
        const data = doc.data();
        return data.ministries && data.ministries.includes(ministryId);
      })
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  } catch (error) {
    console.error('Error getting members by ministry:', error);
    throw error;
  }
};
