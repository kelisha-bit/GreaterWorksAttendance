import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Building2, 
  Shield, 
  Save,
  Plus,
  Trash2,
  Edit2,
  X,
  Church
} from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const { isAdmin, currentUser, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDepartment, setNewDepartment] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchDepartments();
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchDepartments = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'departments'));
      const deptList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDepartments(deptList);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartment.trim()) {
      toast.error('Please enter a department name');
      return;
    }

    try {
      await addDoc(collection(db, 'departments'), {
        name: newDepartment,
        createdAt: new Date().toISOString()
      });
      toast.success('Department added successfully');
      setNewDepartment('');
      setShowAddDeptModal(false);
      fetchDepartments();
    } catch (error) {
      console.error('Error adding department:', error);
      toast.error('Failed to add department');
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'departments', deptId));
      toast.success('Department deleted successfully');
      fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Failed to delete department');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: Users },
    { id: 'church', name: 'Church Info', icon: Church },
    ...(isAdmin ? [
      { id: 'departments', name: 'Departments', icon: Building2 },
      { id: 'users', name: 'User Management', icon: Shield }
    ] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-church-gold text-church-darkGold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="input-field bg-gray-50"
                />
              </div>

              <div>
                <label className="label">Role</label>
                <input
                  type="text"
                  value={userRole || 'viewer'}
                  disabled
                  className="input-field bg-gray-50 capitalize"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> To update your profile information, please contact your administrator.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Church Info Tab */}
        {activeTab === 'church' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Church Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Church Name</label>
                <input
                  type="text"
                  value="Greater Works City Church"
                  disabled
                  className="input-field bg-gray-50"
                />
              </div>

              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  value="Ghana"
                  disabled
                  className="input-field bg-gray-50"
                />
              </div>

              <div>
                <label className="label">App Name</label>
                <input
                  type="text"
                  value="Greater Works Attendance Tracker"
                  disabled
                  className="input-field bg-gray-50"
                />
              </div>

              <div className="bg-church-lightGold border border-church-gold rounded-lg p-4">
                <p className="text-sm text-gray-800">
                  <strong>Church Branding:</strong> The app uses a white and gold theme to reflect the church's identity.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Departments Tab */}
        {activeTab === 'departments' && isAdmin && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Manage Departments</h2>
              <button
                onClick={() => setShowAddDeptModal(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Department</span>
              </button>
            </div>

            <div className="space-y-2">
              {departments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No custom departments added yet</p>
                </div>
              ) : (
                departments.map(dept => (
                  <div key={dept.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{dept.name}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteDepartment(dept.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Default departments (Choir, Ushering, Media, etc.) are built into the system and cannot be deleted.
              </p>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && isAdmin && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{user.email}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{user.name || '-'}</td>
                      <td className="py-3 px-4 text-sm">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                          className="input-field py-1 text-sm"
                          disabled={user.id === currentUser?.uid}
                        >
                          <option value="admin">Admin</option>
                          <option value="leader">Leader</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {user.id === currentUser?.uid && (
                          <span className="text-xs bg-church-lightGold text-church-darkGold px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Role Permissions:</strong>
              </p>
              <ul className="text-sm text-blue-800 space-y-1 ml-4">
                <li><strong>Admin:</strong> Full access - can manage members, sessions, reports, and users</li>
                <li><strong>Leader:</strong> Can create sessions, manage members, and mark attendance</li>
                <li><strong>Viewer:</strong> Can only view attendance summaries and reports</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Add Department Modal */}
      {showAddDeptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add Department</h2>
              <button onClick={() => setShowAddDeptModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Department Name</label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Hospitality"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowAddDeptModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={handleAddDepartment} className="btn-primary">
                  Add Department
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
