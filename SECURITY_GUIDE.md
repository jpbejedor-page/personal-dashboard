# Security Guide

## Overview

This Personal Dashboard implements enterprise-grade security features to protect your data and ensure safe access. This guide covers all security features, best practices, and configuration options.

## Table of Contents

1. [Security Features](#security-features)
2. [Authentication System](#authentication-system)
3. [Password Security](#password-security)
4. [Session Management](#session-management)
5. [Two-Factor Authentication (2FA)](#two-factor-authentication-2fa)
6. [Rate Limiting & Brute Force Protection](#rate-limiting--brute-force-protection)
7. [Audit Logging](#audit-logging)
8. [User Management Security](#user-management-security)
9. [Best Practices](#best-practices)
10. [Security Configuration](#security-configuration)
11. [Troubleshooting](#troubleshooting)

---

## Security Features

### ✅ Implemented Security Features

- **Password Hashing**: SHA-256 with salt
- **Session Management**: Secure token-based sessions with automatic expiration
- **Rate Limiting**: Protection against brute force attacks
- **Password Validation**: Enforced strong password requirements
- **Two-Factor Authentication**: Optional 2FA support
- **Audit Logging**: Comprehensive security event logging
- **Input Sanitization**: Protection against injection attacks
- **Session Timeout**: Automatic logout after inactivity
- **Account Lockout**: Temporary lockout after failed login attempts
- **Role-Based Access Control**: Granular permissions system

---

## Authentication System

### Login Process

1. **Username Validation**
   - 3-20 characters
   - Alphanumeric and underscore only
   - Case-sensitive

2. **Password Verification**
   - Hashed password comparison
   - Automatic migration from legacy plain-text passwords
   - Secure password storage with salt

3. **Account Status Check**
   - Only active accounts can login
   - Inactive accounts are blocked

4. **Rate Limit Check**
   - Maximum 5 failed attempts
   - 15-minute lockout after max attempts

5. **2FA Verification** (if enabled)
   - 6-digit TOTP code required
   - 5-minute verification window

6. **Session Creation**
   - Secure session token generated
   - Session stored in sessionStorage
   - Automatic expiration after 1 hour

### Logout Process

- Secure session destruction
- Audit log entry created
- All session data cleared
- Redirect to login screen

---

## Password Security

### Password Requirements

**Minimum Requirements:**
- At least 8 characters long
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

### Password Strength Indicator

The system provides real-time feedback on password strength:

- **Weak** (0-29%): Red - Does not meet minimum requirements
- **Fair** (30-59%): Orange - Meets basic requirements
- **Good** (60-79%): Blue - Strong password
- **Strong** (80-100%): Green - Very strong password

### Password Hashing

**Algorithm**: SHA-256 with salt

```javascript
// Password is hashed with a unique salt
const { hash, salt } = await AuthSecurity.hashPassword(password);

// Stored in database:
{
  passwordHash: "abc123...",
  passwordSalt: "xyz789..."
}
```

### Password Reset

1. **Initiate Reset**
   - Admin generates reset token
   - Token valid for 1 hour
   - Token stored in user record

2. **Reset Password**
   - User provides reset token
   - New password must meet requirements
   - Password is hashed and stored
   - Old token is invalidated

---

## Session Management

### Session Configuration

```javascript
{
  sessionTimeout: 60 * 60 * 1000,      // 1 hour
  sessionCheckInterval: 60 * 1000       // Check every minute
}
```

### Session Data

Sessions are stored in `sessionStorage` (more secure than `localStorage`):

```javascript
{
  token: "secure-random-token",
  userId: "user-id",
  username: "username",
  role: "admin|user",
  permissions: {...},
  createdAt: timestamp,
  expiresAt: timestamp,
  lastActivity: timestamp
}
```

### Session Monitoring

- Automatic session validation every minute
- Session refreshed on user activity
- Automatic logout on expiration
- Warning before session expires

### Session Security

- Tokens are cryptographically random (32 bytes)
- Sessions expire after 1 hour of inactivity
- Sessions are destroyed on logout
- No session data persists after logout

---

## Two-Factor Authentication (2FA)

### Enabling 2FA

**For New Users:**
1. Admin enables 2FA when creating user
2. User receives 2FA secret on first login
3. User scans QR code with authenticator app
4. User enters 6-digit code to verify

**For Existing Users:**
1. Admin enables 2FA in user settings
2. User logs out and logs back in
3. User sets up authenticator app
4. 2FA is now required for all logins

### 2FA Login Flow

1. User enters username and password
2. System validates credentials
3. If 2FA enabled, prompt for code
4. User enters 6-digit code from authenticator app
5. System verifies code
6. Session created on successful verification

### 2FA Configuration

```javascript
{
  twoFactorEnabled: true,
  twoFactorSecret: "base32-encoded-secret"
}
```

### Supported Authenticator Apps

- Google Authenticator
- Microsoft Authenticator
- Authy
- Any TOTP-compatible app

---

## Rate Limiting & Brute Force Protection

### Login Attempt Limits

```javascript
{
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000  // 15 minutes
}
```

### How It Works

1. **Failed Login Attempt**
   - Counter incremented
   - Remaining attempts shown to user

2. **Max Attempts Reached**
   - Account locked for 15 minutes
   - All login attempts blocked
   - Lockout time displayed to user

3. **Successful Login**
   - Counter reset
   - Lockout cleared

4. **Lockout Expiration**
   - Counter automatically reset
   - User can attempt login again

### Rate Limit Bypass

- No bypass mechanism (security feature)
- Wait for lockout period to expire
- Contact admin if account is locked

---

## Audit Logging

### Logged Events

**Authentication Events:**
- Login success/failure
- Logout (user-initiated or session expired)
- 2FA verification success/failure
- Account lockout
- Password reset initiated/completed

**User Management Events:**
- User created
- User updated
- User deleted
- Password changed
- 2FA enabled/disabled

### Log Entry Structure

```javascript
{
  timestamp: 1234567890,
  type: "login|logout|user_management",
  username: "username",
  action: "specific_action",
  success: true|false,
  ipAddress: "unknown",
  userAgent: "browser-info",
  details: {...}
}
```

### Viewing Audit Logs

Audit logs are stored in Firebase Realtime Database:
- Path: `/securityLogs`
- Accessible by admins only
- Can be exported for analysis

### Log Retention

- Logs stored indefinitely in Firebase
- Can be manually archived or deleted
- Consider implementing log rotation for large deployments

---

## User Management Security

### Creating Users

**Security Checks:**
1. Username format validation
2. Username uniqueness check
3. Password strength validation
4. Password confirmation match
5. Secure password hashing
6. Audit log entry created

**Required Information:**
- Username (3-20 alphanumeric + underscore)
- Strong password
- Role (admin or user)
- Status (active or inactive)
- Permissions (for non-admin users)
- Optional: 2FA enabled

### Updating Users

**Security Considerations:**
- Cannot change own role
- Cannot delete own account
- Password changes require new password validation
- Empty password field = no password change
- All changes logged in audit trail

### Deleting Users

**Restrictions:**
- Cannot delete own account
- Confirmation required
- Permanent deletion (no recovery)
- Audit log entry created

---

## Best Practices

### For Administrators

1. **Password Management**
   - Change default admin password immediately
   - Use strong, unique passwords
   - Enable 2FA for admin accounts
   - Rotate passwords regularly

2. **User Account Management**
   - Follow principle of least privilege
   - Grant only necessary permissions
   - Regularly review user accounts
   - Deactivate unused accounts promptly
   - Monitor audit logs for suspicious activity

3. **Session Security**
   - Don't share login credentials
   - Always logout when finished
   - Don't use public computers for admin access
   - Clear browser cache on shared devices

4. **2FA Recommendations**
   - Enable 2FA for all admin accounts
   - Recommend 2FA for all users
   - Keep backup codes secure
   - Use reputable authenticator apps

### For Users

1. **Password Security**
   - Use unique password for this dashboard
   - Don't share your password
   - Change password if compromised
   - Use password manager if needed

2. **Session Management**
   - Logout when finished
   - Don't leave sessions unattended
   - Be aware of session timeout
   - Don't save passwords in browser

3. **2FA Usage**
   - Keep authenticator device secure
   - Don't share 2FA codes
   - Set up backup authentication method
   - Contact admin if device is lost

### Security Checklist

- [ ] Changed default admin password
- [ ] Enabled 2FA for admin accounts
- [ ] Reviewed and configured security settings
- [ ] Created user accounts with appropriate permissions
- [ ] Tested login and logout functionality
- [ ] Verified session timeout works
- [ ] Checked audit logs are being created
- [ ] Documented emergency access procedures
- [ ] Backed up Firebase security rules
- [ ] Configured HTTPS for production

---

## Security Configuration

### Customizing Security Settings

Edit `auth-security.js` to customize security parameters:

```javascript
const AuthSecurity = {
    config: {
        maxLoginAttempts: 5,              // Max failed login attempts
        lockoutDuration: 15 * 60 * 1000,  // Lockout duration (ms)
        sessionTimeout: 60 * 60 * 1000,   // Session timeout (ms)
        passwordMinLength: 8,              // Minimum password length
        requireUppercase: true,            // Require uppercase letters
        requireLowercase: true,            // Require lowercase letters
        requireNumbers: true,              // Require numbers
        requireSpecialChars: true,         // Require special characters
        sessionCheckInterval: 60 * 1000    // Session check interval (ms)
    }
};
```

### Firebase Security Rules

Ensure proper Firebase security rules are configured:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'"
    },
    "securityLogs": {
      ".read": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'",
      ".write": "auth != null"
    }
  }
}
```

### HTTPS Configuration

**Production Deployment:**
- Always use HTTPS in production
- Obtain SSL/TLS certificate
- Configure web server for HTTPS
- Redirect HTTP to HTTPS
- Enable HSTS (HTTP Strict Transport Security)

---

## Troubleshooting

### Cannot Login

**Possible Causes:**
1. **Incorrect credentials**
   - Verify username and password
   - Check caps lock is off
   - Ensure correct case sensitivity

2. **Account locked**
   - Wait 15 minutes for lockout to expire
   - Contact admin if urgent

3. **Account inactive**
   - Contact admin to activate account

4. **2FA issues**
   - Verify time on device is correct
   - Try next code from authenticator
   - Contact admin to disable 2FA temporarily

### Session Expired

**Solutions:**
- Login again
- Increase session timeout in config
- Enable "remember me" feature (if implemented)

### Password Reset Not Working

**Troubleshooting:**
1. Verify reset token is valid
2. Check token hasn't expired (1 hour limit)
3. Ensure new password meets requirements
4. Contact admin for manual reset

### 2FA Code Not Working

**Common Issues:**
1. **Time sync issue**
   - Ensure device time is accurate
   - Sync with network time

2. **Wrong code**
   - Wait for next code (30 seconds)
   - Verify correct account in authenticator

3. **Lost device**
   - Contact admin to disable 2FA
   - Set up new authenticator

### Audit Logs Not Appearing

**Checks:**
1. Verify Firebase connection
2. Check Firebase security rules
3. Ensure user has admin role
4. Check browser console for errors

---

## Security Incident Response

### If Account is Compromised

1. **Immediate Actions:**
   - Change password immediately
   - Enable 2FA if not already enabled
   - Review audit logs for suspicious activity
   - Logout all active sessions

2. **Admin Actions:**
   - Deactivate compromised account
   - Review access logs
   - Check for unauthorized changes
   - Reset password and notify user
   - Enable 2FA requirement

3. **Prevention:**
   - Implement stronger password policy
   - Require 2FA for all users
   - Regular security audits
   - User security training

### Reporting Security Issues

If you discover a security vulnerability:
1. Do not disclose publicly
2. Contact system administrator
3. Provide detailed description
4. Include steps to reproduce
5. Wait for fix before disclosure

---

## Additional Resources

### Related Documentation
- [User Management Guide](USER_MANAGEMENT_GUIDE.md)
- [Firebase Setup Guide](FIREBASE_SETUP.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)

### Security Standards
- OWASP Top 10
- NIST Cybersecurity Framework
- CIS Controls

### Tools & Libraries
- Firebase Authentication
- Web Crypto API
- TOTP (Time-based One-Time Password)

---

## Version History

- **v1.0.0** - Initial security implementation
  - Password hashing with SHA-256
  - Session management
  - Rate limiting
  - 2FA support
  - Audit logging

---

**Last Updated**: 2026-06-04

**Made with Bob**