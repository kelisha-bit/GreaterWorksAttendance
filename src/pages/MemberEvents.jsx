import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRealtimeMemberData, useRealtimeEvents } from '../hooks/useRealtimeMemberData';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Trophy,
  Download,
  Filter,
  Search,
  CalendarDays,
  Video,
  Mic,
  Music,
  Heart,
  Coffee,
  Book,
  Target,
  TrendingUp,
  Church
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const MemberEvents = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { isLeader } = useAuth();
  const { member, loading: memberLoading, error: memberError } = useRealtimeMemberData(memberId);
  const { events, loading: eventsLoading } = useRealtimeEvents(memberId, member?.memberId);
  const [eventStats, setEventStats] = useState({
    totalEvents: 0,
    attendedEvents: 0,
    upcomingEvents: 0,
    participationRate: 0,
    favoriteEventType: '',
    mostActiveMonth: ''
  });
  const [monthlyParticipation, setMonthlyParticipation] = useState([]);
  const [eventTypeDistribution, setEventTypeDistribution] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEventType, setFilterEventType] = useState('all');

  const loading = memberLoading || eventsLoading;

  const parseEventDate = (value) => {
    if (!value) return null;
    const dateValue = value instanceof Date ? value : new Date(value);
    return isNaN(dateValue.getTime()) ? null : dateValue;
  };

  const formatEventDate = (value, dateFormat = 'MMM dd, yyyy') => {
    const parsedDate = parseEventDate(value);
    return parsedDate ? format(parsedDate, dateFormat) : null;
  };

  useEffect(() => {
    if (memberError) {
      toast.error(memberError);
      if (memberError === 'Member not found') {
        navigate('/members');
      }
    }
  }, [memberError, navigate]);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, filterStatus, filterEventType]);

  useEffect(() => {
    if (events.length > 0) {
      calculateStats();
      prepareChartData();
    }
  }, [events]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];

  const eventTypes = [
    { value: 'service', label: 'Sunday Service', icon: Church, color: 'blue' },
    { value: 'bible_study', label: 'Bible Study', icon: Book, color: 'green' },
    { value: 'prayer', label: 'Prayer Meeting', icon: Heart, color: 'purple' },
    { value: 'youth', label: 'Youth Service', icon: Star, color: 'orange' },
    { value: 'outreach', label: 'Outreach', icon: Target, color: 'red' },
    { value: 'conference', label: 'Conference', icon: Users, color: 'indigo' },
    { value: 'workshop', label: 'Workshop', icon: Coffee, color: 'yellow' },
    { value: 'special', label: 'Special Event', icon: Trophy, color: 'pink' }
  ];

  const filterEvents = () => {
    let filtered = [...events];

    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'registered') {
        filtered = filtered.filter(event => event.registered);
      } else if (filterStatus === 'attended') {
        filtered = filtered.filter(event => event.attended);
      } else if (filterStatus === 'upcoming') {
        filtered = filtered.filter(event => event.isUpcoming);
      } else if (filterStatus === 'past') {
        filtered = filtered.filter(event => event.isPast);
      }
    }

    if (filterEventType !== 'all') {
      filtered = filtered.filter(event => event.type === filterEventType);
    }

    setFilteredEvents(filtered);
  };

  const calculateStats = () => {
    const eventsList = events;
    const totalEvents = eventsList.length;
    const attendedEvents = eventsList.filter(e => e.attended).length;
    const upcomingEvents = eventsList.filter(e => e.isUpcoming).length;
    const participationRate = totalEvents > 0 ? Math.round((attendedEvents / totalEvents) * 100) : 0;

    // Find favorite event type
    const eventTypeCounts = {};
    eventsList.filter(e => e.attended).forEach(event => {
      const type = event.type || 'service';
      eventTypeCounts[type] = (eventTypeCounts[type] || 0) + 1;
    });
    
    const favoriteEventType = Object.keys(eventTypeCounts).reduce((a, b) => 
      eventTypeCounts[a] > eventTypeCounts[b] ? a : b, ''
    );

    // Find most active month
    const monthCounts = {};
    eventsList.filter(e => e.attended).forEach(event => {
      const eventDate = parseEventDate(event.date);
      if (!eventDate) {
        return;
      }
      const month = format(eventDate, 'MMM yyyy');
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    
    const mostActiveMonth = Object.keys(monthCounts).reduce((a, b) => 
      monthCounts[a] > monthCounts[b] ? a : b, ''
    );

    setEventStats({
      totalEvents,
      attendedEvents,
      upcomingEvents,
      participationRate,
      favoriteEventType,
      mostActiveMonth
    });
  };

  const prepareChartData = () => {
    const eventsList = events;
    // Monthly participation data
    const monthlyData = {};
    eventsList.filter(e => e.attended).forEach(event => {
      const eventDate = parseEventDate(event.date);
      if (!eventDate) {
        return;
      }
      const monthKey = format(eventDate, 'MMM yyyy');
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    const monthlyArray = Object.entries(monthlyData)
      .map(([month, count]) => ({ month, count }))
      .slice(-12)
      .sort((a, b) => new Date(a.month) - new Date(b.month));

    setMonthlyParticipation(monthlyArray);

    // Event type distribution
    const typeDistribution = {};
    eventsList.filter(e => e.attended).forEach(event => {
      const type = event.type || 'service';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    const typeArray = Object.entries(typeDistribution).map(([type, count]) => ({
      name: eventTypes.find(t => t.value === type)?.label || type,
      value: count
    })).sort((a, b) => b.value - a.value);

    setEventTypeDistribution(typeArray);
  };

  const exportEventsReport = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(212, 175, 55);
    doc.text('Greater Works City Church', 14, 20);
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Member Events Report', 14, 28);
    
    // Member Info
    doc.setFontSize(12);
    doc.text(`Name: ${member.fullName}`, 14, 40);
    doc.text(`Member ID: ${member.memberId}`, 14, 47);
    doc.text(`Department: ${member.department}`, 14, 54);
    
    // Event Stats
    doc.setFontSize(14);
    doc.text('Event Statistics', 14, 68);
    doc.setFontSize(10);
    doc.text(`Total Events: ${eventStats.totalEvents}`, 14, 76);
    doc.text(`Attended Events: ${eventStats.attendedEvents}`, 14, 83);
    doc.text(`Participation Rate: ${eventStats.participationRate}%`, 14, 90);
    doc.text(`Upcoming Events: ${eventStats.upcomingEvents}`, 14, 97);
    
    // Events Table
    const tableData = events.slice(0, 20).map(event => [
      formatEventDate(event.date) || 'Date TBD',
      event.name,
      eventTypes.find(t => t.value === event.type)?.label || 'Service',
      event.registered ? (event.attended ? 'Attended' : 'Registered') : 'Not Registered',
      event.location || '-'
    ]);
    
    doc.autoTable({
      startY: 110,
      head: [['Date', 'Event', 'Type', 'Status', 'Location']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [212, 175, 55] }
    });
    
    doc.save(`${member.fullName}_Events_Report.pdf`);
    toast.success('Events report exported successfully');
  };

  const getEventTypeIcon = (type) => {
    const eventType = eventTypes.find(t => t.value === type);
    const Icon = eventType?.icon || CalendarDays;
    return <Icon className="w-5 h-5" />;
  };

  const getEventTypeColor = (type) => {
    const eventType = eventTypes.find(t => t.value === type);
    return eventType?.color || 'gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-church-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Member not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          onClick={() => navigate(`/members/${memberId}`)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Profile</span>
        </button>
        <div className="flex gap-2">
          <button
            onClick={exportEventsReport}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <button onClick={() => navigate('/members')} className="hover:text-gray-900">Members</button>
        <span>/</span>
        <button onClick={() => navigate(`/members/${memberId}`)} className="hover:text-gray-900">{member.fullName}</button>
        <span>/</span>
        <span className="text-gray-900 font-medium">Events</span>
      </div>

      {/* Member Info Header */}
      <div className="card bg-gradient-to-r from-purple-600 to-purple-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{member.fullName}</h1>
            <p className="text-white opacity-90">{member.department} • {member.memberId}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{eventStats.participationRate}%</p>
            <p className="text-white opacity-90">Participation Rate</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">All Events</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="registered">Registered</option>
            <option value="attended">Attended</option>
          </select>

          <select
            value={filterEventType}
            onChange={(e) => setFilterEventType(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">All Types</option>
            {eventTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Event Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-semibold">Total Events</p>
              <p className="text-2xl font-bold text-purple-900">{eventStats.totalEvents}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">Attended</p>
              <p className="text-2xl font-bold text-green-900">{eventStats.attendedEvents}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">Upcoming</p>
              <p className="text-2xl font-bold text-blue-900">{eventStats.upcomingEvents}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-semibold">Participation</p>
              <p className="text-2xl font-bold text-orange-900">{eventStats.participationRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Participation Trend */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart className="w-5 h-5 mr-2 text-church-gold" />
            Monthly Event Participation
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyParticipation}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8B5CF6" name="Events Attended" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Event Type Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-church-gold" />
            Event Type Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={eventTypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {eventTypeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming Events */}
      {events.filter(e => e.isUpcoming).length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Clock className="w-6 h-6 mr-2 text-church-gold" />
            Upcoming Events
          </h2>
          <div className="space-y-3">
            {events.filter(e => e.isUpcoming).slice(0, 3).map((event) => (
              <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{event.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full bg-${getEventTypeColor(event.type)}-100 text-${getEventTypeColor(event.type)}-800`}>
                        {eventTypes.find(t => t.value === event.type)?.label || 'Service'}
                      </span>
                      {event.registered && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          Registered
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatEventDate(event.date) || 'Date TBD'}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{event.time || 'TBA'}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location || 'TBA'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Events List */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <CalendarDays className="w-6 h-6 mr-2 text-church-gold" />
          All Events
        </h2>
        
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No events found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`p-2 rounded-lg bg-${getEventTypeColor(event.type)}-100 text-${getEventTypeColor(event.type)}-600`}>
                        {getEventTypeIcon(event.type)}
                      </div>
                      <h3 className="font-semibold text-gray-900">{event.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full bg-${getEventTypeColor(event.type)}-100 text-${getEventTypeColor(event.type)}-800`}>
                        {eventTypes.find(t => t.value === event.type)?.label || 'Service'}
                      </span>
                      {event.isUpcoming && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          Upcoming
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatEventDate(event.date) || 'Date TBD'}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{event.time || 'TBA'}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location || 'TBA'}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    {event.attended ? (
                      <span className="flex items-center space-x-1 text-green-600 font-semibold">
                        <CheckCircle className="w-5 h-5" />
                        <span>Attended</span>
                      </span>
                    ) : event.registered ? (
                      <span className="flex items-center space-x-1 text-blue-600 font-semibold">
                        <AlertCircle className="w-5 h-5" />
                        <span>Registered</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-gray-400">
                        <XCircle className="w-5 h-5" />
                        <span>Not Registered</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberEvents;
