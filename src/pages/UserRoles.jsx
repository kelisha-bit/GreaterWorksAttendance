import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  query,
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Shield, 
  Users, 
  Eye, 
  Crown,
  Search,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const UserRoles = () => {
  const { isAdmin, currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [roleChange, setRoleChange] = useState(null);

  const roles = [
    { 
      value: 'admin', 
      label: 'Admin', 
      icon: Crown,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Full system access, can manage users and all features'
    },
    { 
      value: 'leader', 
      label: 'Leader', 
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Can manage members, events, and attendance'
    },
    { 
      value: 'viewer', 
      label: 'Viewer', 
      icon: Eye,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      description: 'Read-only access to view information'
    }
  ];

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(usersQuery);
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const confirmRoleChange = (userId, currentRole, newRole, userName) => {
    setRoleChange({
      userId,
      currentRole,
      newRole,
      userName
    });
    setShowConfirmModal(true);
  };

  const handleRoleUpdate = async () => {
    if (!roleChange) return;

    try {
      const userRef = doc(db, 'users', roleChange.userId);
      await updateDoc(userRef, {
        role: roleChange.newRole,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid
      });

      // Update local state
      setUsers(users.map(user => 
        user.id === roleChange.userId 
          ? { ...user, role: roleChange.newRole }
          : user
      ));

      toast.success(`Role updated successfully to ${roleChange.newRole}`);
      setShowConfirmModal(false);
      setRoleChange(null);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const getFilteredUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole) {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    return filtered;
  };

  const getRoleInfo = (roleValue) => {
    return roles.find(r => r.value === roleValue) || roles[2]; // Default to viewer
  };

  const getRoleStats = () => {
    return {
      total: users.length,
      admin: users.filter(u => u.role === 'admin').length,
      leader: users.filter(u => u.role === 'leader').length,
      viewer: users.filter(u => u.role === 'viewer').length
    };
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = getRoleStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Role Management</h1>
        <p className="text-gray-600 mt-1">Manage user permissions and access levels</p>
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-church-gold" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-purple-600">{stats.admin}</p>
            </div>
            <Crown className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Leaders</p>
              <p className="text-2xl font-bold text-blue-600">{stats.leader}</p>
            </div>
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Viewers</p>
              <p className="text-2xl font-bold text-gray-600">{stats.viewer}</p>
            </div>
            <Eye className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Role Descriptions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div key={role.value} className={`p-4 rounded-lg border-2 ${role.bgColor} border-transparent`}>
                <div className="flex items-center space-x-3 mb-2">
                  <Icon className={`w-6 h-6 ${role.color}`} />
                  <h3 className={`font-semibold ${role.color}`}>{role.label}</h3>
                </div>
                <p className="text-sm text-gray-700">{role.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="input-field"
          >
            <option value="">All Roles</option>
            {roles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Current Role</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Change Role</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredUsers().length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                getFilteredUsers().map((user, index) => {
                  const roleInfo = getRoleInfo(user.role);
                  const RoleIcon = roleInfo.icon;
                  const isCurrentUser = user.id === currentUser.uid;

                  return (
                    <tr 
                      key={user.id} 
                      className={`border-b border-gray-100 hover:bg-gray-50 animate-fade-in-up ${
                        index < 20 ? `stagger-${index + 1}` : 'stagger-max'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full ${roleInfo.bgColor} flex items-center justify-center`}>
                            <RoleIcon className={`w-5 h-5 ${roleInfo.color}`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.name || 'Unnamed User'}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs bg-church-gold text-white px-2 py-0.5 rounded">You</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              Joined {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${roleInfo.bgColor} ${roleInfo.color}`}>
                          <RoleIcon className="w-4 h-4" />
                          <span>{roleInfo.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={user.role}
                          onChange={(e) => confirmRoleChange(user.id, user.role, e.target.value, user.name || user.email)}
                          disabled={isCurrentUser}
                          className={`input-field text-sm ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {roles.map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                        {isCurrentUser && (
                          <p className="text-xs text-gray-500 mt-1">Cannot change your own role</p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && roleChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">Confirm Role Change</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 mb-3">
                    Are you sure you want to change the role for <strong>{roleChange.userName}</strong>?
                  </p>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Current Role:</span>
                      <span className={`font-semibold ${getRoleInfo(roleChange.currentRole).color}`}>
                        {getRoleInfo(roleChange.currentRole).label}
                      </span>
                    </div>
                    <div className="flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">New Role:</span>
                      <span className={`font-semibold ${getRoleInfo(roleChange.newRole).color}`}>
                        {getRoleInfo(roleChange.newRole).label}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    This will change their access permissions immediately.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setRoleChange(null);
                  // Reset the select to original value
                  fetchUsers();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleUpdate}
                className="btn-primary"
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoles;
