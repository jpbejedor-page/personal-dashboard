# Project Structure

## Root Directory
```
MyPersonalWebsite/
├── index.html              # Main application entry point
├── style.css               # Application styles
├── script.js               # Main application logic
├── config.js               # Configuration settings
├── auth-security.js        # Authentication & security module
├── firebase-api.js         # Firebase database API wrapper
├── .gitignore              # Git ignore rules
├── PROJECT_STRUCTURE.md    # This file
├── docs/                   # Documentation files
├── utils/                  # Utility tools and scripts
└── backups/                # Data backup directory
```

## Core Application Files
- **index.html** - Main dashboard interface
- **style.css** - Responsive CSS styles with dark mode support
- **script.js** - Application logic for all modules
- **config.js** - Firebase and app configuration
- **auth-security.js** - Security features (password hashing, 2FA, rate limiting)
- **firebase-api.js** - Firebase Realtime Database integration

## Documentation (`/docs`)
All documentation files are organized here:
- **README.md** - Main project documentation
- **QUICK_START.md** - Quick setup guide
- **DEPLOYMENT_GUIDE.md** - Deployment instructions
- **FIREBASE_SETUP.md** - Firebase configuration guide
- **FIREBASE_ADMIN_SETUP.md** - Admin user setup
- **FIREBASE_CONSOLE_GUIDE.md** - Firebase console usage
- **SECURITY_GUIDE.md** - Security features documentation
- **SECURITY_TEST_CHECKLIST.md** - Security testing checklist
- **BACKUP_GUIDE.md** - Data backup instructions
- **USER_MANAGEMENT_GUIDE.md** - User management guide
- **TROUBLESHOOTING.md** - Common issues and solutions
- **TERMS.md** - Lending business terms (used in app)
- **NOTES.md** - Business notes (used in app)

## Utilities (`/utils`)
Helper tools and scripts:
- **password-hash-generator.html** - Generate secure password hashes for Firebase users
- **backup-to-github.js** - Node.js script for automated data backups

## Backups (`/backups`)
Directory for storing data backup files:
- **.gitkeep** - Keeps directory in git
- **README.md** - Backup directory documentation

## Key Features
- 📊 Blood Sugar Monitoring
- 💰 Financial Tracking
- 🤝 Lending Business Management
- 💵 Monthly Salary Budget Planning
- 📄 Document Management (Terms & Notes)
- 👥 User Management with Role-Based Access Control
- 🔒 Enterprise-Grade Security Features
- 📱 Fully Responsive Design
- 🌙 Dark Mode Support
- 📊 Real-time Charts and Analytics
- 📥 Excel Export Functionality
- 🔄 Automated Backup System

## Getting Started
1. Read `/docs/README.md` for complete documentation
2. Follow `/docs/QUICK_START.md` for quick setup
3. Use `/utils/password-hash-generator.html` to create admin user
4. Configure Firebase using `/docs/FIREBASE_SETUP.md`

## Development
- All core files are in the root directory for easy access
- Documentation is organized in `/docs` for clarity
- Utilities are separated in `/utils` for maintenance
- Backups are stored in `/backups` and can be committed to git

## Security
- Passwords are hashed with SHA-256 + salt
- Session-based authentication with timeout
- Rate limiting on login attempts
- Optional 2FA support
- Comprehensive audit logging
- See `/docs/SECURITY_GUIDE.md` for details