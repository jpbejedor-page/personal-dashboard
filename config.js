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
    
    // Firebase Configuration
    // Get these from Firebase Console: Project Settings > General > Your apps
    firebase: {
        apiKey: "YOUR_FIREBASE_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    },
    
    // Database Type: 'firebase' or 'mock'
    databaseType: 'firebase', // Change to 'mock' to use offline mode
    
    // Google Sheets API Configuration (Legacy - kept for reference)
    api: {
        // Replace with your Google Apps Script Web App URL
        baseUrl: 'https://script.google.com/macros/s/AKfycbz7AWT_J01uSK5jWYt-i_xRB1u2VK5iAO5E3sBU7Jxa9wgcRPU7b0GP9uAeTGQzASvj/exec',
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
