import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Alert, Row, Col, Breadcrumb, Tab, Nav } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { getMinistryById } from '../utils/ministryService';
import MinistryForm from '../components/MinistryForm';
import MinistryMemberAssignment from '../components/MinistryMemberAssignment';

const MinistryManagement = () => {
  const { ministryId } = useParams();
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  
  const [ministry, setMinistry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isEditing = !!ministryId;
  
  // Check if user has admin or leader permissions
  useEffect(() => {
    if (currentUser && !['admin', 'leader'].includes(userRole)) {
      setError('You do not have permission to manage ministries');
      setLoading(false);
    }
  }, [currentUser, userRole]);
  
  // Fetch ministry data if editing
  useEffect(() => {
    let isMounted = true;
    
    const fetchMinistry = async () => {
      if (!isEditing) {
        setLoading(false);
        return;
      }
      
      try {
        const ministryData = await getMinistryById(ministryId);
        if (!isMounted) return;
        
        if (!ministryData) {
          setError('Ministry not found');
        } else {
          setMinistry(ministryData);
        }
      } catch (err) {
        console.error('Error fetching ministry:', err);
        if (isMounted) {
          setError('Failed to load ministry data. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    if (currentUser && ['admin', 'leader'].includes(userRole)) {
      setLoading(true);
      fetchMinistry();
    }
    
    return () => {
      isMounted = false;
    };
  }, [ministryId, isEditing, currentUser, userRole]);
  
  const handleSuccess = () => {
    navigate('/ministries');
  };
  
  const handleCancel = () => {
    navigate('/ministries');
  };
  
  if (loading) {
    return (
      <Container fluid className="py-4 px-4 bg-light min-vh-100">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-primary fw-bold">Loading ministry data...</p>
          </div>
        </div>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container fluid className="py-4 px-4 bg-light min-vh-100">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '3rem' }}></i>
                </div>
                <Alert variant="danger" className="mb-0">
                  <Alert.Heading className="h5">Access Error</Alert.Heading>
                  <p className="mb-0">{error}</p>
                </Alert>
                <div className="text-center mt-4">
                  <button 
                    className="btn btn-outline-secondary" 
                    onClick={() => navigate('/ministries')}
                  >
                    Return to Ministries
                  </button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
  
  if (!isEditing) {
    return (
      <Container fluid className="py-4 px-4 bg-light min-vh-100">
        <Row className="mb-4">
          <Col>
            <Breadcrumb className="bg-white shadow-sm py-2 px-3 rounded">
              <Breadcrumb.Item onClick={() => navigate('/ministries')} style={{ cursor: 'pointer' }}>Ministries</Breadcrumb.Item>
              <Breadcrumb.Item active>Create New Ministry</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
        </Row>
        
        <Row>
          <Col lg={12}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white py-3">
                <h4 className="mb-0 text-primary">Create New Ministry</h4>
              </Card.Header>
              <Card.Body className="p-4">
                <MinistryForm 
                  ministry={ministry} 
                  onSuccess={handleSuccess}
                  onCancel={handleCancel}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 px-4 bg-light min-vh-100">
      <Row className="mb-4">
        <Col>
          <Breadcrumb className="bg-white shadow-sm py-2 px-3 rounded">
            <Breadcrumb.Item onClick={() => navigate('/ministries')} style={{ cursor: 'pointer' }}>Ministries</Breadcrumb.Item>
            <Breadcrumb.Item active>{ministry?.name}</Breadcrumb.Item>
          </Breadcrumb>
        </Col>
      </Row>
      
      <Row>
        <Col lg={12}>
          <Tab.Container defaultActiveKey="details">
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white py-3 border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0 text-primary">{ministry?.name}</h4>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={() => navigate('/ministries')}
                    >
                      <i className="bi bi-arrow-left me-1"></i> Back to Ministries
                    </Button>
                  </div>
                </div>
                
                <Nav variant="tabs" className="mt-3 border-0">
                  <Nav.Item>
                    <Nav.Link eventKey="details" className="border-0">
                      <i className="bi bi-info-circle me-1"></i> Details
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="members" className="border-0">
                      <i className="bi bi-people me-1"></i> Members
                      {ministry?.memberCount > 0 && (
                        <Badge bg="primary" className="ms-1">
                          {ministry.memberCount}
                        </Badge>
                      )}
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Header>
              
              <Card.Body className="p-0">
                <Tab.Content>
                  <Tab.Pane eventKey="details" className="p-4">
                    <MinistryForm 
                      ministry={ministry} 
                      onSuccess={handleSuccess}
                      onCancel={handleCancel}
                    />
                  </Tab.Pane>
                  
                  <Tab.Pane eventKey="members" className="p-0">
                    <MinistryMemberAssignment 
                      ministryId={ministryId} 
                      currentUser={currentUser}
                    />
                  </Tab.Pane>
                </Tab.Content>
              </Card.Body>
            </Card>
          </Tab.Container>
        </Col>
      </Row>
    </Container>
  );
};

export default MinistryManagement;