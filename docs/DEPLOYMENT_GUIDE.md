# 🚀 Deployment Guide - Personal Management Dashboard

This guide provides step-by-step instructions for deploying your Personal Management Dashboard to GitHub Pages.

## 📋 Prerequisites

Before you begin, ensure you have:
- ✅ A GitHub account
- ✅ Git installed on your computer (optional, for command-line deployment)
- ✅ A Google account (for Google Sheets backend)
- ✅ All project files ready

## 🔧 Pre-Deployment Setup

### Step 1: Configure Your Credentials

1. Open `config.js`
2. Change the default login credentials:
   ```javascript
   auth: {
       username: 'your_username',    // Change this!
       password: 'your_password',    // Change this!
   }
   ```
3. **Important**: Use a strong password for production

### Step 2: Set Up Google Sheets Backend

#### Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **Blank** to create a new spreadsheet
3. Rename it to "Personal Dashboard Data"
4. Note the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[THIS_IS_YOUR_SHEET_ID]/edit
   ```


#### Deploy Google Apps Script

1. In your Google Sheet, click **Extensions > Apps Script**
2. Delete any default code
3. Open `google-apps-script.js` from your project
4. Copy all the code
5. Paste it into the Apps Script editor
6. Update line 7 with your Sheet ID:
   ```javascript
   const SHEET_ID = 'paste_your_sheet_id_here';
   ```
7. Click the **Save** icon (💾)
8. Name your project: "Personal Dashboard API"

#### Deploy as Web App

1. Click **Deploy > New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Select **Web app**
4. Fill in the deployment settings:
   - **Description**: Personal Dashboard API v1
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
5. Click **Deploy**
6. Click **Authorize access**
7. Choose your Google account
8. Click **Advanced** (if you see a warning)
9. Click **Go to [Project Name] (unsafe)**
10. Click **Allow**
11. **Copy the Web app URL** - you'll need this!
12. Click **Done**

#### Update Frontend Configuration

1. Open `config.js`
2. Find the `api` section
3. Replace the `baseUrl` with your Web app URL:
   ```javascript
   api: {
       baseUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
   }
   ```
4. Save the file

### Step 3: Test Locally

1. Open `index.html` in your web browser
2. Login with your new credentials
3. Try adding a blood sugar record
4. Check if data appears in your Google Sheet
5. Test all modules (Blood Sugar, Financial, Lending)

**If data doesn't save**: The app will work with mock data (stored in browser memory only)

## 🌐 Deployment Methods

Choose one of the following methods:

---

## Method 1: GitHub Web Interface (Easiest)

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click the **+** icon in the top right
3. Select **New repository**
4. Fill in the details:
   - **Repository name**: `personal-dashboard` (or your choice)
   - **Description**: Personal Management Dashboard
   - **Public** or **Private** (your choice)
   - ✅ Check "Add a README file" (optional)
5. Click **Create repository**

### Step 2: Upload Files

1. In your new repository, click **Add file > Upload files**
2. Drag and drop these files:
   - `index.html`
   - `style.css`
   - `script.js`
   - `config.js`
   - `README.md`
   - `DEPLOYMENT_GUIDE.md` (optional)
3. **Do NOT upload** `google-apps-script.js` (it's already in Google Apps Script)
4. Add a commit message: "Initial commit: Personal Dashboard"
5. Click **Commit changes**

### Step 3: Enable GitHub Pages

1. Go to your repository **Settings**
2. Scroll down to **Pages** in the left sidebar
3. Under **Source**, select:
   - Branch: **main** (or **master**)
   - Folder: **/ (root)**
4. Click **Save**
5. Wait 1-2 minutes for deployment
6. Your site will be available at:
   ```
   https://your-username.github.io/personal-dashboard/
   ```

### Step 4: Access Your Dashboard

1. Visit your GitHub Pages URL
2. Login with your credentials
3. Start using your dashboard!

---

## Method 2: Git Command Line (Advanced)

### Step 1: Initialize Git Repository

Open terminal/command prompt in your project folder:

```bash
# Initialize git repository
git init

# Add all files
git add index.html style.css script.js config.js README.md

# Create initial commit
git commit -m "Initial commit: Personal Management Dashboard"
```

### Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click **+** > **New repository**
3. Name it `personal-dashboard`
4. **Do NOT** initialize with README
5. Click **Create repository**
6. Copy the repository URL

### Step 3: Push to GitHub

```bash
# Add remote repository
git remote add origin https://github.com/your-username/personal-dashboard.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Enable GitHub Pages

1. Go to repository **Settings > Pages**
2. Select **main** branch
3. Click **Save**
4. Wait for deployment

---

## Method 3: GitHub Desktop (User-Friendly)

### Step 1: Install GitHub Desktop

1. Download from [desktop.github.com](https://desktop.github.com)
2. Install and sign in with your GitHub account

### Step 2: Create Repository

1. Click **File > New repository**
2. Fill in:
   - **Name**: personal-dashboard
   - **Local path**: Choose your project folder
3. Click **Create repository**

### Step 3: Commit and Publish

1. You'll see all your files listed
2. Add commit message: "Initial commit"
3. Click **Commit to main**
4. Click **Publish repository**
5. Choose **Public** or **Private**
6. Click **Publish repository**

### Step 4: Enable GitHub Pages

1. Go to your repository on GitHub.com
2. Settings > Pages
3. Select **main** branch
4. Click **Save**

---

## 🔄 Updating Your Deployed Site

### Method 1: GitHub Web Interface

1. Go to your repository
2. Click on the file you want to edit
3. Click the pencil icon (✏️) to edit
4. Make your changes
5. Scroll down and click **Commit changes**
6. Changes will be live in 1-2 minutes

### Method 2: Git Command Line

```bash
# Make your changes to files
# Then:

git add .
git commit -m "Description of changes"
git push origin main
```

### Method 3: GitHub Desktop

1. Make changes to your files
2. Open GitHub Desktop
3. Review changes
4. Add commit message
5. Click **Commit to main**
6. Click **Push origin**

---

## 🔒 Security Best Practices

### Before Deployment Checklist

- [ ] Changed default username and password in `config.js`
- [ ] Verified Google Apps Script is deployed correctly
- [ ] Tested all features locally
- [ ] Removed any test/debug data
- [ ] Reviewed all configuration settings

### After Deployment

1. **Test immediately**: Visit your site and test all features
2. **Secure your Google Sheet**: 
   - Don't share the Sheet ID publicly
   - Keep the spreadsheet private
3. **Monitor access**: Check Google Apps Script execution logs
4. **Regular backups**: Download your Google Sheet weekly

### Optional: Use Environment Variables

For added security, consider:
1. Using a separate config file for sensitive data
2. Implementing backend authentication
3. Using OAuth instead of hardcoded credentials

---

## 📱 Mobile Access

### Add to Home Screen (iOS)

1. Open your dashboard in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Name it "My Dashboard"
5. Tap "Add"

### Add to Home Screen (Android)

1. Open your dashboard in Chrome
2. Tap the menu (⋮)
3. Tap "Add to Home screen"
4. Name it "My Dashboard"
5. Tap "Add"

---

## 🐛 Troubleshooting Deployment

### Issue: GitHub Pages not working

**Solution**:
1. Check Settings > Pages is enabled
2. Verify branch is set to **main**
3. Wait 5-10 minutes for initial deployment
4. Check for typos in file names
5. Ensure `index.html` is in root directory

### Issue: 404 Error

**Solution**:
1. Verify the URL is correct: `https://username.github.io/repo-name/`
2. Check that `index.html` exists in root
3. Clear browser cache
4. Wait a few more minutes

### Issue: Data not saving

**Solution**:
1. Check Google Apps Script URL in `config.js`
2. Verify script is deployed as "Anyone" access
3. Check browser console for errors (F12)
4. Test with mock data first (comment out API URL)

### Issue: Login not working

**Solution**:
1. Verify credentials in `config.js`
2. Clear browser cache and cookies
3. Try incognito/private browsing mode
4. Check browser console for errors

### Issue: Charts not displaying

**Solution**:
1. Check internet connection (Chart.js loads from CDN)
2. Verify Chart.js CDN URL in `index.html`
3. Check browser console for errors
4. Try different browser

---

## 🎯 Post-Deployment Checklist

After successful deployment:

- [ ] Site is accessible at GitHub Pages URL
- [ ] Login works with new credentials
- [ ] Can add/edit/delete blood sugar records
- [ ] Can add/edit/delete financial transactions
- [ ] Can add/edit/delete lending records
- [ ] Data saves to Google Sheets
- [ ] Charts display correctly
- [ ] Mobile responsive design works
- [ ] Dark mode toggle works
- [ ] All notifications appear correctly

---

## 📊 Monitoring and Maintenance

### Check Google Apps Script Logs

1. Open your Apps Script project
2. Click **Executions** in left sidebar
3. Review any errors or warnings
4. Check execution frequency

### Monitor Google Sheet

1. Regularly check your Google Sheet
2. Verify data is being saved correctly
3. Look for any duplicate or corrupted entries
4. Create manual backups weekly

### Update Deployment

When you make changes:
1. Test locally first
2. Commit and push changes
3. Wait 1-2 minutes
4. Test on live site
5. Monitor for any issues

---

## 🆘 Getting Help

If you encounter issues:

1. **Check the README.md** - Comprehensive documentation
2. **Browser Console** - Press F12 to see errors
3. **Google Apps Script Logs** - Check for API errors
4. **GitHub Issues** - Create an issue in your repository
5. **Test Locally** - Verify it works before deployment

---

## 🎉 Success!

Congratulations! Your Personal Management Dashboard is now live and accessible from anywhere!

**Next Steps**:
1. Bookmark your dashboard URL
2. Add to mobile home screen
3. Start tracking your data
4. Customize colors and settings
5. Share with trusted users (if desired)

---

**Remember**: Keep your credentials secure and backup your data regularly!

**Happy Tracking! 📊💪**