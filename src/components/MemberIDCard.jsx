import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';

const MemberIDCard = ({ member, showBack = false }) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="id-card-container">
      {/* Front of Card */}
      <div className="id-card id-card-front">
        {/* Header */}
        <div className="id-card-header">
          <div className="church-logo">
            <div className="logo-circle">
              {/* Replace with your church logo */}
              <img 
                src="/church-logo.png" 
                alt="Church Logo" 
                className="logo-image"
                onError={(e) => {
                  // Fallback to text logo if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span className="logo-text" style={{ display: 'none' }}>GW</span>
            </div>
          </div>
          <div className="church-info">
            <h1 className="church-name">Greater Works City Church</h1>
            <p className="church-subtitle">Member ID Card</p>
          </div>
          {/* QR Code in Header */}
          <div className="qr-code-header">
            <QRCodeSVG
              value={member.memberId}
              size={40}
              level="H"
              includeMargin={false}
            />
          </div>
        </div>

        {/* Member Profile - Horizontal Layout */}
        <div className="member-profile-horizontal">
          {/* Photo */}
          <div className="member-photo-section">
            {member.profilePhotoURL ? (
              <img 
                src={member.profilePhotoURL} 
                alt={member.fullName}
                className="member-photo"
              />
            ) : (
              <div className="member-photo-placeholder">
                <span className="placeholder-initials">
                  {member.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
            )}
          </div>

          {/* Name and ID */}
          <div className="member-info-text">
            <h2 className="member-name">{member.fullName}</h2>
            <p className="member-id">ID: {member.memberId}</p>
          </div>
        </div>

        {/* Member Details */}
        <div className="member-details">
          <div className="member-info-grid">
            <div className="info-item">
              <span className="info-label">Department:</span>
              <span className="info-value">{Array.isArray(member.department) ? member.department.join(', ') : member.department}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Type:</span>
              <span className="info-value">{member.membershipType}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Joined:</span>
              <span className="info-value">
                {member.dateJoined ? format(new Date(member.dateJoined), 'MMM yyyy') : 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Valid Until:</span>
              <span className="info-value">Dec {currentYear}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="id-card-footer">
          <p className="validity-text">Valid for {currentYear}</p>
        </div>
      </div>

      {/* Back of Card (Optional) */}
      {showBack && (
        <div className="id-card id-card-back">
          {/* Emergency Contact */}
          <div className="back-section">
            <h3 className="back-section-title">Emergency Contact</h3>
            {member.emergencyContactName && member.emergencyContactPhone ? (
              <div className="back-info">
                <p className="back-text"><strong>{member.emergencyContactName}</strong></p>
                <p className="back-text">{member.emergencyContactPhone}</p>
              </div>
            ) : (
              <p className="back-text text-gray-500">Not provided</p>
            )}
          </div>

          {/* Important Information */}
          <div className="back-section">
            <h3 className="back-section-title">Important Information</h3>
            <ul className="back-list">
              <li>This card is property of Greater Works City Church</li>
              <li>Must be presented for church events</li>
              <li>Report if lost or stolen</li>
              <li>Non-transferable</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="back-section">
            <h3 className="back-section-title">Church Contact</h3>
            <div className="back-info">
              <p className="back-text">📞 +233 XX XXX XXXX</p>
              <p className="back-text">📧 info@greaterworks.org</p>
              <p className="back-text">📍 Accra, Ghana</p>
            </div>
          </div>

          {/* Signature Line */}
          <div className="signature-section">
            <div className="signature-line">
              <div className="signature-box"></div>
              <p className="signature-label">Authorized Signature</p>
            </div>
          </div>

          {/* Barcode/Member ID */}
          <div className="barcode-section">
            <div className="barcode-placeholder">
              <div className="barcode-lines">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="barcode-line" style={{ height: `${Math.random() * 30 + 20}px` }}></div>
                ))}
              </div>
            </div>
            <p className="barcode-text">{member.memberId}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberIDCard;
