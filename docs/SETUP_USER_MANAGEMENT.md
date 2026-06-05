# 🚀 User Management Setup Guide

## Quick Start Checklist

Follow these steps in order to get User Management working:

- [ ] Step 1: Update Firebase Rules
- [ ] Step 2: Create Admin User in Firebase
- [ ] Step 3: Login as Admin
- [ ] Step 4: Verify User Management Appears

---

## Step 1: Update Firebase Rules

### 1.1 Open Firebase Console
1. Go to https://console.firebase.google.com/
2. Select your project
3. Click **Realtime Database** in left menu
4. Click **Rules** tab

### 1.2 Update Rules
Replace your current rules with:

```json
{
  "rules": {
    "bloodSugar": {
      ".read": true,
      ".write": true
    },
    "budget": {
      ".read": true,
      ".write": true
    },
    "financial": {
      ".read": true,
      ".write": true
    },
    "lending": {
      ".read": true,
      ".write": true
    },
    "simpleLoans": {
      ".read": true,
      ".write": true
    },
    "users": {
      ".read": true,
      ".write": true,
      ".indexOn": ["username", "role"]
    },
    "securityLogs": {
      ".read": true,
      ".write": true
    }
  }
}
```

### 1.3 Publish Rules
1. Click **Publish** button
2. Wait for "Rules published successfully" message

---

## Step 2: Create Admin User in Firebase

You have **TWO OPTIONS** to create an admin user:

### Option A: Manual Creation in Firebase Console (Recommended)

#### 2.1 Generate Password Hash
1. Open `utils/password-hash-generator.html` in your browser
2. Enter your desired password (e.g., `Admin@123456`)
3. Click "Generate Hash"
4. **Copy both the Hash and Salt** - you'll need them!

#### 2.2 Add User to Firebase
1. Go to Firebase Console → Realtime Database → **Data** tab
2. Click the **+** icon next to the root
3. Enter name: `users`
4. Click **+** icon next to `users`
5. Leave the auto-generated key (or create your own)
6. Click **+** to add fields:

Add these fields one by one:

| Field | Type | Value |
|-------|------|-------|
| `username` | string | `admin` |
| `passwordHash` | string | *paste your generated hash* |
| `passwordSalt` | string | *paste your generated salt* |
| `role` | string | `admin` |
| `status` | string | `active` |
| `createdAt` | number | `1234567890` |
| `permissions` | null | null |

7. Click **Add**

Your structure should look like:
```
users/
  └── -AbCdEfGhIjKlMnO/
      ├── username: "admin"
      ├── passwordHash: "abc123..."
      ├── passwordSalt: "xyz789..."
      ├── role: "admin"
      ├── status: "active"
      ├── createdAt: 1234567890
      └── permissions: null
```

### Option B: Import JSON (Faster)

#### 2.1 Generate Password Hash
1. Open `utils/password-hash-generator.html`
2. Generate hash for your password
3. Copy the hash and salt

#### 2.2 Create JSON File
Create a file named `admin-user.json`:

```json
{
  "users": {
    "admin-user-001": {
      "username": "admin",
      "passwordHash": "YOUR_GENERATED_HASH_HERE",
      "passwordSalt": "YOUR_GENERATED_SALT_HERE",
      "role": "admin",
      "status": "active",
      "createdAt": 1234567890,
      "permissions": null
    }
  }
}
```

#### 2.3 Import to Firebase
1. Go to Firebase Console → Realtime Database → Data tab
2. Click the **⋮** menu (three dots) at the top
3. Select **Import JSON**
4. Choose your `admin-user.json` file
5. Click **Import**

---

## Step 3: Login as Admin

### 3.1 Open Your Dashboard
1. Open `index.html` in your browser
2. Or visit your deployed URL

### 3.2 Login
1. Enter username: `admin`
2. Enter the password you used when generating the hash
3. Click **Login**

### 3.3 Verify Login
1. You should see the dashboard
2. Open browser console (F12)
3. Type: `AppState.currentUser`
4. Press Enter
5. You should see: `role: "admin"`

---

## Step 4: Verify User Management Appears

### 4.1 Check Sidebar
Look at the left sidebar menu. You should see:
- Overview
- Blood Sugar
- Salary Budget
- Financial
- Lending Business
- Documents
- **User Management** ← This should be visible!

### 4.2 Click User Management
1. Click on "User Management" in the sidebar
2. You should see a table with your admin user
3. You should see an "Add User" button

### 4.3 Test Creating a User
1. Click **Add User** button
2. Fill in the form:
   - Username: `testuser`
   - Password: `Test@123456`
   - Confirm Password: `Test@123456`
   - Role: User
   - Status: Active
   - Check some permissions
3. Click **Add User**
4. User should appear in the table
5. Check Firebase Console → Data → users → you should see the new user!

---

## 🐛 Troubleshooting

### Issue: "User Management" not showing in sidebar

**Possible Causes:**
1. Not logged in as admin
2. User role is not "admin" in Firebase
3. Browser cache issue

**Solutions:**

#### Solution 1: Verify Admin Role
1. Open browser console (F12)
2. Type: `AppState.currentUser`
3. Check if `role: "admin"`
4. If not, check Firebase → users → your user → role field

#### Solution 2: Check Firebase Data
1. Firebase Console → Realtime Database → Data
2. Expand `users` node
3. Find your user
4. Verify `role: "admin"` (not "Admin" or "ADMIN")
5. Verify `status: "active"`

#### Solution 3: Clear Cache and Re-login
1. Logout from dashboard
2. Clear browser cache (Ctrl+Shift+Delete)
3. Hard refresh (Ctrl+Shift+R)
4. Login again

#### Solution 4: Use Diagnostic Tool
1. Open `check-admin-status.html` in your browser
2. Click "Check Admin Status"
3. Follow the recommendations

### Issue: "Add User" button doesn't work

**Solutions:**
1. Open browser console (F12)
2. Look for JavaScript errors
3. Check if all scripts are loaded
4. Verify Firebase rules are published

### Issue: User not saved to Firebase

**Solutions:**
1. Check Firebase Console for connection
2. Verify Firebase rules allow write to `users` node
3. Check browser console for errors
4. Ensure internet connection is active

### Issue: Can't login with created user

**Solutions:**
1. Verify password was hashed correctly
2. Check user status is "active"
3. Verify username matches exactly (case-sensitive)
4. Try resetting password using password-hash-generator

---

## 📊 Expected Firebase Structure

After setup, your Firebase should look like:

```
your-database/
├── bloodSugar/
├── budget/
├── financial/
├── lending/
├── simpleLoans/
├── users/
│   ├── {userId1}/
│   │   ├── username: "admin"
│   │   ├── passwordHash: "..."
│   │   ├── passwordSalt: "..."
│   │   ├── role: "admin"
│   │   ├── status: "active"
│   │   ├── createdAt: 1234567890
│   │   └── permissions: null
│   └── {userId2}/
│       ├── username: "testuser"
│       ├── passwordHash: "..."
│       ├── passwordSalt: "..."
│       ├── role: "user"
│       ├── status: "active"
│       ├── createdAt: 1234567890
│       └── permissions: {...}
└── securityLogs/
    └── {logId}/
        ├── timestamp: 1234567890
        ├── type: "login"
        ├── username: "admin"
        └── ...
```

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] Firebase rules include `users` and `securityLogs` nodes
- [ ] Admin user exists in Firebase with `role: "admin"`
- [ ] Can login with admin credentials
- [ ] "User Management" appears in sidebar
- [ ] Can click "Add User" button
- [ ] Can create new users
- [ ] New users appear in Firebase
- [ ] Can edit users
- [ ] Can delete users (except yourself)

---

## 🎉 You're Done!

If all checkboxes are checked, your User Management module is fully functional!

### Next Steps:
1. Create additional admin users (backup)
2. Create regular users with specific permissions
3. Test login with different user roles
4. Review security logs in Firebase

### Important Notes:
- **Admin users** have access to all modules and User Management
- **Regular users** only see modules they have permissions for
- **Passwords are hashed** - you cannot see them in Firebase
- **Security logs** track all login attempts and user changes

---

## 📞 Still Having Issues?

1. Open `check-admin-status.html` for diagnostics
2. Check browser console for errors (F12)
3. Verify all files are present and loaded
4. Ensure Firebase configuration is correct in `config.js`
5. Check Firebase Console for any service issues

---

**Last Updated:** 2026-06-05

**Made with Bob** 🤖