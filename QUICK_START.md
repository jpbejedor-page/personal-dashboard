# ⚡ Quick Start Guide

Get your Personal Management Dashboard up and running in 5 minutes!

## 🎯 What You'll Need
- A web browser
- A Google account
- 5 minutes of your time

## 🚀 3-Step Setup

### Step 1: Configure Login (30 seconds)

Open `config.js` and change:
```javascript
username: 'admin',      // ← Change this
password: 'admin123',   // ← Change this
```

### Step 2: Set Up Google Sheets (2 minutes)

1. **Create a Google Sheet**
   - Go to [sheets.google.com](https://sheets.google.com)
   - Create new spreadsheet
   - Copy the ID from URL: `docs.google.com/spreadsheets/d/[COPY_THIS_ID]/edit`

2. **Deploy Apps Script**
   - In your sheet: Extensions → Apps Script
   - Copy all code from `google-apps-script.js`
   - Paste into editor
   - Update line 7: `const SHEET_ID = 'YOUR_ID_HERE';`
   - Click Deploy → New deployment → Web app
   - Set "Who has access" to "Anyone"
   - Copy the Web app URL

3. **Update Frontend**
   - Open `config.js`
   - Paste your Web app URL:
   ```javascript
   baseUrl: 'https://script.google.com/macros/s/YOUR_URL/exec',
   ```

### Step 3: Test It! (1 minute)

1. Open `index.html` in your browser
2. Login with your new credentials
3. Add a test record
4. Check your Google Sheet - data should appear!

## 🌐 Deploy to GitHub Pages (Optional)

1. Create new GitHub repository
2. Upload all files (except `google-apps-script.js`)
3. Go to Settings → Pages
4. Select "main" branch
5. Your site is live at: `https://username.github.io/repo-name/`

## 📱 Features Overview

### 🏠 Overview Dashboard
- See all your stats at a glance
- Visual charts for trends
- Quick summary cards

### 🩺 Blood Sugar Monitoring
- Track glucose levels
- Add date, time, and notes
- View trends over time

### 💰 Financial Tracking
- Record income and expenses
- Filter by category and date
- See balance summary

### 🤝 Lending Business
- Track loans to others
- Monitor due dates
- Update payment status

## 🎨 Customization

### Change Colors
Edit `style.css`:
```css
:root {
    --primary-color: #4f46e5;  /* Change this */
}
```

### Change Currency
Edit `config.js`:
```javascript
currency: '₱',  /* Change to $, €, £, etc. */
```

### Add Categories
Edit `config.js`:
```javascript
financialCategories: [
    'Income',
    'Expense',
    'Your New Category'  /* Add here */
]
```

## 🔑 Default Credentials

**Username:** `admin`  
**Password:** `admin123`

⚠️ **Change these immediately in `config.js`!**

## 💡 Pro Tips

1. **Mobile Access**: Add to home screen for app-like experience
2. **Dark Mode**: Toggle in sidebar for night use
3. **Backup**: Download your Google Sheet weekly
4. **Filters**: Use date filters to analyze specific periods
5. **Notes**: Add context to each entry for better tracking

## 🐛 Troubleshooting

**Data not saving?**
- Check Google Apps Script URL in config.js
- Verify script is deployed
- App works with mock data if not connected

**Can't login?**
- Check credentials in config.js
- Clear browser cache
- Try incognito mode

**Charts not showing?**
- Check internet connection (needs Chart.js CDN)
- Refresh the page
- Check browser console (F12)

## 📚 Need More Help?

- **Full Documentation**: See `README.md`
- **Deployment Guide**: See `DEPLOYMENT_GUIDE.md`
- **Browser Console**: Press F12 to see errors

## ✅ Quick Checklist

Before using:
- [ ] Changed default username/password
- [ ] Created Google Sheet
- [ ] Deployed Apps Script
- [ ] Updated config.js with Web app URL
- [ ] Tested login
- [ ] Added test record
- [ ] Verified data in Google Sheet

## 🎉 You're Ready!

Start tracking your health and finances today!

**Happy Tracking! 📊💪**

---

**Need detailed instructions?** Check `README.md` and `DEPLOYMENT_GUIDE.md`