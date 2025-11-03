/**
 * Role-Based Permission Utilities
 */
export type UserRole = 'VIEWER' | 'EDITOR' | 'ADMIN';

/**
 * Check if user has permission to perform an action
 */
export function hasPermission(userRole: UserRole, action: string): boolean {
  const permissions: Record<UserRole, string[]> = {
    VIEWER: [
      'view_messages',
      'view_contacts',
      'view_notes',
      // No analytics access
    ],
    EDITOR: [
      'view_messages',
      'view_contacts',
      'view_notes',
      'create_messages',
      'create_contacts',
      'update_contacts',
      'create_notes',
      'update_notes',
      'send_messages',
      'schedule_messages',
      // No analytics access
    ],
    ADMIN: [
      'view_messages',
      'view_contacts',
      'view_analytics',
      'view_notes',
      'create_messages',
      'create_contacts',
      'update_contacts',
      'delete_contacts',
      'create_notes',
      'update_notes',
      'delete_notes',
      'send_messages',
      'schedule_messages',
      'manage_users',
      'manage_integrations',
      'manage_channels',
      'manage_groups',
      'view_all_messages',
    ],
  };

  return permissions[userRole]?.includes(action) || false;
}

/**
 * Check if user can manage other users
 */
export function canManageUsers(userRole: UserRole): boolean {
  return userRole === 'ADMIN';
}

/**
 * Check if user can modify contacts
 */
export function canModifyContacts(userRole: UserRole): boolean {
  return userRole === 'EDITOR' || userRole === 'ADMIN';
}

/**
 * Check if user can delete resources
 */
export function canDelete(userRole: UserRole): boolean {
  return userRole === 'ADMIN';
}

/**
 * Check if user can view all messages (not just own)
 */
export function canViewAllMessages(userRole: UserRole): boolean {
  return userRole === 'ADMIN';
}









