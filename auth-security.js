// ===================================
// Authentication & Security Module
// ===================================

const AuthSecurity = {
    // Configuration
    config: {
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        sessionTimeout: 60 * 60 * 1000, // 1 hour
        passwordMinLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        sessionCheckInterval: 60 * 1000 // Check session every minute
    },
    
    loginAttempts: {},
    sessionCheckTimer: null,
    
    // ===================================
    // Password Hashing (SHA-256 based)
    // ===================================
    async hashPassword(password, salt = null) {
        // Generate salt if not provided
        if (!salt) {
            salt = this.generateSalt();
        }
        
        // Combine password and salt
        const combined = password + salt;
        
        // Hash using SHA-256
        const encoder = new TextEncoder();
        const data = encoder.encode(combined);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        
        // Convert to hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return {
            hash: hashHex,
            salt: salt
        };
    },
    
    async verifyPassword(password, storedHash, salt) {
        const result = await this.hashPassword(password, salt);
        return result.hash === storedHash;
    },
    
    generateSalt(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },
    
    // ===================================
    // Password Validation
    // ===================================
    validatePassword(password) {
        const errors = [];
        
        if (password.length < this.config.passwordMinLength) {
            errors.push(`Password must be at least ${this.config.passwordMinLength} characters long`);
        }
        
        if (this.config.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (this.config.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (this.config.requireNumbers && !/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (this.config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors,
            strength: this.calculatePasswordStrength(password)
        };
    },
    
    calculatePasswordStrength(password) {
        let strength = 0;
        
        // Length
        if (password.length >= 8) strength += 20;
        if (password.length >= 12) strength += 20;
        if (password.length >= 16) strength += 10;
        
        // Character variety
        if (/[a-z]/.test(password)) strength += 10;
        if (/[A-Z]/.test(password)) strength += 10;
        if (/[0-9]/.test(password)) strength += 10;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 20;
        
        return Math.min(100, strength);
    },
    
    getPasswordStrengthLabel(strength) {
        if (strength < 30) return { label: 'Weak', color: '#ef4444' };
        if (strength < 60) return { label: 'Fair', color: '#f59e0b' };
        if (strength < 80) return { label: 'Good', color: '#3b82f6' };
        return { label: 'Strong', color: '#10b981' };
    },
    
    // ===================================
    // Login Rate Limiting
    // ===================================
    checkLoginAttempts(username) {
        const now = Date.now();
        const attempts = this.loginAttempts[username];
        
        if (!attempts) {
            return { allowed: true, remaining: this.config.maxLoginAttempts };
        }
        
        // Check if lockout period has expired
        if (attempts.lockedUntil && now < attempts.lockedUntil) {
            const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
            return {
                allowed: false,
                locked: true,
                remainingTime: remainingTime
            };
        }
        
        // Reset if lockout expired
        if (attempts.lockedUntil && now >= attempts.lockedUntil) {
            delete this.loginAttempts[username];
            return { allowed: true, remaining: this.config.maxLoginAttempts };
        }
        
        // Check attempts
        const remaining = this.config.maxLoginAttempts - attempts.count;
        return {
            allowed: remaining > 0,
            remaining: remaining,
            locked: false
        };
    },
    
    recordLoginAttempt(username, success) {
        const now = Date.now();
        
        if (success) {
            // Clear attempts on successful login
            delete this.loginAttempts[username];
            return;
        }
        
        // Record failed attempt
        if (!this.loginAttempts[username]) {
            this.loginAttempts[username] = {
                count: 1,
                firstAttempt: now
            };
        } else {
            this.loginAttempts[username].count++;
        }
        
        // Lock account if max attempts reached
        if (this.loginAttempts[username].count >= this.config.maxLoginAttempts) {
            this.loginAttempts[username].lockedUntil = now + this.config.lockoutDuration;
        }
    },
    
    // ===================================
    // Session Management
    // ===================================
    generateSessionToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },
    
    createSession(user) {
        const session = {
            token: this.generateSessionToken(),
            userId: user.id,
            username: user.username,
            role: user.role,
            permissions: user.permissions,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.config.sessionTimeout,
            lastActivity: Date.now()
        };
        
        // Store in sessionStorage (more secure than localStorage)
        sessionStorage.setItem('authSession', JSON.stringify(session));
        
        // Also store minimal info in localStorage for persistence
        localStorage.setItem('userSession', JSON.stringify({
            username: user.username,
            loginTime: Date.now()
        }));
        
        // Start session monitoring
        this.startSessionMonitoring();
        
        return session;
    },
    
    getSession() {
        const sessionData = sessionStorage.getItem('authSession');
        if (!sessionData) return null;
        
        try {
            const session = JSON.parse(sessionData);
            
            // Check if session expired
            if (Date.now() > session.expiresAt) {
                this.destroySession();
                return null;
            }
            
            // Update last activity
            session.lastActivity = Date.now();
            sessionStorage.setItem('authSession', JSON.stringify(session));
            
            return session;
        } catch (error) {
            console.error('Error parsing session:', error);
            return null;
        }
    },
    
    refreshSession() {
        const session = this.getSession();
        if (session) {
            session.expiresAt = Date.now() + this.config.sessionTimeout;
            session.lastActivity = Date.now();
            sessionStorage.setItem('authSession', JSON.stringify(session));
        }
    },
    
    destroySession() {
        sessionStorage.removeItem('authSession');
        localStorage.removeItem('userSession');
        this.stopSessionMonitoring();
    },
    
    startSessionMonitoring() {
        // Clear existing timer
        if (this.sessionCheckTimer) {
            clearInterval(this.sessionCheckTimer);
        }
        
        // Check session periodically
        this.sessionCheckTimer = setInterval(() => {
            const session = this.getSession();
            if (!session) {
                // Session expired, logout user
                if (typeof Auth !== 'undefined' && Auth.logout) {
                    Auth.logout(true); // true = session expired
                }
            }
        }, this.config.sessionCheckInterval);
    },
    
    stopSessionMonitoring() {
        if (this.sessionCheckTimer) {
            clearInterval(this.sessionCheckTimer);
            this.sessionCheckTimer = null;
        }
    },
    
    // ===================================
    // Audit Logging
    // ===================================
    async logSecurityEvent(event) {
        const logEntry = {
            timestamp: Date.now(),
            type: event.type,
            username: event.username || 'anonymous',
            action: event.action,
            success: event.success,
            ipAddress: event.ipAddress || 'unknown',
            userAgent: navigator.userAgent,
            details: event.details || {}
        };
        
        try {
            // Store in Firebase
            await FirebaseAPI.getRef('securityLogs').push(logEntry);
            
            // Also log to console in development
            if (CONFIG.app.environment === 'development') {
                console.log('Security Event:', logEntry);
            }
        } catch (error) {
            console.error('Error logging security event:', error);
        }
    },
    
    // ===================================
    // Two-Factor Authentication (2FA)
    // ===================================
    generate2FASecret() {
        // Generate a random secret for TOTP
        const array = new Uint8Array(20);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },
    
    async enable2FA(userId) {
        const secret = this.generate2FASecret();
        
        // Store secret in user record
        await FirebaseAPI.updateUser(userId, {
            twoFactorEnabled: true,
            twoFactorSecret: secret
        });
        
        return {
            secret: secret,
            qrCode: this.generate2FAQRCode(secret)
        };
    },
    
    async disable2FA(userId) {
        await FirebaseAPI.updateUser(userId, {
            twoFactorEnabled: false,
            twoFactorSecret: null
        });
    },
    
    generate2FAQRCode(secret) {
        // In production, use a proper TOTP library
        // This is a placeholder
        return `otpauth://totp/PersonalDashboard?secret=${secret}`;
    },
    
    verify2FACode(secret, code) {
        // In production, implement proper TOTP verification
        // This is a simplified version
        return code.length === 6 && /^\d+$/.test(code);
    },
    
    // ===================================
    // Password Reset
    // ===================================
    async initiatePasswordReset(username) {
        try {
            const response = await FirebaseAPI.getUserByUsername(username);
            
            if (!response.success || !response.data) {
                // Don't reveal if user exists
                return { success: true, message: 'If the account exists, a reset link will be sent.' };
            }
            
            const user = response.data;
            const resetToken = this.generateSessionToken();
            const resetExpiry = Date.now() + (60 * 60 * 1000); // 1 hour
            
            // Store reset token
            await FirebaseAPI.updateUser(user.id, {
                resetToken: resetToken,
                resetExpiry: resetExpiry
            });
            
            // Log event
            await this.logSecurityEvent({
                type: 'password_reset',
                username: username,
                action: 'reset_initiated',
                success: true
            });
            
            return {
                success: true,
                token: resetToken,
                message: 'Password reset initiated'
            };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, message: 'Password reset failed' };
        }
    },
    
    async resetPassword(token, newPassword) {
        try {
            // Validate password
            const validation = this.validatePassword(newPassword);
            if (!validation.valid) {
                return { success: false, errors: validation.errors };
            }
            
            // Find user with this token
            const usersSnapshot = await FirebaseAPI.getRef('users')
                .orderByChild('resetToken')
                .equalTo(token)
                .once('value');
            
            const users = usersSnapshot.val();
            if (!users) {
                return { success: false, message: 'Invalid or expired reset token' };
            }
            
            const userId = Object.keys(users)[0];
            const user = users[userId];
            
            // Check if token expired
            if (Date.now() > user.resetExpiry) {
                return { success: false, message: 'Reset token has expired' };
            }
            
            // Hash new password
            const { hash, salt } = await this.hashPassword(newPassword);
            
            // Update user
            await FirebaseAPI.updateUser(userId, {
                passwordHash: hash,
                passwordSalt: salt,
                resetToken: null,
                resetExpiry: null,
                passwordChangedAt: Date.now()
            });
            
            // Log event
            await this.logSecurityEvent({
                type: 'password_reset',
                username: user.username,
                action: 'password_changed',
                success: true
            });
            
            return { success: true, message: 'Password reset successful' };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, message: 'Password reset failed' };
        }
    },
    
    // ===================================
    // Security Utilities
    // ===================================
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        // Remove potentially dangerous characters
        return input
            .replace(/[<>]/g, '')
            .trim();
    },
    
    validateUsername(username) {
        // Username must be 3-20 characters, alphanumeric and underscore only
        const regex = /^[a-zA-Z0-9_]{3,20}$/;
        return regex.test(username);
    },
    
    // Check if running in secure context
    isSecureContext() {
        return window.isSecureContext || location.protocol === 'https:';
    }
};

// Initialize on load
console.log('Auth Security module loaded');

// Made with Bob