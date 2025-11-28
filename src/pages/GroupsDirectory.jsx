import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Search, Filter, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { listGroups, requestMembership, listMyMemberships } from '../utils/groupService';

const GroupsDirectory = () => {
  const { currentUser, isAdmin, isLeader } = useAuth();
  const [groups, setGroups] = useState([]);
  const [myMemberships, setMyMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibility, setVisibility] = useState('all');

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { filterGroups(); }, [searchTerm, visibility, groups]);

  const [filtered, setFiltered] = useState([]);

  const fetchAll = async () => {
    try {
      const items = await listGroups({}, { userId: currentUser.uid, isAdmin, isLeader });
      setGroups(items);
      const memberships = await listMyMemberships(currentUser.uid, null);
      setMyMemberships(memberships);
      setFiltered(items);
    } catch { toast.error('Failed to load groups'); } finally { setLoading(false); }
  };

  const filterGroups = () => {
    let items = [...groups];
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      items = items.filter(g => (g.name || '').toLowerCase().includes(s) || (g.description || '').toLowerCase().includes(s));
    }
    if (visibility !== 'all') items = items.filter(g => (g.visibility || 'public') === visibility);
    setFiltered(items);
  };

  const myStatus = (groupId) => {
    const m = myMemberships.find(mm => mm.groupId === groupId);
    return m ? m.status : null;
  };

  const requestJoin = async (groupId) => {
    try { await requestMembership(groupId, currentUser); toast.success('Membership requested'); await fetchAll(); } catch { toast.error('Failed to request membership'); }
  };

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" /></div>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="Search groups" className="input-field pl-10" />
          </div>
          <div>
            <select value={visibility} onChange={(e)=>setVisibility(e.target.value)} className="input-field">
              <option value="all">All</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No groups found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(g => {
              const status = myStatus(g.id);
              return (
                <div key={g.id} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{g.name}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{g.visibility || 'public'}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{g.description || '-'}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">Max members: {g.maxMembers || 200}</div>
                    <div className="flex items-center gap-2">
                      {status === 'approved' && <span className="flex items-center text-green-600 text-sm"><CheckCircle className="w-4 h-4 mr-1" /> Member</span>}
                      {status === 'pending' && <span className="flex items-center text-orange-600 text-sm"><Clock className="w-4 h-4 mr-1" /> Pending</span>}
                      {!status && (
                        <button onClick={() => requestJoin(g.id)} className="btn-primary text-sm">Request</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsDirectory;
