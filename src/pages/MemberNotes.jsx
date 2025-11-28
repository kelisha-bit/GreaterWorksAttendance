import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useRealtimeMemberData, useRealtimeNotes } from '../hooks/useRealtimeMemberData';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Heart,
  MessageSquare,
  Phone,
  Mail,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const MemberNotes = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { currentUser, isLeader } = useAuth();
  const { member, loading: memberLoading, error: memberError } = useRealtimeMemberData(memberId);
  const { notes, loading: notesLoading } = useRealtimeNotes(memberId);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const loading = memberLoading || notesLoading;

  const noteCategories = [
    { value: 'pastoral', label: 'Pastoral Care', color: 'blue' },
    { value: 'prayer', label: 'Prayer Request', color: 'purple' },
    { value: 'counseling', label: 'Counseling', color: 'green' },
    { value: 'followup', label: 'Follow-up', color: 'orange' },
    { value: 'celebration', label: 'Celebration', color: 'pink' },
    { value: 'concern', label: 'Concern', color: 'red' },
    { value: 'general', label: 'General', color: 'gray' }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'gray' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'high', label: 'High', color: 'red' },
    { value: 'urgent', label: 'Urgent', color: 'red' }
  ];

  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    category: 'pastoral',
    priority: 'medium',
    followUpRequired: false,
    followUpDate: '',
    isConfidential: false
  });

  useEffect(() => {
    if (memberError) {
      toast.error(memberError);
      if (memberError === 'Member not found') {
        navigate('/members');
      }
    }
  }, [memberError, navigate]);

  useEffect(() => {
    filterNotes();
  }, [notes, searchTerm, filterCategory, filterStatus]);

  const filterNotes = () => {
    let filtered = [...notes];

    if (searchTerm) {
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(note => note.category === filterCategory);
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'followup') {
        filtered = filtered.filter(note => note.followUpRequired && !note.followUpCompleted);
      } else if (filterStatus === 'completed') {
        filtered = filtered.filter(note => note.followUpCompleted);
      }
    }

    return filtered;
  };

  const handleSubmitNote = async (e) => {
    e.preventDefault();
    
    if (!noteForm.title.trim() || !noteForm.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const noteData = {
        memberId: member.id,
        memberName: member.fullName,
        title: noteForm.title.trim(),
        content: noteForm.content.trim(),
        category: noteForm.category,
        priority: noteForm.priority,
        followUpRequired: noteForm.followUpRequired,
        followUpDate: noteForm.followUpDate || null,
        followUpCompleted: false,
        isConfidential: noteForm.isConfidential,
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || currentUser.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (editingNote) {
        await updateDoc(doc(db, 'member_notes', editingNote.id), {
          ...noteData,
          updatedAt: serverTimestamp()
        });
        toast.success('Note updated successfully');
      } else {
        await addDoc(collection(db, 'member_notes'), noteData);
        toast.success('Note added successfully');
      }

      // Reset form
      setNoteForm({
        title: '',
        content: '',
        category: 'pastoral',
        priority: 'medium',
        followUpRequired: false,
        followUpDate: '',
        isConfidential: false
      });
      setShowAddModal(false);
      setEditingNote(null);
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title,
      content: note.content,
      category: note.category,
      priority: note.priority,
      followUpRequired: note.followUpRequired || false,
      followUpDate: note.followUpDate || '',
      isConfidential: note.isConfidential || false
    });
    setShowAddModal(true);
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteDoc(doc(db, 'member_notes', noteId));
      toast.success('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const handleCompleteFollowUp = async (noteId) => {
    try {
      await updateDoc(doc(db, 'member_notes', noteId), {
        followUpCompleted: true,
        completedAt: serverTimestamp(),
        completedBy: currentUser.uid,
        completedByName: currentUser.displayName || currentUser.email
      });
      toast.success('Follow-up marked as completed');
    } catch (error) {
      console.error('Error updating follow-up:', error);
      toast.error('Failed to update follow-up');
    }
  };

  const exportNotesReport = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(212, 175, 55);
    doc.text('Greater Works City Church', 14, 20);
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Member Notes Report', 14, 28);
    
    // Member Info
    doc.setFontSize(12);
    doc.text(`Name: ${member.fullName}`, 14, 40);
    doc.text(`Member ID: ${member.memberId}`, 14, 47);
    doc.text(`Department: ${member.department}`, 14, 54);
    
    // Notes Summary
    const filteredNotes = filterNotes();
    doc.setFontSize(14);
    doc.text('Notes Summary', 14, 68);
    doc.setFontSize(10);
    doc.text(`Total Notes: ${filteredNotes.length}`, 14, 76);
    doc.text(`Follow-ups Required: ${filteredNotes.filter(n => n.followUpRequired && !n.followUpCompleted).length}`, 14, 83);
    doc.text(`Confidential Notes: ${filteredNotes.filter(n => n.isConfidential).length}`, 14, 90);
    
    // Notes Table
    const tableData = filteredNotes.slice(0, 20).map(note => [
      format(note.createdAt?.toDate(), 'MMM dd, yyyy'),
      note.title,
      noteCategories.find(c => c.value === note.category)?.label || note.category,
      note.priority,
      note.followUpRequired ? (note.followUpCompleted ? 'Completed' : 'Pending') : 'No',
      note.isConfidential ? 'Yes' : 'No'
    ]);
    
    doc.autoTable({
      startY: 100,
      head: [['Date', 'Title', 'Category', 'Priority', 'Follow-up', 'Confidential']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [212, 175, 55] }
    });
    
    doc.save(`${member.fullName}_Notes_Report.pdf`);
    toast.success('Notes report exported successfully');
  };

  const getCategoryColor = (category) => {
    const cat = noteCategories.find(c => c.value === category);
    return cat ? cat.color : 'gray';
  };

  const getPriorityColor = (priority) => {
    const pri = priorityLevels.find(p => p.value === priority);
    return pri ? pri.color : 'gray';
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

  const filteredNotes = filterNotes();

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
            onClick={exportNotesReport}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          {isLeader && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Note</span>
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <button onClick={() => navigate('/members')} className="hover:text-gray-900">Members</button>
        <span>/</span>
        <button onClick={() => navigate(`/members/${memberId}`)} className="hover:text-gray-900">{member.fullName}</button>
        <span>/</span>
        <span className="text-gray-900 font-medium">Notes</span>
      </div>

      {/* Member Info Header */}
      <div className="card bg-gradient-to-r from-indigo-600 to-indigo-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{member.fullName}</h1>
            <p className="text-white opacity-90">{member.department} • {member.memberId}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{filteredNotes.length}</p>
            <p className="text-white opacity-90">Total Notes</p>
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
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">All Categories</option>
            {noteCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">All Status</option>
            <option value="followup">Follow-up Required</option>
            <option value="completed">Completed Follow-ups</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold">Total Notes</p>
              <p className="text-2xl font-bold text-blue-900">{filteredNotes.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-semibold">Follow-ups</p>
              <p className="text-2xl font-bold text-orange-900">
                {filteredNotes.filter(n => n.followUpRequired && !n.followUpCompleted).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold">Completed</p>
              <p className="text-2xl font-bold text-green-900">
                {filteredNotes.filter(n => n.followUpCompleted).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-semibold">Confidential</p>
              <p className="text-2xl font-bold text-red-900">
                {filteredNotes.filter(n => n.isConfidential).length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <MessageSquare className="w-6 h-6 mr-2 text-church-gold" />
          Pastoral Care Notes
        </h2>
        
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No notes found</p>
            {isLeader && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary mt-4"
              >
                Add First Note
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotes.map((note) => (
              <div key={note.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{note.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full bg-${getCategoryColor(note.category)}-100 text-${getCategoryColor(note.category)}-800`}>
                        {noteCategories.find(c => c.value === note.category)?.label || note.category}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full bg-${getPriorityColor(note.priority)}-100 text-${getPriorityColor(note.priority)}-800`}>
                        {note.priority}
                      </span>
                      {note.isConfidential && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          Confidential
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">{note.content}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{note.createdByName}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(note.createdAt?.toDate(), 'MMM dd, yyyy')}</span>
                        </span>
                      </div>
                      
                      {note.followUpRequired && (
                        <div className="flex items-center space-x-2">
                          {note.followUpCompleted ? (
                            <span className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 text-orange-600">
                              <Clock className="w-4 h-4" />
                              <span>Pending</span>
                            </span>
                          )}
                          {note.followUpDate && (
                            <span className="text-xs">
                              Due: {format(new Date(note.followUpDate), 'MMM dd')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isLeader && (
                    <div className="flex items-center space-x-2 ml-4">
                      {note.followUpRequired && !note.followUpCompleted && (
                        <button
                          onClick={() => handleCompleteFollowUp(note.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Mark as completed"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditNote(note)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit note"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete note"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingNote ? 'Edit Note' : 'Add New Note'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingNote(null);
                    setNoteForm({
                      title: '',
                      content: '',
                      category: 'pastoral',
                      priority: 'medium',
                      followUpRequired: false,
                      followUpDate: '',
                      isConfidential: false
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitNote} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({...noteForm, title: e.target.value})}
                    className="input-field"
                    placeholder="Enter note title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content *
                  </label>
                  <textarea
                    value={noteForm.content}
                    onChange={(e) => setNoteForm({...noteForm, content: e.target.value})}
                    className="input-field"
                    rows={4}
                    placeholder="Enter note content"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={noteForm.category}
                      onChange={(e) => setNoteForm({...noteForm, category: e.target.value})}
                      className="input-field"
                    >
                      {noteCategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={noteForm.priority}
                      onChange={(e) => setNoteForm({...noteForm, priority: e.target.value})}
                      className="input-field"
                    >
                      {priorityLevels.map(pri => (
                        <option key={pri.value} value={pri.value}>{pri.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={noteForm.followUpRequired}
                      onChange={(e) => setNoteForm({...noteForm, followUpRequired: e.target.checked})}
                      className="rounded border-gray-300 text-church-gold focus:ring-church-gold"
                    />
                    <span className="text-sm text-gray-700">Follow-up required</span>
                  </label>

                  {noteForm.followUpRequired && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Follow-up Date
                      </label>
                      <input
                        type="date"
                        value={noteForm.followUpDate}
                        onChange={(e) => setNoteForm({...noteForm, followUpDate: e.target.value})}
                        className="input-field"
                      />
                    </div>
                  )}

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={noteForm.isConfidential}
                      onChange={(e) => setNoteForm({...noteForm, isConfidential: e.target.checked})}
                      className="rounded border-gray-300 text-church-gold focus:ring-church-gold"
                    />
                    <span className="text-sm text-gray-700">Mark as confidential</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingNote(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingNote ? 'Update Note' : 'Add Note'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberNotes;
