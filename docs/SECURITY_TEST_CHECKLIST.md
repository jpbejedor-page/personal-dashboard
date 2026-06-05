# Security Features Test Checklist

This checklist helps verify that all security features are working correctly.

## Pre-Testing Setup

- [ ] Backup current data
- [ ] Clear browser cache and cookies
- [ ] Open browser console for error monitoring
- [ ] Have authenticator app ready (for 2FA testing)

---

## 1. Password Hashing & Storage

### Test Cases

- [ ] **New User Creation**
  - Create a new user with password "Test123!@#"
  - Verify in Firebase: `passwordHash` and `passwordSalt` fields exist
  - Verify: No plain text `password` field exists
  - Expected: Password is hashed with salt

- [ ] **Legacy Password Migration**
  - If any users have plain text passwords
  - Login with that user
  - Verify password is automatically migrated to hashed format
  - Expected: Plain text password removed, hash/salt added

---

## 2. Password Validation

### Test Cases

- [ ] **Too Short Password**
  - Try: "Test1!"
  - Expected: Error - "Password must be at least 8 characters long"

- [ ] **No Uppercase**
  - Try: "test123!@#"
  - Expected: Error - "Password must contain at least one uppercase letter"

- [ ] **No Lowercase**
  - Try: "TEST123!@#"
  - Expected: Error - "Password must contain at least one lowercase letter"

- [ ] **No Numbers**
  - Try: "TestTest!@#"
  - Expected: Error - "Password must contain at least one number"

- [ ] **No Special Characters**
  - Try: "Test1234567"
  - Expected: Error - "Password must contain at least one special character"

- [ ] **Valid Strong Password**
  - Try: "Test123!@#"
  - Expected: Success - Password strength shows "Strong" (green)

- [ ] **Password Strength Indicator**
  - Type password gradually
  - Expected: Strength bar updates in real-time
  - Expected: Color changes (red → orange → blue → green)

- [ ] **Password Confirmation Match**
  - Enter password: "Test123!@#"
  - Enter confirm: "Test123!@#"
  - Expected: "✓ Passwords match" (green)

- [ ] **Password Confirmation Mismatch**
  - Enter password: "Test123!@#"
  - Enter confirm: "Test456!@#"
  - Expected: "✗ Passwords do not match" (red)

---

## 3. Login Rate Limiting

### Test Cases

- [ ] **Failed Login Attempt 1**
  - Username: "testuser"
  - Password: "wrong"
  - Expected: "Invalid username or password. 4 attempts remaining."

- [ ] **Failed Login Attempt 2**
  - Expected: "Invalid username or password. 3 attempts remaining."

- [ ] **Failed Login Attempt 3**
  - Expected: "Invalid username or password. 2 attempts remaining."

- [ ] **Failed Login Attempt 4**
  - Expected: "Invalid username or password. 1 attempts remaining."

- [ ] **Failed Login Attempt 5**
  - Expected: "Invalid username or password. 0 attempts remaining."

- [ ] **Account Lockout**
  - Try to login again
  - Expected: "Account locked. Try again in 15 minutes."

- [ ] **Lockout Timer**
  - Wait 1 minute
  - Try to login
  - Expected: "Account locked. Try again in 14 minutes."

- [ ] **Lockout Expiration**
  - Wait 15 minutes (or modify config for faster testing)
  - Try to login with correct credentials
  - Expected: Login successful, counter reset

- [ ] **Successful Login Resets Counter**
  - Make 2 failed attempts
  - Login successfully
  - Make 5 more failed attempts
  - Expected: Counter starts from 5 again

---

## 4. Session Management

### Test Cases

- [ ] **Session Creation**
  - Login successfully
  - Check sessionStorage: `authSession` exists
  - Expected: Session token, userId, expiresAt present

- [ ] **Session Persistence**
  - Login successfully
  - Refresh page
  - Expected: Still logged in, session maintained

- [ ] **Session Timeout**
  - Login successfully
  - Wait 1 hour (or modify config for faster testing)
  - Try to access a module
  - Expected: "Your session has expired. Please login again."

- [ ] **Session Activity Refresh**
  - Login successfully
  - Wait 30 minutes
  - Click on a module
  - Wait another 30 minutes
  - Click on another module
  - Expected: Session extended, no timeout

- [ ] **Manual Logout**
  - Login successfully
  - Click logout
  - Check sessionStorage
  - Expected: `authSession` removed, redirected to login

- [ ] **Session Monitoring**
  - Login successfully
  - Open browser console
  - Wait for session check interval (1 minute)
  - Expected: No errors, session validated

---

## 5. Two-Factor Authentication (2FA)

### Test Cases

- [ ] **Enable 2FA for New User**
  - Create user with "Enable 2FA" checked
  - Expected: User created with `twoFactorEnabled: true`

- [ ] **2FA Login Flow**
  - Login with 2FA-enabled user
  - Enter correct username/password
  - Expected: 2FA code prompt appears

- [ ] **2FA Code Entry**
  - Enter 6-digit code from authenticator app
  - Expected: Code accepted, login successful

- [ ] **Invalid 2FA Code**
  - Enter wrong code (e.g., "000000")
  - Expected: "Invalid 2FA code. Please try again."

- [ ] **2FA Session Timeout**
  - Login with username/password
  - Wait 6 minutes at 2FA prompt
  - Try to enter code
  - Expected: "2FA session expired. Please login again."

- [ ] **2FA Bypass Attempt**
  - Login with 2FA-enabled user
  - Close 2FA modal
  - Try to access dashboard directly
  - Expected: Cannot access, must complete 2FA

---

## 6. User Management Security

### Test Cases

- [ ] **Username Validation**
  - Try username: "ab" (too short)
  - Expected: Error - "Invalid username format"

- [ ] **Username Validation - Special Chars**
  - Try username: "test@user"
  - Expected: Error - "Invalid username format"

- [ ] **Duplicate Username**
  - Create user: "testuser"
  - Try to create another: "testuser"
  - Expected: Error - "Username already exists"

- [ ] **Admin Cannot Delete Self**
  - Login as admin
  - Try to delete own account
  - Expected: Delete button disabled or error message

- [ ] **User Cannot Access User Management**
  - Login as non-admin user
  - Expected: "User Management" menu not visible

- [ ] **Password Update Without Change**
  - Edit user
  - Leave password field blank
  - Save
  - Expected: Password unchanged, user can still login

- [ ] **Password Update With Change**
  - Edit user
  - Enter new password: "NewPass123!@#"
  - Save
  - Logout and login with new password
  - Expected: Login successful with new password

---

## 7. Audit Logging

### Test Cases

- [ ] **Login Success Log**
  - Login successfully
  - Check Firebase: `/securityLogs`
  - Expected: Entry with type: "login", action: "login_success"

- [ ] **Login Failure Log**
  - Login with wrong password
  - Check Firebase: `/securityLogs`
  - Expected: Entry with type: "login", action: "login_failed"

- [ ] **Logout Log**
  - Logout
  - Check Firebase: `/securityLogs`
  - Expected: Entry with type: "logout", action: "user_logout"

- [ ] **Session Expired Log**
  - Wait for session to expire
  - Check Firebase: `/securityLogs`
  - Expected: Entry with type: "logout", action: "session_expired"

- [ ] **User Created Log**
  - Create new user
  - Check Firebase: `/securityLogs`
  - Expected: Entry with type: "user_management", action: "user_created"

- [ ] **2FA Success Log**
  - Complete 2FA login
  - Check Firebase: `/securityLogs`
  - Expected: Entry with type: "login", action: "2fa_success"

- [ ] **2FA Failure Log**
  - Enter wrong 2FA code
  - Check Firebase: `/securityLogs`
  - Expected: Entry with type: "login", action: "2fa_failed"

- [ ] **Log Entry Structure**
  - Check any log entry
  - Expected: Contains timestamp, type, username, action, success, userAgent

---

## 8. Input Sanitization

### Test Cases

- [ ] **Username XSS Attempt**
  - Try username: "<script>alert('xss')</script>"
  - Expected: Script tags removed or escaped

- [ ] **SQL Injection Attempt**
  - Try username: "admin' OR '1'='1"
  - Expected: Treated as literal string, no injection

- [ ] **HTML Injection**
  - Try username: "<b>bold</b>"
  - Expected: HTML tags removed or escaped

---

## 9. Permission System

### Test Cases

- [ ] **View-Only Permission**
  - Create user with only "View" permission for Financial module
  - Login as that user
  - Go to Financial module
  - Expected: Can see data, but Add/Edit/Delete buttons disabled

- [ ] **Modify Permission**
  - Create user with "Modify" permission for Financial module
  - Login as that user
  - Go to Financial module
  - Expected: Can add, edit, and delete records

- [ ] **No Permission**
  - Create user with no permissions for Budget module
  - Login as that user
  - Expected: Budget module not visible in sidebar

- [ ] **Admin Bypass**
  - Login as admin
  - Expected: All modules visible and editable

---

## 10. Password Reset

### Test Cases

- [ ] **Initiate Password Reset**
  - Call `AuthSecurity.initiatePasswordReset('username')`
  - Check Firebase: User has `resetToken` and `resetExpiry`
  - Expected: Reset token generated

- [ ] **Reset with Valid Token**
  - Use reset token
  - Enter new password: "NewPass123!@#"
  - Expected: Password changed successfully

- [ ] **Reset with Expired Token**
  - Wait for token to expire (1 hour)
  - Try to reset password
  - Expected: "Reset token has expired"

- [ ] **Reset with Invalid Token**
  - Use random token
  - Expected: "Invalid or expired reset token"

- [ ] **Token Invalidation After Use**
  - Reset password successfully
  - Try to use same token again
  - Expected: Token no longer valid

---

## 11. Security Configuration

### Test Cases

- [ ] **Modify Max Login Attempts**
  - Change `maxLoginAttempts` to 3
  - Make 3 failed attempts
  - Expected: Account locked after 3 attempts

- [ ] **Modify Lockout Duration**
  - Change `lockoutDuration` to 5 minutes
  - Get locked out
  - Wait 5 minutes
  - Expected: Can login again

- [ ] **Modify Session Timeout**
  - Change `sessionTimeout` to 5 minutes
  - Login and wait 5 minutes
  - Expected: Session expires after 5 minutes

- [ ] **Modify Password Requirements**
  - Disable `requireSpecialChars`
  - Try password without special chars
  - Expected: Password accepted

---

## 12. Browser Compatibility

### Test Cases

- [ ] **Chrome**
  - Test all login features
  - Expected: All features work

- [ ] **Firefox**
  - Test all login features
  - Expected: All features work

- [ ] **Safari**
  - Test all login features
  - Expected: All features work

- [ ] **Edge**
  - Test all login features
  - Expected: All features work

- [ ] **Mobile Browser**
  - Test login on mobile device
  - Expected: Responsive and functional

---

## 13. Error Handling

### Test Cases

- [ ] **Network Error During Login**
  - Disconnect internet
  - Try to login
  - Expected: Graceful error message

- [ ] **Firebase Connection Error**
  - Invalid Firebase config
  - Try to login
  - Expected: Fallback to config-based auth

- [ ] **Console Errors**
  - Check browser console during all operations
  - Expected: No JavaScript errors

---

## Test Results Summary

### Passed: _____ / _____
### Failed: _____ / _____
### Skipped: _____ / _____

### Issues Found:
1. 
2. 
3. 

### Notes:


---

**Test Date**: _______________
**Tested By**: _______________
**Browser**: _______________
**Version**: _______________

---

**Made with Bob**