import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';
import { FaPaperPlane, FaUserCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const MinistryChat = ({ ministryId, ministryName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const messagesEndRef = useRef(null);
  const messageLimit = 50;

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!ministryId) return;

    setLoading(true);
    const messagesRef = collection(db, 'ministries', ministryId, 'messages');
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(messageLimit)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse(); // Reverse to show oldest first
      
      setMessages(messageData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages. Please try again later.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [ministryId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      const messagesRef = collection(db, 'ministries', ministryId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Anonymous',
        senderEmail: currentUser.email,
        timestamp: serverTimestamp()
      });
      
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  return (
    <Card className="ministry-chat h-100">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">{ministryName} Chat</h5>
          <small className="text-muted">Communication channel for ministry members</small>
        </div>
        <Badge bg="info">{messages.length} messages</Badge>
      </Card.Header>
      
      <Card.Body className="p-0">
        <div className="chat-messages p-3" style={{ height: '400px', overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center my-5 text-muted">
              <p>No messages yet. Be the first to start the conversation!</p>
            </div>
          ) : (
            <ListGroup variant="flush">
              {messages.map((message) => (
                <ListGroup.Item 
                  key={message.id}
                  className={`border-0 ${message.senderId === currentUser.uid ? 'text-end' : ''}`}
                >
                  <div className={`d-inline-block message-bubble p-2 rounded ${
                    message.senderId === currentUser.uid 
                      ? 'bg-primary text-white' 
                      : 'bg-light'
                  }`} style={{ maxWidth: '80%' }}>
                    {message.senderId !== currentUser.uid && (
                      <div className="sender-info mb-1 d-flex align-items-center">
                        <FaUserCircle className="me-1" />
                        <small className="fw-bold">{message.senderName}</small>
                      </div>
                    )}
                    <p className="mb-1">{message.text}</p>
                    <small className={`d-block ${message.senderId === currentUser.uid ? 'text-white-50' : 'text-muted'}`}>
                      {message.timestamp ? formatDistanceToNow(message.timestamp.toDate(), { addSuffix: true }) : 'Sending...'}
                    </small>
                  </div>
                </ListGroup.Item>
              ))}
              <div ref={messagesEndRef} />
            </ListGroup>
          )}
        </div>
      </Card.Body>
      
      <Card.Footer className="bg-white">
        <Form onSubmit={handleSubmit}>
          <div className="d-flex">
            <Form.Control
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={loading}
            />
            <Button 
              variant="primary" 
              type="submit" 
              className="ms-2"
              disabled={!newMessage.trim() || loading}
            >
              <FaPaperPlane />
            </Button>
          </div>
        </Form>
      </Card.Footer>
    </Card>
  );
};

export default MinistryChat;