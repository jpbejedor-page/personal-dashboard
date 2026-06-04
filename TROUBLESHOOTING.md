# Troubleshooting Guide

## Issue: Modules Not Showing After Login

If you're experiencing issues where modules are not showing up after implementing the security features, follow these steps:

### Quick Fix Steps

1. **Clear Browser Data**
   ```
   - Open browser DevTools (F12)
   - Go to Application tab (Chrome) or Storage tab (Firefox)
   - Clear all localStorage and sessionStorage
   - Refresh the page
   ```

2. **Logout and Login Again**
   - Click logout if you're logged in
   - Clear browser cache (Ctrl+Shift+Delete)
   - Login with credentials: `jayps` / `Y@hWeh101!`

3. **Check Browser Console**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for any JavaScript errors
   - Share errors if you need help

### Common Issues and Solutions

#### Issue 1: "Cannot read property of undefined"

**Cause**: Old session data in localStorage conflicting with new security system

**Solution**:
```javascript
// Open browser console and run:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

#### Issue 2: Modules Hidden for Admin User

**Cause**: Admin user permissions not properly set

**Solution**:
1. Logout completely
2. Clear browser storage
3. Login with config credentials (jayps / Y@hWeh101!)
4. Admin users should see ALL modules automatically

#### Issue 3: Session Expired Immediately

**Cause**: Session timeout configuration or browser time sync

**Solution**:
1. Check system time is correct
2. Verify `auth-security.js` is loaded (check Network tab)
3. Check console for errors

#### Issue 4: Firebase Connection Issues

**Cause**: Firebase not initialized or network issues

**Solution**:
1. Check `config.js` has correct Firebase credentials
2. Verify internet connection
3. Check Firebase console for any issues
4. Look for Firebase errors in browser console

### Verification Steps

Run these checks in browser console:

```javascript
// 1. Check if security module loaded
console.log('AuthSecurity loaded:', typeof AuthSecurity !== 'undefined');

// 2. Check current user
console.log('Current user:', AppState.currentUser);

// 3. Check session
console.log('Session:', AuthSecurity.getSession());

// 4. Check if user is admin
console.log('Is admin:', AppState.isAdmin());

// 5. Check permissions for a module
console.log('Has overview permission:', AppState.hasPermission('overview', 'view'));
```

### Expected Console Output for Admin

```javascript
AuthSecurity loaded: true
Current user: {
  id: "config-admin",
  username: "jayps",
  role: "admin",
  permissions: null,
  sessionToken: "..."
}
Session: {
  token: "...",
  userId: "config-admin",
  username: "jayps",
  role: "admin",
  ...
}
Is admin: true
Has overview permission: true
```

### Module Visibility Logic

Modules are shown/hidden based on:

1. **Admin Users**: See ALL modules (no permission checks)
2. **Regular Users**: See only modules they have permissions for
3. **User Management**: Only visible to admins

Check this in console:
```javascript
// Should return true for admin
AppState.isAdmin()

// Should return true for any module if admin
AppState.hasPermission('overview', 'view')
AppState.hasPermission('blood-sugar', 'view')
AppState.hasPermission('budget', 'view')
```

### Reset to Default State

If all else fails, reset everything:

1. **Clear All Browser Data**
   ```
   - Settings > Privacy > Clear browsing data
   - Select "All time"
   - Check: Cookies, Cache, Site data
   - Clear data
   ```

2. **Reset Firebase Data** (if needed)
   - Go to Firebase Console
   - Navigate to Realtime Database
   - Delete `/users` node (if you want fresh start)
   - Keep other data intact

3. **Reload Application**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Login with default credentials

### Creating First Admin User in Firebase

If you want to move away from config-based auth:

1. Login with config credentials (jayps / Y@hWeh101!)
2. Go to User Management module
3. Create a new admin user:
   - Username: your-admin-username
   - Password: Strong password (meets requirements)
   - Role: Admin
   - Status: Active
4. Logout and login with new admin credentials
5. (Optional) Change config.js credentials to prevent config-based login

### Debug Mode

Enable debug logging:

```javascript
// Add to browser console
localStorage.setItem('debug', 'true');

// Then reload page and check console for detailed logs
```

### Still Having Issues?

1. **Check File Loading**
   - Open DevTools > Network tab
   - Refresh page
   - Verify these files load successfully:
     - auth-security.js
     - config.js
     - firebase-api.js
     - script.js

2. **Check Script Order**
   - In index.html, scripts should load in this order:
     1. config.js
     2. auth-security.js
     3. firebase-api.js
     4. script.js

3. **Browser Compatibility**
   - Use modern browser (Chrome, Firefox, Safari, Edge)
   - Update to latest version
   - Disable browser extensions that might interfere

4. **Firebase Rules**
   - Ensure Firebase security rules allow read/write
   - Check Firebase Console > Realtime Database > Rules

### Contact Support

If issues persist:
1. Open browser console (F12)
2. Copy all error messages
3. Note what you were trying to do
4. Share browser and version
5. Provide steps to reproduce

---

**Made with Bob**