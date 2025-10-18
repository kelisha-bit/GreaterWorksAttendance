import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Grid3x3,
  List,
  Clock,
  MapPin,
  Users,
  Filter,
  Search,
  Download,
  X
} from 'lucide-react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import EventForm from '../components/EventForm';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays, isToday } from 'date-fns';

const EventCalendar = () => {
  const { userRole } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day, agenda
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    eventType: 'all',
    category: 'all',
    visibility: 'all'
  });

  const eventTypes = [
    { value: 'worship_service', label: 'Worship Service', color: 'bg-blue-500' },
    { value: 'prayer_meeting', label: 'Prayer Meeting', color: 'bg-purple-500' },
    { value: 'bible_study', label: 'Bible Study', color: 'bg-green-500' },
    { value: 'fellowship', label: 'Fellowship', color: 'bg-yellow-500' },
    { value: 'conference', label: 'Conference', color: 'bg-red-500' },
    { value: 'outreach', label: 'Outreach', color: 'bg-orange-500' },
    { value: 'training', label: 'Training', color: 'bg-indigo-500' },
    { value: 'social', label: 'Social Event', color: 'bg-pink-500' },
    { value: 'celebration', label: 'Celebration', color: 'bg-gold-500' },
    { value: 'other', label: 'Other', color: 'bg-gray-500' }
  ];

  const categories = [
    'Regular Service',
    'Special Service',
    'Fellowship',
    'Ministry',
    'Youth',
    'Children',
    'Men',
    'Women',
    'Administrative'
  ];

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, view]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, searchTerm, filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const eventsRef = collection(db, 'events');
      
      // Calculate date range based on view
      let startDate, endDate;
      if (view === 'month') {
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
      } else if (view === 'week') {
        startDate = startOfWeek(currentDate);
        endDate = endOfWeek(currentDate);
      } else if (view === 'day') {
        startDate = currentDate;
        endDate = currentDate;
      } else {
        // Agenda view - show next 30 days
        startDate = new Date();
        endDate = addDays(new Date(), 30);
      }

      // Set end date to end of day to include events on that day
      endDate = new Date(endDate);
      endDate.setHours(23, 59, 59, 999);

      // Query with range filter
      const q = query(
        eventsRef,
        where('startDate', '>=', Timestamp.fromDate(startDate)),
        where('startDate', '<=', Timestamp.fromDate(endDate))
      );

      const snapshot = await getDocs(q);
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate()
      }));

      console.log('Fetched events:', eventsData.length, 'events');
      console.log('Date range:', startDate, 'to', endDate);
      console.log('Events:', eventsData);

      // Sort events by startDate on the client side
      eventsData.sort((a, b) => a.startDate - b.startDate);

      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Event type filter
    if (filters.eventType !== 'all') {
      filtered = filtered.filter(event => event.eventType === filters.eventType);
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(event => event.category === filters.category);
    }

    // Visibility filter
    if (filters.visibility !== 'all') {
      filtered = filtered.filter(event => event.visibility === filters.visibility);
    }

    setFilteredEvents(filtered);
  };

  const getEventTypeColor = (eventType) => {
    const type = eventTypes.find(t => t.value === eventType);
    return type?.color || 'bg-gray-500';
  };

  const handlePrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else if (view === 'day') {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else if (view === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date) => {
    return filteredEvents.filter(event => 
      isSameDay(event.startDate, date)
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Calendar header */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center font-semibold text-gray-700 text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);

            return (
              <div
                key={idx}
                className={`min-h-[120px] border-r border-b border-gray-200 p-2 ${
                  !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                } ${isTodayDate ? 'bg-blue-50' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isTodayDate ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full text-left text-xs p-1 rounded ${getEventTypeColor(event.eventType)} text-white truncate hover:opacity-80`}
                    >
                      {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 pl-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <div className="grid grid-cols-8 min-w-[800px]">
          {/* Time column */}
          <div className="border-r border-gray-200">
            <div className="h-16 border-b border-gray-200"></div>
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b border-gray-200 p-2 text-xs text-gray-500">
                {format(new Date().setHours(hour, 0), 'h:mm a')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIdx) => {
            const dayEvents = getEventsForDate(day);
            const isTodayDate = isToday(day);

            return (
              <div key={dayIdx} className="border-r border-gray-200">
                <div className={`h-16 border-b border-gray-200 p-2 text-center ${
                  isTodayDate ? 'bg-blue-50' : ''
                }`}>
                  <div className="text-xs text-gray-500">{format(day, 'EEE')}</div>
                  <div className={`text-lg font-semibold ${
                    isTodayDate ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>
                <div className="relative">
                  {hours.map(hour => (
                    <div key={hour} className="h-16 border-b border-gray-200"></div>
                  ))}
                  {/* Event blocks */}
                  {dayEvents.map(event => {
                    const startHour = event.startDate.getHours();
                    const startMinute = event.startDate.getMinutes();
                    const top = (startHour * 64) + (startMinute / 60 * 64);
                    
                    return (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`absolute left-1 right-1 ${getEventTypeColor(event.eventType)} text-white text-xs p-1 rounded shadow-sm hover:opacity-80`}
                        style={{ top: `${top}px`, height: '60px' }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="truncate">{event.startTime}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h3>
        </div>
        <div className="grid grid-cols-[100px_1fr]">
          {/* Time column */}
          <div className="border-r border-gray-200">
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b border-gray-200 p-2 text-xs text-gray-500">
                {format(new Date().setHours(hour, 0), 'h:mm a')}
              </div>
            ))}
          </div>

          {/* Events column */}
          <div className="relative">
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b border-gray-200"></div>
            ))}
            {dayEvents.map(event => {
              const startHour = event.startDate.getHours();
              const startMinute = event.startDate.getMinutes();
              const top = (startHour * 64) + (startMinute / 60 * 64);
              
              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`absolute left-2 right-2 ${getEventTypeColor(event.eventType)} text-white p-3 rounded shadow-sm hover:opacity-80`}
                  style={{ top: `${top}px`, minHeight: '80px' }}
                >
                  <div className="font-semibold">{event.title}</div>
                  <div className="text-sm mt-1">{event.startTime} - {event.endTime}</div>
                  {event.location && (
                    <div className="text-sm mt-1 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {event.location}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    // Group events by date
    const groupedEvents = filteredEvents.reduce((acc, event) => {
      const dateKey = format(event.startDate, 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {});

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {Object.entries(groupedEvents).map(([date, dateEvents]) => (
            <div key={date} className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </h3>
              <div className="space-y-2">
                {dateEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-church-gold hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`w-3 h-3 rounded-full ${getEventTypeColor(event.eventType)}`}></span>
                          <span className="font-semibold text-gray-900">{event.title}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {event.startTime} - {event.endTime}
                          </span>
                          {event.location && (
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {event.location}
                            </span>
                          )}
                          {event.registeredCount !== undefined && (
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {event.registeredCount} registered
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {event.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(groupedEvents).length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No upcoming events found
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Calendar</h1>
          <p className="text-gray-600 mt-1">Manage church events and activities</p>
        </div>
        {(userRole === 'admin' || userRole === 'leader') && (
          <button
            onClick={() => setShowEventForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-church-gold text-white rounded-lg hover:bg-church-darkGold transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleToday}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Today
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevious}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-lg font-semibold min-w-[200px] text-center">
                {view === 'month' && format(currentDate, 'MMMM yyyy')}
                {view === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d')}`}
                {view === 'day' && format(currentDate, 'MMMM d, yyyy')}
                {view === 'agenda' && 'Upcoming Events'}
              </span>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* View switcher */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setView('month')}
              className={`p-2 rounded-lg ${view === 'month' ? 'bg-church-gold text-white' : 'hover:bg-gray-100'}`}
              title="Month View"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('week')}
              className={`p-2 rounded-lg ${view === 'week' ? 'bg-church-gold text-white' : 'hover:bg-gray-100'}`}
              title="Week View"
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('day')}
              className={`p-2 rounded-lg ${view === 'day' ? 'bg-church-gold text-white' : 'hover:bg-gray-100'}`}
              title="Day View"
            >
              <Clock className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('agenda')}
              className={`p-2 rounded-lg ${view === 'agenda' ? 'bg-church-gold text-white' : 'hover:bg-gray-100'}`}
              title="Agenda View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* Search and filters */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg ${showFilters ? 'bg-church-gold text-white' : 'hover:bg-gray-100'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg" title="Export">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select
                value={filters.eventType}
                onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
              >
                <option value="all">All Types</option>
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
              <select
                value={filters.visibility}
                onChange={(e) => setFilters({ ...filters, visibility: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
              >
                <option value="all">All Events</option>
                <option value="public">Public</option>
                <option value="members">Members Only</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Calendar View */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-church-gold"></div>
        </div>
      ) : (
        <>
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
          {view === 'agenda' && renderAgendaView()}
        </>
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <EventForm
          onClose={() => setShowEventForm(false)}
          onSuccess={() => {
            fetchEvents();
            setShowEventForm(false);
          }}
        />
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-white text-sm ${getEventTypeColor(selectedEvent.eventType)}`}>
                  {eventTypes.find(t => t.value === selectedEvent.eventType)?.label}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {selectedEvent.category}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium">
                      {format(selectedEvent.startDate, 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedEvent.startTime} - {selectedEvent.endTime}
                    </div>
                  </div>
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium">{selectedEvent.location}</div>
                      {selectedEvent.address && (
                        <div className="text-sm text-gray-600">{selectedEvent.address}</div>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedEvent.registrationEnabled && (
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium">
                        {selectedEvent.registeredCount || 0} / {selectedEvent.capacity || '∞'} registered
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {selectedEvent.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-gray-600">{selectedEvent.description}</p>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                {selectedEvent.registrationEnabled && (
                  <button className="flex-1 px-4 py-2 bg-church-gold text-white rounded-lg hover:bg-church-darkGold">
                    Register
                  </button>
                )}
                {(userRole === 'admin' || userRole === 'leader') && (
                  <>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Edit
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Manage
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;
