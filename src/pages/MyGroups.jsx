import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { listMyMemberships, listGroups, getGroupMemberCount } from '../utils/groupService';
import { Link } from 'react-router-dom';

const MyGroups = () => {
  const { currentUser, isAdmin, isLeader } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const memberships = await listMyMemberships(currentUser.uid, 'approved');
      const allGroups = await listGroups({}, { userId: currentUser.uid, isAdmin, isLeader });
      const mine = [];
      for (const m of memberships) {
        const g = allGroups.find(x => x.id === m.groupId);
        if (g) {
          const count = await getGroupMemberCount(g.id);
          mine.push({ ...g, memberCount: count });
        }
      }
      setGroups(mine);
    } catch { toast.error('Failed to load groups'); } finally { setLoading(false); }
  };

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" /></div>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Groups</h1>
      </div>

      <div className="card">
        {groups.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">You are not in any groups yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(g => (
              <div key={g.id} className="p-4 border rounded-lg bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{g.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{g.description || '-'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Members: {g.memberCount}</span>
                  <Link to={`/groups/${g.id}`} className="text-church-gold hover:underline flex items-center gap-1 text-sm">View <ArrowRight className="w-4 h-4" /></Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGroups;
