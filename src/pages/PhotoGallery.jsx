import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  where,
  getDocs
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Image as ImageIcon, 
  Upload, 
  X, 
  Calendar, 
  Tag, 
  Search,
  Filter,
  Grid3x3,
  List,
  Trash2,
  Edit2,
  Eye,
  Download,
  Users,
  MapPin,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const PhotoGallery = () => {
  const { userRole } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterYear, setFilterYear] = useState('all');

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'event',
    eventDate: '',
    location: '',
    tags: '',
    files: []
  });

  const categories = [
    { value: 'event', label: 'Church Event', icon: Calendar },
    { value: 'service', label: 'Church Service', icon: Users },
    { value: 'member', label: 'Member Photo', icon: Users },
    { value: 'baptism', label: 'Baptism', icon: Users },
    { value: 'wedding', label: 'Wedding', icon: Users },
    { value: 'outreach', label: 'Outreach', icon: MapPin },
    { value: 'youth', label: 'Youth Ministry', icon: Users },
    { value: 'other', label: 'Other', icon: ImageIcon }
  ];

  // Fetch photos
  useEffect(() => {
    const q = query(
      collection(db, 'photo_gallery'),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const photosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPhotos(photosData);
      setFilteredPhotos(photosData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching photos:', error);
      toast.error('Failed to load photos');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter photos
  useEffect(() => {
    let filtered = photos;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(photo => 
        photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(photo => photo.category === filterCategory);
    }

    // Filter by year
    if (filterYear !== 'all') {
      filtered = filtered.filter(photo => {
        const photoYear = new Date(photo.eventDate || photo.uploadedAt).getFullYear().toString();
        return photoYear === filterYear;
      });
    }

    setFilteredPhotos(filtered);
  }, [searchTerm, filterCategory, filterYear, photos]);

  // Get unique years from photos
  const getAvailableYears = () => {
    const years = new Set();
    photos.forEach(photo => {
      const year = new Date(photo.eventDate || photo.uploadedAt).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isUnder10MB = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isImage) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (!isUnder10MB) {
        toast.error(`${file.name} is larger than 10MB`);
        return false;
      }
      return true;
    });

    setUploadForm(prev => ({
      ...prev,
      files: [...prev.files, ...validFiles]
    }));
  };

  // Remove file from upload queue
  const removeFile = (index) => {
    setUploadForm(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  // Upload photos
  const handleUpload = async (e) => {
    e.preventDefault();

    if (uploadForm.files.length === 0) {
      toast.error('Please select at least one photo');
      return;
    }

    if (!uploadForm.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = uploadForm.files.map(async (file) => {
        // Create unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}_${file.name}`;
        const storageRef = ref(storage, `gallery/${uploadForm.category}/${filename}`);

        // Upload file
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        // Create photo document
        const photoData = {
          title: uploadForm.title,
          description: uploadForm.description || '',
          category: uploadForm.category,
          eventDate: uploadForm.eventDate || new Date().toISOString().split('T')[0],
          location: uploadForm.location || '',
          tags: uploadForm.tags ? uploadForm.tags.split(',').map(tag => tag.trim()) : [],
          imageUrl: downloadURL,
          storagePath: `gallery/${uploadForm.category}/${filename}`,
          filename: file.name,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          uploadedBy: userRole
        };

        await addDoc(collection(db, 'photo_gallery'), photoData);
      });

      await Promise.all(uploadPromises);

      toast.success(`${uploadForm.files.length} photo(s) uploaded successfully!`);
      
      // Reset form
      setUploadForm({
        title: '',
        description: '',
        category: 'event',
        eventDate: '',
        location: '',
        tags: '',
        files: []
      });
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  // Delete photo
  const handleDelete = async (photo) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      // Delete from storage
      const storageRef = ref(storage, photo.storagePath);
      await deleteObject(storageRef);

      // Delete from Firestore
      await deleteDoc(doc(db, 'photo_gallery', photo.id));

      toast.success('Photo deleted successfully');
      setShowPhotoModal(false);
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    }
  };

  // Download photo
  const handleDownload = async (photo) => {
    try {
      const response = await fetch(photo.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.filename || 'photo.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Photo downloaded');
    } catch (error) {
      console.error('Error downloading photo:', error);
      toast.error('Failed to download photo');
    }
  };

  // View photo details
  const viewPhoto = (photo) => {
    setSelectedPhoto(photo);
    setShowPhotoModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-church-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Photo Gallery</h1>
          <p className="text-gray-600 mt-1">Church events and member photos</p>
        </div>
        {(userRole === 'admin' || userRole === 'leader') && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-church-gold text-white rounded-lg hover:bg-church-darkGold transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Photos</span>
          </button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search photos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
            >
              <option value="all">All Years</option>
              {getAvailableYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''} found
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-church-lightGold text-church-darkGold' : 'bg-gray-100 text-gray-600'}`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-church-lightGold text-church-darkGold' : 'bg-gray-100 text-gray-600'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Photos Display */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No photos found</h3>
          <p className="text-gray-600">
            {searchTerm || filterCategory !== 'all' || filterYear !== 'all'
              ? 'Try adjusting your filters'
              : 'Upload your first photo to get started'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer animate-grid-item ${
                index < 20 ? `stagger-${index + 1}` : 'stagger-max'
              }`}
              onClick={() => viewPhoto(photo)}
            >
              <div className="aspect-square relative">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
                    {categories.find(c => c.value === photo.category)?.label}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 truncate">{photo.title}</h3>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(photo.eventDate).toLocaleDateString()}
                </div>
                {photo.location && (
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {photo.location}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm divide-y">
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer flex items-center space-x-4 animate-fade-in-up ${
                index < 20 ? `stagger-${index + 1}` : 'stagger-max'
              }`}
              onClick={() => viewPhoto(photo)}
            >
              <img
                src={photo.imageUrl}
                alt={photo.title}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{photo.title}</h3>
                <p className="text-sm text-gray-600 truncate">{photo.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Tag className="w-3 h-3 mr-1" />
                    {categories.find(c => c.value === photo.category)?.label}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(photo.eventDate).toLocaleDateString()}
                  </span>
                  {photo.location && (
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {photo.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Upload Photos</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
                  placeholder="e.g., Easter Sunday Service 2024"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
                  placeholder="Add details about this event or photo..."
                />
              </div>

              {/* Category and Event Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={uploadForm.eventDate}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, eventDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={uploadForm.location}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
                  placeholder="e.g., Main Sanctuary, Accra"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-church-gold focus:border-transparent"
                  placeholder="e.g., worship, praise, youth"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photos * (Max 10MB each)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-church-gold transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-church-gold hover:text-church-darkGold">
                        <span>Upload files</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>

              {/* Selected Files */}
              {uploadForm.files.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Selected Files ({uploadForm.files.length})
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {uploadForm.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || uploadForm.files.length === 0}
                  className="flex-1 px-4 py-2 bg-church-gold text-white rounded-lg hover:bg-church-darkGold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : `Upload ${uploadForm.files.length} Photo${uploadForm.files.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Detail Modal */}
      {showPhotoModal && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">{selectedPhoto.title}</h2>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-white hover:text-gray-300"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Image */}
              <div className="lg:col-span-2">
                <img
                  src={selectedPhoto.imageUrl}
                  alt={selectedPhoto.title}
                  className="w-full rounded-lg"
                />
              </div>

              {/* Details */}
              <div className="bg-white rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1 text-gray-900">{selectedPhoto.description || 'No description'}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Category</h3>
                  <p className="mt-1 text-gray-900">
                    {categories.find(c => c.value === selectedPhoto.category)?.label}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Event Date</h3>
                  <p className="mt-1 text-gray-900">
                    {new Date(selectedPhoto.eventDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {selectedPhoto.location && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Location</h3>
                    <p className="mt-1 text-gray-900">{selectedPhoto.location}</p>
                  </div>
                )}

                {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedPhoto.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-church-lightGold text-church-darkGold text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Uploaded</h3>
                  <p className="mt-1 text-gray-900 text-sm">
                    {new Date(selectedPhoto.uploadedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-4 space-y-2">
                  <button
                    onClick={() => handleDownload(selectedPhoto)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-church-gold text-white rounded-lg hover:bg-church-darkGold"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>

                  {(userRole === 'admin' || userRole === 'leader') && (
                    <button
                      onClick={() => handleDelete(selectedPhoto)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
