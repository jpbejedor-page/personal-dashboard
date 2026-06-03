// ===================================
// Configuration File
// ===================================

const CONFIG = {
    // Authentication
    auth: {
        // Hardcoded credentials (for demo purposes)
        // In production, use proper authentication
        username: 'jayps',
        password: 'Y@hWeh101!',
        
        // Google OAuth Client ID (replace with your own)
        googleClientId: '1026123058562-r5jvr38qj3510g5jljglquehf2mvivif.apps.googleusercontent.com',
        
        // Session timeout (in milliseconds)
        sessionTimeout: 3600000 // 1 hour
    },
    
    // Google Sheets API Configuration
    api: {
        // Replace with your Google Apps Script Web App URL
        //baseUrl: 'https://script.google.com/macros/s/AKfycbyCV0HYW7ciX63Fx4aMld2777IXXSvDhqv5507ykVk9xZs3FlZVjDIP4q5FR48FWiBdEA/exec',
        baseUrl: 'https://script.google.com/macros/s/AKfycbwwhqjc_IQDJ3FIHIv35xSMat_xjDBCMvRexAla9n4AqMQOB-edjm-04YxB2oiGN6sU2g/exec',
        // Sheet names
        sheets: {
            bloodSugar: 'BloodSugar',
            financial: 'Financial',
            lending: 'Lending'
        },
        
        // API timeout (in milliseconds)
        timeout: 10000
    },
    
    // Application Settings
    app: {
        name: 'Personal Dashboard',
        version: '1.0.0',
        
        // Date format
        dateFormat: 'YYYY-MM-DD',
        dateTimeFormat: 'YYYY-MM-DD HH:mm',
        
        // Currency
        currency: '₱',
        currencyPosition: 'prefix', // 'prefix' or 'suffix'
        
        // Pagination
        itemsPerPage: 10,
        
        // Chart colors
        chartColors: {
            primary: '#4f46e5',
            success: '#10b981',
            danger: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6',
            secondary: '#64748b'
        }
    },
    
    // Blood Sugar Thresholds
    bloodSugar: {
        low: 70,
        normal: { min: 70, max: 140 },
        high: 140,
        critical: 180
    },
    
    // Financial Categories
    financialCategories: [
        'Income',
        'Expense',
        'Loan',
        'Investment',
        'Savings',
        'Other'
    ],
    
    // Expense Subcategories
    expenseSubcategories: [
        'Food & Dining',
        'Transportation',
        'Utilities',
        'Healthcare',
        'Entertainment',
        'Shopping',
        'Education',
        'Other'
    ],
    
    // Income Sources
    incomeSources: [
        'Salary',
        'Business',
        'Investment',
        'Freelance',
        'Other'
    ],
    
    // Payment Status Options
    paymentStatus: [
        'Paid',
        'Pending',
        'Overdue',
        'Cancelled'
    ],
    
    // Loan Status Options
    loanStatus: [
        'Active',
        'Paid',
        'Overdue',
        'Defaulted'
    ],
    
    // Features Toggle
    features: {
        darkMode: true,
        charts: true,
        export: true,
        notifications: true,
        googleLogin: true, // Set to true when Google OAuth is configured
        offlineMode: false
    }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);

// Made with Bob
