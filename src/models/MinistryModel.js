/**
 * Ministry Data Model
 * 
 * This file defines the structure and validation for ministry data
 * used throughout the application.
 */

// Ministry types available in the system
export const MINISTRY_TYPES = [
  'Worship',
  'Children',
  'Youth',
  'Ushering',
  'Prayer',
  'Evangelism',
  'Media',
  'Hospitality',
  'Counseling',
  'Missions',
  'Technical',
  'Administration',
  'Choir',
  'Outreach',
  'Teaching',
  'Welfare'
];

// Ministry roles with permission levels
export const MINISTRY_ROLES = {
  LEADER: 'leader',      // Can manage all ministry aspects
  ASSISTANT: 'assistant', // Can manage most aspects except critical settings
  COORDINATOR: 'coordinator', // Can organize events and manage resources
  MEMBER: 'member'       // Regular ministry member
};

// Permission levels for different ministry actions
export const PERMISSIONS = {
  VIEW: 'view',           // Can view ministry content
  EDIT: 'edit',           // Can edit ministry content
  MANAGE_MEMBERS: 'manage_members', // Can add/remove members
  MANAGE_RESOURCES: 'manage_resources', // Can add/edit resources
  MANAGE_ANNOUNCEMENTS: 'manage_announcements', // Can create announcements
  MANAGE_EVENTS: 'manage_events', // Can create/edit ministry events
  ADMIN: 'admin'          // Full administrative access
};

// Role to permissions mapping
export const ROLE_PERMISSIONS = {
  [MINISTRY_ROLES.LEADER]: [
    PERMISSIONS.VIEW,
    PERMISSIONS.EDIT,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.MANAGE_RESOURCES,
    PERMISSIONS.MANAGE_ANNOUNCEMENTS,
    PERMISSIONS.MANAGE_EVENTS,
    PERMISSIONS.ADMIN
  ],
  [MINISTRY_ROLES.ASSISTANT]: [
    PERMISSIONS.VIEW,
    PERMISSIONS.EDIT,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.MANAGE_RESOURCES,
    PERMISSIONS.MANAGE_ANNOUNCEMENTS,
    PERMISSIONS.MANAGE_EVENTS
  ],
  [MINISTRY_ROLES.COORDINATOR]: [
    PERMISSIONS.VIEW,
    PERMISSIONS.EDIT,
    PERMISSIONS.MANAGE_RESOURCES,
    PERMISSIONS.MANAGE_ANNOUNCEMENTS,
    PERMISSIONS.MANAGE_EVENTS
  ],
  [MINISTRY_ROLES.MEMBER]: [
    PERMISSIONS.VIEW
  ]
};

/**
 * Validates if a user has permission for a specific action
 * @param {string} userRole - The role of the user in the ministry
 * @param {string} permission - The permission to check
 * @returns {boolean} - Whether the user has the permission
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission) || permissions.includes(PERMISSIONS.ADMIN);
};

/**
 * Ministry schema for Firestore
 * This represents the structure of ministry documents in Firestore
 */
export const ministrySchema = {
  id: String,
  name: String,
  description: String,
  type: String, // One of MINISTRY_TYPES
  createdAt: Date,
  updatedAt: Date,
  active: Boolean,
  meetingSchedule: {
    day: String, // e.g., "Monday", "Tuesday"
    time: String, // e.g., "18:00"
    location: String,
    frequency: String // e.g., "weekly", "bi-weekly", "monthly"
  },
  contactEmail: String,
  contactPhone: String,
  leaders: Array, // Array of user IDs with leader role
  members: Array, // Array of user IDs with member role
  resources: Array, // Array of resource objects
  announcements: Array, // Array of announcement objects
  events: Array, // Array of event IDs related to this ministry
};

/**
 * Creates a new ministry object with default values
 * @param {Object} ministryData - Initial ministry data
 * @returns {Object} - A new ministry object
 */
export const createMinistry = (ministryData = {}) => {
  const now = new Date();
  
  return {
    id: ministryData.id || null,
    name: ministryData.name || '',
    description: ministryData.description || '',
    type: ministryData.type || MINISTRY_TYPES[0],
    createdAt: ministryData.createdAt || now,
    updatedAt: now,
    active: ministryData.active !== undefined ? ministryData.active : true,
    meetingSchedule: {
      day: ministryData.meetingSchedule?.day || '',
      time: ministryData.meetingSchedule?.time || '',
      location: ministryData.meetingSchedule?.location || '',
      frequency: ministryData.meetingSchedule?.frequency || 'weekly'
    },
    contactEmail: ministryData.contactEmail || '',
    contactPhone: ministryData.contactPhone || '',
    leaders: ministryData.leaders || [],
    members: ministryData.members || [],
    resources: ministryData.resources || [],
    announcements: ministryData.announcements || [],
    events: ministryData.events || []
  };
};