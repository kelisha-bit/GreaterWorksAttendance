import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';

const cacheSet = (key, data) => { try { localStorage.setItem(`groups_${key}`, JSON.stringify({ data, ts: Date.now() })); } catch (e) { void e; } };
const cacheGet = (key, maxAgeMs = 60_000) => { try { const raw = localStorage.getItem(`groups_${key}`); if (!raw) return null; const obj = JSON.parse(raw); if (Date.now() - obj.ts > maxAgeMs) return null; return obj.data; } catch (e) { void e; return null; } };

export const listGroups = async (filters = {}, auth = {}) => {
  const key = `list_${auth.userId || 'anon'}_${auth.isAdmin ? 'A' : ''}${auth.isLeader ? 'L' : ''}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  let items = [];
  if (auth.isAdmin || auth.isLeader) {
    const snap = await getDocs(collection(db, 'groups'));
    items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } else {
    const pubQ = query(collection(db, 'groups'), where('visibility', '==', 'public'));
    const pubSnap = await getDocs(pubQ);
    items = pubSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (auth.userId) {
      const ownQ = query(collection(db, 'groups'), where('groupOwner', '==', auth.userId));
      const ownSnap = await getDocs(ownQ);
      const ownItems = ownSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const modQ = query(collection(db, 'groups'), where('moderators', 'array-contains', auth.userId));
      const modSnap = await getDocs(modQ);
      const modItems = modSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const dedup = new Map();
      [...items, ...ownItems, ...modItems].forEach(i => dedup.set(i.id, i));
      items = Array.from(dedup.values());
    }
  }
  if (filters.visibility && filters.visibility !== 'all') items = items.filter(g => (g.visibility || 'public') === filters.visibility);
  if (filters.search) {
    const s = filters.search.toLowerCase();
    items = items.filter(g => (g.name || '').toLowerCase().includes(s) || (g.description || '').toLowerCase().includes(s));
  }
  items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  cacheSet(key, items);
  return items;
};

export const createGroup = async (data, actor) => {
  const payload = { name: '', description: '', visibility: 'public', maxMembers: 200, moderators: [], groupOwner: actor.uid, createdBy: actor.email, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data };
  const res = await addDoc(collection(db, 'groups'), payload);
  await addDoc(collection(db, 'audit_logs'), { action: 'create', entityType: 'group', entityId: res.id, details: { payload }, timestamp: new Date().toISOString() });
  return res.id;
};

export const requestMembership = async (groupId, user) => {
  const payload = { groupId, userId: user.uid, userEmail: user.email, status: 'pending', role: 'member', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const res = await addDoc(collection(db, 'group_memberships'), payload);
  await addDoc(collection(db, 'audit_logs'), { action: 'request', entityType: 'group_membership', entityId: res.id, details: { groupId }, timestamp: new Date().toISOString() });
  return res.id;
};

export const listMyMemberships = async (userId, status = 'approved') => {
  const ref = collection(db, 'group_memberships');
  const snap = await getDocs(ref);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => m.userId === userId && (status ? m.status === status : true));
  return items;
};

export const listGroupMembers = async (groupId, pageSize = 25, lastDocId = null) => {
  const ref = collection(db, 'group_memberships');
  const all = await getDocs(ref);
  let items = all.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => m.groupId === groupId && m.status === 'approved');
  items.sort((a, b) => (a.userEmail || '').localeCompare(b.userEmail || ''));
  const startIndex = lastDocId ? Math.max(0, items.findIndex(x => x.id === lastDocId) + 1) : 0;
  const page = items.slice(startIndex, startIndex + pageSize);
  const nextCursor = page.length > 0 ? page[page.length - 1].id : null;
  return { members: page, nextCursor };
};

export const approveMembership = async (membershipId, approver) => {
  await updateDoc(doc(db, 'group_memberships', membershipId), { status: 'approved', updatedAt: new Date().toISOString(), approvedBy: approver.email });
  await addDoc(collection(db, 'audit_logs'), { action: 'approve', entityType: 'group_membership', entityId: membershipId, timestamp: new Date().toISOString() });
};

export const rejectMembership = async (membershipId, approver) => {
  await updateDoc(doc(db, 'group_memberships', membershipId), { status: 'rejected', updatedAt: new Date().toISOString(), approvedBy: approver.email });
  await addDoc(collection(db, 'audit_logs'), { action: 'reject', entityType: 'group_membership', entityId: membershipId, timestamp: new Date().toISOString() });
};

export const leaveGroup = async (membershipId) => {
  await deleteDoc(doc(db, 'group_memberships', membershipId));
  await addDoc(collection(db, 'audit_logs'), { action: 'leave', entityType: 'group_membership', entityId: membershipId, timestamp: new Date().toISOString() });
};

export const getGroupMemberCount = async (groupId) => {
  const ref = collection(db, 'group_memberships');
  const snap = await getDocs(ref);
  return snap.docs.map(d => d.data()).filter(m => m.groupId === groupId && m.status === 'approved').length;
};
