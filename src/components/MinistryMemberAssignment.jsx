import React, { useState, useEffect } from 'react';
import { Card, Table, Form, Button, Badge, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { getMembers, updateMember } from '../utils/memberService';
import { toast } from 'react-toastify';

const MinistryMemberAssignment = ({ ministryId, currentUser }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const membersList = await getMembers();
        setMembers(membersList);
      } catch (err) {
        console.error('Error fetching members:', err);
        setError('Failed to load members. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (ministryId) {
      fetchMembers();
    }
  }, [ministryId]);

  // Toggle member assignment to ministry
  const toggleMemberAssignment = async (memberId, isAssigned) => {
    try {
      setSaving(prev => ({ ...prev, [memberId]: true }));
      
      // Update the member's ministries array
      const member = members.find(m => m.id === memberId);
      const updatedMinistries = isAssigned
        ? (member.ministries || []).filter(id => id !== ministryId)
        : [...(member.ministries || []), ministryId];

      await updateMember(memberId, { ministries: updatedMinistries });
      
      // Update local state
      setMembers(members.map(member => 
        member.id === memberId 
          ? { ...member, ministries: updatedMinistries } 
          : member
      ));
      
      toast.success(`Member ${isAssigned ? 'removed from' : 'added to'} ministry successfully`);
    } catch (error) {
      console.error('Error updating member assignment:', error);
      toast.error(`Failed to update member assignment`);
    } finally {
      setSaving(prev => ({ ...prev, [memberId]: false }));
    }
  };

  // Filter members based on search term
  const filteredMembers = members.filter(member => 
    member.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading members...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white py-3">
        <h5 className="mb-0">Manage Members</h5>
        <p className="text-muted mb-0">Assign or remove members from this ministry</p>
      </Card.Header>
      <Card.Body>
        <div className="mb-4">
          <InputGroup>
            <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </div>

        <div className="table-responsive">
          <Table hover className="align-middle">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th className="text-center">Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length > 0 ? (
                filteredMembers.map(member => {
                  const isAssigned = member.ministries?.includes(ministryId) || false;
                  
                  return (
                    <tr key={member.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0 me-2">
                            {member.photoURL ? (
                              <img 
                                src={member.photoURL} 
                                alt={member.firstName} 
                                className="rounded-circle"
                                style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div 
                                className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white"
                                style={{ width: '36px', height: '36px' }}
                              >
                                {member.firstName?.[0]?.toUpperCase()}
                                {member.lastName?.[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="fw-semibold">
                              {member.firstName} {member.lastName}
                            </div>
                            <small className="text-muted">{member.membershipNumber}</small>
                          </div>
                        </div>
                      </td>
                      <td>{member.email || '-'}</td>
                      <td>{member.phone || '-'}</td>
                      <td className="text-center">
                        {isAssigned ? (
                          <Badge bg="success">Assigned</Badge>
                        ) : (
                          <Badge bg="secondary">Not Assigned</Badge>
                        )}
                      </td>
                      <td className="text-center">
                        <Button
                          variant={isAssigned ? 'outline-danger' : 'outline-primary'}
                          size="sm"
                          onClick={() => toggleMemberAssignment(member.id, isAssigned)}
                          disabled={saving[member.id]}
                        >
                          {saving[member.id] ? (
                            <>
                              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                              {isAssigned ? 'Removing...' : 'Adding...'}
                            </>
                          ) : isAssisted ? (
                            <><i className="bi bi-dash-circle me-1"></i> Remove</>
                          ) : (
                            <><i className="bi bi-plus-circle me-1"></i> Add to Ministry</>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    <div className="text-muted">
                      <i className="bi bi-people fs-1 d-block mb-2"></i>
                      No members found
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default MinistryMemberAssignment;
