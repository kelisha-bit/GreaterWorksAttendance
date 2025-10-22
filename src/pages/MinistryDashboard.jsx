import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getMinistryById, 
  getMinistryByUserId, 
  getUserMinistryRole,
  subscribeToMinistry,
  getMinistryMembersCount,
  getUpcomingEvents
} from '../utils/ministryService';
import { hasPermission, PERMISSIONS, MINISTRY_TYPES } from '../models/MinistryModel';
import toast from 'react-hot-toast';
import MinistryChat from '../components/MinistryChat';

// Icons
import { 
  FaUsers, 
  FaCalendarAlt, 
  FaBullhorn, 
  FaBook, 
  FaComments, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaUserFriends,
  FaChartLine,
  FaChurch,
  FaInfoCircle
} from 'react-icons/fa';

// UI Components
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter, 
  CardDescription 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

const MinistryDashboard = () => {
  const { ministryId } = useParams();
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  
  const [ministry, setMinistry] = useState(null);
  const [userMinistries, setUserMinistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    members: 0,
    events: [],
    activeMembers: 0,
    attendanceRate: 0
  });
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Get initials from name
  const getInitials = (name) => {
    return name 
      ? name.split(' ').map(n => n[0]).join('').toUpperCase()
      : 'MW';
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Fetch ministry data
  useEffect(() => {
    let unsubscribe = null;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // If ministryId is provided, fetch that specific ministry
        if (ministryId) {
          // Subscribe to real-time updates for this ministry
          unsubscribe = subscribeToMinistry(
            ministryId,
            (ministryData) => {
              setMinistry(ministryData);
              setLoading(false);
            },
            (error) => {
              console.error('Error subscribing to ministry:', error);
              toast.error('Failed to load ministry data. Please try again.');
              setLoading(false);
            }
          );
          
          // Get user's role in this ministry
          if (currentUser?.uid) {
            const role = await getUserMinistryRole(ministryId, currentUser.uid);
            setUserRole(role);
          }
        } else {
          // If no ministryId, fetch all ministries the user belongs to
          if (currentUser?.uid) {
            const ministries = await getMinistryByUserId(currentUser.uid);
            setUserMinistries(ministries);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching ministry data:', error);
        toast.error('Failed to load ministry data. Please try again.');
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchData();
    } else {
      setLoading(false);
    }
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [ministryId, currentUser]);
  
  // Check if user has permission for a specific action
  const canPerformAction = (permission) => {
    return hasPermission(userRole, permission);
  };
  
  // Render ministry selection if no specific ministry is selected
  const renderMinistrySelection = () => {
    if (userMinistries.length === 0) {
      return (
        <div className="text-center p-5">
          <h3>You are not part of any ministry yet</h3>
          <p>Please contact your church administrator to be added to a ministry.</p>
        </div>
      );
    }
    
    return (
      <div className="container mt-4">
        <h2 className="mb-4">Your Ministries</h2>
        <div className="row">
          {userMinistries.map(ministry => (
            <div className="col-md-4 mb-4" key={ministry.id}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title>{ministry.name}</Card.Title>
                  <Card.Text className="text-muted">{ministry.type}</Card.Text>
                  <Card.Text className="mb-3">{ministry.description}</Card.Text>
                  <div className="d-flex justify-content-between align-items-center">
                    <Badge bg="primary" className="me-2">
                      {ministry.leaders.includes(currentUser.uid) ? 'Leader' : 'Member'}
                    </Badge>
                    <Button 
                      variant="outline-primary" 
                      onClick={() => navigate(`/ministry/${ministry.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render ministry overview tab
  const renderOverview = () => {
    if (!ministry) return null;
    
    return (
      <div className="ministry-overview">
        <div className="mb-4">
          <h3>About {ministry.name}</h3>
          <p>{ministry.description}</p>
        </div>
        
        <div className="mb-4">
          <h4>Meeting Schedule</h4>
          <p>
            <strong>Day:</strong> {ministry.meetingSchedule?.day || 'Not specified'}<br />
            <strong>Time:</strong> {ministry.meetingSchedule?.time || 'Not specified'}<br />
            <strong>Location:</strong> {ministry.meetingSchedule?.location || 'Not specified'}<br />
            <strong>Frequency:</strong> {ministry.meetingSchedule?.frequency || 'Weekly'}
          </p>
        </div>
        
        <div className="mb-4">
          <h4>Contact Information</h4>
          <p>
            <strong>Email:</strong> {ministry.contactEmail || 'Not specified'}<br />
            <strong>Phone:</strong> {ministry.contactPhone || 'Not specified'}
          </p>
        </div>
        
        {canPerformAction(PERMISSIONS.EDIT) && (
          <Button 
            variant="outline-primary"
            onClick={() => navigate(`/ministry/${ministry.id}/edit`)}
          >
            Edit Ministry Details
          </Button>
        )}
      </div>
    );
  };
  
  // Render members tab
  const renderMembers = () => {
    if (!ministry) return null;
    
    return (
      <div className="ministry-members">
        <div className="mb-4">
          <h3>Leadership Team</h3>
          {ministry.leaders && ministry.leaders.length > 0 ? (
            <div className="row">
              {ministry.leaders.map(leaderId => (
                <div className="col-md-4 mb-3" key={leaderId}>
                  <Card>
                    <Card.Body>
                      <Card.Title>{leaderId}</Card.Title>
                      <Card.Text>Leader</Card.Text>
                      <Button 
                        variant="link" 
                        onClick={() => navigate(`/members/${leaderId}`)}
                      >
                        View Profile
                      </Button>
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <p>No leaders assigned yet.</p>
          )}
        </div>
        
        <div className="mb-4">
          <h3>Members</h3>
          {ministry.members && ministry.members.length > 0 ? (
            <div className="row">
              {ministry.members.map(memberId => (
                <div className="col-md-4 mb-3" key={memberId}>
                  <Card>
                    <Card.Body>
                      <Card.Title>{memberId}</Card.Title>
                      <Card.Text>Member</Card.Text>
                      <Button 
                        variant="link" 
                        onClick={() => navigate(`/members/${memberId}`)}
                      >
                        View Profile
                      </Button>
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <p>No members assigned yet.</p>
          )}
        </div>
        
        {canPerformAction(PERMISSIONS.MANAGE_MEMBERS) && (
          <Button 
            variant="outline-primary"
            onClick={() => navigate(`/ministry/${ministry.id}/members/manage`)}
          >
            Manage Members
          </Button>
        )}
      </div>
    );
  };
  
  // Render announcements tab
  const renderAnnouncements = () => {
    if (!ministry) return null;
    
    return (
      <div className="ministry-announcements">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Announcements</h3>
          {canPerformAction(PERMISSIONS.MANAGE_ANNOUNCEMENTS) && (
            <Button 
              variant="primary"
              onClick={() => navigate(`/ministry/${ministry.id}/announcements/new`)}
            >
              New Announcement
            </Button>
          )}
        </div>
        
        {ministry.announcements && ministry.announcements.length > 0 ? (
          <div className="announcements-list">
            {ministry.announcements.map(announcement => (
              <Card className="mb-3" key={announcement.id}>
                <Card.Body>
                  <Card.Title>{announcement.title}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {announcement.createdAt ? new Date(announcement.createdAt.seconds * 1000).toLocaleDateString() : 'Date not available'}
                  </Card.Subtitle>
                  <Card.Text>{announcement.content}</Card.Text>
                </Card.Body>
              </Card>
            ))}
          </div>
        ) : (
          <p>No announcements yet.</p>
        )}
      </div>
    );
  };
  
  // Render resources tab
  const renderResources = () => {
    if (!ministry) return null;
    
    return (
      <div className="ministry-resources">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Resources</h3>
          {canPerformAction(PERMISSIONS.MANAGE_RESOURCES) && (
            <Button 
              variant="primary"
              onClick={() => navigate(`/ministry/${ministry.id}/resources/new`)}
            >
              Add Resource
            </Button>
          )}
        </div>
        
        {ministry.resources && ministry.resources.length > 0 ? (
          <div className="row">
            {ministry.resources.map(resource => (
              <div className="col-md-4 mb-3" key={resource.id}>
                <Card className="h-100">
                  <Card.Body>
                    <Card.Title>{resource.title}</Card.Title>
                    <Card.Text>{resource.description}</Card.Text>
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-outline-primary"
                    >
                      View Resource
                    </a>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <p>No resources available yet.</p>
        )}
      </div>
    );
  };
  
  // Render communication tab
  const renderCommunication = () => {
    if (!ministry) return null;
    
    return (
      <div className="ministry-communication">
        <h3>Communication</h3>
        <p>This feature is coming soon. You'll be able to communicate with other ministry members here.</p>
      </div>
    );
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading ministry information...</p>
      </div>
    );
  }
  
  // Render ministry selection if no specific ministry is selected
  if (!ministryId) {
    return renderMinistrySelection();
  }
  
  // Render specific ministry dashboard
  return (
    <div className="container mt-4">
      {ministry ? (
        <>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2>{ministry.name}</h2>
              <p className="text-muted">{ministry.type}</p>
            </div>
            <Badge bg="primary" className="p-2">
              {userRole === 'leader' ? 'Leader' : 'Member'}
            </Badge>
          </div>
          
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            <Tab eventKey="overview" title={<><FaBook className="me-2" />Overview</>}>
              {renderOverview()}
            </Tab>
            <Tab eventKey="members" title={<><FaUsers className="me-2" />Members</>}>
              {renderMembers()}
            </Tab>
            <Tab eventKey="announcements" title={<><FaBullhorn className="me-2" />Announcements</>}>
              {renderAnnouncements()}
            </Tab>
            <Tab eventKey="resources" title={<><FaBook className="me-2" />Resources</>}>
              {renderResources()}
            </Tab>
            <Tab eventKey="communication" title={<><FaComments className="me-2" />Communication</>}>
              <MinistryChat ministryId={ministry.id} ministryName={ministry.name} />
            </Tab>
          </Tabs>
        </>
      ) : (
        <div className="text-center p-5">
          <h3>Ministry not found</h3>
          <p>The ministry you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/ministry')}
          >
            View Your Ministries
          </Button>
        </div>
      )}
    </div>
  );
};

export default MinistryDashboard;