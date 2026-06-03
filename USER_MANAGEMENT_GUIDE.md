# User Management Guide

This guide explains how to use the User Management system with role-based access control.

## Overview

The Personal Dashboard now includes a comprehensive user management system that allows administrators to:
- Create and manage user accounts
- Assign roles (Admin or User)
- Set granular permissions for each module
- Control view and modify access per module

## User Roles

### Admin
- **Full Access**: Can view and modify all modules
- **User Management**: Can create, edit, and delete users
- **No Restrictions**: Bypasses all permission checks

### User
- **Custom Permissions**: Access controlled by assigned permissions
- **Module-Level Control**: Can be granted view or modify access per module
- **No User Management**: Cannot access user management features

## Modules and Permissions

Each module has two permission levels:

1. **View**: Can see the module and its data (read-only)
2. **Modify**: Can add, edit, and delete records in the module

### Available Modules:
- **Overview**: Dashboard statistics and charts
- **Blood Sugar**: Blood sugar monitoring records
- **Budget**: Monthly salary budget allocations
- **Financial**: Financial transactions tracking
- **Lending**: Lending business management

## Getting Started

### Initial Setup

1. **First Login**: Use the default admin credentials from `config.js`
   ```
   Username: admin
   Password: admin123
   ```

2. **Access User Management**:
   - Login as admin
   - Click "User Management" in the sidebar (admin-only)

3. **Create Your First User**:
   - Click "Add User" button
   - Fill in the user details
   - Set permissions for each module
   - Click "Add User"

### Creating a New User

1. Click the **"Add User"** button
2. Fill in the required fields:
   - **Username**: Unique username for login
   - **Password**: User's password (change on first login recommended)
   - **Role**: Select Admin or User
   - **Status**: Active or Inactive

3. **Set Permissions** (for User role only):
   - Check "View" to allow read-only access
   - Check "Modify" to allow full access (add/edit/delete)
   - Leave unchecked to deny access to that module

4. Click **"Add User"** to save

### Editing a User

1. In the User Management table, click the **Edit** icon (pencil)
2. Modify the user details or permissions
3. Leave password blank to keep the current password
4. Click **"Update User"** to save changes

### Deleting a User

1. Click the **Delete** icon (trash) next to the user
2. Confirm the deletion
3. **Note**: You cannot delete your own account

### Activating/Deactivating Users

1. Edit the user
2. Change **Status** to:
   - **Active**: User can login
   - **Inactive**: User cannot login (account disabled)

## Permission Examples

### Example 1: View-Only Financial Analyst
```
Role: User
Permissions:
  - Overview: View ✓
  - Financial: View ✓
  - All others: No access
```
**Result**: Can see overview and financial data, but cannot make changes

### Example 2: Budget Manager
```
Role: User
Permissions:
  - Overview: View ✓
  - Budget: View ✓, Modify ✓
  - Financial: View ✓
```
**Result**: Can fully manage budgets, view financial data and overview

### Example 3: Health Tracker
```
Role: User
Permissions:
  - Overview: View ✓
  - Blood Sugar: View ✓, Modify ✓
```
**Result**: Can only access and manage blood sugar records

### Example 4: Full Access User
```
Role: User
Permissions:
  - All modules: View ✓, Modify ✓
```
**Result**: Same access as admin, except cannot manage users

## Security Best Practices

### Password Management
1. **Change Default Password**: Immediately change the default admin password
2. **Strong Passwords**: Use complex passwords with mixed characters
3. **Regular Updates**: Change passwords periodically
4. **No Sharing**: Each user should have their own account

### User Account Management
1. **Principle of Least Privilege**: Grant only necessary permissions
2. **Regular Audits**: Review user accounts and permissions regularly
3. **Deactivate Unused Accounts**: Disable accounts that are no longer needed
4. **Monitor Activity**: Check for suspicious login attempts

### Admin Account Protection
1. **Limit Admin Accounts**: Only create admin accounts when necessary
2. **Separate Accounts**: Use separate accounts for admin and regular tasks
3. **Backup Admin**: Have at least one backup admin account

## User Interface Changes Based on Permissions

### For Users with Limited Permissions:

1. **Hidden Modules**: Modules without view permission are hidden from sidebar
2. **Disabled Buttons**: Add/Edit/Delete buttons are disabled for view-only access
3. **Read-Only Tables**: Action columns are hidden in view-only mode
4. **No User Management**: User Management menu is hidden for non-admins

### Visual Indicators:

- **Role Badges**: 
  - 🔴 Admin (red badge)
  - 🔵 User (blue badge)

- **Permission Icons**:
  - 👁️ View only
  - ✏️ Modify access

- **Status Badges**:
  - 🟢 Active
  - ⚫ Inactive

## Troubleshooting

### Cannot Login
- **Check Status**: Ensure account is Active
- **Verify Credentials**: Confirm username and password are correct
- **Contact Admin**: Ask administrator to check your account

### Missing Modules
- **Check Permissions**: You may not have access to those modules
- **Contact Admin**: Request access if needed

### Cannot Add/Edit Records
- **Check Permissions**: You may only have View access
- **Contact Admin**: Request Modify permission if needed

### Forgot Password
- **Contact Admin**: Only administrators can reset passwords
- **Admin Reset**: Admin can edit your account and set a new password

## Firebase Database Structure

Users are stored in Firebase Realtime Database:

```json
{
  "users": {
    "user_id_1": {
      "username": "john_doe",
      "password": "hashed_password",
      "role": "user",
      "status": "active",
      "permissions": {
        "overview": { "view": true, "modify": false },
        "blood-sugar": { "view": true, "modify": true },
        "budget": { "view": false, "modify": false },
        "financial": { "view": true, "modify": false },
        "lending": { "view": false, "modify": false }
      },
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  }
}
```

## API Reference

### FirebaseAPI Methods

```javascript
// Get all users
await FirebaseAPI.getUsers()

// Add new user
await FirebaseAPI.addUser(userData)

// Update user
await FirebaseAPI.updateUser(userId, userData)

// Delete user
await FirebaseAPI.deleteUser(userId)

// Get user by username
await FirebaseAPI.getUserByUsername(username)
```

### AppState Methods

```javascript
// Check if user has permission
AppState.hasPermission('module-name', 'view')
AppState.hasPermission('module-name', 'modify')

// Check if current user is admin
AppState.isAdmin()
```

## Migration from Old System

If you're upgrading from the old authentication system:

1. **Backup Data**: Export all data before upgrading
2. **Create Admin User**: Login with old credentials to create admin account in Firebase
3. **Create User Accounts**: Add user accounts for all team members
4. **Test Permissions**: Verify each user can access their assigned modules
5. **Update Config**: Update `config.js` if needed

## Support

For issues or questions:
1. Check this guide for common solutions
2. Review Firebase console for user data
3. Check browser console for error messages
4. Verify Firebase configuration in `config.js`

---

**Made with Bob**