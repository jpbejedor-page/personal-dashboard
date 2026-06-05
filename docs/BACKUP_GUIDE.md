# Data Backup Guide

This guide explains how to backup your Personal Dashboard data to GitHub.

## Overview

The dashboard provides two types of data export:

1. **Export Buttons** (in each module) - Download currently displayed/filtered data as XLSX
2. **Backup Button** (in Overview) - Download all data from Firebase as a single XLSX file
3. **Automated GitHub Backup** - Automatically save backups to the repository

## Export vs Backup

### Export (Download)
- **Location**: Each module (Blood Sugar, Budget, Financial, Lending)
- **Button**: "Export to Excel" (gray button)
- **Function**: Downloads only the currently displayed/filtered data
- **Use Case**: Quick exports for analysis or sharing specific data
- **File Location**: Downloads to your browser's download folder

### Backup (Download All)
- **Location**: Overview module
- **Button**: "Backup All Data" (green button)
- **Function**: Downloads ALL data from Firebase database
- **Use Case**: Complete data backup for safekeeping
- **File Location**: Downloads to your browser's download folder
- **File Format**: Single XLSX file with multiple sheets (Blood Sugar, Budget, Financial, Lending)

## Automated GitHub Backup

### Setup

1. **Install Node.js Dependencies**
   ```bash
   npm install xlsx
   # If using Firebase Admin SDK:
   npm install firebase-admin
   ```

2. **Configure Firebase Credentials**
   
   Add your Firebase credentials to GitHub Secrets:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `FIREBASE_DATABASE_URL`: Your Firebase Realtime Database URL
     - `FIREBASE_SERVICE_ACCOUNT`: Your Firebase service account JSON (if using Admin SDK)

3. **Update backup-to-github.js**
   
   Edit the `fetchDataFromFirebase()` function to implement actual Firebase data fetching:
   
   ```javascript
   async function fetchDataFromFirebase() {
       const admin = require('firebase-admin');
       
       // Initialize Firebase Admin
       admin.initializeApp({
           credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
           databaseURL: process.env.FIREBASE_DATABASE_URL
       });
       
       const db = admin.database();
       
       // Fetch all data
       const bloodSugar = await db.ref('bloodSugar').once('value');
       const budget = await db.ref('budget').once('value');
       const financial = await db.ref('financial').once('value');
       const lending = await db.ref('lending').once('value');
       
       return {
           bloodSugar: Object.values(bloodSugar.val() || {}),
           budget: Object.values(budget.val() || {}),
           financial: Object.values(financial.val() || {}),
           lending: Object.values(lending.val() || {})
       };
   }
   ```

### Manual Backup

Run the backup script manually:

```bash
node backup-to-github.js
```

This will:
1. Fetch all data from Firebase
2. Create an XLSX file in the `backups/` folder
3. Display git commands to commit the backup

Then commit and push:

```bash
git add backups/
git commit -m "Manual backup: $(date +'%Y-%m-%d')"
git push
```

### Automated Backup (GitHub Actions)

The repository includes a GitHub Actions workflow that can:

1. **Run Manually**
   - Go to Actions tab in your GitHub repository
   - Select "Backup Dashboard Data"
   - Click "Run workflow"

2. **Run Automatically**
   - Scheduled to run daily at midnight UTC
   - Edit `.github/workflows/backup-data.yml` to change schedule

### Backup File Structure

```
backups/
├── README.md
├── dashboard_backup_2026-06-03_0900.xlsx
├── dashboard_backup_2026-06-04_0900.xlsx
└── dashboard_backup_2026-06-05_0900.xlsx
```

Each backup file contains multiple sheets:
- **Blood Sugar**: All blood sugar records
- **Budget**: All budget allocations
- **Financial**: All financial transactions
- **Lending**: All lending business records

## Backup File Naming

Format: `dashboard_backup_YYYY-MM-DD_HHmm.xlsx`

Example: `dashboard_backup_2026-06-03_1430.xlsx`
- Date: June 3, 2026
- Time: 2:30 PM

## Restoring from Backup

To restore data from a backup:

1. Open the XLSX file
2. Review the data in each sheet
3. Manually import data back to Firebase using the dashboard interface
4. Or use a custom import script (to be implemented)

## Best Practices

1. **Regular Backups**: Run backups at least weekly
2. **Version Control**: Keep multiple backup versions
3. **Verify Backups**: Periodically open backup files to ensure data integrity
4. **Secure Storage**: GitHub private repositories are recommended for sensitive data
5. **Local Copies**: Download important backups to local storage as well

## Troubleshooting

### Backup Script Fails

1. Check Node.js is installed: `node --version`
2. Verify dependencies are installed: `npm list`
3. Check Firebase credentials are correct
4. Review error messages in console

### GitHub Actions Fails

1. Check GitHub Secrets are configured correctly
2. Review workflow logs in Actions tab
3. Ensure repository has write permissions for GitHub Actions

### Empty Backup Files

1. Verify Firebase database has data
2. Check Firebase connection in backup script
3. Review console logs for errors

## Security Notes

- Never commit Firebase credentials directly to the repository
- Use GitHub Secrets for sensitive information
- Consider encrypting backup files if they contain sensitive data
- Regularly review who has access to your repository

## Support

For issues or questions:
1. Check the error messages in console
2. Review Firebase connection settings
3. Verify GitHub Actions configuration
4. Check backup file permissions

---

**Made with Bob**