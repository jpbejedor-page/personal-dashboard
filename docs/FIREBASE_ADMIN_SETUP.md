# Firebase Admin User Setup Guide

## Overview

This guide explains how to create your first admin user in Firebase now that config-based authentication has been removed for security reasons.

## Why This Change?

**Security Improvements:**
- ✅ No plain text passwords in code
- ✅ All passwords properly hashed with SHA-256 + salt
- ✅ Credentials stored securely in Firebase
- ✅ No hardcoded credentials in repository
- ✅ Proper audit trail for all users

---

## Method 1: Direct Firebase Console (Recommended)

### Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `personal-dashboard-54d9f`
3. Click on **Realtime Database** in the left menu
4. You should see your database URL: `https://personal-dashboard-54d9f-default-rtdb.asia-southeast1.firebasedatabase.app`

### Step 2: Generate Password Hash

Open your browser console (F12) and run this code to generate a hashed password:

```javascript
// Function to hash password (copy this entire block)
async function generatePasswordHash(password) {
    // Generate salt
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const salt = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Hash password with salt
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return { hash, salt };
}

// Generate hash for your password
const result = await generatePasswordHash('YourSecurePassword123!@#');
console.log('Password Hash:', result.hash);
console.log('Password Salt:', result.salt);
console.log('\nCopy these values to use in Step 3');
```

**Important:** Replace `'YourSecurePassword123!@#'` with your desired admin password.

### Step 3: Create Admin User in Firebase

1. In Firebase Console, click the **+** icon next to your database root
2. Add a new node called `users` (if it doesn't exist)
3. Under `users`, click **+** to add a child
4. Use a unique ID (e.g., `admin-001` or generate random)
5. Add the following fields:

```json
{
  "username": "your-admin-username",
  "passwordHash": "paste-hash-from-step-2",
  "passwordSalt": "paste-salt-from-step-2",
  "role": "admin",
  "status": "active",
  "permissions": null,
  "createdAt": 1234567890000,
  "createdBy": "system"
}
```

**Field Explanations:**
- `username`: Your admin username (3-20 alphanumeric + underscore)
- `passwordHash`: The hash value from Step 2
- `passwordSalt`: The salt value from Step 2
- `role`: Must be "admin" for full access
- `status`: Must be "active" to allow login
- `permissions`: Set to `null` for admin (admins bypass permissions)
- `createdAt`: Current timestamp in milliseconds (use `Date.now()` in console)
- `createdBy`: "system" or "manual"

### Step 4: Test Login

1. Go to your dashboard URL
2. Login with your new admin credentials
3. You should see all modules
4. Go to User Management to create additional users

---

## Method 2: Using Firebase REST API

If you prefer using the REST API:

### Step 1: Get Your Firebase Credentials

From `config.js`:
- Database URL: `https://personal-dashboard-54d9f-default-rtdb.asia-southeast1.firebasedatabase.app`
- API Key: `AIzaSyAmLnH6zAHsoNuK9MCgMXt-Qlq2AHcfGIE`

### Step 2: Generate Hash (Same as Method 1 Step 2)

Use the browser console code from Method 1 to generate hash and salt.

### Step 3: Create User via API

Use this curl command (replace values):

```bash
curl -X POST \
  'https://personal-dashboard-54d9f-default-rtdb.asia-southeast1.firebasedatabase.app/users.json' \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "your-admin-username",
    "passwordHash": "your-generated-hash",
    "passwordSalt": "your-generated-salt",
    "role": "admin",
    "status": "active",
    "permissions": null,
    "createdAt": 1234567890000,
    "createdBy": "system"
  }'
```

---

## Method 3: Temporary Config Fallback (Emergency Only)

If you need immediate access and can't use Methods 1 or 2:

### Step 1: Temporarily Re-enable Config Auth

Edit `script.js` around line 599, add this code BEFORE the "No user found" section:

```javascript
// TEMPORARY: Remove after creating Firebase admin user
if (username === 'emergency-admin' && password === 'TempPass123!@#') {
    const user = {
        id: 'temp-admin',
        username: username,
        role: 'admin',
        permissions: null,
        status: 'active'
    };
    
    const session = AuthSecurity.createSession(user);
    AppState.currentUser = {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
        sessionToken: session.token
    };
    
    this.showDashboard();
    Notification.warning('Using temporary admin access. Create Firebase user immediately!');
    return;
}
```

### Step 2: Login and Create Firebase User

1. Login with: `emergency-admin` / `TempPass123!@#`
2. Go to User Management
3. Create a proper admin user in Firebase
4. Logout

### Step 3: Remove Temporary Code

1. Remove the temporary code from `script.js`
2. Login with your new Firebase admin user
3. Verify everything works

---

## Password Requirements

Your admin password must meet these requirements:
- ✅ At least 8 characters long
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

**Example Strong Passwords:**
- `AdminPass123!@#`
- `Secure2024$Admin`
- `MyDashboard#2024!`

---

## Security Best Practices

### After Creating Admin User

1. **Enable 2FA** (Recommended)
   - Edit your admin user
   - Check "Enable Two-Factor Authentication"
   - Set up authenticator app on next login

2. **Create Additional Admins**
   - Don't rely on a single admin account
   - Create at least one backup admin
   - Store credentials securely

3. **Regular Users**
   - Create regular users with limited permissions
   - Use principle of least privilege
   - Review permissions regularly

4. **Password Management**
   - Use unique, strong passwords
   - Consider using a password manager
   - Change passwords periodically
   - Never share passwords

5. **Audit Logs**
   - Regularly review security logs in Firebase
   - Path: `/securityLogs`
   - Look for suspicious activity
   - Monitor failed login attempts

---

## Troubleshooting

### Issue: Can't Access Firebase Console

**Solution:**
- Verify you're logged into the correct Google account
- Check you have permission to the Firebase project
- Contact project owner for access

### Issue: Hash Generation Code Doesn't Work

**Solution:**
- Use a modern browser (Chrome, Firefox, Edge)
- Ensure you're on a secure page (HTTPS or localhost)
- Check browser console for errors
- Try in incognito/private mode

### Issue: Login Fails After Creating User

**Checklist:**
- ✅ Username is correct (case-sensitive)
- ✅ Password hash and salt are correct
- ✅ Role is set to "admin"
- ✅ Status is set to "active"
- ✅ All fields are strings (not numbers)
- ✅ No extra spaces in values

**Debug Steps:**
1. Open browser console (F12)
2. Try to login
3. Check for error messages
4. Verify user exists in Firebase Console
5. Check all field values match exactly

### Issue: User Created But No Modules Showing

**Solution:**
1. Clear browser storage:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```
2. Login again
3. Check console: `AppState.isAdmin()` should return `true`

---

## Firebase Database Structure

Your users node should look like this:

```
users/
├── user-id-1/
│   ├── username: "admin"
│   ├── passwordHash: "abc123..."
│   ├── passwordSalt: "xyz789..."
│   ├── role: "admin"
│   ├── status: "active"
│   ├── permissions: null
│   ├── createdAt: 1234567890000
│   └── createdBy: "system"
├── user-id-2/
│   ├── username: "john"
│   ├── passwordHash: "def456..."
│   ├── passwordSalt: "uvw012..."
│   ├── role: "user"
│   ├── status: "active"
│   ├── permissions: {...}
│   ├── createdAt: 1234567890000
│   └── createdBy: "admin"
```

---

## Next Steps

After creating your admin user:

1. ✅ Test login with new admin credentials
2. ✅ Verify all modules are visible
3. ✅ Create additional users via User Management
4. ✅ Enable 2FA for admin accounts
5. ✅ Review and update Firebase security rules
6. ✅ Set up regular backups
7. ✅ Document your admin credentials securely

---

## Security Notes

⚠️ **Important Security Reminders:**

- Never commit Firebase credentials to public repositories
- Use environment variables for production deployments
- Regularly rotate admin passwords
- Monitor security logs for suspicious activity
- Keep Firebase security rules up to date
- Use HTTPS in production
- Enable 2FA for all admin accounts

---

## Support

If you encounter issues:

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review [SECURITY_GUIDE.md](SECURITY_GUIDE.md)
3. Check Firebase Console for errors
4. Review browser console for JavaScript errors

---

**Last Updated**: 2026-06-04

**Made with Bob**