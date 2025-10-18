import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Cake, 
  Heart, 
  Calendar, 
  Gift,
  Bell,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Edit2,
  Trash2,
  Star,
  PartyPopper
} from 'lucide-react';
import toast from 'react-hot-toast';

const Celebrations = () => {
  const { isLeader } = useAuth();
  const [members, setMembers] = useState([]);
  const [specialOccasions, setSpecialOccasions] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState('calendar'); // calendar, upcoming, all
  const [filterType, setFilterType] = useState('all'); // all, birthdays, anniversaries, occasions
  const [searchTerm, setSearchTerm] = useState('');
  const [showOccasionModal, setShowOccasionModal] = useState(false);
  const [editingOccasion, setEditingOccasion] = useState(null);
  const [loading, setLoading] = useState(true);

  const [occasionForm, setOccasionForm] = useState({
    title: '',
    type: 'Birthday',
    date: '',
    memberId: '',
    memberName: '',
    notes: '',
    recurring: true
  });

  const occasionTypes = ['Birthday', 'Anniversary', 'Baptism', 'Dedication', 'Other'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch members
      const membersSnapshot = await getDocs(collection(db, 'members'));
      const membersList = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersList);

      // Fetch special occasions
      const occasionsSnapshot = await getDocs(collection(db, 'special_occasions'));
      const occasionsList = occasionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSpecialOccasions(occasionsList);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load celebrations');
    } finally {
      setLoading(false);
    }
  };

  // Get all celebrations (birthdays, anniversaries, special occasions)
  const getAllCelebrations = () => {
    const celebrations = [];

    // Add birthdays from members
    members.forEach(member => {
      if (member.dateOfBirth) {
        celebrations.push({
          id: `birthday-${member.id}`,
          type: 'Birthday',
          title: `${member.fullName}'s Birthday`,
          date: member.dateOfBirth,
          memberId: member.memberId,
          memberName: member.fullName,
          icon: Cake,
          color: 'bg-pink-500',
          recurring: true
        });
      }

      if (member.weddingAnniversary) {
        celebrations.push({
          id: `anniversary-${member.id}`,
          type: 'Anniversary',
          title: `${member.fullName}'s Anniversary`,
          date: member.weddingAnniversary,
          memberId: member.memberId,
          memberName: member.fullName,
          icon: Heart,
          color: 'bg-red-500',
          recurring: true
        });
      }
    });

    // Add special occasions
    specialOccasions.forEach(occasion => {
      celebrations.push({
        ...occasion,
        icon: getOccasionIcon(occasion.type),
        color: getOccasionColor(occasion.type)
      });
    });

    return celebrations;
  };

  const getOccasionIcon = (type) => {
    switch (type) {
      case 'Birthday': return Cake;
      case 'Anniversary': return Heart;
      case 'Baptism': return Star;
      case 'Dedication': return Gift;
      default: return PartyPopper;
    }
  };

  const getOccasionColor = (type) => {
    switch (type) {
      case 'Birthday': return 'bg-pink-500';
      case 'Anniversary': return 'bg-red-500';
      case 'Baptism': return 'bg-blue-500';
      case 'Dedication': return 'bg-purple-500';
      default: return 'bg-orange-500';
    }
  };

  // Filter celebrations
  const getFilteredCelebrations = () => {
    let celebrations = getAllCelebrations();

    // Filter by type
    if (filterType !== 'all') {
      if (filterType === 'birthdays') {
        celebrations = celebrations.filter(c => c.type === 'Birthday');
      } else if (filterType === 'anniversaries') {
        celebrations = celebrations.filter(c => c.type === 'Anniversary');
      } else if (filterType === 'occasions') {
        celebrations = celebrations.filter(c => 
          c.type !== 'Birthday' && c.type !== 'Anniversary'
        );
      }
    }

    // Filter by search term
    if (searchTerm) {
      celebrations = celebrations.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.memberName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return celebrations;
  };

  // Get celebrations for current month
  const getMonthCelebrations = () => {
    const celebrations = getFilteredCelebrations();
    const month = currentMonth.getMonth();
    
    return celebrations.filter(c => {
      const celebDate = new Date(c.date);
      return celebDate.getMonth() === month;
    });
  };

  // Get upcoming celebrations (next 30 days)
  const getUpcomingCelebrations = () => {
    const celebrations = getFilteredCelebrations();
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return celebrations.filter(c => {
      const celebDate = new Date(c.date);
      const thisYearDate = new Date(today.getFullYear(), celebDate.getMonth(), celebDate.getDate());
      
      return thisYearDate >= today && thisYearDate <= thirtyDaysFromNow;
    }).sort((a, b) => {
      const dateA = new Date(today.getFullYear(), new Date(a.date).getMonth(), new Date(a.date).getDate());
      const dateB = new Date(today.getFullYear(), new Date(b.date).getMonth(), new Date(b.date).getDate());
      return dateA - dateB;
    });
  };

  // Get celebrations for today
  const getTodayCelebrations = () => {
    const celebrations = getAllCelebrations();
    const today = new Date();
    
    return celebrations.filter(c => {
      const celebDate = new Date(c.date);
      return celebDate.getMonth() === today.getMonth() && 
             celebDate.getDate() === today.getDate();
    });
  };

  // Calculate days until celebration
  const getDaysUntil = (date) => {
    const today = new Date();
    const celebDate = new Date(date);
    const thisYearDate = new Date(today.getFullYear(), celebDate.getMonth(), celebDate.getDate());
    
    if (thisYearDate < today) {
      thisYearDate.setFullYear(today.getFullYear() + 1);
    }
    
    const diffTime = thisYearDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate age/years
  const calculateYears = (date) => {
    const today = new Date();
    const celebDate = new Date(date);
    let years = today.getFullYear() - celebDate.getFullYear();
    
    if (today.getMonth() < celebDate.getMonth() || 
        (today.getMonth() === celebDate.getMonth() && today.getDate() < celebDate.getDate())) {
      years--;
    }
    
    return years;
  };

  const handleAddOccasion = async (e) => {
    e.preventDefault();

    if (!occasionForm.title || !occasionForm.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const occasionData = {
        title: occasionForm.title,
        type: occasionForm.type,
        date: occasionForm.date,
        memberId: occasionForm.memberId || null,
        memberName: occasionForm.memberName || null,
        notes: occasionForm.notes || '',
        recurring: occasionForm.recurring,
        createdAt: new Date().toISOString()
      };

      if (editingOccasion) {
        await updateDoc(doc(db, 'special_occasions', editingOccasion.id), occasionData);
        toast.success('Occasion updated successfully');
      } else {
        await addDoc(collection(db, 'special_occasions'), occasionData);
        toast.success('Occasion added successfully');
      }

      fetchData();
      closeOccasionModal();
    } catch (error) {
      console.error('Error saving occasion:', error);
      toast.error('Failed to save occasion');
    }
  };

  const handleEditOccasion = (occasion) => {
    setEditingOccasion(occasion);
    setOccasionForm({
      title: occasion.title,
      type: occasion.type,
      date: occasion.date,
      memberId: occasion.memberId || '',
      memberName: occasion.memberName || '',
      notes: occasion.notes || '',
      recurring: occasion.recurring
    });
    setShowOccasionModal(true);
  };

  const handleDeleteOccasion = async (occasionId) => {
    if (!window.confirm('Are you sure you want to delete this occasion?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'special_occasions', occasionId));
      toast.success('Occasion deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting occasion:', error);
      toast.error('Failed to delete occasion');
    }
  };

  const closeOccasionModal = () => {
    setShowOccasionModal(false);
    setEditingOccasion(null);
    setOccasionForm({
      title: '',
      type: 'Birthday',
      date: '',
      memberId: '',
      memberName: '',
      notes: '',
      recurring: true
    });
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const todayCelebrations = getTodayCelebrations();
  const upcomingCelebrations = getUpcomingCelebrations();
  const monthCelebrations = getMonthCelebrations();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Celebrations</h1>
          <p className="text-gray-600">Birthdays, Anniversaries & Special Occasions</p>
        </div>
        {isLeader && (
          <button
            onClick={() => setShowOccasionModal(true)}
            className="btn-primary flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Occasion</span>
          </button>
        )}
      </div>

      {/* Today's Celebrations Alert */}
      {todayCelebrations.length > 0 && (
        <div className="card bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200">
          <div className="flex items-start space-x-3">
            <PartyPopper className="w-6 h-6 text-pink-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-pink-900 mb-2">🎉 Today's Celebrations!</h3>
              <div className="space-y-2">
                {todayCelebrations.map((celeb, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Cake className="w-4 h-4 text-pink-600" />
                    <span className="text-pink-800">{celeb.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-pink-50 to-pink-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pink-600 font-semibold">Today</p>
              <p className="text-3xl font-bold text-pink-900">{todayCelebrations.length}</p>
            </div>
            <Cake className="w-10 h-10 text-pink-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-semibold">This Month</p>
              <p className="text-3xl font-bold text-purple-900">{monthCelebrations.length}</p>
            </div>
            <Calendar className="w-10 h-10 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">Next 30 Days</p>
              <p className="text-3xl font-bold text-blue-900">{upcomingCelebrations.length}</p>
            </div>
            <Bell className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-semibold">Total Events</p>
              <p className="text-3xl font-bold text-orange-900">{getAllCelebrations().length}</p>
            </div>
            <Gift className="w-10 h-10 text-orange-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search celebrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field"
            >
              <option value="all">All Celebrations</option>
              <option value="birthdays">Birthdays Only</option>
              <option value="anniversaries">Anniversaries Only</option>
              <option value="occasions">Special Occasions</option>
            </select>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setView('upcoming')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                view === 'upcoming'
                  ? 'bg-church-gold text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                view === 'calendar'
                  ? 'bg-church-gold text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={goToToday} className="text-sm text-church-gold hover:text-church-darkGold">
                Today
              </button>
            </div>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {monthCelebrations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No celebrations this month</p>
            </div>
          ) : (
            <div className="space-y-3">
              {monthCelebrations
                .sort((a, b) => new Date(a.date).getDate() - new Date(b.date).getDate())
                .map((celeb, index) => {
                  const Icon = celeb.icon;
                  const celebDate = new Date(celeb.date);
                  const years = celeb.type === 'Birthday' || celeb.type === 'Anniversary' 
                    ? calculateYears(celeb.date) 
                    : null;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`${celeb.color} p-3 rounded-lg`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{celeb.title}</p>
                          <p className="text-sm text-gray-600">
                            {celebDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                            {years !== null && ` • ${years} years`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {getDaysUntil(celeb.date) === 0 ? 'Today!' : `${getDaysUntil(celeb.date)} days`}
                        </span>
                        {isLeader && celeb.id.startsWith('occasion-') && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditOccasion(celeb)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteOccasion(celeb.id.replace('occasion-', ''))}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Upcoming View */}
      {view === 'upcoming' && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Celebrations (Next 30 Days)</h2>
          
          {upcomingCelebrations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No upcoming celebrations in the next 30 days</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingCelebrations.map((celeb, index) => {
                const Icon = celeb.icon;
                const celebDate = new Date(celeb.date);
                const daysUntil = getDaysUntil(celeb.date);
                const years = celeb.type === 'Birthday' || celeb.type === 'Anniversary' 
                  ? calculateYears(celeb.date) 
                  : null;

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                      daysUntil === 0 
                        ? 'bg-gradient-to-r from-pink-100 to-purple-100 border-2 border-pink-300'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`${celeb.color} p-3 rounded-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{celeb.title}</p>
                        <p className="text-sm text-gray-600">
                          {celebDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          {years !== null && ` • Turning ${years + 1}`}
                        </p>
                        {celeb.notes && (
                          <p className="text-xs text-gray-500 mt-1">{celeb.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold ${
                        daysUntil === 0 ? 'text-pink-600' : 'text-gray-600'
                      }`}>
                        {daysUntil === 0 ? '🎉 Today!' : `${daysUntil} days`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Occasion Modal */}
      {showOccasionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingOccasion ? 'Edit Occasion' : 'Add Special Occasion'}
              </h2>
              <button onClick={closeOccasionModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddOccasion} className="p-6 space-y-4">
              <div>
                <label className="label">Title *</label>
                <input
                  type="text"
                  value={occasionForm.title}
                  onChange={(e) => setOccasionForm({ ...occasionForm, title: e.target.value })}
                  className="input-field"
                  placeholder="e.g., John's Baptism"
                  required
                />
              </div>

              <div>
                <label className="label">Type *</label>
                <select
                  value={occasionForm.type}
                  onChange={(e) => setOccasionForm({ ...occasionForm, type: e.target.value })}
                  className="input-field"
                  required
                >
                  {occasionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Date *</label>
                <input
                  type="date"
                  value={occasionForm.date}
                  onChange={(e) => setOccasionForm({ ...occasionForm, date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="label">Member (Optional)</label>
                <select
                  value={occasionForm.memberId}
                  onChange={(e) => {
                    const member = members.find(m => m.memberId === e.target.value);
                    setOccasionForm({
                      ...occasionForm,
                      memberId: e.target.value,
                      memberName: member ? member.fullName : ''
                    });
                  }}
                  className="input-field"
                >
                  <option value="">Select member...</option>
                  {members.map(member => (
                    <option key={member.id} value={member.memberId}>
                      {member.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Notes (Optional)</label>
                <textarea
                  value={occasionForm.notes}
                  onChange={(e) => setOccasionForm({ ...occasionForm, notes: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Additional details..."
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={occasionForm.recurring}
                    onChange={(e) => setOccasionForm({ ...occasionForm, recurring: e.target.checked })}
                    className="w-4 h-4 text-church-gold focus:ring-church-gold border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Recurring annually</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={closeOccasionModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingOccasion ? 'Update' : 'Add'} Occasion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Celebrations;
