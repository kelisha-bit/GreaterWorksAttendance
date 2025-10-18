import { useState, useEffect } from 'react';
import { X, Upload, Calendar, Clock, MapPin, Users, Tag, Eye, Repeat } from 'lucide-react';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const EventForm = ({ event, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(event?.imageUrl || '');
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // Basic Info
    title: event?.title || '',
    description: event?.description || '',
    eventType: event?.eventType || 'worship_service',
    category: event?.category || 'Regular Service',
    tags: event?.tags || [],
    
    // Date & Time
    startDate: event?.startDate ? format(event.startDate, 'yyyy-MM-dd') : '',
    endDate: event?.endDate ? format(event.endDate, 'yyyy-MM-dd') : '',
    startTime: event?.startTime || '09:00',
    endTime: event?.endTime || '11:00',
    timezone: event?.timezone || 'Africa/Lagos',
    allDay: event?.allDay || false,
    
    // Location
    location: event?.location || '',
    address: event?.address || '',
    
    // Registration
    registrationEnabled: event?.registrationEnabled || false,
    registrationDeadline: event?.registrationDeadline ? format(event.registrationDeadline, 'yyyy-MM-dd') : '',
    capacity: event?.capacity || '',
    requiresApproval: event?.requiresApproval || false,
    
    // Attendance
    attendanceEnabled: event?.attendanceEnabled || true,
    requireCheckIn: event?.requireCheckIn || false,
    allowLateCheckIn: event?.allowLateCheckIn || true,
    
    // Recurrence
    isRecurring: event?.isRecurring || false,
    recurrenceFrequency: event?.recurrence?.frequency || 'weekly',
    recurrenceInterval: event?.recurrence?.interval || 1,
    recurrenceDays: event?.recurrence?.daysOfWeek || [],
    recurrenceEndDate: event?.recurrence?.endDate || '',
    
    // Visibility
    visibility: event?.visibility || 'public',
    status: event?.status || 'published'
  });

  const eventTypes = [
    { value: 'worship_service', label: 'Worship Service' },
    { value: 'prayer_meeting', label: 'Prayer Meeting' },
    { value: 'bible_study', label: 'Bible Study' },
    { value: 'fellowship', label: 'Fellowship' },
    { value: 'conference', label: 'Conference' },
    { value: 'outreach', label: 'Outreach' },
    { value: 'training', label: 'Training' },
    { value: 'social', label: 'Social Event' },
    { value: 'celebration', label: 'Celebration' },
    { value: 'other', label: 'Other' }
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

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDayToggle = (day) => {
    setFormData(prev => {
      const days = prev.recurrenceDays.includes(day)
        ? prev.recurrenceDays.filter(d => d !== day)
        : [...prev.recurrenceDays, day];
      return { ...prev, recurrenceDays: days };
    });
  };

  const uploadImage = async () => {
    if (!imageFile) return event?.imageUrl || '';

    try {
      const storageRef = ref(storage, `events/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.startDate || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      // Upload image if new one selected
      const imageUrl = await uploadImage();

      // Prepare event data
      const eventData = {
        title: formData.title,
        description: formData.description,
        eventType: formData.eventType,
        category: formData.category,
        tags: formData.tags,
        
        startDate: Timestamp.fromDate(new Date(formData.startDate)),
        endDate: Timestamp.fromDate(new Date(formData.endDate || formData.startDate)),
        startTime: formData.startTime,
        endTime: formData.endTime,
        timezone: formData.timezone,
        allDay: formData.allDay,
        
        location: formData.location,
        address: formData.address,
        
        registrationEnabled: formData.registrationEnabled,
        registrationDeadline: formData.registrationDeadline 
          ? Timestamp.fromDate(new Date(formData.registrationDeadline))
          : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        requiresApproval: formData.requiresApproval,
        
        attendanceEnabled: formData.attendanceEnabled,
        requireCheckIn: formData.requireCheckIn,
        allowLateCheckIn: formData.allowLateCheckIn,
        
        isRecurring: formData.isRecurring,
        recurrence: formData.isRecurring ? {
          frequency: formData.recurrenceFrequency,
          interval: parseInt(formData.recurrenceInterval),
          daysOfWeek: formData.recurrenceDays,
          endDate: formData.recurrenceEndDate || null
        } : null,
        
        visibility: formData.visibility,
        status: formData.status,
        imageUrl: imageUrl,
        
        registeredCount: event?.registeredCount || 0,
        attendedCount: event?.attendedCount || 0,
        
        updatedAt: Timestamp.now()
      };

      if (event) {
        // Update existing event
        await updateDoc(doc(db, 'events', event.id), eventData);
        toast.success('Event updated successfully');
      } else {
        // Create new event
        eventData.createdBy = currentUser.uid;
        eventData.createdAt = Timestamp.now();
        await addDoc(collection(db, 'events'), eventData);
        toast.success('Event created successfully');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center">
        <Tag className="w-5 h-5 mr-2" />
        Basic Information
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Event Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Sunday Morning Service"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          placeholder="Describe the event..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
          <select
            name="eventType"
            value={formData.eventType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
          >
            {eventTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Event Image</label>
        <div className="mt-1 flex items-center space-x-4">
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
          )}
          <label className="cursor-pointer flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Upload className="w-5 h-5" />
            <span>Upload Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center">
        <Calendar className="w-5 h-5 mr-2" />
        Date & Time
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            min={formData.startDate}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="allDay"
          checked={formData.allDay}
          onChange={handleChange}
          className="rounded border-gray-300 text-church-gold focus:ring-church-gold"
        />
        <label className="text-sm text-gray-700">All Day Event</label>
      </div>

      {!formData.allDay && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
              required
            />
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <Repeat className="w-4 h-4 mr-2" />
          Recurring Event
        </h4>
        <div className="flex items-center space-x-2 mb-3">
          <input
            type="checkbox"
            name="isRecurring"
            checked={formData.isRecurring}
            onChange={handleChange}
            className="rounded border-gray-300 text-church-gold focus:ring-church-gold"
          />
          <label className="text-sm text-gray-700">This is a recurring event</label>
        </div>

        {formData.isRecurring && (
          <div className="space-y-3 pl-6 border-l-2 border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select
                name="recurrenceFrequency"
                value={formData.recurrenceFrequency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {formData.recurrenceFrequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Repeat On</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleDayToggle(day.value)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        formData.recurrenceDays.includes(day.value)
                          ? 'bg-church-gold text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.label.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
              <input
                type="date"
                name="recurrenceEndDate"
                value={formData.recurrenceEndDate}
                onChange={handleChange}
                min={formData.startDate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center">
        <MapPin className="w-5 h-5 mr-2" />
        Location & Details
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="e.g., Main Sanctuary"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Street address, city, country"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
        />
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <Users className="w-4 h-4 mr-2" />
          Registration Settings
        </h4>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="registrationEnabled"
              checked={formData.registrationEnabled}
              onChange={handleChange}
              className="rounded border-gray-300 text-church-gold focus:ring-church-gold"
            />
            <label className="text-sm text-gray-700">Enable registration for this event</label>
          </div>

          {formData.registrationEnabled && (
            <div className="space-y-3 pl-6 border-l-2 border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    placeholder="Unlimited"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
                  <input
                    type="date"
                    name="registrationDeadline"
                    value={formData.registrationDeadline}
                    onChange={handleChange}
                    max={formData.startDate}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="requiresApproval"
                  checked={formData.requiresApproval}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-church-gold focus:ring-church-gold"
                />
                <label className="text-sm text-gray-700">Require approval for registration</label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Attendance Settings</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="attendanceEnabled"
              checked={formData.attendanceEnabled}
              onChange={handleChange}
              className="rounded border-gray-300 text-church-gold focus:ring-church-gold"
            />
            <label className="text-sm text-gray-700">Track attendance for this event</label>
          </div>

          {formData.attendanceEnabled && (
            <>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="requireCheckIn"
                  checked={formData.requireCheckIn}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-church-gold focus:ring-church-gold"
                />
                <label className="text-sm text-gray-700">Require check-in</label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="allowLateCheckIn"
                  checked={formData.allowLateCheckIn}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-church-gold focus:ring-church-gold"
                />
                <label className="text-sm text-gray-700">Allow late check-in</label>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center">
        <Eye className="w-5 h-5 mr-2" />
        Visibility & Status
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
        <select
          name="visibility"
          value={formData.visibility}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
        >
          <option value="public">Public - Visible to everyone</option>
          <option value="members">Members Only - Requires login</option>
          <option value="private">Private - Invitation only</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
        >
          <option value="draft">Draft - Not visible</option>
          <option value="published">Published - Visible to selected audience</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <h4 className="font-semibold text-blue-900 mb-2">Event Summary</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <p><strong>Title:</strong> {formData.title || 'Not set'}</p>
          <p><strong>Date:</strong> {formData.startDate || 'Not set'}</p>
          <p><strong>Time:</strong> {formData.startTime} - {formData.endTime}</p>
          <p><strong>Location:</strong> {formData.location || 'Not set'}</p>
          <p><strong>Type:</strong> {eventTypes.find(t => t.value === formData.eventType)?.label}</p>
          <p><strong>Registration:</strong> {formData.registrationEnabled ? 'Enabled' : 'Disabled'}</p>
          <p><strong>Recurring:</strong> {formData.isRecurring ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className="flex items-center flex-1">
                <button
                  onClick={() => setCurrentStep(step)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep === step
                      ? 'bg-church-gold text-white'
                      : currentStep > step
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </button>
                {step < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 pb-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2 bg-church-gold text-white rounded-lg hover:bg-church-darkGold"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-church-gold text-white rounded-lg hover:bg-church-darkGold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
