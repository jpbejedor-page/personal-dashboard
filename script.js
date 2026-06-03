// ===================================
// Personal Dashboard - Main JavaScript
// ===================================

// ===================================
// Global State Management
// ===================================
const AppState = {
    currentUser: null,
    currentModule: 'overview',
    data: {
        bloodSugar: [],
        budget: [],
        financial: [],
        lending: []
    },
    charts: {},
    isLoading: false
};

// ===================================
// Utility Functions
// ===================================
const Utils = {
    // Format date
    formatDate(date, format = CONFIG.app.dateFormat) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes);
    },
    
    // Format currency
    formatCurrency(amount) {
        const formatted = parseFloat(amount).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        return CONFIG.app.currencyPosition === 'prefix' 
            ? `${CONFIG.app.currency}${formatted}`
            : `${formatted}${CONFIG.app.currency}`;
    },
    
    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Get current date in input format
    getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    },
    
    // Get current datetime in input format
    getCurrentDateTime() {
        const now = new Date();
        const offset = now.getTimezoneOffset();
        const localDate = new Date(now.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().slice(0, 16);
    }
,
    
    // Export data to XLSX
    exportToXLSX(data, filename, sheetName = 'Sheet1') {
        try {
            // Create a new workbook
            const wb = XLSX.utils.book_new();
            
            // Convert data to worksheet
            const ws = XLSX.utils.json_to_sheet(data);
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            
            // Generate filename with timestamp
            const timestamp = this.formatDate(new Date(), 'YYYY-MM-DD_HHmm');
            const fullFilename = `${filename}_${timestamp}.xlsx`;
            
            // Write file
            XLSX.writeFile(wb, fullFilename);
            
            return true;
        } catch (error) {
            console.error('Error exporting to XLSX:', error);
            return false;
        }
    },
    
    // Backup all data to a single XLSX file with multiple sheets
    backupAllData() {
        try {
            // Create a new workbook
            const wb = XLSX.utils.book_new();
            
            // Blood Sugar Data
            if (AppState.data.bloodSugar.length > 0) {
                const bloodSugarData = AppState.data.bloodSugar.map(item => ({
                    'Date & Time': this.formatDate(item.datetime, CONFIG.app.dateTimeFormat),
                    'Meal Timing': item.mealTiming === 'fasting' ? 'Fasting' : `${item.mealTiming}h after meal`,
                    'Level (mg/dL)': item.level,
                    'Notes': item.notes || ''
                }));
                const ws1 = XLSX.utils.json_to_sheet(bloodSugarData);
                XLSX.utils.book_append_sheet(wb, ws1, 'Blood Sugar');
            }
            
            // Budget Data
            if (AppState.data.budget.length > 0) {
                const budgetData = [];
                AppState.data.budget.forEach(budget => {
                    budgetData.push({
                        'Month': budget.monthKey,
                        'Monthly Salary': parseFloat(budget.salary),
                        'Category': 'TOTAL',
                        'Amount': parseFloat(budget.salary),
                        'Percentage': '100%'
                    });
                    
                    if (budget.allocations && budget.allocations.length > 0) {
                        budget.allocations.forEach(alloc => {
                            budgetData.push({
                                'Month': budget.monthKey,
                                'Monthly Salary': '',
                                'Category': alloc.category,
                                'Amount': parseFloat(alloc.amount),
                                'Percentage': `${((alloc.amount / budget.salary) * 100).toFixed(2)}%`
                            });
                        });
                    }
                    
                    // Add empty row between budgets
                    budgetData.push({
                        'Month': '',
                        'Monthly Salary': '',
                        'Category': '',
                        'Amount': '',
                        'Percentage': ''
                    });
                });
                const ws2 = XLSX.utils.json_to_sheet(budgetData);
                XLSX.utils.book_append_sheet(wb, ws2, 'Budget');
            }
            
            // Financial Data
            if (AppState.data.financial.length > 0) {
                const financialData = AppState.data.financial.map(item => ({
                    'Date': this.formatDate(item.date),
                    'Category': item.category,
                    'Description': item.description,
                    'Amount': parseFloat(item.amount),
                    'Status': item.status
                }));
                const ws3 = XLSX.utils.json_to_sheet(financialData);
                XLSX.utils.book_append_sheet(wb, ws3, 'Financial');
            }
            
            // Lending Data
            if (AppState.data.lending.length > 0) {
                const lendingData = AppState.data.lending.map(item => {
                    const principal = parseFloat(item.principal || 0);
                    const interestRate = parseFloat(item.interestRate || 0);
                    const totalDue = principal + (principal * interestRate / 100);
                    const totalPaid = (item.payments || []).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                    const balance = totalDue - totalPaid;
                    
                    return {
                        'Borrower': item.borrower,
                        'Start Date': this.formatDate(item.startDate),
                        'Principal': principal,
                        'Interest Rate': `${interestRate}%`,
                        'Payment Terms': item.paymentTerms,
                        'Total Due': totalDue,
                        'Total Paid': totalPaid,
                        'Balance': balance,
                        'Status': balance <= 0 ? 'Fully Paid' : 'Active'
                    };
                });
                const ws4 = XLSX.utils.json_to_sheet(lendingData);
                XLSX.utils.book_append_sheet(wb, ws4, 'Lending');
            }
            
            // Check if there's any data to export
            if (wb.SheetNames.length === 0) {
                Notification.warning('No data available to backup');
                return false;
            }
            
            // Generate filename with timestamp
            const timestamp = this.formatDate(new Date(), 'YYYY-MM-DD_HHmm');
            const filename = `dashboard_backup_${timestamp}.xlsx`;
            
            // Write file
            XLSX.writeFile(wb, filename);
            
            return true;
        } catch (error) {
            console.error('Error backing up data:', error);
            return false;
        }
    }
};

// ===================================
// Notification System
// ===================================
const Notification = {
    show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    },
    
    success(message) {
        this.show(message, 'success');
    },
    
    error(message) {
        this.show(message, 'error', 5000);
    },
    
    warning(message) {
        this.show(message, 'warning');
    },
    
    info(message) {
        this.show(message, 'info');
    }
};

// ===================================
// Modal System
// ===================================
const Modal = {
    show(title, content, size = 'normal') {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        // Remove any existing size classes
        modalContent.classList.remove('large', 'normal');
        
        // Add size class
        if (size === 'large') {
            modalContent.classList.add('large');
        }
        
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modal.style.display = 'flex';
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    },
    
    hide() {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');
        modal.style.display = 'none';
        
        // Remove size classes
        modalContent.classList.remove('large', 'normal');
        
        document.body.style.overflow = '';
    }
};

// ===================================
// Mock API (for offline/testing mode)
// ===================================
const MockAPI = {
    data: {
        bloodSugar: [],
        budget: [],
        financial: [],
        lending: []
    },
    
    async getBloodSugar() {
        return { data: this.data.bloodSugar };
    },
    
    async addBloodSugar(data) {
        const record = { id: Utils.generateId(), ...data };
        this.data.bloodSugar.push(record);
        return { success: true, data: record };
    },
    
    async updateBloodSugar(id, data) {
        const index = this.data.bloodSugar.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data.bloodSugar[index] = { ...this.data.bloodSugar[index], ...data };
            return { success: true };
        }
        return { error: 'Record not found' };
    },
    
    async deleteBloodSugar(id) {
        this.data.bloodSugar = this.data.bloodSugar.filter(item => item.id !== id);
        return { success: true };
    },
    
    async getBudget() {
        return { data: this.data.budget };
    },
    
    async addBudget(data) {
        const record = { id: Utils.generateId(), ...data };
        this.data.budget.push(record);
        return { success: true, data: record };
    },
    
    async updateBudget(id, data) {
        const index = this.data.budget.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data.budget[index] = { ...this.data.budget[index], ...data };
            return { success: true };
        }
        return { error: 'Record not found' };
    },
    
    async deleteBudget(id) {
        this.data.budget = this.data.budget.filter(item => item.id !== id);
        return { success: true };
    },
    
    async getFinancial() {
        return { data: this.data.financial };
    },
    
    async addFinancial(data) {
        const record = { id: Utils.generateId(), ...data };
        this.data.financial.push(record);
        return { success: true, data: record };
    },
    
    async updateFinancial(id, data) {
        const index = this.data.financial.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data.financial[index] = { ...this.data.financial[index], ...data };
            return { success: true };
        }
        return { error: 'Record not found' };
    },
    
    async deleteFinancial(id) {
        this.data.financial = this.data.financial.filter(item => item.id !== id);
        return { success: true };
    },
    
    async getLending() {
        return { data: this.data.lending };
    },
    
    async addLending(data) {
        const record = { id: Utils.generateId(), ...data };
        this.data.lending.push(record);
        return { success: true, data: record };
    },
    
    async updateLending(id, data) {
        const index = this.data.lending.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data.lending[index] = { ...this.data.lending[index], ...data };
            return { success: true };
        }
        return { error: 'Record not found' };
    },
    
    async deleteLending(id) {
        this.data.lending = this.data.lending.filter(item => item.id !== id);
        return { success: true };
    }
};

// Select API based on configuration
let DataAPI;
if (typeof CONFIG !== 'undefined' && CONFIG.databaseType === 'firebase' && typeof FirebaseAPI !== 'undefined') {
    DataAPI = FirebaseAPI;
    console.log('Using Firebase Realtime Database');
} else {
    DataAPI = MockAPI;
    console.log('Using Mock API (offline mode)');
}

// ===================================
// Authentication Module
// ===================================
const Auth = {
    init() {
        // Check if user is already logged in
        const user = localStorage.getItem('currentUser');
        if (user) {
            AppState.currentUser = JSON.parse(user);
            this.showDashboard();
        }
        
        // Login form handler
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
        
        // Google login handler
        document.getElementById('googleLoginBtn').addEventListener('click', () => {
            this.googleLogin();
        });
        
        // Logout handlers
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('logoutBtnMobile').addEventListener('click', () => this.logout());
        
        // Export data handler
        document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
    },
    
    login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        
        if (username === CONFIG.auth.username && password === CONFIG.auth.password) {
            const user = { username, loginTime: Date.now() };
            AppState.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            this.showDashboard();
            Notification.success('Login successful!');
        } else {
            errorDiv.textContent = 'Invalid username or password';
            errorDiv.style.display = 'block';
        }
    },
    
    googleLogin() {
        if (!CONFIG.features.googleLogin) {
            Notification.warning('Google login is not configured. Please set up Google OAuth in config.js');
            return;
        }
        
        // Google OAuth implementation would go here
        Notification.info('Google login feature coming soon!');
    },
    
    exportData() {
        if (typeof XLSX === 'undefined') {
            Notification.error('Export library not loaded. Please refresh the page.');
            return;
        }
        
        try {
            // Create a new workbook
            const wb = XLSX.utils.book_new();
            
            // Export Blood Sugar data
            if (AppState.data.bloodSugar.length > 0) {
                const bloodSugarData = AppState.data.bloodSugar.map(item => ({
                    'Date & Time': item.datetime,
                    'Blood Sugar Level (mg/dL)': item.level,
                    'Meal Timing': item.mealTiming || '',
                    'Notes': item.notes || ''
                }));
                const ws1 = XLSX.utils.json_to_sheet(bloodSugarData);
                XLSX.utils.book_append_sheet(wb, ws1, 'Blood Sugar');
            }
            
            // Export Budget data
            if (AppState.data.budget.length > 0) {
                const budgetData = [];
                AppState.data.budget.forEach(budget => {
                    budgetData.push({
                        'Month': budget.month,
                        'Monthly Salary': budget.salary,
                        'Category': '',
                        'Amount': '',
                        'Percentage': ''
                    });
                    if (budget.allocations && budget.allocations.length > 0) {
                        budget.allocations.forEach(alloc => {
                            const percentage = budget.salary > 0 ? ((parseFloat(alloc.amount) / parseFloat(budget.salary)) * 100).toFixed(1) : 0;
                            budgetData.push({
                                'Month': '',
                                'Monthly Salary': '',
                                'Category': alloc.category,
                                'Amount': alloc.amount,
                                'Percentage': percentage + '%'
                            });
                        });
                    }
                });
                const ws2 = XLSX.utils.json_to_sheet(budgetData);
                XLSX.utils.book_append_sheet(wb, ws2, 'Salary Budget');
            }
            
            // Export Financial data
            if (AppState.data.financial.length > 0) {
                const financialData = AppState.data.financial.map(item => ({
                    'Date': item.date,
                    'Category': item.category,
                    'Amount': item.amount,
                    'Description': item.description || '',
                    'Status': item.status || ''
                }));
                const ws3 = XLSX.utils.json_to_sheet(financialData);
                XLSX.utils.book_append_sheet(wb, ws3, 'Financial');
            }
            
            // Export Lending data
            if (AppState.data.lending.length > 0) {
                const lendingData = AppState.data.lending.map(item => ({
                    'Borrower Name': item.borrowerName,
                    'Amount': item.amount,
                    'Interest Rate (%)': item.interestRate,
                    'Start Date': item.startDate,
                    'Due Date': item.dueDate,
                    'Status': item.status,
                    'Payment Schedule': item.paymentSchedule ? JSON.stringify(item.paymentSchedule) : '',
                    'Notes': item.notes || ''
                }));
                const ws4 = XLSX.utils.json_to_sheet(lendingData);
                XLSX.utils.book_append_sheet(wb, ws4, 'Lending Business');
            }
            
            // Generate filename with current date
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const filename = `Dashboard_Backup_${dateStr}.xlsx`;
            
            // Write and download the file
            XLSX.writeFile(wb, filename);
            
            Notification.success('Data exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            Notification.error('Failed to export data. Please try again.');
        }
    },
    
    logout() {
        AppState.currentUser = null;
        localStorage.removeItem('currentUser');
        
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        
        Notification.info('Logged out successfully');
    },
    
    showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        
        // Initialize dashboard
        Dashboard.init();
    }
};

// ===================================
// Dashboard Module
// ===================================
const Dashboard = {
    init() {
        this.setupNavigation();
        this.setupMobileMenu();
        this.setupDarkMode();
        this.loadAllData();
    },
    
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const module = item.dataset.module;
                this.switchModule(module);
                
                // Close mobile menu
                document.getElementById('sidebar').classList.remove('open');
            });
        });
    },
    
    switchModule(moduleName) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.module === moduleName) {
                item.classList.add('active');
            }
        });
        
        // Update active module
        document.querySelectorAll('.module').forEach(module => {
            module.classList.remove('active');
        });
        document.getElementById(`${moduleName}-module`).classList.add('active');
        
        // Update mobile title
        const titles = {
            overview: 'Overview',
            'blood-sugar': 'Blood Sugar',
            financial: 'Financial',
            lending: 'Lending Business'
        };
        document.querySelector('.mobile-title').textContent = titles[moduleName];
        
        AppState.currentModule = moduleName;
    },
    
    setupMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
        
        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });
    },
    
    setupDarkMode() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        }
        
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDark);
            
            darkModeToggle.innerHTML = isDark 
                ? '<i class="fas fa-sun"></i> Light Mode'
                : '<i class="fas fa-moon"></i> Dark Mode';
        });
    },
    
    async loadAllData() {
        try {
            AppState.isLoading = true;
            
            // Load all data in parallel
            const [bloodSugar, budget, financial, lending] = await Promise.all([
                DataAPI.getBloodSugar(),
                DataAPI.getBudget(),
                DataAPI.getFinancial(),
                DataAPI.getLending()
            ]);
            
            AppState.data.bloodSugar = bloodSugar.data || [];
            AppState.data.budget = budget.data || [];
            AppState.data.financial = financial.data || [];
            AppState.data.lending = lending.data || [];
            
            // Initialize modules
            Overview.init();
            BloodSugar.init();
            Budget.init();
            Financial.init();
            Lending.init();
            
            AppState.isLoading = false;
        } catch (error) {
            console.error('Error loading data:', error);
            Notification.error('Failed to load data. Using offline mode.');
            AppState.isLoading = false;
        }
    }
};

// ===================================
// Overview Module
// ===================================
const Overview = {
    init() {
        this.updateStats();
        this.initCharts();
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        // Add event listener for blood sugar range filter
        const rangeFilter = document.getElementById('bloodSugarRangeFilter');
        if (rangeFilter) {
            rangeFilter.addEventListener('change', (e) => {
                this.createBloodSugarChart(e.target.value);
            });
        }
        
        // Add event listener for backup all data button
        const backupBtn = document.getElementById('backupAllDataBtn');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                this.backupAllData();
            });
        }
    },
    
    backupAllData() {
        const success = Utils.backupAllData();
        
        if (success) {
            Notification.success('All data backed up successfully!');
        } else {
            Notification.error('Failed to backup data');
        }
    },
    
    updateStats() {
        // Latest Blood Sugar
        const bloodSugarData = AppState.data.bloodSugar;
        if (bloodSugarData.length > 0) {
            const latest = bloodSugarData[bloodSugarData.length - 1];
            document.getElementById('latestBloodSugar').textContent = latest.level || '--';
        }
        
        // Financial stats (current month)
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyFinancial = AppState.data.financial.filter(item => 
            item.date && item.date.startsWith(currentMonth)
        );
        
        const income = monthlyFinancial
            .filter(item => item.category === 'Income')
            .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        
        const expenses = monthlyFinancial
            .filter(item => item.category === 'Expense')
            .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        
        document.getElementById('totalIncome').textContent = Utils.formatCurrency(income);
        document.getElementById('totalExpenses').textContent = Utils.formatCurrency(expenses);
        
        // Active loans
        const activeLoans = AppState.data.lending.filter(item => 
            item.status === 'Active' || item.status === 'Overdue'
        ).length;
        
        document.getElementById('activeLoans').textContent = activeLoans;
    },
    
    initCharts() {
        if (!CONFIG.features.charts || typeof Chart === 'undefined') {
            return;
        }
        
        this.createBloodSugarChart();
        this.createFinancialChart();
    },
    
    createBloodSugarChart(daysFilter = 'all') {
        const canvas = document.getElementById('bloodSugarChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Filter data based on selected range
        let filteredData = [...AppState.data.bloodSugar];
        
        if (daysFilter !== 'all') {
            const days = parseInt(daysFilter);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            filteredData = filteredData.filter(item => {
                const itemDate = new Date(item.datetime);
                return itemDate >= cutoffDate;
            });
        }
        
        // Sort by date
        filteredData.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        
        const labels = filteredData.map(item => Utils.formatDate(item.datetime, 'MM/DD HH:mm'));
        const data = filteredData.map(item => parseFloat(item.level));
        
        if (AppState.charts.bloodSugar) {
            AppState.charts.bloodSugar.destroy();
        }
        
        AppState.charts.bloodSugar = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Blood Sugar (mg/dL)',
                    data: data,
                    borderColor: CONFIG.app.chartColors.warning,
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Blood Sugar: ${context.parsed.y} mg/dL`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 50,
                        max: 200,
                        title: {
                            display: true,
                            text: 'mg/dL'
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    },
    
    createFinancialChart() {
        const canvas = document.getElementById('financialChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Calculate totals by category
        const categories = {};
        AppState.data.financial.forEach(item => {
            const cat = item.category || 'Other';
            categories[cat] = (categories[cat] || 0) + parseFloat(item.amount || 0);
        });
        
        if (AppState.charts.financial) {
            AppState.charts.financial.destroy();
        }
        
        AppState.charts.financial = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: [
                        CONFIG.app.chartColors.success,
                        CONFIG.app.chartColors.danger,
                        CONFIG.app.chartColors.info,
                        CONFIG.app.chartColors.warning,
                        CONFIG.app.chartColors.secondary
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
};

// ===================================
// Blood Sugar Module
// ===================================
const BloodSugar = {
    init() {
        this.renderTable();
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        document.getElementById('addBloodSugarBtn').addEventListener('click', () => {
            this.showAddModal();
        });
        
        document.getElementById('exportBloodSugarBtn').addEventListener('click', () => {
            this.exportData();
        });
    },
    
    exportData() {
        const data = AppState.data.bloodSugar;
        
        if (data.length === 0) {
            Notification.warning('No data to export');
            return;
        }
        
        // Prepare data for export
        const exportData = data.map(item => ({
            'Date & Time': Utils.formatDate(item.datetime, CONFIG.app.dateTimeFormat),
            'Meal Timing': this.formatMealTiming(item.mealTiming),
            'Level (mg/dL)': item.level,
            'Status': this.getHealthIndicator(item.level, item.mealTiming).label,
            'Notes': item.notes || ''
        }));
        
        // Export to XLSX
        const success = Utils.exportToXLSX(exportData, 'blood_sugar_data', 'Blood Sugar Records');
        
        if (success) {
            Notification.success('Data exported successfully!');
        } else {
            Notification.error('Failed to export data');
        }
    },
    
    renderTable() {
        const tbody = document.getElementById('bloodSugarTableBody');
        const data = AppState.data.bloodSugar;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No records found</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(item => {
            const indicator = this.getHealthIndicator(item.level, item.mealTiming);
            return `
                <tr>
                    <td data-label="Date & Time">${Utils.formatDate(item.datetime, CONFIG.app.dateTimeFormat)}</td>
                    <td data-label="Meal Timing">${this.formatMealTiming(item.mealTiming)}</td>
                    <td data-label="Level">${item.level} mg/dL</td>
                    <td data-label="Status">
                        <span class="blood-sugar-indicator ${indicator.class}" title="${indicator.description}">
                            ${indicator.icon} ${indicator.label}
                        </span>
                    </td>
                    <td data-label="Notes">${item.notes || '-'}</td>
                    <td data-label="Actions">
                        <div class="action-buttons">
                            <button class="action-btn" onclick="BloodSugar.edit('${item.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="BloodSugar.delete('${item.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    formatMealTiming(timing) {
        if (!timing) return '-';
        if (timing === 'fasting') return 'Fasting';
        return `${timing}h after meal`;
    },
    
    getHealthIndicator(level, mealTiming) {
        const lvl = parseFloat(level);
        const isFasting = mealTiming === 'fasting';
        
        // Very High: > 250
        if (lvl > 250) {
            return {
                icon: '🚨',
                label: 'Very High',
                class: 'very-high',
                description: 'Very high - take action / seek advice'
            };
        }
        
        // High: > 180
        if (lvl > 180) {
            return {
                icon: '🔴',
                label: 'High',
                class: 'high',
                description: 'High - monitor and correct'
            };
        }
        
        // Elevated (fasting only): > 100
        if (isFasting && lvl > 100) {
            return {
                icon: '⚠️',
                label: 'Elevated',
                class: 'elevated',
                description: 'Elevated fasting level'
            };
        }
        
        // Low: < 80
        if (lvl < 80) {
            return {
                icon: '⚠️',
                label: 'Low',
                class: 'low',
                description: 'Low - treat immediately'
            };
        }
        
        // Target ranges
        if (isFasting) {
            // Fasting: 80-99
            if (lvl >= 80 && lvl <= 99) {
                return {
                    icon: '✅',
                    label: 'Target',
                    class: 'target',
                    description: 'Target range (fasting: 80-99)'
                };
            }
        } else {
            // After meal: < 180
            if (lvl < 180) {
                return {
                    icon: '✅',
                    label: 'Target',
                    class: 'target',
                    description: 'Target range (after meal: < 180)'
                };
            }
        }
        
        // Default
        return {
            icon: '⚠️',
            label: 'Monitor',
            class: 'elevated',
            description: 'Monitor closely'
        };
    },
    
    showAddModal() {
        const content = `
            <form id="bloodSugarForm" class="modal-form">
                <div class="form-group">
                    <label for="bsDatetime">Date & Time *</label>
                    <input type="datetime-local" id="bsDatetime" required value="${Utils.getCurrentDateTime()}">
                </div>
                <div class="form-group">
                    <label for="bsMealTiming">Meal Timing *</label>
                    <select id="bsMealTiming" required>
                        <option value="">Select timing</option>
                        <option value="fasting">Fasting</option>
                        <option value="1">1 hour after meal</option>
                        <option value="2">2 hours after meal</option>
                        <option value="3">3 hours after meal</option>
                        <option value="4">4 hours after meal</option>
                        <option value="5">5+ hours after meal</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="bsLevel">Blood Sugar Level (mg/dL) *</label>
                    <input type="number" id="bsLevel" required min="0" step="0.1">
                </div>
                <div class="form-group">
                    <label for="bsNotes">Notes</label>
                    <textarea id="bsNotes" rows="3" placeholder="Optional notes about the reading..."></textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
            </form>
        `;
        
        Modal.show('Add Blood Sugar Record', content);
        
        document.getElementById('bloodSugarForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.save();
        });
    },
    
    showEditModal(id) {
        const record = AppState.data.bloodSugar.find(item => item.id === id);
        if (!record) return;
        
        const content = `
            <form id="bloodSugarForm" class="modal-form">
                <input type="hidden" id="bsId" value="${id}">
                <div class="form-group">
                    <label for="bsDatetime">Date & Time *</label>
                    <input type="datetime-local" id="bsDatetime" required value="${record.datetime}">
                </div>
                <div class="form-group">
                    <label for="bsMealTiming">Meal Timing *</label>
                    <select id="bsMealTiming" required>
                        <option value="">Select timing</option>
                        <option value="fasting" ${record.mealTiming === 'fasting' ? 'selected' : ''}>Fasting</option>
                        <option value="1" ${record.mealTiming === '1' ? 'selected' : ''}>1 hour after meal</option>
                        <option value="2" ${record.mealTiming === '2' ? 'selected' : ''}>2 hours after meal</option>
                        <option value="3" ${record.mealTiming === '3' ? 'selected' : ''}>3 hours after meal</option>
                        <option value="4" ${record.mealTiming === '4' ? 'selected' : ''}>4 hours after meal</option>
                        <option value="5" ${record.mealTiming === '5' ? 'selected' : ''}>5+ hours after meal</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="bsLevel">Blood Sugar Level (mg/dL) *</label>
                    <input type="number" id="bsLevel" required min="0" step="0.1" value="${record.level}">
                </div>
                <div class="form-group">
                    <label for="bsNotes">Notes</label>
                    <textarea id="bsNotes" rows="3" placeholder="Optional notes about the reading...">${record.notes || ''}</textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update</button>
                </div>
            </form>
        `;
        
        Modal.show('Edit Blood Sugar Record', content);
        
        document.getElementById('bloodSugarForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.save(id);
        });
    },
    
    async save(id = null) {
        const data = {
            datetime: document.getElementById('bsDatetime').value,
            mealTiming: document.getElementById('bsMealTiming').value,
            level: document.getElementById('bsLevel').value,
            notes: document.getElementById('bsNotes').value
        };
        
        try {
            if (id) {
                await DataAPI.updateBloodSugar(id, data);
                const index = AppState.data.bloodSugar.findIndex(item => item.id === id);
                AppState.data.bloodSugar[index] = { ...AppState.data.bloodSugar[index], ...data };
                Notification.success('Record updated successfully');
            } else {
                const result = await DataAPI.addBloodSugar(data);
                AppState.data.bloodSugar.push(result.data || { id: Utils.generateId(), ...data });
                Notification.success('Record added successfully');
            }
            
            this.renderTable();
            Overview.updateStats();
            Overview.createBloodSugarChart();
            Modal.hide();
        } catch (error) {
            Notification.error('Failed to save record');
        }
    },
    
    edit(id) {
        this.showEditModal(id);
    },
    
    async delete(id) {
        if (!confirm('Are you sure you want to delete this record?')) {
            return;
        }
        
        try {
            await DataAPI.deleteBloodSugar(id);
            AppState.data.bloodSugar = AppState.data.bloodSugar.filter(item => item.id !== id);
            this.renderTable();
            Overview.updateStats();
            Overview.createBloodSugarChart();
            Notification.success('Record deleted successfully');
        } catch (error) {
            Notification.error('Failed to delete record');
        }
    }
};

// ===================================
// Financial Module
// ===================================
const Financial = {
    filteredData: [],
    
    init() {
        this.filteredData = AppState.data.financial;
        this.renderTable();
        this.updateSummary();
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        document.getElementById('addFinancialBtn').addEventListener('click', () => {
            this.showAddModal();
        });
        
        document.getElementById('exportFinancialBtn').addEventListener('click', () => {
            this.exportData();
        });
        
        // Filters
        document.getElementById('financialCategoryFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('financialStatusFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('financialMonthFilter').addEventListener('change', () => this.applyFilters());
    },
    
    exportData() {
        const data = this.filteredData;
        
        if (data.length === 0) {
            Notification.warning('No data to export');
            return;
        }
        
        // Prepare data for export
        const exportData = data.map(item => ({
            'Date': Utils.formatDate(item.date),
            'Category': item.category,
            'Description': item.description,
            'Amount': parseFloat(item.amount),
            'Status': item.status
        }));
        
        // Export to XLSX
        const success = Utils.exportToXLSX(exportData, 'financial_transactions', 'Financial Records');
        
        if (success) {
            Notification.success('Financial data exported successfully!');
        } else {
            Notification.error('Failed to export financial data');
        }
    },
    
    applyFilters() {
        const category = document.getElementById('financialCategoryFilter').value;
        const status = document.getElementById('financialStatusFilter').value;
        const month = document.getElementById('financialMonthFilter').value;
        
        this.filteredData = AppState.data.financial.filter(item => {
            if (category && item.category !== category) return false;
            if (status && item.status !== status) return false;
            if (month && !item.date.startsWith(month)) return false;
            return true;
        });
        
        this.renderTable();
        this.updateSummary();
    },
    
    renderTable() {
        const tbody = document.getElementById('financialTableBody');
        const data = this.filteredData;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No records found</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(item => `
            <tr>
                <td data-label="Date">${Utils.formatDate(item.date)}</td>
                <td data-label="Category">${item.category}</td>
                <td data-label="Description">${item.description}</td>
                <td data-label="Amount">${Utils.formatCurrency(item.amount)}</td>
                <td data-label="Status">
                    <span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span>
                </td>
                <td data-label="Actions">
                    <div class="action-buttons">
                        <button class="action-btn" onclick="Financial.edit('${item.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="Financial.delete('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },
    
    updateSummary() {
        const income = this.filteredData
            .filter(item => item.category === 'Income')
            .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        
        const expense = this.filteredData
            .filter(item => item.category === 'Expense')
            .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        
        const balance = income - expense;
        
        document.getElementById('summaryIncome').textContent = Utils.formatCurrency(income);
        document.getElementById('summaryExpense').textContent = Utils.formatCurrency(expense);
        document.getElementById('summaryBalance').textContent = Utils.formatCurrency(balance);
    },
    
    showAddModal() {
        const content = `
            <form id="financialForm" class="modal-form">
                <div class="form-group">
                    <label for="finDate">Date *</label>
                    <input type="date" id="finDate" required value="${Utils.getCurrentDate()}">
                </div>
                <div class="form-group">
                    <label for="finCategory">Category *</label>
                    <select id="finCategory" required>
                        ${CONFIG.financialCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="finDescription">Description *</label>
                    <input type="text" id="finDescription" required>
                </div>
                <div class="form-group">
                    <label for="finAmount">Amount *</label>
                    <input type="number" id="finAmount" required min="0" step="0.01">
                </div>
                <div class="form-group">
                    <label for="finStatus">Status *</label>
                    <select id="finStatus" required>
                        ${CONFIG.paymentStatus.map(status => `<option value="${status}">${status}</option>`).join('')}
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
            </form>
        `;
        
        Modal.show('Add Transaction', content);
        
        document.getElementById('financialForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.save();
        });
    },
    
    showEditModal(id) {
        const record = AppState.data.financial.find(item => item.id === id);
        if (!record) return;
        
        const content = `
            <form id="financialForm" class="modal-form">
                <input type="hidden" id="finId" value="${id}">
                <div class="form-group">
                    <label for="finDate">Date *</label>
                    <input type="date" id="finDate" required value="${record.date}">
                </div>
                <div class="form-group">
                    <label for="finCategory">Category *</label>
                    <select id="finCategory" required>
                        ${CONFIG.financialCategories.map(cat => 
                            `<option value="${cat}" ${cat === record.category ? 'selected' : ''}>${cat}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="finDescription">Description *</label>
                    <input type="text" id="finDescription" required value="${record.description}">
                </div>
                <div class="form-group">
                    <label for="finAmount">Amount *</label>
                    <input type="number" id="finAmount" required min="0" step="0.01" value="${record.amount}">
                </div>
                <div class="form-group">
                    <label for="finStatus">Status *</label>
                    <select id="finStatus" required>
                        ${CONFIG.paymentStatus.map(status => 
                            `<option value="${status}" ${status === record.status ? 'selected' : ''}>${status}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update</button>
                </div>
            </form>
        `;
        
        Modal.show('Edit Transaction', content);
        
        document.getElementById('financialForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.save(id);
        });
    },
    
    async save(id = null) {
        const data = {
            date: document.getElementById('finDate').value,
            category: document.getElementById('finCategory').value,
            description: document.getElementById('finDescription').value,
            amount: document.getElementById('finAmount').value,
            status: document.getElementById('finStatus').value
        };
        
        try {
            if (id) {
                await DataAPI.updateFinancial(id, data);
                const index = AppState.data.financial.findIndex(item => item.id === id);
                AppState.data.financial[index] = { ...AppState.data.financial[index], ...data };
                Notification.success('Transaction updated successfully');
            } else {
                const result = await DataAPI.addFinancial(data);
                AppState.data.financial.push(result.data || { id: Utils.generateId(), ...data });
                Notification.success('Transaction added successfully');
            }
            
            this.filteredData = AppState.data.financial;
            this.renderTable();
            this.updateSummary();
            Overview.updateStats();
            Overview.createFinancialChart();
            Modal.hide();
        } catch (error) {
            Notification.error('Failed to save transaction');
        }
    },
    
    edit(id) {
        this.showEditModal(id);
    },
    
    async delete(id) {
        if (!confirm('Are you sure you want to delete this transaction?')) {
            return;
        }
        
        try {
            await DataAPI.deleteFinancial(id);
            AppState.data.financial = AppState.data.financial.filter(item => item.id !== id);
            this.filteredData = AppState.data.financial;
            this.renderTable();
            this.updateSummary();
            Overview.updateStats();
            Overview.createFinancialChart();
            Notification.success('Transaction deleted successfully');
        } catch (error) {
            Notification.error('Failed to delete transaction');
        }
    }
};

// ===================================
// Lending Module
// ===================================
const Lending = {
    init() {
        this.renderTable();
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        document.getElementById('addLendingBtn').addEventListener('click', () => {
            this.showAddModal();
        });
        
        document.getElementById('exportLendingBtn').addEventListener('click', () => {
            this.exportData();
        });
    },
    
    exportData() {
        const data = AppState.data.lending;
        
        if (data.length === 0) {
            Notification.warning('No data to export');
            return;
        }
        
        // Prepare data for export
        const exportData = data.map(item => {
            const details = this.calculateLoanDetails(item);
            return {
                'Borrower': item.borrower,
                'Start Date': Utils.formatDate(item.startDate),
                'Principal': parseFloat(details.principal),
                'Interest Rate': `${details.interestRate}%`,
                'Payment Terms': item.paymentTerms,
                'Total Due': parseFloat(details.totalDue),
                'Total Paid': parseFloat(details.totalPaid),
                'Balance': parseFloat(details.balance),
                'Status': details.isFullyPaid ? 'Fully Paid' : 'Active'
            };
        });
        
        // Export to XLSX
        const success = Utils.exportToXLSX(exportData, 'lending_business', 'Lending Records');
        
        if (success) {
            Notification.success('Lending data exported successfully!');
        } else {
            Notification.error('Failed to export lending data');
        }
    },
    
    calculateLoanDetails(loan) {
        const principal = parseFloat(loan.principal || 0);
        const interestRate = parseFloat(loan.interestRate || 0);
        const totalDue = principal + (principal * interestRate / 100);
        const totalPaid = (loan.payments || []).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const balance = totalDue - totalPaid;
        
        return {
            principal,
            interestRate,
            totalDue,
            totalPaid,
            balance,
            isFullyPaid: balance <= 0
        };
    },
    
    renderTable() {
        const tbody = document.getElementById('lendingTableBody');
        const data = AppState.data.lending;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No records found</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(item => {
            const details = this.calculateLoanDetails(item);
            const statusClass = details.isFullyPaid ? 'paid' : 'active';
            const status = details.isFullyPaid ? 'Fully Paid' : 'Active';
            
            return `
                <tr>
                    <td data-label="Borrower">
                        <strong>${item.borrower}</strong>
                        <br><small>Started: ${Utils.formatDate(item.startDate)}</small>
                    </td>
                    <td data-label="Principal">${Utils.formatCurrency(details.principal)}</td>
                    <td data-label="Interest">${details.interestRate}%</td>
                    <td data-label="Terms">${item.paymentTerms}</td>
                    <td data-label="Total Due">${Utils.formatCurrency(details.totalDue)}</td>
                    <td data-label="Paid">${Utils.formatCurrency(details.totalPaid)}</td>
                    <td data-label="Balance">
                        <strong style="color: ${details.balance > 0 ? 'var(--danger-color)' : 'var(--success-color)'}">
                            ${Utils.formatCurrency(details.balance)}
                        </strong>
                    </td>
                    <td data-label="Status">
                        <span class="status-badge status-${statusClass}">${status}</span>
                    </td>
                    <td data-label="Actions">
                        <div class="action-buttons">
                            <button class="action-btn" onclick="Lending.viewPayments('${item.id}')" title="View Payments">
                                <i class="fas fa-list"></i>
                            </button>
                            <button class="action-btn" onclick="Lending.edit('${item.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="Lending.delete('${item.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    showAddModal() {
        const content = `
            <form id="lendingForm" class="modal-form">
                <div class="form-group">
                    <label for="lendBorrower">Borrower Name *</label>
                    <input type="text" id="lendBorrower" required>
                </div>
                <div class="form-group">
                    <label for="lendPrincipal">Principal Amount *</label>
                    <input type="number" id="lendPrincipal" required min="0" step="0.01" placeholder="0.00">
                </div>
                <div class="form-group">
                    <label for="lendInterest">Interest Rate (%) *</label>
                    <input type="number" id="lendInterest" required min="0" step="0.1" value="0" placeholder="0">
                </div>
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label for="lendTermsType">Payment Frequency *</label>
                        <select id="lendTermsType" required>
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly" selected>Monthly</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label for="lendTermsCount">Number of Payments *</label>
                        <input type="number" id="lendTermsCount" required min="1" value="1" placeholder="e.g., 12">
                    </div>
                </div>
                <div class="form-group">
                    <label for="lendStartDate">Start Date *</label>
                    <input type="date" id="lendStartDate" required value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label for="lendNotes">Notes</label>
                    <textarea id="lendNotes" rows="2" placeholder="Optional notes..."></textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Loan & Generate Schedule</button>
                </div>
            </form>
        `;
        
        Modal.show('Add Loan', content);
        
        document.getElementById('lendingForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.save();
        });
    },
    
    showEditModal(id) {
        const record = AppState.data.lending.find(item => item.id === id);
        if (!record) return;
        
        const content = `
            <form id="lendingForm" class="modal-form">
                <input type="hidden" id="lendId" value="${id}">
                <div class="form-group">
                    <label for="lendBorrower">Borrower Name *</label>
                    <input type="text" id="lendBorrower" required value="${record.borrower}">
                </div>
                <div class="form-group">
                    <label for="lendPrincipal">Principal Amount *</label>
                    <input type="number" id="lendPrincipal" required min="0" step="0.01" value="${record.principal}">
                </div>
                <div class="form-group">
                    <label for="lendInterest">Interest Rate (%) *</label>
                    <input type="number" id="lendInterest" required min="0" step="0.1" value="${record.interestRate}">
                </div>
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label for="lendTermsType">Payment Frequency *</label>
                        <select id="lendTermsType" required>
                            <option value="Daily" ${record.paymentTerms === 'Daily' ? 'selected' : ''}>Daily</option>
                            <option value="Weekly" ${record.paymentTerms === 'Weekly' ? 'selected' : ''}>Weekly</option>
                            <option value="Monthly" ${record.paymentTerms === 'Monthly' ? 'selected' : ''}>Monthly</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label for="lendTermsCount">Number of Payments *</label>
                        <input type="number" id="lendTermsCount" required min="1" value="${record.termsCount || 1}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="lendStartDate">Start Date *</label>
                    <input type="date" id="lendStartDate" required value="${record.startDate}">
                </div>
                <div class="form-group">
                    <label for="lendNotes">Notes</label>
                    <textarea id="lendNotes" rows="2">${record.notes || ''}</textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update</button>
                </div>
            </form>
        `;
        
        Modal.show('Edit Loan', content);
        
        document.getElementById('lendingForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.save(id);
        });
    },
    
    async save(id = null) {
        const principal = parseFloat(document.getElementById('lendPrincipal').value);
        const interestRate = parseFloat(document.getElementById('lendInterest').value);
        const termsType = document.getElementById('lendTermsType').value;
        const termsCount = parseInt(document.getElementById('lendTermsCount').value);
        const startDate = document.getElementById('lendStartDate').value;
        
        // Calculate total due and amount per payment
        const totalDue = principal + (principal * interestRate / 100);
        const amountPerPayment = totalDue / termsCount;
        
        // Generate payment schedule automatically
        const payments = [];
        for (let i = 0; i < termsCount; i++) {
            payments.push({
                dueDate: this.calculateNextDueDate(startDate, termsType, i),
                amountDue: amountPerPayment,
                amount: 0,
                status: 'Pending'
            });
        }
        
        const data = {
            borrower: document.getElementById('lendBorrower').value,
            principal: principal,
            interestRate: interestRate,
            paymentTerms: termsType,
            termsCount: termsCount,
            startDate: startDate,
            notes: document.getElementById('lendNotes').value,
            payments: id ? AppState.data.lending.find(item => item.id === id)?.payments || payments : payments
        };
        
        try {
            if (id) {
                await DataAPI.updateLending(id, data);
                const index = AppState.data.lending.findIndex(item => item.id === id);
                AppState.data.lending[index] = { ...AppState.data.lending[index], ...data };
                Notification.success('Loan updated successfully');
            } else {
                const result = await DataAPI.addLending(data);
                AppState.data.lending.push(result.data || { id: Utils.generateId(), ...data });
                Notification.success('Loan added successfully');
            }
            
            this.renderTable();
            Overview.updateStats();
            Modal.hide();
        } catch (error) {
            Notification.error('Failed to save loan');
        }
    },
    
    viewPayments(id) {
        const loan = AppState.data.lending.find(item => item.id === id);
        if (!loan) return;
        
        const details = this.calculateLoanDetails(loan);
        const payments = loan.payments || [];
        
        // Generate payment schedule
        const schedule = this.generatePaymentSchedule(loan);
        
        const content = `
            <div class="payment-details">
                <div class="loan-summary">
                    <h4>${loan.borrower}</h4>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <label>Principal:</label>
                            <span>${Utils.formatCurrency(details.principal)}</span>
                        </div>
                        <div class="summary-item">
                            <label>Interest (${details.interestRate}%):</label>
                            <span>${Utils.formatCurrency(details.totalDue - details.principal)}</span>
                        </div>
                        <div class="summary-item">
                            <label>Total Due:</label>
                            <span><strong>${Utils.formatCurrency(details.totalDue)}</strong></span>
                        </div>
                        <div class="summary-item">
                            <label>Total Paid:</label>
                            <span style="color: var(--success-color)">${Utils.formatCurrency(details.totalPaid)}</span>
                        </div>
                        <div class="summary-item">
                            <label>Balance:</label>
                            <span style="color: ${details.balance > 0 ? 'var(--danger-color)' : 'var(--success-color)'}">
                                <strong>${Utils.formatCurrency(details.balance)}</strong>
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="payment-schedule">
                    <h4>Payment Schedule (${loan.termsCount} ${loan.paymentTerms} Payments)</h4>
                    <table class="schedule-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Due Date</th>
                                <th>Amount Due</th>
                                <th>Status</th>
                                <th>Mark as Paid</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${schedule.map((item, index) => `
                                <tr class="${item.status.toLowerCase()}">
                                    <td>${index + 1}</td>
                                    <td>
                                        <input type="date"
                                            id="dueDate_${index}"
                                            value="${item.dueDate}"
                                            class="schedule-date-input"
                                            onchange="Lending.updateDueDate('${id}', ${index})">
                                    </td>
                                    <td><strong>${Utils.formatCurrency(item.amountDue)}</strong></td>
                                    <td>
                                        <span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span>
                                    </td>
                                    <td style="text-align: center;">
                                        <input type="checkbox"
                                            id="paid_${index}"
                                            ${item.status === 'Paid' ? 'checked' : ''}
                                            onchange="Lending.togglePaymentStatus('${id}', ${index})"
                                            class="payment-checkbox">
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Close</button>
                </div>
            </div>
        `;
        
        Modal.show(`Payment Schedule - ${loan.borrower}`, content, 'large');
    },
    
    generatePaymentSchedule(loan) {
        const payments = loan.payments || [];
        return payments.map(payment => ({
            dueDate: payment.dueDate,
            amountDue: parseFloat(payment.amountDue || 0),
            amountPaid: parseFloat(payment.amount || 0),
            status: payment.status || 'Pending'
        }));
    },
    
    calculateNextDueDate(startDate, terms, periodNumber) {
        const date = new Date(startDate);
        
        switch(terms) {
            case 'Daily':
                date.setDate(date.getDate() + periodNumber);
                break;
            case 'Weekly':
                date.setDate(date.getDate() + (periodNumber * 7));
                break;
            case 'Monthly':
                date.setMonth(date.getMonth() + periodNumber);
                break;
        }
        
        return date.toISOString().split('T')[0];
    },
    
    async togglePaymentStatus(loanId, paymentIndex) {
        const loan = AppState.data.lending.find(item => item.id === loanId);
        if (!loan || !loan.payments || !loan.payments[paymentIndex]) return;
        
        const payment = loan.payments[paymentIndex];
        const checkbox = document.getElementById(`paid_${paymentIndex}`);
        
        // Toggle status
        if (checkbox.checked) {
            payment.status = 'Paid';
            payment.amount = payment.amountDue;
        } else {
            payment.status = 'Pending';
            payment.amount = 0;
        }
        
        try {
            await DataAPI.updateLending(loanId, loan);
            const index = AppState.data.lending.findIndex(item => item.id === loanId);
            AppState.data.lending[index] = loan;
            
            Notification.success('Payment status updated');
            this.viewPayments(loanId); // Refresh the view
            this.renderTable();
        } catch (error) {
            Notification.error('Failed to update payment status');
            checkbox.checked = !checkbox.checked; // Revert checkbox
        }
    },
    
    async updateDueDate(loanId, paymentIndex) {
        const loan = AppState.data.lending.find(item => item.id === loanId);
        if (!loan || !loan.payments || !loan.payments[paymentIndex]) return;
        
        const newDueDate = document.getElementById(`dueDate_${paymentIndex}`).value;
        loan.payments[paymentIndex].dueDate = newDueDate;
        
        try {
            await DataAPI.updateLending(loanId, loan);
            const index = AppState.data.lending.findIndex(item => item.id === loanId);
            AppState.data.lending[index] = loan;
            
            Notification.success('Due date updated');
        } catch (error) {
            Notification.error('Failed to update due date');
        }
    },
    
    edit(id) {
        this.showEditModal(id);
    },
    
    async delete(id) {
        if (!confirm('Are you sure you want to delete this loan?')) {
            return;
        }
        
        try {
            await DataAPI.deleteLending(id);
            AppState.data.lending = AppState.data.lending.filter(item => item.id !== id);
            this.renderTable();
            Overview.updateStats();
            Notification.success('Loan deleted successfully');
        } catch (error) {
            Notification.error('Failed to delete loan');
        }
    }
};

// ===================================
// Modal Close Handler
// ===================================
document.getElementById('modalClose').addEventListener('click', () => Modal.hide());
document.getElementById('modalContainer').addEventListener('click', (e) => {
    if (e.target.id === 'modalContainer') {
        Modal.hide();
    }
});

// ===================================
// Budget Module
// ===================================
const Budget = {
    currentBudget: null,
    
    init() {
        this.populateYearSelector();
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        document.getElementById('addBudgetBtn').addEventListener('click', () => {
            this.showAddBudgetModal();
        });
        
        document.getElementById('exportBudgetBtn').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('budgetMonthSelect').addEventListener('change', () => {
            this.loadSelectedBudget();
        });
        
        document.getElementById('budgetYearSelect').addEventListener('change', () => {
            this.loadSelectedBudget();
        });
        
        document.getElementById('addAllocationBtn')?.addEventListener('click', () => {
            this.showAddAllocationModal();
        });
    },
    
    exportData() {
        if (!this.currentBudget) {
            Notification.warning('Please select a budget month to export');
            return;
        }
        
        const allocations = this.currentBudget.allocations || [];
        
        if (allocations.length === 0) {
            Notification.warning('No allocations to export');
            return;
        }
        
        // Prepare data for export
        const exportData = allocations.map(item => ({
            'Category': item.category,
            'Amount': parseFloat(item.amount),
            'Percentage': `${((item.amount / this.currentBudget.salary) * 100).toFixed(2)}%`
        }));
        
        // Add summary row
        exportData.push({
            'Category': 'TOTAL',
            'Amount': parseFloat(this.currentBudget.salary),
            'Percentage': '100%'
        });
        
        // Export to XLSX
        const monthYear = this.currentBudget.monthKey;
        const success = Utils.exportToXLSX(exportData, `budget_${monthYear}`, 'Budget Allocations');
        
        if (success) {
            Notification.success('Budget data exported successfully!');
        } else {
            Notification.error('Failed to export budget data');
        }
    },
    
    populateYearSelector() {
        const yearSelect = document.getElementById('budgetYearSelect');
        const currentYear = new Date().getFullYear();
        
        // Clear existing options
        yearSelect.innerHTML = '<option value="">Select year...</option>';
        
        // Add years from current year to 15 years in the future
        for (let year = currentYear; year <= currentYear + 15; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === currentYear) {
                option.selected = true;
            }
            yearSelect.appendChild(option);
        }
        
        // Set current month
        const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
        document.getElementById('budgetMonthSelect').value = currentMonth;
        
        // Load budget for current month/year
        this.loadSelectedBudget();
    },
    
    loadSelectedBudget() {
        const month = document.getElementById('budgetMonthSelect').value;
        const year = document.getElementById('budgetYearSelect').value;
        
        if (!month || !year) {
            document.getElementById('budgetDisplay').style.display = 'none';
            return;
        }
        
        const monthKey = `${year}-${month}`;
        const budget = AppState.data.budget.find(b => b.monthKey === monthKey);
        
        if (!budget) {
            document.getElementById('budgetDisplay').style.display = 'none';
            return;
        }
        
        this.currentBudget = budget;
        document.getElementById('budgetDisplay').style.display = 'block';
        document.getElementById('budgetMonthTitle').textContent = `Budget for ${budget.month}`;
        
        this.updateSummary();
        this.renderAllocations();
    },
    
    updateSummary() {
        if (!this.currentBudget) return;
        
        const salary = parseFloat(this.currentBudget.salary || 0);
        const allocations = this.currentBudget.allocations || [];
        const totalAllocated = allocations.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);
        const remaining = salary - totalAllocated;
        
        document.getElementById('budgetSalary').textContent = Utils.formatCurrency(salary);
        document.getElementById('budgetAllocated').textContent = Utils.formatCurrency(totalAllocated);
        document.getElementById('budgetRemaining').textContent = Utils.formatCurrency(remaining);
        document.getElementById('budgetRemaining').style.color = 
            remaining < 0 ? 'var(--danger-color)' : 'var(--success-color)';
    },
    
    renderAllocations() {
        const tbody = document.getElementById('budgetTableBody');
        const allocations = this.currentBudget?.allocations || [];
        
        if (allocations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No allocations yet</td></tr>';
            return;
        }
        
        const salary = parseFloat(this.currentBudget.salary || 0);
        
        tbody.innerHTML = allocations.map((allocation, index) => {
            const amount = parseFloat(allocation.amount || 0);
            const percentage = salary > 0 ? ((amount / salary) * 100).toFixed(1) : 0;
            
            return `
                <tr>
                    <td data-label="Category">${allocation.category}</td>
                    <td data-label="Amount">${Utils.formatCurrency(amount)}</td>
                    <td data-label="Percentage">${percentage}%</td>
                    <td data-label="Actions">
                        <div class="action-buttons">
                            <button class="action-btn" onclick="Budget.editAllocation(${index})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="Budget.deleteAllocation(${index})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    showAddBudgetModal() {
        const currentYear = new Date().getFullYear();
        const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
        
        const content = `
            <form id="budgetForm" class="modal-form">
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label for="budgetMonthInput">Month *</label>
                        <select id="budgetMonthInput" required>
                            <option value="">Select month...</option>
                            <option value="01" ${currentMonth === '01' ? 'selected' : ''}>January</option>
                            <option value="02" ${currentMonth === '02' ? 'selected' : ''}>February</option>
                            <option value="03" ${currentMonth === '03' ? 'selected' : ''}>March</option>
                            <option value="04" ${currentMonth === '04' ? 'selected' : ''}>April</option>
                            <option value="05" ${currentMonth === '05' ? 'selected' : ''}>May</option>
                            <option value="06" ${currentMonth === '06' ? 'selected' : ''}>June</option>
                            <option value="07" ${currentMonth === '07' ? 'selected' : ''}>July</option>
                            <option value="08" ${currentMonth === '08' ? 'selected' : ''}>August</option>
                            <option value="09" ${currentMonth === '09' ? 'selected' : ''}>September</option>
                            <option value="10" ${currentMonth === '10' ? 'selected' : ''}>October</option>
                            <option value="11" ${currentMonth === '11' ? 'selected' : ''}>November</option>
                            <option value="12" ${currentMonth === '12' ? 'selected' : ''}>December</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label for="budgetYearInput">Year *</label>
                        <select id="budgetYearInput" required>
                            <option value="">Select year...</option>
                            ${Array.from({length: 16}, (_, i) => currentYear + i).map(year =>
                                `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="budgetSalaryInput">Monthly Salary *</label>
                    <input type="number" id="budgetSalaryInput" required min="0" step="0.01" placeholder="0.00">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Budget</button>
                </div>
            </form>
        `;
        
        Modal.show('Create Monthly Budget', content);
        
        document.getElementById('budgetForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveBudget();
        });
    },
    
    async saveBudget() {
        const month = document.getElementById('budgetMonthInput').value;
        const year = document.getElementById('budgetYearInput').value;
        const salary = document.getElementById('budgetSalaryInput').value;
        
        if (!month || !year) {
            Notification.error('Please select both month and year');
            return;
        }
        
        const monthKey = `${year}-${month}`;
        
        // Check if budget already exists for this month/year
        const existingBudget = AppState.data.budget.find(b => b.monthKey === monthKey);
        if (existingBudget) {
            Notification.error('Budget already exists for this month and year');
            return;
        }
        
        // Format month as "January 2024"
        const date = new Date(monthKey + '-01');
        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const data = {
            month: monthName,
            monthKey: monthKey,
            salary: salary,
            allocations: []
        };
        
        try {
            const result = await DataAPI.addBudget(data);
            AppState.data.budget.push(result.data || { id: Utils.generateId(), ...data });
            
            // Set the selectors to the new budget's month and year
            document.getElementById('budgetYearSelect').value = year;
            document.getElementById('budgetMonthSelect').value = month;
            this.loadSelectedBudget();
            
            Modal.hide();
            Notification.success('Budget created successfully');
        } catch (error) {
            Notification.error('Failed to create budget');
        }
    },
    
    showAddAllocationModal() {
        if (!this.currentBudget) return;
        
        const content = `
            <form id="allocationForm" class="modal-form">
                <div class="form-group">
                    <label for="allocationCategory">Category/Label *</label>
                    <input type="text" id="allocationCategory" required placeholder="e.g., Rent, Food, Savings">
                </div>
                <div class="form-group">
                    <label for="allocationAmount">Amount *</label>
                    <input type="number" id="allocationAmount" required min="0" step="0.01" placeholder="0.00">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Allocation</button>
                </div>
            </form>
        `;
        
        Modal.show('Add Budget Allocation', content);
        
        document.getElementById('allocationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveAllocation();
        });
    },
    
    showEditAllocationModal(index) {
        if (!this.currentBudget) return;
        
        const allocation = this.currentBudget.allocations[index];
        
        const content = `
            <form id="allocationForm" class="modal-form">
                <input type="hidden" id="allocationIndex" value="${index}">
                <div class="form-group">
                    <label for="allocationCategory">Category/Label *</label>
                    <input type="text" id="allocationCategory" required value="${allocation.category}">
                </div>
                <div class="form-group">
                    <label for="allocationAmount">Amount *</label>
                    <input type="number" id="allocationAmount" required min="0" step="0.01" value="${allocation.amount}">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Allocation</button>
                </div>
            </form>
        `;
        
        Modal.show('Edit Budget Allocation', content);
        
        document.getElementById('allocationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveAllocation(index);
        });
    },
    
    async saveAllocation(index = null) {
        const category = document.getElementById('allocationCategory').value;
        const amount = document.getElementById('allocationAmount').value;
        
        const allocation = { category, amount };
        
        if (index !== null) {
            this.currentBudget.allocations[index] = allocation;
        } else {
            if (!this.currentBudget.allocations) {
                this.currentBudget.allocations = [];
            }
            this.currentBudget.allocations.push(allocation);
        }
        
        try {
            await DataAPI.updateBudget(this.currentBudget.id, this.currentBudget);
            const budgetIndex = AppState.data.budget.findIndex(b => b.id === this.currentBudget.id);
            AppState.data.budget[budgetIndex] = this.currentBudget;
            
            this.updateSummary();
            this.renderAllocations();
            Modal.hide();
            Notification.success(index !== null ? 'Allocation updated' : 'Allocation added');
        } catch (error) {
            Notification.error('Failed to save allocation');
        }
    },
    
    editAllocation(index) {
        this.showEditAllocationModal(index);
    },
    
    async deleteAllocation(index) {
        if (!confirm('Are you sure you want to delete this allocation?')) {
            return;
        }
        
        this.currentBudget.allocations.splice(index, 1);
        
        try {
            await DataAPI.updateBudget(this.currentBudget.id, this.currentBudget);
            const budgetIndex = AppState.data.budget.findIndex(b => b.id === this.currentBudget.id);
            AppState.data.budget[budgetIndex] = this.currentBudget;
            
            this.updateSummary();
            this.renderAllocations();
            Notification.success('Allocation deleted');
        } catch (error) {
            Notification.error('Failed to delete allocation');
        }
    }
};


// ===================================
// Initialize Application
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

// Made with Bob
