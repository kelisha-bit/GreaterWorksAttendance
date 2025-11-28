import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Users, Search, UserCircle, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

const MyMinistry = () => {
  const { currentUser } = useAuth();
  const [memberProfile, setMemberProfile] = useState(null);
  const [ministryMembers, setMinistryMembers] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMemberProfile = async () => {
      if (!currentUser?.email) {
        setError('We could not find your account information. Please sign in again.');
        setLoadingProfile(false);
        return;
      }

      try {
        setLoadingProfile(true);
        const memberQuery = query(
          collection(db, 'members'),
          where('email', '==', currentUser.email)
        );
        const snapshot = await getDocs(memberQuery);

        if (snapshot.empty) {
          toast.error('No member profile linked to your account.');
          setMemberProfile(null);
          setError(null);
          return;
        }

        const profile = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        };
        setMemberProfile(profile);
        setError(null);
      } catch (err) {
        console.error('Error fetching member profile:', err);
        toast.error('Failed to load your ministry profile');
        setError('Failed to load your ministry profile. Please try again later.');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchMemberProfile();
  }, [currentUser]);

  useEffect(() => {
    const fetchMinistryMembers = async () => {
      if (!memberProfile?.ministry) {
        setMinistryMembers([]);
        setLoadingMembers(false);
        return;
      }

      try {
        setLoadingMembers(true);
        const ministryQuery = query(
          collection(db, 'members'),
          where('ministry', '==', memberProfile.ministry)
        );
        const snapshot = await getDocs(ministryQuery);
        const members = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMinistryMembers(members);
        setError(null);
      } catch (err) {
        console.error('Error fetching ministry members:', err);
        toast.error('Failed to load ministry members');
        setError('Failed to load members for this ministry.');
      } finally {
        setLoadingMembers(false);
      }
    };

    if (memberProfile) {
      fetchMinistryMembers();
    }
  }, [memberProfile?.ministry]);

  const filteredMembers = useMemo(() => {
    if (!searchTerm) return ministryMembers;
    const term = searchTerm.toLowerCase();
    return ministryMembers.filter(member => {
      return (
        member.fullName?.toLowerCase().includes(term) ||
        member.phoneNumber?.includes(searchTerm) ||
        member.email?.toLowerCase().includes(term)
      );
    });
  }, [ministryMembers, searchTerm]);

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!memberProfile) {
    return (
      <div className="card text-center py-12">
        <UserCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Member Profile Found</h2>
        <p className="text-gray-600">
          Your user account is not linked to a member profile. Please reach out to your administrator.
        </p>
      </div>
    );
  }

  if (!memberProfile.ministry) {
    return (
      <div className="card text-center py-12">
        <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Ministry Assigned</h2>
        <p className="text-gray-600">
          You have not been assigned to a ministry yet. Kindly contact your church leader to get connected.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-church-gold/90 to-church-darkGold text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-widest opacity-80">My Ministry</p>
            <h1 className="text-3xl font-bold">{memberProfile.ministry}</h1>
            <p className="text-white text-opacity-90">
              {ministryMembers.length} member{ministryMembers.length === 1 ? '' : 's'} connected
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-2 px-3 py-2 bg-white bg-opacity-20 rounded-lg">
              <Phone className="w-4 h-4" />
              <span>{memberProfile.phoneNumber || 'No phone on file'}</span>
            </div>
            {memberProfile.city && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-white bg-opacity-20 rounded-lg">
                <MapPin className="w-4 h-4" />
                <span>{memberProfile.city}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Ministry Members</h2>
            <p className="text-gray-500 text-sm">
              Browse the list of members who belong to the same ministry.
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search members by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="overflow-x-auto">
            {loadingMembers ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-church-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-60" />
                <p>No members found in this ministry.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600">Phone</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600">Membership Type</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(member => (
                    <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{member.fullName}</div>
                        <div className="text-xs text-gray-500">{member.memberId}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{member.phoneNumber || '—'}</td>
                      <td className="py-3 px-4 text-gray-700">{member.email || '—'}</td>
                      <td className="py-3 px-4 text-gray-700">{member.membershipType || '—'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                            member.membershipStatus === 'Active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {member.membershipStatus || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyMinistry;

