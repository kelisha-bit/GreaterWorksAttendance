import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

const MemberImport = () => {
  const navigate = useNavigate();
  const { isLeader } = useAuth();
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // Check if user is a leader
  if (!isLeader) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <p className="text-lg text-gray-600">You don't have permission to import members.</p>
        <button onClick={() => navigate('/members')} className="btn-primary mt-4">
          Go to Members
        </button>
      </div>
    );
  }

  const generateMemberId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `GW${timestamp}${random}`;
  };

  const generateTitheEnvelopeNumber = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `TE${year}${random}`;
  };

  const downloadTemplate = () => {
    const headers = [
      'Full Name*',
      'Gender*',
      'Phone Number*',
      'Email',
      'Department*',
      'Membership Type*',
      'Membership Status',
      'Date of Birth',
      'Date Joined',
      'Salvation Date',
      'Wedding Anniversary',
      'Marital Status',
      'Occupation',
      'Address',
      'City',
      'Home Cell',
      'Baptism Status',
      'Baptism Date',
      'Previous Church',
      'Skills',
      'Ministry Interests',
      'Emergency Contact Name',
      'Emergency Contact Phone',
      'Notes'
    ];

    const sampleRow = [
      'John Mensah',
      'Male',
      '0241234567',
      'john@example.com',
      'Choir',
      'Adult',
      'Active',
      '1990-05-20',
      '2025-01-15',
      '2010-03-15',
      '2015-08-10',
      'Married',
      'Teacher',
      '123 Independence Ave',
      'Accra',
      'East Legon Cell',
      'Water Baptized',
      '2010-06-20',
      'Victory Chapel',
      'Singing, Teaching',
      'Choir, Youth Ministry',
      'Jane Mensah',
      '0249876543',
      'Interested in leading worship'
    ];

    const csvContent = [
      headers.join(','),
      sampleRow.map(cell => `"${cell}"`).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'member_import_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully');
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index].replace(/^"|"$/g, '');
        });
        data.push(row);
      }
    }

    return data;
  };

  const validateMember = (member) => {
    const errors = [];
    
    // Required fields
    if (!member['Full Name*'] || !member['Full Name*'].trim()) {
      errors.push('Full Name is required');
    }
    if (!member['Gender*'] || !['Male', 'Female'].includes(member['Gender*'])) {
      errors.push('Gender must be Male or Female');
    }
    if (!member['Phone Number*'] || !member['Phone Number*'].trim()) {
      errors.push('Phone Number is required');
    }
    if (!member['Department*'] || !member['Department*'].trim()) {
      errors.push('Department is required');
    }
    if (!member['Membership Type*'] || !member['Membership Type*'].trim()) {
      errors.push('Membership Type is required');
    }

    return errors;
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    
    // Read and preview file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const data = parseCSV(text);
        setPreviewData(data.slice(0, 5)); // Show first 5 rows
        setShowPreview(true);
        toast.success(`File loaded: ${data.length} members found`);
      } catch (error) {
        toast.error('Error reading file: ' + error.message);
        setFile(null);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const data = parseCSV(text);

        const importResults = {
          total: data.length,
          successful: 0,
          failed: 0,
          errors: []
        };

        // Check for existing phone numbers to avoid duplicates
        const existingMembersQuery = await getDocs(collection(db, 'members'));
        const existingPhones = new Set(
          existingMembersQuery.docs.map(doc => doc.data().phoneNumber)
        );

        for (let i = 0; i < data.length; i++) {
          const member = data[i];
          const rowNumber = i + 2; // +2 because of header and 0-index

          // Validate member
          const validationErrors = validateMember(member);
          if (validationErrors.length > 0) {
            importResults.failed++;
            importResults.errors.push({
              row: rowNumber,
              name: member['Full Name*'] || 'Unknown',
              errors: validationErrors
            });
            continue;
          }

          // Check for duplicate phone number
          if (existingPhones.has(member['Phone Number*'])) {
            importResults.failed++;
            importResults.errors.push({
              row: rowNumber,
              name: member['Full Name*'],
              errors: ['Phone number already exists']
            });
            continue;
          }

          try {
            // Prepare member data
            const memberData = {
              fullName: member['Full Name*'],
              gender: member['Gender*'],
              phoneNumber: member['Phone Number*'],
              email: member['Email'] || '',
              department: member['Department*'],
              membershipType: member['Membership Type*'],
              membershipStatus: member['Membership Status'] || 'Active',
              dateOfBirth: member['Date of Birth'] || '',
              dateJoined: member['Date Joined'] || new Date().toISOString().split('T')[0],
              salvationDate: member['Salvation Date'] || '',
              weddingAnniversary: member['Wedding Anniversary'] || '',
              maritalStatus: member['Marital Status'] || '',
              occupation: member['Occupation'] || '',
              address: member['Address'] || '',
              city: member['City'] || '',
              homeCell: member['Home Cell'] || '',
              baptismStatus: member['Baptism Status'] || '',
              baptismDate: member['Baptism Date'] || '',
              previousChurch: member['Previous Church'] || '',
              skills: member['Skills'] || '',
              ministryInterests: member['Ministry Interests'] || '',
              emergencyContactName: member['Emergency Contact Name'] || '',
              emergencyContactPhone: member['Emergency Contact Phone'] || '',
              notes: member['Notes'] || '',
              memberId: generateMemberId(),
              titheEnvelopeNumber: generateTitheEnvelopeNumber(),
              profilePhotoURL: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            // Add to Firestore
            await addDoc(collection(db, 'members'), memberData);
            existingPhones.add(member['Phone Number*']); // Add to set to prevent duplicates in same import
            importResults.successful++;
          } catch (error) {
            importResults.failed++;
            importResults.errors.push({
              row: rowNumber,
              name: member['Full Name*'],
              errors: [error.message]
            });
          }
        }

        setResults(importResults);
        toast.success(`Import complete: ${importResults.successful} successful, ${importResults.failed} failed`);
      } catch (error) {
        toast.error('Error importing members: ' + error.message);
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/members')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Members</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Import Members</h1>
            <p className="text-sm text-gray-600">Bulk import members from CSV file</p>
          </div>
        </div>
      </div>

      {/* Instructions Card */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Import Instructions</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Download the CSV template below</li>
              <li>Fill in member information (required fields marked with *)</li>
              <li>Save the file as CSV format</li>
              <li>Upload the file and preview the data</li>
              <li>Click "Import Members" to add them to the database</li>
            </ol>
            <p className="mt-2 text-sm text-blue-700">
              <strong>Note:</strong> Duplicate phone numbers will be skipped automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Download Template */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Download Template</h2>
        <p className="text-gray-600 mb-4">
          Download the CSV template with all required and optional fields. The template includes a sample row to guide you.
        </p>
        <button
          onClick={downloadTemplate}
          className="btn-primary flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Download CSV Template</span>
        </button>
      </div>

      {/* Upload File */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Upload CSV File</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-church-gold transition-colors">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">
            {file ? `Selected: ${file.name}` : 'Select a CSV file to import'}
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="btn-secondary cursor-pointer inline-block">
            <FileText className="w-4 h-4 inline mr-2" />
            Choose File
          </label>
        </div>
      </div>

      {/* Preview Data */}
      {showPreview && previewData.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Step 3: Preview Data (First 5 rows)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Full Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Gender</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Phone</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Department</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900">{row['Full Name*']}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{row['Gender*']}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{row['Phone Number*']}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{row['Department*']}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{row['Membership Type*']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <button
              onClick={handleImport}
              disabled={importing}
              className="btn-primary flex items-center space-x-2"
            >
              {importing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  <span>Import Members</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Results</h2>
          
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-semibold">Total Processed</p>
              <p className="text-3xl font-bold text-blue-900">{results.total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-semibold">Successful</p>
                  <p className="text-3xl font-bold text-green-900">{results.successful}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600 opacity-50" />
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-semibold">Failed</p>
                  <p className="text-3xl font-bold text-red-900">{results.failed}</p>
                </div>
                <XCircle className="w-10 h-10 text-red-600 opacity-50" />
              </div>
            </div>
          </div>

          {/* Errors */}
          {results.errors.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Errors ({results.errors.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.errors.map((error, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="font-medium text-red-900">
                      Row {error.row}: {error.name}
                    </p>
                    <ul className="list-disc list-inside text-sm text-red-700 mt-1">
                      {error.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex space-x-3">
            <button
              onClick={() => navigate('/members')}
              className="btn-primary"
            >
              View Members
            </button>
            <button
              onClick={() => {
                setFile(null);
                setResults(null);
                setPreviewData([]);
                setShowPreview(false);
              }}
              className="btn-secondary"
            >
              Import More
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberImport;
