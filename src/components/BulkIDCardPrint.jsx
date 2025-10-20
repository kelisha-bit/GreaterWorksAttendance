import { useState } from 'react';
import { X, Printer, Users, Filter } from 'lucide-react';
import MemberIDCard from './MemberIDCard';
import '../styles/idcard.css';
import toast from 'react-hot-toast';

const BulkIDCardPrint = ({ members, onClose }) => {
  const [selectedMembers, setSelectedMembers] = useState(members.map(m => m.id));
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [printBothSides, setPrintBothSides] = useState(false);

  const departments = [...new Set(members.map(m => m.department))].sort();
  const membershipTypes = [...new Set(members.map(m => m.membershipType))].sort();

  const filteredMembers = members.filter(member => {
    if (filterDepartment !== 'all' && member.department !== filterDepartment) {
      return false;
    }
    if (filterType !== 'all' && member.membershipType !== filterType) {
      return false;
    }
    return selectedMembers.includes(member.id);
  });

  const toggleMember = (memberId) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const toggleAll = () => {
    const currentFiltered = members.filter(member => {
      if (filterDepartment !== 'all' && member.department !== filterDepartment) {
        return false;
      }
      if (filterType !== 'all' && member.membershipType !== filterType) {
        return false;
      }
      return true;
    });

    const allSelected = currentFiltered.every(m => selectedMembers.includes(m.id));
    
    if (allSelected) {
      setSelectedMembers(prev => prev.filter(id => !currentFiltered.find(m => m.id === id)));
    } else {
      setSelectedMembers(prev => [...new Set([...prev, ...currentFiltered.map(m => m.id)])]);
    }
  };

  const handlePrint = () => {
    if (filteredMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast.error('Please allow pop-ups to print ID cards');
      return;
    }

    // Generate HTML for all selected cards
    const cardsHTML = filteredMembers.map(member => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generateCardHTML(member, printBothSides);
      return tempDiv.innerHTML;
    }).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bulk Member ID Cards</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              padding: 0;
              margin: 0;
            }

            @page {
              size: 3.375in 2.125in;
              margin: 0;
            }

            ${getIDCardStyles()}
          </style>
        </head>
        <body>
          ${cardsHTML}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 500);
    };

    toast.success(`Printing ${filteredMembers.length} ID card(s)`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bulk Print ID Cards</h2>
            <p className="text-sm text-gray-600">
              {filteredMembers.length} of {members.length} members selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters and Options */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Filter className="w-4 h-4 inline mr-1" />
                Department
              </label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="input-field"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Users className="w-4 h-4 inline mr-1" />
                Membership Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field"
              >
                <option value="all">All Types</option>
                {membershipTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Print Options
              </label>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="bulk-print-both"
                  checked={printBothSides}
                  onChange={(e) => setPrintBothSides(e.target.checked)}
                  className="w-4 h-4 text-church-gold focus:ring-church-gold border-gray-300 rounded"
                />
                <label htmlFor="bulk-print-both" className="text-sm text-gray-700 cursor-pointer">
                  Print both sides
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={toggleAll}
              className="text-sm text-church-gold hover:text-church-darkGold font-medium"
            >
              {members.filter(m => {
                if (filterDepartment !== 'all' && m.department !== filterDepartment) return false;
                if (filterType !== 'all' && m.membershipType !== filterType) return false;
                return true;
              }).every(m => selectedMembers.includes(m.id))
                ? 'Deselect All'
                : 'Select All'}
            </button>
            <span className="text-sm text-gray-600">
              {filteredMembers.length} card{filteredMembers.length !== 1 ? 's' : ''} will be printed
            </span>
          </div>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {members
              .filter(member => {
                if (filterDepartment !== 'all' && member.department !== filterDepartment) {
                  return false;
                }
                if (filterType !== 'all' && member.membershipType !== filterType) {
                  return false;
                }
                return true;
              })
              .map(member => (
                <div
                  key={member.id}
                  onClick={() => toggleMember(member.id)}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedMembers.includes(member.id)
                      ? 'border-church-gold bg-church-lightGold'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => {}}
                      className="w-4 h-4 text-church-gold focus:ring-church-gold border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{member.fullName}</p>
                      <p className="text-sm text-gray-600 truncate">
                        {member.memberId} • {member.department}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {members.filter(member => {
            if (filterDepartment !== 'all' && member.department !== filterDepartment) return false;
            if (filterType !== 'all' && member.membershipType !== filterType) return false;
            return true;
          }).length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No members match the selected filters</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Tip:</strong> For best results, use CR80 card stock and enable "Print Background Graphics" in your printer settings.
            {printBothSides && ' Print all front sides first, then reload paper and print back sides.'}
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            disabled={filteredMembers.length === 0}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            <span>Print {filteredMembers.length} Card{filteredMembers.length !== 1 ? 's' : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to generate card HTML
function generateCardHTML(member, showBack) {
  const currentYear = new Date().getFullYear();
  const initials = member.fullName.split(' ').map(n => n[0]).join('').slice(0, 2);
  const joinedDate = member.dateJoined ? new Date(member.dateJoined).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A';

  let html = `
    <div class="id-card-container">
      <div class="id-card id-card-front">
        <div class="id-card-header">
          <div class="church-logo">
            <div class="logo-circle">
              <span class="logo-text">GW</span>
            </div>
          </div>
          <div class="church-info">
            <h1 class="church-name">Greater Works</h1>
            <p class="church-subtitle">City Church</p>
          </div>
        </div>
        <div class="member-photo-section">
          ${member.profilePhotoURL 
            ? `<img src="${member.profilePhotoURL}" alt="${member.fullName}" class="member-photo" />`
            : `<div class="member-photo-placeholder"><span class="placeholder-initials">${initials}</span></div>`
          }
        </div>
        <div class="member-details">
          <h2 class="member-name">${member.fullName}</h2>
          <p class="member-id">ID: ${member.memberId}</p>
          <div class="member-info-grid">
            <div class="info-item">
              <span class="info-label">Department:</span>
              <span class="info-value">${member.department}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Type:</span>
              <span class="info-value">${member.membershipType}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Joined:</span>
              <span class="info-value">${joinedDate}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Valid Until:</span>
              <span class="info-value">Dec ${currentYear}</span>
            </div>
          </div>
        </div>
        <div class="qr-code-section">
          <svg width="80" height="80" viewBox="0 0 80 80">
            ${generateQRCodeSVG(member.memberId)}
          </svg>
          <p class="qr-label">Scan for Attendance</p>
        </div>
        <div class="id-card-footer">
          <p class="validity-text">Valid for ${currentYear}</p>
        </div>
      </div>
    </div>
  `;

  return html;
}

// Simple QR code placeholder (in production, use actual QR generation)
function generateQRCodeSVG(data) {
  // This is a placeholder - in production, you'd generate actual QR code
  return `<rect width="80" height="80" fill="white"/><text x="40" y="40" text-anchor="middle" font-size="8" fill="black">QR: ${data}</text>`;
}

// Get ID card styles (same as in IDCardPrintModal)
function getIDCardStyles() {
  // Return the same styles as in IDCardPrintModal
  return `
    .id-card-container { display: flex; gap: 0.25in; flex-wrap: wrap; justify-content: center; }
    .id-card { width: 3.375in; height: 2.125in; border-radius: 12px; overflow: hidden; page-break-after: always; break-after: page; }
    .id-card:last-child { page-break-after: auto; break-after: auto; }
    .id-card-front { display: flex; flex-direction: column; padding: 0.4in; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .id-card-header { display: flex; align-items: center; gap: 0.15in; margin-bottom: 0.15in; padding-bottom: 0.1in; border-bottom: 2px solid rgba(255, 255, 255, 0.3); }
    .logo-circle { width: 0.5in; height: 0.5in; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .logo-text { font-size: 14pt; font-weight: 800; color: #1e3a8a; letter-spacing: -1px; }
    .church-name { font-size: 12pt; font-weight: 700; margin: 0; line-height: 1.1; }
    .church-subtitle { font-size: 8pt; margin: 0; opacity: 0.9; font-weight: 500; }
    .member-photo-section { display: flex; justify-content: center; margin-bottom: 0.12in; }
    .member-photo { width: 0.8in; height: 0.8in; border-radius: 50%; object-fit: cover; border: 3px solid white; }
    .member-photo-placeholder { width: 0.8in; height: 0.8in; border-radius: 50%; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); display: flex; align-items: center; justify-content: center; border: 3px solid white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .placeholder-initials { font-size: 16pt; font-weight: 700; color: #1e3a8a; }
    .member-details { text-align: center; margin-bottom: 0.12in; }
    .member-name { font-size: 11pt; font-weight: 700; margin: 0 0 0.05in 0; line-height: 1.2; }
    .member-id { font-size: 7pt; margin: 0 0 0.08in 0; opacity: 0.9; font-family: 'Courier New', monospace; letter-spacing: 0.5px; }
    .member-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.05in; font-size: 6.5pt; background: rgba(255, 255, 255, 0.1); padding: 0.08in; border-radius: 6px; }
    .info-item { display: flex; flex-direction: column; gap: 2px; }
    .info-label { opacity: 0.8; font-weight: 500; font-size: 5.5pt; text-transform: uppercase; letter-spacing: 0.3px; }
    .info-value { font-weight: 600; font-size: 7pt; }
    .qr-code-section { display: flex; flex-direction: column; align-items: center; gap: 0.05in; margin-top: auto; padding: 0.08in; background: white; border-radius: 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .qr-label { font-size: 5.5pt; color: #1e3a8a; margin: 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    .id-card-footer { text-align: center; margin-top: 0.08in; padding-top: 0.08in; border-top: 1px solid rgba(255, 255, 255, 0.3); }
    .validity-text { font-size: 6pt; margin: 0; opacity: 0.8; font-weight: 500; }
    @media print { @page { size: 3.375in 2.125in; margin: 0; } body { margin: 0; padding: 0; } .id-card { box-shadow: none; margin: 0; } }
  `;
}

export default BulkIDCardPrint;
