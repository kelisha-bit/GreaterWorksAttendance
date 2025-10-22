import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Card, Row, Col, Alert, Badge, InputGroup, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createNewMinistry, updateMinistry } from '../utils/ministryService';
import { MINISTRY_TYPES } from '../models/MinistryModel';
import { useAuth } from '../contexts/AuthContext';

const MinistryForm = ({ ministry, onSuccess }) => {
  const navigate = useNavigate();
  const { currentUser, isAdmin, isLeader } = useAuth();
  const isEditing = !!ministry?.id;
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: MINISTRY_TYPES[0],
    active: true,
    meetingSchedule: {
      day: '',
      time: '',
      location: '',
      frequency: 'weekly'
    },
    contactEmail: '',
    contactPhone: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Check if user is authorized to create/edit ministries
  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        if (!currentUser) {
          setIsAuthorized(false);
          return;
        }
        
        // Allow creation if user is admin or leader
        // Allow editing if user is admin or a leader of this ministry
        const canEdit = isEditing 
          ? (isAdmin || (ministry?.leaders?.includes(currentUser.uid)))
          : (isAdmin || isLeader);
          
        setIsAuthorized(canEdit);
      } catch (error) {
        console.error('Error checking authorization:', error);
        toast.error('Error checking permissions');
      } finally {
        setLoadingAuth(false);
      }
    };
    
    checkAuthorization();
  }, [isEditing, ministry, currentUser, isAdmin, isLeader]);
  
  // Initialize form with ministry data if editing
  useEffect(() => {
    if (isEditing && ministry) {
      setFormData({
        name: ministry.name || '',
        description: ministry.description || '',
        type: ministry.type || MINISTRY_TYPES[0],
        active: ministry.active !== undefined ? ministry.active : true,
        meetingSchedule: {
          day: ministry.meetingSchedule?.day || '',
          time: ministry.meetingSchedule?.time || '',
          location: ministry.meetingSchedule?.location || '',
          frequency: ministry.meetingSchedule?.frequency || 'weekly'
        },
        contactEmail: ministry.contactEmail || '',
        contactPhone: ministry.contactPhone || ''
      });
    }
  }, [ministry, isEditing]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Ministry name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Ministry name must be at least 3 characters long';
    }
    
    if (!formData.type) {
      newErrors.type = 'Ministry type is required';
    }
    
    // Meeting schedule validation
    if (formData.active) {
      if (!formData.meetingSchedule.day) {
        newErrors['meetingSchedule.day'] = 'Meeting day is required';
      }
      if (!formData.meetingSchedule.time) {
        newErrors['meetingSchedule.time'] = 'Meeting time is required';
      }
      if (!formData.meetingSchedule.location) {
        newErrors['meetingSchedule.location'] = 'Meeting location is required';
      }
    }
    
    // Contact validation
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }
    
    // Improved phone validation with international format support
    if (formData.contactPhone && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/.test(formData.contactPhone)) {
      newErrors.contactPhone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      // Scroll to the first error
      const firstErrorElement = document.querySelector('.is-invalid');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorElement.focus();
      }
      return;
    }
    
    try {
      // Double-check authorization before calling Firestore
      if (!isAuthorized) {
        toast.error('You do not have permission to perform this action.');
        return;
      }
      setLoading(true);
      
      // Add a slight delay to show loading state for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (isEditing) {
        // Update existing ministry
        await updateMinistry(ministry.id, formData);
        toast.success('Ministry updated successfully', {
          icon: '✅',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      } else {
        // Create new ministry
        await createNewMinistry(formData);
        toast.success('Ministry created successfully', {
          icon: '🎉',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/ministries');
      }
    } catch (error) {
      console.error('Error saving ministry:', error);
      
      // Handle specific Firebase permission errors
      let errorMessage = error.message || 'Failed to save ministry. Please try again.';
      
      if (error.code === 'permission-denied' || error.message.includes('permission') || error.message.includes('Permission')) {
        errorMessage = 'You do not have permission to perform this action. Please check your account role.';
      } else if (error.message.includes('Authentication')) {
        errorMessage = 'Authentication error. Please log out and log in again.';
      }
      
      toast.error(errorMessage, {
        icon: '❌',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
        duration: 5000, // Show error for longer
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (loadingAuth) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Checking permissions...</p>
      </div>
    );
  }
  
  if (!isAuthorized) {
    return (
      <Alert variant="danger" className="mt-4">
        <Alert.Heading>Access Denied</Alert.Heading>
        <p>
          You don't have permission to {isEditing ? 'edit this ministry' : 'create new ministries'}.
          {!currentUser ? ' Please log in first.' : ' Only administrators and ministry leaders can perform this action.'}
        </p>
        {!currentUser && (
          <Button variant="primary" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        )}
      </Alert>
    );
  }

  return (
    <Card className="shadow border-0 rounded-3">
      <Card.Header className="bg-primary bg-gradient text-white py-3">
        <div className="d-flex align-items-center">
          <i className="bi bi-people-fill me-2 fs-4" aria-hidden="true"></i>
          <h5 className="mb-0">{isEditing ? 'Edit Ministry' : 'Create New Ministry'}</h5>
          {isEditing && (
            <Badge bg="light" text="dark" className="ms-2 px-3 py-2">
              <span className="visually-hidden">Ministry ID:</span> {ministry.id.substring(0, 8)}
            </Badge>
          )}
        </div>
      </Card.Header>
      <Card.Body className="p-4">
        <Form onSubmit={handleSubmit} noValidate aria-label={isEditing ? 'Edit Ministry Form' : 'Create Ministry Form'}>
          <Row className="mb-4">
            <Col md={6}>
              <Form.Group className="mb-3" controlId="ministryName">
                <Form.Label>
                  Ministry Name <span className="text-danger">*</span>
                </Form.Label>
                <InputGroup hasValidation>
                  <InputGroup.Text>
                    <i className="bi bi-tag" aria-hidden="true"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    isInvalid={!!errors.name}
                    placeholder="Enter ministry name"
                    required
                    aria-describedby="nameHelpBlock"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </InputGroup>
                <Form.Text id="nameHelpBlock" muted>
                  Choose a clear, descriptive name for the ministry
                </Form.Text>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Ministry Type <span className="text-danger">*</span>
                </Form.Label>
                <InputGroup hasValidation>
                  <InputGroup.Text>
                    <i className="bi bi-list-check"></i>
                  </InputGroup.Text>
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    isInvalid={!!errors.type}
                    required
                    aria-describedby="typeHelpBlock"
                  >
                    {MINISTRY_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.type}
                  </Form.Control.Feedback>
                </InputGroup>
                <Form.Text id="typeHelpBlock" muted>
                  Select the category that best describes this ministry
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-4">
            <Form.Label>Description</Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-file-text"></i>
              </InputGroup.Text>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide a brief description of the ministry's purpose and activities"
                isInvalid={!!errors.description}
              />
              <Form.Control.Feedback type="invalid">
                {errors.description}
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
          
          <Form.Group className="mb-4">
            <div className="d-flex align-items-center">
              <Form.Check
                type="switch"
                id="ministry-active-switch"
                label="Active Ministry"
                name="active"
                checked={formData.active}
                onChange={handleCheckboxChange}
                className="fs-5"
              />
              <Badge bg={formData.active ? "success" : "secondary"} className="ms-2">
                {formData.active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <Form.Text muted>
              Active ministries are visible to members and can schedule meetings
            </Form.Text>
          </Form.Group>
          
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-light">
              <div className="d-flex align-items-center">
                <i className="bi bi-calendar-event me-2"></i>
                <h6 className="mb-0">Meeting Schedule</h6>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Day</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="bi bi-calendar-day"></i>
                      </InputGroup.Text>
                      <Form.Select
                        name="meetingSchedule.day"
                        value={formData.meetingSchedule.day}
                        onChange={handleChange}
                        isInvalid={!!errors['meetingSchedule.day']}
                      >
                        <option value="">Select Day</option>
                        <option value="Sunday">Sunday</option>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors['meetingSchedule.day']}
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Time</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="bi bi-clock" aria-hidden="true"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="time"
                        name="meetingSchedule.time"
                        value={formData.meetingSchedule.time}
                        onChange={handleChange}
                        isInvalid={!!errors['meetingSchedule.time']}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors['meetingSchedule.time']}
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="bi bi-geo-alt"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="meetingSchedule.location"
                        value={formData.meetingSchedule.location}
                        onChange={handleChange}
                        placeholder="Enter meeting location"
                        isInvalid={!!errors['meetingSchedule.location']}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors['meetingSchedule.location']}
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Frequency</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="bi bi-arrow-repeat"></i>
                      </InputGroup.Text>
                      <Form.Select
                        name="meetingSchedule.frequency"
                        value={formData.meetingSchedule.frequency}
                        onChange={handleChange}
                      >
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom</option>
                      </Form.Select>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-light">
              <div className="d-flex align-items-center">
                <i className="bi bi-envelope-at me-2"></i>
                <h6 className="mb-0">Contact Information</h6>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="bi bi-envelope"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="email"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        placeholder="ministry@example.com"
                        isInvalid={!!errors.contactEmail}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.contactEmail}
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="bi bi-telephone"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="tel"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        placeholder="+1 (123) 456-7890"
                        isInvalid={!!errors.contactPhone}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.contactPhone}
                      </Form.Control.Feedback>
                    </InputGroup>
                    <Form.Text muted>
                      Format: +1 (123) 456-7890
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <div className="d-flex justify-content-between mt-4">
            <Button
              variant="outline-secondary"
              onClick={() => navigate('/ministries')}
              disabled={loading}
              className="px-4"
              aria-label="Cancel and return to ministries page"
            >
              <i className="bi bi-arrow-left me-2" aria-hidden="true"></i>
              Back to Ministries
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="px-4"
              aria-live="polite"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <i className={`bi ${isEditing ? 'bi-save' : 'bi-plus-circle'} me-2`} aria-hidden="true"></i>
                  <span>{isEditing ? 'Update Ministry' : 'Create Ministry'}</span>
                </>
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default MinistryForm;