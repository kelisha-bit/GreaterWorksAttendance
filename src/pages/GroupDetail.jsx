import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { listGroups, listGroupMembers, approveMembership, rejectMembership } from '../utils/groupService';

const GroupDetail = () => {
  const { groupId } = useParams();
  const { currentUser, userRole, isAdmin, isLeader } = useAuth();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cursor, setCursor] = useState(null);
  const pageSize = 25;

  useEffect(() => { fetchGroup(); fetchMembers(); }, [groupId]);
  useEffect(() => { applyFilter(); }, [searchTerm, members]);

  const fetchGroup = async () => {
    try {
      const all = await listGroups({}, { userId: currentUser.uid, isAdmin, isLeader });
      setGroup(all.find(g => g.id === groupId) || null);
    } catch { toast.error('Failed to load group'); }
  };

  const fetchMembers = async (next = false) => {
    try {
      const res = await listGroupMembers(groupId, pageSize, next ? cursor : null);
      setMembers(res.members);
      setCursor(res.nextCursor);
    } catch { toast.error('Failed to load members'); } finally { setLoading(false); }
  };

  const applyFilter = () => {
    let items = [...members];
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      items = items.filter(m => (m.userEmail || '').toLowerCase().includes(s));
    }
    setFiltered(items);
  };

  const canModerate = userRole === 'admin' || userRole === 'leader' || (group && group.groupOwner === currentUser.uid);

  const approve = async (membershipId) => { try { await approveMembership(membershipId, currentUser); toast.success('Approved'); await fetchMembers(); } catch { toast.error('Failed to approve'); } };
  const reject = async (membershipId) => { try { await rejectMembership(membershipId, currentUser); toast('Rejected'); await fetchMembers(); } catch { toast.error('Failed to reject'); } };

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" /></div>);

  if (!group) return (
    <div className="card text-center py-12">
      <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <p className="text-lg text-gray-600">Group not found</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          <p className="text-sm text-gray-600">{group.description || '-'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchMembers(false)} className="btn-secondary flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Prev</button>
          <button onClick={() => fetchMembers(true)} className="btn-secondary flex items-center gap-1">Next <ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Members</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="Search by email" className="input-field pl-10" />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No members found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  {canModerate && <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{m.userEmail}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{m.role || 'member'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{m.status}</td>
                    {canModerate && (
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          {m.status !== 'approved' && <button onClick={() => approve(m.id)} className="btn-primary text-sm">Approve</button>}
                          {m.status === 'pending' && <button onClick={() => reject(m.id)} className="btn-secondary text-sm">Reject</button>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetail;
