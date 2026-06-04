# Personal Management Dashboard

A flexible, modular, and responsive static website for tracking blood sugar levels, financial transactions, and lending business activities. Built with HTML, CSS, and JavaScript, integrated with Google Sheets as a backend database.

## 🌟 Features

### Core Modules
- **📊 Overview Dashboard** - Real-time statistics and charts
- **🩺 Blood Sugar Monitoring** - Track and visualize blood sugar levels
- **💰 Financial Tracking** - Manage income, expenses, loans, and investments
- **🤝 Lending Business** - Track lending activities and payment status

### Key Features
- ✅ Fully responsive design (mobile & desktop optimized)
- ✅ **User Management** - Role-based access control with granular permissions
- ✅ Firebase Realtime Database integration
- ✅ Real-time data visualization with charts
- ✅ Dark mode support
- ✅ CRUD operations for all modules
- ✅ Filtering and search capabilities
- ✅ **Excel Export** - Export displayed data to XLSX
- ✅ **Automated Backups** - Backup all data to GitHub
- ✅ Toast notifications
- ✅ Mobile-friendly navigation
- ✅ Offline-capable (with mock data)

### 🔒 Security Features
- ✅ **Secure Authentication** - SHA-256 password hashing with salt
- ✅ **Session Management** - Token-based sessions with automatic expiration (1 hour)
- ✅ **Rate Limiting** - Brute force protection (5 attempts, 15-min lockout)
- ✅ **Two-Factor Authentication** - Optional 2FA support with TOTP
- ✅ **Password Validation** - Enforced strong password requirements
- ✅ **Audit Logging** - Comprehensive security event tracking
- ✅ **Input Sanitization** - Protection against injection attacks
- ✅ **Account Controls** - User activation/deactivation
- ✅ **Password Reset** - Secure password reset with token validation
- ✅ **Session Monitoring** - Automatic logout on inactivity

## 🚀 Quick Start

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A Google account (for Google Sheets integration)
- GitHub account (for deployment)

### Installation

1. **Clone or Download the Repository**
   ```bash
   git clone <your-repo-url>
   cd personal-dashboard
   ```

2. **File Structure**
   ```
   personal-dashboard/
   ├── index.html                      # Main HTML file
   ├── style.css                       # Responsive CSS styles
   ├── script.js                       # Main JavaScript logic
   ├── config.js                       # Configuration file
   ├── firebase-api.js                 # Firebase integration
   ├── backup-to-github.js             # Backup script
   ├── backups/                        # Backup files directory
   ├── .github/workflows/              # GitHub Actions
   │   └── backup-data.yml            # Automated backup workflow
   ├── BACKUP_GUIDE.md                 # Backup documentation
   ├── USER_MANAGEMENT_GUIDE.md        # User management documentation
   ├── FIREBASE_SETUP.md               # Firebase setup guide
   └── README.md                       # Documentation
   ```

## 📝 Setup Guide

### Step 1: Configure Authentication

Edit `config.js` and update the credentials:

```javascript
auth: {
    username: 'admin',        // Change this
    password: 'admin123',     // Change this
    // ...
}
```

### Step 2: Set Up Google Sheets Backend

#### 2.1 Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Personal Dashboard Data"
4. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```

#### 2.2 Set Up Google Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any existing code
3. Copy the entire content from `google-apps-script.js`
4. Paste it into the Apps Script editor
5. Update the `SHEET_ID` variable with your Sheet ID:
   ```javascript
   const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
   ```

#### 2.3 Deploy as Web App

1. Click **Deploy > New deployment**
2. Click the gear icon ⚙️ and select **Web app**
3. Configure:
   - **Description**: Personal Dashboard API
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. Copy the **Web app URL**
6. Click **Authorize access** and grant permissions

#### 2.4 Update Frontend Configuration

Edit `config.js` and update the API URL:

```javascript
api: {
    baseUrl: 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL',
    // ...
}
```

### Step 3: Test Locally

1. Open `index.html` in your browser
2. Login with your credentials (default: admin/admin123)
3. Test adding/editing/deleting records in each module

**Note**: If Google Sheets is not configured, the app will use mock data stored in browser memory.

## 🌐 Deployment to GitHub Pages

### Option 1: Using GitHub Web Interface

1. Create a new repository on GitHub
2. Upload all files (index.html, style.css, script.js, config.js)
3. Go to **Settings > Pages**
4. Under **Source**, select **main** branch
5. Click **Save**
6. Your site will be available at: `https://yourusername.github.io/repository-name/`

### Option 2: Using Git Command Line

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Personal Dashboard"

# Add remote repository
git remote add origin https://github.com/yourusername/your-repo-name.git

# Push to GitHub
git push -u origin main

# Enable GitHub Pages in repository settings
```

## 📱 Usage Guide

### Login & Security
- **Default credentials**: username: `jayps`, password: `Y@hWeh101!`
- **⚠️ IMPORTANT**: Change default credentials immediately after first login
- **Security Features**:
  - Strong password requirements (8+ chars, uppercase, lowercase, number, special char)
  - Rate limiting: 5 failed attempts = 15-minute lockout
  - Session timeout: 1 hour of inactivity
  - Optional 2FA for enhanced security
- See [SECURITY_GUIDE.md](SECURITY_GUIDE.md) for detailed security information

### Overview Module
- View summary statistics for all modules
- See charts for blood sugar trends and financial overview
- Quick access to latest data

### Blood Sugar Monitoring
- **Add Record**: Click "Add Record" button
- **Edit**: Click edit icon on any record
- **Delete**: Click delete icon (with confirmation)
- **Fields**: Date/Time, Level (mg/dL), Notes

### Financial Tracking
- **Add Transaction**: Click "Add Transaction" button
- **Filter**: Use category, status, and month filters
- **Summary**: View income, expenses, and balance
- **Categories**: Income, Expense, Loan, Investment
- **Status**: Paid, Pending

### Lending Business
- **Add Loan**: Click "Add Loan" button
- **Track**: Borrower name, amount, interest rate, due date
- **Status**: Active, Paid, Overdue, Defaulted
- **Visual Indicators**: Color-coded status badges

### User Management (Admin Only)
- **Add Users**: Create new user accounts
- **Assign Roles**: Admin or User roles
- **Set Permissions**: Granular control per module (view/modify)
- **Manage Status**: Activate or deactivate accounts
- **Security**: Role-based access control

## 👥 User Management

### Roles and Permissions

**Admin Role**:
- Full access to all modules
- Can create, edit, and delete users
- Can assign permissions to other users
- Bypasses all permission checks

**User Role**:
- Custom permissions per module
- Can be granted view or modify access
- Cannot access user management
- Permissions set by administrators

### Module Permissions

Each module has two permission levels:
1. **View**: Read-only access to module data
2. **Modify**: Full access (add, edit, delete records)

**Available Modules**:
- Overview
- Blood Sugar
- Budget
- Financial
- Lending

### Getting Started with User Management

1. **Login as Admin**: Use default credentials (change immediately!)
2. **Access User Management**: Click "User Management" in sidebar
3. **Create Users**: Add user accounts with appropriate permissions
4. **Test Access**: Login with user accounts to verify permissions

**See [USER_MANAGEMENT_GUIDE.md](USER_MANAGEMENT_GUIDE.md) for detailed instructions.**

## 📊 Data Export & Backup

### Export to Excel (XLSX)

Each module has an **"Export to Excel"** button that downloads the currently displayed data:

- **Blood Sugar**: Exports filtered blood sugar records
- **Budget**: Exports current month's budget allocations
- **Financial**: Exports filtered financial transactions
- **Lending**: Exports all lending records

**File Format**: `module_name_YYYY-MM-DD_HHmm.xlsx`

### Backup All Data

The **"Backup All Data"** button (green button in Overview module) downloads ALL data from Firebase:

- Creates a single XLSX file with multiple sheets
- Includes all modules: Blood Sugar, Budget, Financial, Lending
- **File Format**: `dashboard_backup_YYYY-MM-DD_HHmm.xlsx`

### Automated GitHub Backup

Set up automated backups to save data directly to your GitHub repository:

1. **Manual Backup**:
   ```bash
   node backup-to-github.js
   git add backups/
   git commit -m "Backup: $(date +'%Y-%m-%d')"
   git push
   ```

2. **Automated Backup** (GitHub Actions):
   - Runs daily at midnight UTC
   - Can be triggered manually from Actions tab
   - Automatically commits backup files to repository

**See [BACKUP_GUIDE.md](BACKUP_GUIDE.md) for detailed instructions.**

## 🎨 Customization

### Change Colors

Edit CSS variables in `style.css`:

```css
:root {
    --primary-color: #4f46e5;
    --success-color: #10b981;
    --danger-color: #ef4444;
    /* ... */
}
```

### Add New Categories

Edit `config.js`:

```javascript
financialCategories: [
    'Income',
    'Expense',
    'Your New Category',
    // ...
]
```

### Modify Currency

Edit `config.js`:

```javascript
app: {
    currency: '₱',              // Change to $, €, etc.
    currencyPosition: 'prefix', // or 'suffix'
    // ...
}
```

## 🔧 Configuration Options

### config.js Settings

```javascript
CONFIG = {
    auth: {
        username: 'admin',
        password: 'admin123',
        sessionTimeout: 3600000  // 1 hour
    },
    api: {
        baseUrl: 'YOUR_GOOGLE_APPS_SCRIPT_URL',
        timeout: 10000
    },
    app: {
        currency: '₱',
        dateFormat: 'YYYY-MM-DD',
        itemsPerPage: 10
    },
    features: {
        darkMode: true,
        charts: true,
        export: true,
        notifications: true
    }
}
```

## 📊 Data Structure

### Blood Sugar Records
```javascript
{
    id: 'unique-id',
    datetime: '2024-01-01T10:30',
    level: 120,
    notes: 'Before breakfast'
}
```

### Financial Records
```javascript
{
    id: 'unique-id',
    date: '2024-01-01',
    category: 'Income',
    description: 'Salary',
    amount: 50000,
    status: 'Paid'
}
```

### Lending Records
```javascript
{
    id: 'unique-id',
    borrower: 'John Doe',
    amount: 10000,
    interestRate: 5,
    dueDate: '2024-12-31',
    status: 'Active'
}
```

## 🔒 Security Considerations

⚠️ **Important Security Notes**:

1. **Authentication**: The current implementation uses hardcoded credentials for demo purposes. For production:
   - Implement proper backend authentication
   - Use OAuth or JWT tokens
   - Never store passwords in plain text

2. **API Security**: 
   - The Google Apps Script is set to "Anyone" access for simplicity
   - Consider implementing API keys or OAuth for production
   - Add rate limiting to prevent abuse

3. **Data Privacy**:
   - All data is stored in your personal Google Sheet
   - Only you have access to the spreadsheet
   - Consider encrypting sensitive data

## 🐛 Troubleshooting

### Issue: Data not loading
- **Solution**: Check if Google Apps Script URL is correctly configured in `config.js`
- Verify the script is deployed and accessible
- Check browser console for errors

### Issue: Login not working
- **Solution**: Verify credentials in `config.js`
- Clear browser cache and cookies
- Check browser console for JavaScript errors

### Issue: Charts not displaying
- **Solution**: Ensure Chart.js CDN is loading
- Check internet connection
- Verify `features.charts` is set to `true` in config.js

### Issue: Mobile menu not working
- **Solution**: Clear browser cache
- Test in different browsers
- Check for JavaScript errors in console

## 🔄 Updates and Maintenance

### Updating Google Apps Script

1. Make changes to `google-apps-script.js`
2. Copy updated code to Apps Script editor
3. Click **Deploy > Manage deployments**
4. Click edit icon (pencil) on existing deployment
5. Change **Version** to "New version"
6. Click **Deploy**

### Updating Frontend

1. Make changes to HTML/CSS/JS files
2. Commit and push to GitHub
3. Changes will be live within a few minutes

## 📈 Future Enhancements

Potential features to add:
- [ ] Export data to CSV/Excel
- [ ] Import data from files
- [ ] Advanced filtering and search
- [ ] Data backup and restore
- [ ] Email notifications
- [ ] Multi-user support
- [ ] Budget planning tools
- [ ] Recurring transactions
- [ ] Payment reminders
- [ ] Advanced analytics and reports

## 🤝 Contributing

Feel free to fork this project and submit pull requests for improvements!

## 📄 License

This project is open source and available for personal use.

## 💡 Tips

1. **Regular Backups**: Download your Google Sheet regularly as backup
2. **Mobile Access**: Add to home screen for app-like experience
3. **Dark Mode**: Toggle dark mode for comfortable night viewing
4. **Filters**: Use filters to analyze specific time periods
5. **Notes**: Add detailed notes to track context for each entry

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Verify all configuration settings
4. Test with mock data first (without Google Sheets)

## 🎯 Best Practices

1. **Data Entry**: Be consistent with categories and descriptions
2. **Regular Updates**: Update records daily for accurate tracking
3. **Review**: Check overview dashboard weekly for insights
4. **Backup**: Export data monthly as backup
5. **Security**: Change default password immediately

---

**Built with ❤️ for personal productivity and health tracking**

Last Updated: 2024