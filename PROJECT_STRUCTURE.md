# Project Structure

## Overview
Personal management dashboard with blood sugar monitoring, financial tracking, lending business management, monthly salary budgeting, and **payroll system with project management**.

## Root Directory
```
MyPersonalWebsite/
├── index.html              # Main application entry point
├── style.css               # Application styles
├── script.js               # LEGACY - Main application logic (being modularized)
├── .gitignore              # Git ignore rules
├── PROJECT_STRUCTURE.md    # This file
├── NEW_PROJECT_STRUCTURE.md # New modular structure documentation
├── js/                     # JavaScript modules (NEW)
├── docs/                   # Documentation files
├── utils/                  # Utility tools and scripts
├── tests/                  # Test and debug files (NEW)
└── backups/                # Data backup directory
```

## JavaScript Modules (`/js`)
Organized modular structure for better maintainability:

### Configuration & API Layer
- **config.js** - Firebase and app configuration
- **firebase-api.js** - Firebase Realtime Database integration
- **auth-security.js** - Security features (password hashing, 2FA, rate limiting)

### Core Modules (`/js/core`)
- **app-state.js** - Global application state management
- **utils.js** - Utility functions (formatting, export, backup)
- **notification.js** - Toast notification system
- **modal.js** - Modal dialog system
- **data-api.js** - Data API abstraction layer

### Feature Modules (`/js/modules`)
- **payroll.js** - Payroll system with project management

## Core Application Files
- **index.html** - Main dashboard interface
- **style.css** - Responsive CSS styles with dark mode support
- **script.js** - LEGACY application logic (being migrated to modules)

## Documentation (`/docs`)
All documentation files are organized here:
- **README.md** - Main project documentation
- **QUICK_START.md** - Quick setup guide
- **DEPLOYMENT_GUIDE.md** - Deployment instructions
- **FIREBASE_SETUP.md** - Firebase configuration guide
- **FIREBASE_ADMIN_SETUP.md** - Admin user setup
- **FIREBASE_CONSOLE_GUIDE.md** - Firebase console usage
- **FIREBASE_PAYROLL_RULES.md** - Firebase rules for payroll system
- **SECURITY_GUIDE.md** - Security features documentation
- **SECURITY_TEST_CHECKLIST.md** - Security testing checklist
- **BACKUP_GUIDE.md** - Data backup instructions
- **USER_MANAGEMENT_GUIDE.md** - User management guide
- **PAYROLL_GUIDE.md** - Payroll system guide
- **TROUBLESHOOTING.md** - Common issues and solutions
- **TERMS.md** - Lending business terms (used in app)
- **NOTES.md** - Business notes (used in app)

## Utilities (`/utils`)
Helper tools and scripts:
- **password-hash-generator.html** - Generate secure password hashes for Firebase users
- **backup-to-github.js** - Node.js script for automated data backups

## Tests (`/tests`)
Test and debug files:
- **check-admin-status.html** - Admin status checker
- **debug-user-management.html** - User management debugger
- **test-user-management.html** - User management tester

## Backups (`/backups`)
Directory for storing data backup files:
- **.gitkeep** - Keeps directory in git
- **README.md** - Backup directory documentation

## Key Features
- 📊 Blood Sugar Monitoring
- 💰 Financial Tracking
- 🤝 Lending Business Management
- 💵 Monthly Salary Budget Planning
- 💼 Payroll System with Project Management
- � Document Management (Terms & Notes)
- 👥 User Management with Role-Based Access Control
- 🔒 Enterprise-Grade Security Features
- 📱 Fully Responsive Design
- 🌙 Dark Mode Support
- 📊 Real-time Charts and Analytics
- 📥 Excel Export Functionality
- 📄 PDF Payslip Generation
- 🔄 Automated Backup System

## Getting Started
1. Read `/docs/README.md` for complete documentation
2. Follow `/docs/QUICK_START.md` for quick setup
3. Use `/utils/password-hash-generator.html` to create admin user
4. Configure Firebase using `/docs/FIREBASE_SETUP.md`
5. Review `/NEW_PROJECT_STRUCTURE.md` for modular architecture details

## Development
- JavaScript modules organized in `/js` directory (config, core, modules)
- Documentation organized in `/docs` for clarity
- Utilities separated in `/utils` for maintenance
- Test files in `/tests` for debugging
- Backups stored in `/backups` and can be committed to git
- Modular architecture for better maintainability (see NEW_PROJECT_STRUCTURE.md)

## Security
- Passwords are hashed with SHA-256 + salt
- Session-based authentication with timeout
- Rate limiting on login attempts
- Optional 2FA support
- Comprehensive audit logging
- See `/docs/SECURITY_GUIDE.md` for details