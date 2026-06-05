// ===================================
// Configuration File
// ===================================

const CONFIG = {
    // Authentication
    auth: {
        // SECURITY: Config-based authentication has been removed for security
        // All users must be created in Firebase with hashed passwords
        // See FIREBASE_ADMIN_SETUP.md for initial admin user creation
        
        // Google OAuth Client ID (replace with your own)
        googleClientId: '1026123058562-r5jvr38qj3510g5jljglquehf2mvivif.apps.googleusercontent.com',
        
        // Session timeout (in milliseconds)
        sessionTimeout: 3600000 // 1 hour
    },
    
    // Firebase Configuration
    // Get these from Firebase Console: Project Settings > General > Your apps
    firebase: {
        apiKey: "AIzaSyAmLnH6zAHsoNuK9MCgMXt-Qlq2AHcfGIE",
        authDomain: "personal-dashboard-54d9f.firebaseapp.com",
        databaseURL: "https://personal-dashboard-54d9f-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "personal-dashboard-54d9f",
        storageBucket: "personal-dashboard-54d9f.firebasestorage.app",
        messagingSenderId: "863240942329",
        appId: "1:863240942329:web:2afc7c07fc91c59cb4e828",
        measurementId: "G-43JN097S6D"
    },
    
    // Database Type: 'firebase' or 'mock'
    databaseType: 'firebase', // Change to 'mock' to use offline mode
    
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
