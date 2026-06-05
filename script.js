// ===================================
// Personal Dashboard - Main JavaScript
// ===================================
// NOTE: Core modules (AppState, Utils, Notification, Modal, DataAPI) are now loaded from separate files
// This file contains the remaining feature modules that haven't been extracted yet

// DataAPI is now defined in js/core/data-api.js
// AppState, Utils, Notification, Modal are loaded from js/core/

// ===================================
// Authentication Module
// ===================================
const Auth = {
    init() {
        // Check if user has active session
        const session = AuthSecurity.getSession();
        if (session) {
            // Restore user from session
            AppState.currentUser = {
                id: session.userId,
                username: session.username,
                role: session.role,
                permissions: session.permissions,
                sessionToken: session.token
            };
            this.showDashboard();
        } else {
            // Clear any old localStorage data
            localStorage.removeItem('currentUser');
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
    },
    
    async login() {
        const username = AuthSecurity.sanitizeInput(document.getElementById('username').value);
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        
        // Validate username format
        if (!AuthSecurity.validateUsername(username)) {
            errorDiv.textContent = 'Invalid username format';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Check login attempts
        const attemptCheck = AuthSecurity.checkLoginAttempts(username);
        if (!attemptCheck.allowed) {
            if (attemptCheck.locked) {
                errorDiv.textContent = `Account locked. Try again in ${attemptCheck.remainingTime} minutes.`;
            } else {
                errorDiv.textContent = `Too many failed attempts. ${attemptCheck.remaining} attempts remaining.`;
            }
            errorDiv.style.display = 'block';
            
            // Log failed attempt
            await AuthSecurity.logSecurityEvent({
                type: 'login',
                username: username,
                action: 'login_blocked',
                success: false,
                details: { reason: 'rate_limit' }
            });
            return;
        }
        
        try {
            // Try to authenticate with Firebase users
            const response = await FirebaseAPI.getUserByUsername(username);
            
            if (response.success && response.data) {
                const user = response.data;
                
                // Check if user is active
                if (user.status !== 'active') {
                    errorDiv.textContent = 'Your account is inactive. Please contact an administrator.';
                    errorDiv.style.display = 'block';
                    
                    AuthSecurity.recordLoginAttempt(username, false);
                    await AuthSecurity.logSecurityEvent({
                        type: 'login',
                        username: username,
                        action: 'login_failed',
                        success: false,
                        details: { reason: 'inactive_account' }
                    });
                    return;
                }
                
                // Verify password with hash
                let passwordValid = false;
                if (user.passwordHash && user.passwordSalt) {
                    // New secure password system
                    passwordValid = await AuthSecurity.verifyPassword(password, user.passwordHash, user.passwordSalt);
                } else if (user.password) {
                    // Legacy plain text password (for migration)
                    passwordValid = (user.password === password);
                    
                    // Migrate to hashed password
                    if (passwordValid) {
                        const { hash, salt } = await AuthSecurity.hashPassword(password);
                        await FirebaseAPI.updateUser(user.id, {
                            passwordHash: hash,
                            passwordSalt: salt,
                            password: null // Remove plain text password
                        });
                    }
                }
                
                if (passwordValid) {
                    // Check 2FA if enabled
                    if (user.twoFactorEnabled) {
                        // Store temporary login state for 2FA verification
                        sessionStorage.setItem('pending2FA', JSON.stringify({
                            userId: user.id,
                            username: user.username,
                            timestamp: Date.now()
                        }));
                        
                        this.show2FAPrompt();
                        return;
                    }
                    
                    // Create secure session
                    const session = AuthSecurity.createSession(user);
                    
                    // Set current user
                    AppState.currentUser = {
                        id: user.id,
                        username: user.username,
                        role: user.role,
                        permissions: user.permissions,
                        sessionToken: session.token
                    };
                    
                    // Record successful login
                    AuthSecurity.recordLoginAttempt(username, true);
                    
                    // Log successful login
                    await AuthSecurity.logSecurityEvent({
                        type: 'login',
                        username: username,
                        action: 'login_success',
                        success: true
                    });
                    
                    this.showDashboard();
                    Notification.success(`Welcome back, ${user.username}!`);
                    return;
                }
            }
            
            // No user found or invalid password
            // Record failed attempt
            AuthSecurity.recordLoginAttempt(username, false);
            
            await AuthSecurity.logSecurityEvent({
                type: 'login',
                username: username,
                action: 'login_failed',
                success: false,
                details: { reason: 'invalid_credentials' }
            });
            
            const remainingAttempts = AuthSecurity.checkLoginAttempts(username).remaining;
            errorDiv.textContent = `Invalid username or password. ${remainingAttempts} attempts remaining.`;
            errorDiv.style.display = 'block';
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'Login failed. Please try again.';
            errorDiv.style.display = 'block';
            
            await AuthSecurity.logSecurityEvent({
                type: 'login',
                username: username,
                action: 'login_error',
                success: false,
                details: { error: error.message }
            });
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
    
    async logout(sessionExpired = false) {
        const username = AppState.currentUser?.username;
        
        // Log logout event
        if (username) {
            await AuthSecurity.logSecurityEvent({
                type: 'logout',
                username: username,
                action: sessionExpired ? 'session_expired' : 'user_logout',
                success: true
            });
        }
        
        // Destroy session
        AuthSecurity.destroySession();
        
        // Clear app state
        AppState.currentUser = null;
        
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        
        // Clear login form
        document.getElementById('loginForm').reset();
        document.getElementById('loginError').style.display = 'none';
        
        if (sessionExpired) {
            Notification.warning('Your session has expired. Please login again.');
        } else {
            Notification.info('Logged out successfully');
        }
    },
    
    show2FAPrompt() {
        const modalBody = `
            <form id="verify2FAForm">
                <div class="form-group">
                    <label for="twoFactorCode">Enter 6-digit code from your authenticator app:</label>
                    <input type="text" id="twoFactorCode" name="twoFactorCode"
                           maxlength="6" pattern="[0-9]{6}" required
                           placeholder="000000" style="text-align: center; font-size: 1.5rem; letter-spacing: 0.5rem;">
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-check"></i> Verify
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="Modal.close()">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </form>
        `;
        
        Modal.show('Two-Factor Authentication', modalBody);
        
        document.getElementById('verify2FAForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.verify2FA();
        });
    },
    
    async verify2FA() {
        const code = document.getElementById('twoFactorCode').value;
        const pendingData = sessionStorage.getItem('pending2FA');
        
        if (!pendingData) {
            Notification.error('2FA session expired. Please login again.');
            Modal.close();
            return;
        }
        
        const pending = JSON.parse(pendingData);
        
        // Check if 2FA session expired (5 minutes)
        if (Date.now() - pending.timestamp > 5 * 60 * 1000) {
            sessionStorage.removeItem('pending2FA');
            Notification.error('2FA session expired. Please login again.');
            Modal.close();
            return;
        }
        
        try {
            // Get user data
            const response = await FirebaseAPI.getUserByUsername(pending.username);
            if (!response.success || !response.data) {
                throw new Error('User not found');
            }
            
            const user = response.data;
            
            // Verify 2FA code
            const isValid = AuthSecurity.verify2FACode(user.twoFactorSecret, code);
            
            if (isValid) {
                // Create session
                const session = AuthSecurity.createSession(user);
                
                AppState.currentUser = {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    permissions: user.permissions,
                    sessionToken: session.token
                };
                
                // Clear pending 2FA
                sessionStorage.removeItem('pending2FA');
                
                // Log successful 2FA
                await AuthSecurity.logSecurityEvent({
                    type: 'login',
                    username: user.username,
                    action: '2fa_success',
                    success: true
                });
                
                Modal.close();
                this.showDashboard();
                Notification.success(`Welcome back, ${user.username}!`);
            } else {
                await AuthSecurity.logSecurityEvent({
                    type: 'login',
                    username: user.username,
                    action: '2fa_failed',
                    success: false
                });
                
                Notification.error('Invalid 2FA code. Please try again.');
            }
        } catch (error) {
            console.error('2FA verification error:', error);
            Notification.error('2FA verification failed. Please try again.');
        }
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
        this.applyPermissions();
        this.setupNavigation();
        this.setupMobileMenu();
        this.setupDarkMode();
        this.loadAllData();
    },
    
    applyPermissions() {
        const isAdmin = AppState.isAdmin();
        
        // Show/hide User Management for admins only
        const userManagementNav = document.querySelector('.nav-item[data-module="users"]');
        if (userManagementNav) {
            userManagementNav.style.display = isAdmin ? 'flex' : 'none';
        }
        
        // If not admin, hide/disable modules based on permissions
        if (!isAdmin) {
            const modules = ['overview', 'blood-sugar', 'budget', 'financial', 'lending', 'payroll'];
            
            modules.forEach(module => {
                const hasView = AppState.hasPermission(module, 'view');
                const hasModify = AppState.hasPermission(module, 'modify');
                
                // Hide nav item if no view permission
                const navItem = document.querySelector(`.nav-item[data-module="${module}"]`);
                if (navItem) {
                    navItem.style.display = hasView ? 'flex' : 'none';
                }
                
                // Disable add/edit/delete buttons if no modify permission
                if (hasView && !hasModify) {
                    const moduleSection = document.getElementById(`${module}-module`);
                    if (moduleSection) {
                        // Disable all action buttons
                        const addButtons = moduleSection.querySelectorAll('.btn-primary');
                        addButtons.forEach(btn => {
                            btn.disabled = true;
                            btn.title = 'You do not have permission to modify this module';
                        });
                        
                        // Hide action columns in tables
                        const actionButtons = moduleSection.querySelectorAll('.action-btn');
                        actionButtons.forEach(btn => {
                            btn.style.display = 'none';
                        });
                    }
                }
            });
        }
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
            budget: 'Salary Budget',
            financial: 'Financial',
            lending: 'Lending Business',
            documents: 'Documents',
            payroll: 'Payroll System',
            users: 'User Management'
        };
        document.querySelector('.mobile-title').textContent = titles[moduleName] || 'Dashboard';
        
        // Initialize Documents module if switching to it
        if (moduleName === 'documents' && typeof Documents !== 'undefined') {
            Documents.init();
        }
        
        // Initialize Payroll module if switching to it
        if (moduleName === 'payroll' && typeof PayrollModule !== 'undefined') {
            PayrollModule.init();
        }
        
        // Initialize User Management module if switching to it
        if (moduleName === 'users' && typeof UserManagement !== 'undefined' && AppState.isAdmin()) {
            UserManagement.loadData();
        }
        
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
            const promises = [
                DataAPI.getBloodSugar(),
                DataAPI.getBudget(),
                DataAPI.getFinancial(),
                DataAPI.getLending(),
                DataAPI.getSimpleLoans()
            ];
            
            // Load users if admin
            if (AppState.isAdmin()) {
                promises.push(FirebaseAPI.getUsers());
            }
            
            const results = await Promise.all(promises);
            
            AppState.data.bloodSugar = results[0].data || [];
            AppState.data.budget = results[1].data || [];
            AppState.data.financial = results[2].data || [];
            AppState.data.lending = results[3].data || [];
            AppState.data.simpleLoans = results[4].data || [];
            
            if (AppState.isAdmin() && results[5]) {
                AppState.data.users = results[5].data || [];
            }
            
            // Initialize modules based on permissions
            if (AppState.hasPermission('overview', 'view')) {
                Overview.init();
            }
            if (AppState.hasPermission('blood-sugar', 'view')) {
                BloodSugar.init();
            }
            if (AppState.hasPermission('budget', 'view')) {
                Budget.init();
            }
            if (AppState.hasPermission('financial', 'view')) {
                Financial.init();
            }
            if (AppState.hasPermission('lending', 'view')) {
                Lending.init();
                SimpleLoanTracker.init();
            }
            if (AppState.isAdmin()) {
                UserManagement.init();
            }
            
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
        this.fetchMarketData();
    },
    
    setupEventListeners() {
        // Add event listener for blood sugar range filter
        const rangeFilter = document.getElementById('bloodSugarRangeFilter');
        if (rangeFilter) {
            rangeFilter.addEventListener('change', (e) => {
                this.createBloodSugarChart(e.target.value);
            });
        }
        
        // Add event listener for IBM stock range filter
        const ibmRangeFilter = document.getElementById('ibmStockRangeFilter');
        if (ibmRangeFilter) {
            ibmRangeFilter.addEventListener('change', (e) => {
                this.fetchIBMStockData(e.target.value);
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
    
    async fetchMarketData() {
        // Fetch both IBM stock and currency data
        await Promise.all([
            this.fetchIBMStockData('1M'),
            this.fetchPHPtoUSDRate()
        ]);
    },
    
    async fetchIBMStockData(range = '1M') {
        try {
            // Using Finnhub.io free tier API (60 API calls/minute)
            // Get your free API key at: https://finnhub.io/register
            const API_KEY = 'd8h5vm1r01qhjpmqoeh0d8h5vm1r01qhjpmqoehg'; // Replace with your free API key from finnhub.io
            const symbol = 'IBM';
            
            // Calculate date range
            const now = Math.floor(Date.now() / 1000);
            const rangeMap = {
                '1D': 1,
                '5D': 5,
                '1M': 30,
                '3M': 90,
                '6M': 180,
                '1Y': 365
            };
            const days = rangeMap[range] || 30;
            const from = now - (days * 24 * 60 * 60);
            
            // Fetch current quote
            const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;
            const quoteResponse = await fetch(quoteUrl);
            const quoteData = await quoteResponse.json();
            
            if (quoteData.error) {
                throw new Error(quoteData.error);
            }
            
            const currentPrice = quoteData.c; // Current price
            const change = quoteData.d; // Change
            const changePercent = quoteData.dp; // Change percent
            
            // Update UI
            document.getElementById('ibmStockPrice').textContent = `$${currentPrice.toFixed(2)}`;
            const changeElement = document.getElementById('ibmStockChange');
            const changeText = change >= 0
                ? `+$${change.toFixed(2)} (+${changePercent.toFixed(2)}%)`
                : `$${change.toFixed(2)} (${changePercent.toFixed(2)}%)`;
            changeElement.textContent = changeText;
            changeElement.style.color = change >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
            
            // Fetch historical candles for chart
            const resolution = range === '1D' ? '5' : 'D'; // 5 min for 1D, daily for others
            const candleUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${now}&token=${API_KEY}`;
            const candleResponse = await fetch(candleUrl);
            const candleData = await candleResponse.json();
            
            if (candleData.s === 'ok' && candleData.t && candleData.c) {
                this.createIBMStockChart(candleData.t, candleData.c, range);
            } else {
                console.warn('No historical data available, API response:', candleData);
                // Create sample chart as fallback
                this.createSampleStockChart(range);
                Notification.info('Showing sample chart data. Historical data may not be available for this timeframe.', 5000);
            }
            
        } catch (error) {
            console.error('Error fetching IBM stock data:', error);
            document.getElementById('ibmStockPrice').textContent = 'N/A';
            document.getElementById('ibmStockChange').textContent = 'Get free API key from finnhub.io';
            
            // Show helpful message
            if (error.message && error.message.includes('API key')) {
                Notification.warning('Please add your free Finnhub API key to script.js. Get one at finnhub.io/register');
            } else {
                Notification.warning('Unable to fetch stock data. Check console for details.');
            }
        }
    },
    
    createSampleStockChart(range) {
        // Create sample data for demonstration when API data is unavailable
        const canvas = document.getElementById('ibmStockChart');
        if (!canvas) return;
        
        // Generate sample data points
        const rangeMap = {
            '1D': 78,    // 5-min intervals for 6.5 hours
            '5D': 5,
            '1M': 30,
            '3M': 90,
            '6M': 180,
            '1Y': 365
        };
        const points = rangeMap[range] || 30;
        const basePrice = 195;
        
        const timestamps = [];
        const prices = [];
        const now = Math.floor(Date.now() / 1000);
        
        for (let i = 0; i < points; i++) {
            const timeOffset = range === '1D'
                ? (i * 5 * 60) // 5 minutes in seconds
                : (i * 24 * 60 * 60); // 1 day in seconds
            timestamps.push(now - ((points - i) * timeOffset));
            
            // Generate realistic-looking price movement
            const volatility = 2;
            const trend = (i / points) * 3; // Slight upward trend
            const randomWalk = (Math.random() - 0.5) * volatility;
            prices.push(basePrice + trend + randomWalk);
        }
        
        this.createIBMStockChart(timestamps, prices, range);
    },
    
    async fetchPHPtoUSDRate() {
        try {
            // Using exchangerate-api.com (free tier available)
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            
            if (!data.rates || !data.rates.PHP) {
                throw new Error('PHP rate not available');
            }
            
            const phpRate = data.rates.PHP;
            const lastUpdate = new Date(data.time_last_updated * 1000);
            
            // Update UI
            document.getElementById('phpToUsdRate').textContent = `₱${phpRate.toFixed(4)}`;
            document.getElementById('phpToUsdUpdate').textContent = `Updated: ${lastUpdate.toLocaleDateString()}`;
            
        } catch (error) {
            console.error('Error fetching PHP to USD rate:', error);
            document.getElementById('phpToUsdRate').textContent = 'N/A';
            document.getElementById('phpToUsdUpdate').textContent = 'Unable to fetch rate';
        }
    },
    
    createIBMStockChart(timestamps, closes, range) {
        const canvas = document.getElementById('ibmStockChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Prepare chart data - filter out null values
        const validData = [];
        for (let i = 0; i < timestamps.length; i++) {
            if (closes[i] !== null) {
                validData.push({
                    timestamp: timestamps[i],
                    price: closes[i]
                });
            }
        }
        
        // Format labels based on range
        const labels = validData.map(item => {
            const date = new Date(item.timestamp * 1000);
            if (range === '1D') {
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            } else if (range === '5D' || range === '1M') {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else {
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            }
        });
        
        const prices = validData.map(item => item.price);
        
        // Destroy existing chart
        if (AppState.charts.ibmStock) {
            AppState.charts.ibmStock.destroy();
        }
        
        // Create new chart
        AppState.charts.ibmStock = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'IBM Stock Price (USD)',
                    data: prices,
                    borderColor: '#4facfe',
                    backgroundColor: 'rgba(79, 172, 254, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: range === '1D' ? 1 : 2,
                    pointHoverRadius: 5
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
                                return `Price: $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Price (USD)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            maxTicksLimit: range === '1D' ? 12 : 10
                        }
                    }
                }
            }
        });
    },
    
    backupAllData() {
        const success = Utils.backupAllData();
        
        if (success) {
            Notification.success('All data backed up successfully!');
        } else {
            Notification.error('Failed to backup data');
        }
    },
    
    async updateStats() {
        // Latest Blood Sugar
        const bloodSugarData = AppState.data.bloodSugar;
        const levelElement = document.getElementById('latestBloodSugar');
        const labelElement = levelElement?.nextElementSibling;
        
        if (bloodSugarData.length > 0 && levelElement && labelElement) {
            const latest = bloodSugarData.reduce((latestRecord, currentRecord) => {
                const latestTime = new Date(latestRecord.datetime || latestRecord.date || 0).getTime();
                const currentTime = new Date(currentRecord.datetime || currentRecord.date || 0).getTime();
                return currentTime > latestTime ? currentRecord : latestRecord;
            });
            
            if (latest.level) {
                levelElement.textContent = latest.level;
                if (latest.datetime || latest.date) {
                    const date = new Date(latest.datetime || latest.date);
                    const formattedDate = date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });
                    const formattedTime = date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    labelElement.textContent = `mg/dL (${formattedDate} ${formattedTime})`;
                } else {
                    labelElement.textContent = 'mg/dL';
                }
            } else {
                levelElement.textContent = '--';
                labelElement.textContent = 'mg/dL';
            }
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
        
        // Active loans (including simple loans)
        const activeLoans = AppState.data.lending.filter(item =>
            item.status === 'Active' || item.status === 'Overdue'
        ).length;
        
        const activeSimpleLoans = AppState.data.simpleLoans.filter(item => {
            const details = SimpleLoanTracker.calculateLoanDetails(item);
            return details.balance > 0;
        }).length;
        
        const totalActiveLoans = activeLoans + activeSimpleLoans;
        
        document.getElementById('activeLoans').textContent = totalActiveLoans;
        
        // Payroll stats - aggregate all projects directly
        const totalEmployeesElement = document.getElementById('totalEmployees');
        const totalPayrollElement = document.getElementById('totalPayroll');
        
        if (totalEmployeesElement && totalPayrollElement && typeof FirebaseAPI !== 'undefined' && typeof PayrollModule !== 'undefined') {
            try {
                const projectsResponse = await FirebaseAPI.getPayrollProjects();
                const projects = projectsResponse.data || [];
                let allEmployees = [];
                
                for (const project of projects) {
                    const employeesResponse = await FirebaseAPI.getProjectEmployees(project.id);
                    const projectEmployees = employeesResponse.data || [];
                    allEmployees = allEmployees.concat(projectEmployees);
                }
                
                const totalEmployees = allEmployees.length;
                const totalPayroll = allEmployees.reduce((total, employee) => {
                    const grossPay = PayrollModule.calculateGrossPay(employee);
                    const deductions = PayrollModule.calculateDeductions(employee);
                    return total + (grossPay - deductions);
                }, 0);
                
                totalEmployeesElement.textContent = totalEmployees;
                totalPayrollElement.textContent = Utils.formatCurrency(totalPayroll);
            } catch (error) {
                console.error('Error loading overview payroll stats:', error);
                totalEmployeesElement.textContent = '0';
                totalPayrollElement.textContent = '₱0.00';
            }
        } else if (totalEmployeesElement && totalPayrollElement) {
            totalEmployeesElement.textContent = '0';
            totalPayrollElement.textContent = '₱0.00';
        }
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
                            <option value="Semi-Monthly">Semi-Monthly</option>
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
                            <option value="Semi-Monthly" ${record.paymentTerms === 'Semi-Monthly' ? 'selected' : ''}>Semi-Monthly</option>
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
            case 'Semi-Monthly':
                // Semi-monthly: 15 days apart (approximately twice a month)
                date.setDate(date.getDate() + (periodNumber * 15));
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
// Simple Loan Tracker Module
// ===================================
const SimpleLoanTracker = {
    init() {
        this.renderTable();
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        document.getElementById('addSimpleLoanBtn').addEventListener('click', () => {
            this.showAddModal();
        });
        
        document.getElementById('exportSimpleLoansBtn').addEventListener('click', () => {
            this.exportData();
        });
    },
    
    exportData() {
        const data = AppState.data.simpleLoans;
        
        if (data.length === 0) {
            Notification.warning('No data to export');
            return;
        }
        
        const exportData = data.map(item => {
            const details = this.calculateLoanDetails(item);
            return {
                'Borrower': item.borrower,
                'Date': Utils.formatDate(item.date),
                'Principal': parseFloat(details.principal),
                'Total Payments': parseFloat(details.totalPayments),
                'Total Charges': parseFloat(details.totalCharges),
                'Balance': parseFloat(details.balance),
                'Status': details.isPaid ? 'Paid' : 'Active'
            };
        });
        
        const success = Utils.exportToXLSX(exportData, 'simple_loans', 'Simple Loan Records');
        
        if (success) {
            Notification.success('Simple loan data exported successfully!');
        } else {
            Notification.error('Failed to export simple loan data');
        }
    },
    
    calculateLoanDetails(loan) {
        const principal = parseFloat(loan.principal || 0);
        const payments = loan.payments || [];
        const charges = loan.charges || [];
        
        const totalPayments = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const totalCharges = charges.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
        const balance = principal + totalCharges - totalPayments;
        
        return {
            principal,
            totalPayments,
            totalCharges,
            balance,
            isPaid: balance <= 0
        };
    },
    
    renderTable() {
        const tbody = document.getElementById('simpleLoansTableBody');
        const data = AppState.data.simpleLoans;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No records found</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(item => {
            const details = this.calculateLoanDetails(item);
            const statusClass = details.isPaid ? 'paid' : 'active';
            const status = details.isPaid ? 'Paid' : 'Active';
            
            return `
                <tr>
                    <td data-label="Borrower">
                        <strong>${item.borrower}</strong>
                        ${item.notes ? `<br><small>${item.notes}</small>` : ''}
                    </td>
                    <td data-label="Date">${Utils.formatDate(item.date)}</td>
                    <td data-label="Principal">${Utils.formatCurrency(details.principal)}</td>
                    <td data-label="Payments">${Utils.formatCurrency(details.totalPayments)}</td>
                    <td data-label="Charges">${Utils.formatCurrency(details.totalCharges)}</td>
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
                            <button class="action-btn" onclick="SimpleLoanTracker.viewTransactions('${item.id}')" title="View Transactions">
                                <i class="fas fa-list"></i>
                            </button>
                            <button class="action-btn" onclick="SimpleLoanTracker.addPayment('${item.id}')" title="Add Payment">
                                <i class="fas fa-money-bill-wave"></i>
                            </button>
                            <button class="action-btn" onclick="SimpleLoanTracker.addCharge('${item.id}')" title="Add Charge">
                                <i class="fas fa-plus-circle"></i>
                            </button>
                            <button class="action-btn" onclick="SimpleLoanTracker.edit('${item.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn action-btn-danger" onclick="SimpleLoanTracker.delete('${item.id}')" title="Delete">
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
            <form id="simpleLoanForm" class="modal-form">
                <div class="form-group">
                    <label for="simpleLoanBorrower">Borrower Name *</label>
                    <input type="text" id="simpleLoanBorrower" required>
                </div>
                <div class="form-group">
                    <label for="simpleLoanPrincipal">Principal Amount *</label>
                    <input type="number" id="simpleLoanPrincipal" required min="0" step="0.01" placeholder="0.00">
                </div>
                <div class="form-group">
                    <label for="simpleLoanDate">Date *</label>
                    <input type="date" id="simpleLoanDate" required value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label for="simpleLoanNotes">Notes</label>
                    <textarea id="simpleLoanNotes" rows="2" placeholder="Optional notes..."></textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Simple Loan</button>
                </div>
            </form>
        `;
        
        Modal.show('Add Simple Loan', content);
        
        document.getElementById('simpleLoanForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.save();
        });
    },
    
    showEditModal(id) {
        const record = AppState.data.simpleLoans.find(item => item.id === id);
        if (!record) return;
        
        const content = `
            <form id="simpleLoanForm" class="modal-form">
                <input type="hidden" id="simpleLoanId" value="${id}">
                <div class="form-group">
                    <label for="simpleLoanBorrower">Borrower Name *</label>
                    <input type="text" id="simpleLoanBorrower" required value="${record.borrower}">
                </div>
                <div class="form-group">
                    <label for="simpleLoanPrincipal">Principal Amount *</label>
                    <input type="number" id="simpleLoanPrincipal" required min="0" step="0.01" value="${record.principal}">
                </div>
                <div class="form-group">
                    <label for="simpleLoanDate">Date *</label>
                    <input type="date" id="simpleLoanDate" required value="${record.date}">
                </div>
                <div class="form-group">
                    <label for="simpleLoanNotes">Notes</label>
                    <textarea id="simpleLoanNotes" rows="2">${record.notes || ''}</textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update</button>
                </div>
            </form>
        `;
        
        Modal.show('Edit Simple Loan', content);
        
        document.getElementById('simpleLoanForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.save(id);
        });
    },
    
    async save(id = null) {
        const data = {
            borrower: document.getElementById('simpleLoanBorrower').value,
            principal: parseFloat(document.getElementById('simpleLoanPrincipal').value),
            date: document.getElementById('simpleLoanDate').value,
            notes: document.getElementById('simpleLoanNotes').value,
            payments: id ? AppState.data.simpleLoans.find(item => item.id === id)?.payments || [] : [],
            charges: id ? AppState.data.simpleLoans.find(item => item.id === id)?.charges || [] : []
        };
        
        try {
            if (id) {
                await DataAPI.updateSimpleLoan(id, data);
                const index = AppState.data.simpleLoans.findIndex(item => item.id === id);
                AppState.data.simpleLoans[index] = { ...AppState.data.simpleLoans[index], ...data };
                Notification.success('Simple loan updated successfully');
            } else {
                const result = await DataAPI.addSimpleLoan(data);
                AppState.data.simpleLoans.push(result.data || { id: Utils.generateId(), ...data });
                Notification.success('Simple loan added successfully');
            }
            
            this.renderTable();
            Overview.updateStats();
            Modal.hide();
        } catch (error) {
            Notification.error('Failed to save simple loan');
        }
    },
    
    addPayment(id) {
        const loan = AppState.data.simpleLoans.find(item => item.id === id);
        if (!loan) return;
        
        const details = this.calculateLoanDetails(loan);
        
        const content = `
            <form id="paymentForm" class="modal-form">
                <div class="form-group">
                    <label>Borrower: <strong>${loan.borrower}</strong></label>
                    <label>Current Balance: <strong style="color: var(--danger-color)">${Utils.formatCurrency(details.balance)}</strong></label>
                </div>
                <div class="form-group">
                    <label for="paymentAmount">Payment Amount *</label>
                    <input type="number" id="paymentAmount" required min="0.01" step="0.01" placeholder="0.00">
                </div>
                <div class="form-group">
                    <label for="paymentDate">Payment Date *</label>
                    <input type="date" id="paymentDate" required value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label for="paymentNotes">Notes</label>
                    <textarea id="paymentNotes" rows="2" placeholder="Optional notes..."></textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Payment</button>
                </div>
            </form>
        `;
        
        Modal.show('Add Payment', content);
        
        document.getElementById('paymentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.savePayment(id);
        });
    },
    
    async savePayment(id) {
        const loan = AppState.data.simpleLoans.find(item => item.id === id);
        if (!loan) return;
        
        const payment = {
            amount: parseFloat(document.getElementById('paymentAmount').value),
            date: document.getElementById('paymentDate').value,
            notes: document.getElementById('paymentNotes').value,
            timestamp: new Date().toISOString()
        };
        
        if (!loan.payments) loan.payments = [];
        loan.payments.push(payment);
        
        try {
            await DataAPI.updateSimpleLoan(id, loan);
            const index = AppState.data.simpleLoans.findIndex(item => item.id === id);
            AppState.data.simpleLoans[index] = loan;
            
            Notification.success('Payment added successfully');
            this.renderTable();
            Overview.updateStats();
            Modal.hide();
        } catch (error) {
            Notification.error('Failed to add payment');
        }
    },
    
    addCharge(id) {
        const loan = AppState.data.simpleLoans.find(item => item.id === id);
        if (!loan) return;
        
        const details = this.calculateLoanDetails(loan);
        
        const content = `
            <form id="chargeForm" class="modal-form">
                <div class="form-group">
                    <label>Borrower: <strong>${loan.borrower}</strong></label>
                    <label>Current Balance: <strong style="color: var(--danger-color)">${Utils.formatCurrency(details.balance)}</strong></label>
                </div>
                <div class="form-group">
                    <label for="chargeAmount">Charge Amount *</label>
                    <input type="number" id="chargeAmount" required min="0.01" step="0.01" placeholder="0.00">
                </div>
                <div class="form-group">
                    <label for="chargeDate">Charge Date *</label>
                    <input type="date" id="chargeDate" required value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label for="chargeDescription">Description *</label>
                    <input type="text" id="chargeDescription" required placeholder="e.g., Late fee, Interest, etc.">
                </div>
                <div class="form-group">
                    <label for="chargeNotes">Notes</label>
                    <textarea id="chargeNotes" rows="2" placeholder="Optional notes..."></textarea>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Charge</button>
                </div>
            </form>
        `;
        
        Modal.show('Add Financial Charge', content);
        
        document.getElementById('chargeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveCharge(id);
        });
    },
    
    async saveCharge(id) {
        const loan = AppState.data.simpleLoans.find(item => item.id === id);
        if (!loan) return;
        
        const charge = {
            amount: parseFloat(document.getElementById('chargeAmount').value),
            date: document.getElementById('chargeDate').value,
            description: document.getElementById('chargeDescription').value,
            notes: document.getElementById('chargeNotes').value,
            timestamp: new Date().toISOString()
        };
        
        if (!loan.charges) loan.charges = [];
        loan.charges.push(charge);
        
        try {
            await DataAPI.updateSimpleLoan(id, loan);
            const index = AppState.data.simpleLoans.findIndex(item => item.id === id);
            AppState.data.simpleLoans[index] = loan;
            
            Notification.success('Charge added successfully');
            this.renderTable();
            Overview.updateStats();
            Modal.hide();
        } catch (error) {
            Notification.error('Failed to add charge');
        }
    },
    
    viewTransactions(id) {
        const loan = AppState.data.simpleLoans.find(item => item.id === id);
        if (!loan) return;
        
        const details = this.calculateLoanDetails(loan);
        const payments = loan.payments || [];
        const charges = loan.charges || [];
        
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
                            <label>Total Charges:</label>
                            <span>${Utils.formatCurrency(details.totalCharges)}</span>
                        </div>
                        <div class="summary-item">
                            <label>Total Payments:</label>
                            <span>${Utils.formatCurrency(details.totalPayments)}</span>
                        </div>
                        <div class="summary-item">
                            <label>Balance:</label>
                            <span><strong style="color: ${details.balance > 0 ? 'var(--danger-color)' : 'var(--success-color)'}">
                                ${Utils.formatCurrency(details.balance)}
                            </strong></span>
                        </div>
                    </div>
                </div>
                
                <div class="payment-schedule">
                    <h4>Transaction History</h4>
                    <table class="schedule-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${Utils.formatDate(loan.date)}</td>
                                <td><span class="status-badge status-active">Principal</span></td>
                                <td>Initial loan amount</td>
                                <td style="color: var(--danger-color)">${Utils.formatCurrency(details.principal)}</td>
                                <td>-</td>
                            </tr>
                            ${charges.map((charge, index) => `
                                <tr>
                                    <td>${Utils.formatDate(charge.date)}</td>
                                    <td><span class="status-badge status-pending">Charge</span></td>
                                    <td>${charge.description}${charge.notes ? `<br><small>${charge.notes}</small>` : ''}</td>
                                    <td style="color: var(--danger-color)">+${Utils.formatCurrency(charge.amount)}</td>
                                    <td>
                                        <button class="action-btn action-btn-danger" onclick="SimpleLoanTracker.deleteCharge('${id}', ${index})" title="Delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${payments.map((payment, index) => `
                                <tr>
                                    <td>${Utils.formatDate(payment.date)}</td>
                                    <td><span class="status-badge status-paid">Payment</span></td>
                                    <td>${payment.notes || 'Payment received'}</td>
                                    <td style="color: var(--success-color)">-${Utils.formatCurrency(payment.amount)}</td>
                                    <td>
                                        <button class="action-btn action-btn-danger" onclick="SimpleLoanTracker.deletePayment('${id}', ${index})" title="Delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        Modal.show(`Transaction History - ${loan.borrower}`, content, 'large');
    },
    
    async deletePayment(loanId, paymentIndex) {
        if (!confirm('Are you sure you want to delete this payment?')) return;
        
        const loan = AppState.data.simpleLoans.find(item => item.id === loanId);
        if (!loan || !loan.payments || !loan.payments[paymentIndex]) return;
        
        loan.payments.splice(paymentIndex, 1);
        
        try {
            await DataAPI.updateSimpleLoan(loanId, loan);
            const index = AppState.data.simpleLoans.findIndex(item => item.id === loanId);
            AppState.data.simpleLoans[index] = loan;
            
            Notification.success('Payment deleted successfully');
            this.viewTransactions(loanId);
            this.renderTable();
        } catch (error) {
            Notification.error('Failed to delete payment');
        }
    },
    
    async deleteCharge(loanId, chargeIndex) {
        if (!confirm('Are you sure you want to delete this charge?')) return;
        
        const loan = AppState.data.simpleLoans.find(item => item.id === loanId);
        if (!loan || !loan.charges || !loan.charges[chargeIndex]) return;
        
        loan.charges.splice(chargeIndex, 1);
        
        try {
            await DataAPI.updateSimpleLoan(loanId, loan);
            const index = AppState.data.simpleLoans.findIndex(item => item.id === loanId);
            AppState.data.simpleLoans[index] = loan;
            
            Notification.success('Charge deleted successfully');
            this.viewTransactions(loanId);
            this.renderTable();
        } catch (error) {
            Notification.error('Failed to delete charge');
        }
    },
    
    edit(id) {
        this.showEditModal(id);
    },
    
    async delete(id) {
        if (!confirm('Are you sure you want to delete this simple loan?')) {
            return;
        }
        
        try {
            await DataAPI.deleteSimpleLoan(id);
            AppState.data.simpleLoans = AppState.data.simpleLoans.filter(item => item.id !== id);
            this.renderTable();
            Overview.updateStats();
            Notification.success('Simple loan deleted successfully');
        } catch (error) {
            Notification.error('Failed to delete simple loan');
        }
    }
};


// ===================================
// Documents Module
// ===================================
const Documents = {
    currentDoc: 'terms',
    initialized: false,
    
    init() {
        if (this.initialized) {
            // Just reload the current document if already initialized
            this.loadDocument(this.currentDoc);
            return;
        }
        
        this.setupEventListeners();
        this.loadDocument('terms');
        this.initialized = true;
        console.log('Documents module initialized');
    },
    
    setupEventListeners() {
        // Tab switching
        const tabs = document.querySelectorAll('.doc-tab');
        console.log('Setting up event listeners for', tabs.length, 'tabs');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const docType = e.currentTarget.dataset.doc;
                console.log('Switching to document:', docType);
                this.switchDocument(docType);
            });
        });
    },
    
    switchDocument(docType) {
        // Update active tab
        document.querySelectorAll('.doc-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-doc="${docType}"]`).classList.add('active');
        
        // Show selected document
        document.querySelectorAll('.doc-viewer').forEach(viewer => {
            viewer.style.display = 'none';
        });
        document.getElementById(`doc-${docType}`).style.display = 'block';
        
        // Load document if not already loaded
        if (this.currentDoc !== docType) {
            this.currentDoc = docType;
            this.loadDocument(docType);
        }
    },
    
    async loadDocument(docType) {
        const viewer = document.getElementById(`doc-${docType}`);
        if (!viewer) {
            console.error('Document viewer not found for:', docType);
            return;
        }
        
        const filename = docType === 'terms' ? 'docs/TERMS.md' : 'docs/NOTES.md';
        console.log('Loading document:', filename);
        
        try {
            viewer.innerHTML = '<div class="loading-spinner"></div><p>Loading document...</p>';
            
            const response = await fetch(filename);
            console.log('Fetch response:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const markdown = await response.text();
            console.log('Markdown loaded, length:', markdown.length);
            
            const html = this.parseMarkdown(markdown);
            console.log('HTML generated, length:', html.length);
            
            viewer.innerHTML = html;
            console.log('Document rendered successfully');
        } catch (error) {
            console.error('Error loading document:', error);
            viewer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--danger-color);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>Failed to load document</h3>
                    <p>Error: ${error.message}</p>
                    <p>The document file could not be loaded. Please make sure ${filename} exists in your repository.</p>
                    <p><small>Check the browser console for more details.</small></p>
                </div>
            `;
        }
    },
    
    parseMarkdown(markdown) {
        // Improved markdown parser
        let lines = markdown.split('\n');
        let html = '';
        let inList = false;
        let listType = '';
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            // Skip empty lines
            if (line.trim() === '') {
                if (inList) {
                    html += listType === 'ul' ? '</ul>' : '</ol>';
                    inList = false;
                }
                html += '<br>';
                continue;
            }
            
            // Headers
            if (line.startsWith('### ')) {
                if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
                html += `<h3>${this.parseInline(line.substring(4))}</h3>`;
            } else if (line.startsWith('## ')) {
                if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
                html += `<h2>${this.parseInline(line.substring(3))}</h2>`;
            } else if (line.startsWith('# ')) {
                if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
                html += `<h1>${this.parseInline(line.substring(2))}</h1>`;
            }
            // Horizontal rule
            else if (line.trim() === '---') {
                if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
                html += '<hr>';
            }
            // Unordered list
            else if (line.match(/^[\-\*] /)) {
                if (!inList || listType !== 'ul') {
                    if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
                    html += '<ul>';
                    inList = true;
                    listType = 'ul';
                }
                html += `<li>${this.parseInline(line.substring(2))}</li>`;
            }
            // Ordered list
            else if (line.match(/^\d+\. /)) {
                if (!inList || listType !== 'ol') {
                    if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
                    html += '<ol>';
                    inList = true;
                    listType = 'ol';
                }
                html += `<li>${this.parseInline(line.substring(line.indexOf('. ') + 2))}</li>`;
            }
            // Regular paragraph
            else {
                if (inList) {
                    html += listType === 'ul' ? '</ul>' : '</ol>';
                    inList = false;
                }
                html += `<p>${this.parseInline(line)}</p>`;
            }
        }
        
        // Close any open lists
        if (inList) {
            html += listType === 'ul' ? '</ul>' : '</ol>';
        }
        
        return html;
    },
    
    parseInline(text) {
        // Bold
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // Links
        text = text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
        // Code
        text = text.replace(/`(.*?)`/g, '<code>$1</code>');
        // Checkboxes
        text = text.replace(/\[ \]/g, '<input type="checkbox" disabled>');
        text = text.replace(/\[x\]/gi, '<input type="checkbox" checked disabled>');
        
        return text;
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

// ===================================
// User Management Module
// ===================================
const UserManagement = {
    init() {
        this.loadData();
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        document.getElementById('addUserBtn')?.addEventListener('click', () => {
            this.showAddModal();
        });
    },
    
    renderTable() {
        const tbody = document.getElementById('usersTableBody');
        const data = AppState.data.users;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map(user => {
            const permissionsList = this.formatPermissions(user.permissions);
            const statusClass = user.status === 'active' ? 'active' : 'inactive';
            
            return `
                <tr>
                    <td data-label="Username">
                        <strong>${user.username}</strong>
                    </td>
                    <td data-label="Role">
                        <span class="role-badge role-${user.role}">${user.role}</span>
                    </td>
                    <td data-label="Permissions">
                        <div class="permissions-list">${permissionsList}</div>
                    </td>
                    <td data-label="Status">
                        <span class="status-badge status-${statusClass}">${user.status}</span>
                    </td>
                    <td data-label="Created">${Utils.formatDate(user.createdAt)}</td>
                    <td data-label="Actions">
                        <div class="action-buttons">
                            <button class="action-btn" onclick="UserManagement.edit('${user.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="UserManagement.delete('${user.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    formatPermissions(permissions) {
        if (!permissions) return '<span class="text-muted">No permissions</span>';
        
        const modules = ['overview', 'blood-sugar', 'budget', 'financial', 'lending', 'payroll'];
        const perms = [];
        
        modules.forEach(module => {
            const perm = permissions[module];
            if (perm) {
                const icon = perm.modify ? '✏️' : '👁️';
                const label = module.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
                perms.push(`${icon} ${label}`);
            }
        });
        
        return perms.length > 0 ? perms.join('<br>') : '<span class="text-muted">No permissions</span>';
    },
    
    showAddModal() {
        const content = `
            <form id="userForm" class="form">
                <div class="form-group">
                    <label for="username">Username *</label>
                    <input type="text" id="username" name="username" required
                           pattern="[a-zA-Z0-9_]{3,20}"
                           title="3-20 characters, letters, numbers, and underscore only">
                    <small class="form-help">3-20 characters, alphanumeric and underscore only</small>
                </div>
                
                <div class="form-group">
                    <label for="password">Password *</label>
                    <input type="password" id="password" name="password" required
                           minlength="8">
                    <div id="passwordStrength" class="password-strength" style="display: none;">
                        <div class="strength-bar">
                            <div class="strength-fill"></div>
                        </div>
                        <span class="strength-text"></span>
                    </div>
                    <small class="form-help">Minimum 8 characters with uppercase, lowercase, number, and special character</small>
                    <div id="passwordErrors" class="password-errors"></div>
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password *</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" required>
                    <small id="passwordMatch" class="form-help"></small>
                </div>
                
                <div class="form-group">
                    <label for="role">Role *</label>
                    <select id="role" name="role" required>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="status">Status *</label>
                    <select id="status" name="status" required>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="enable2FA" name="enable2FA">
                        Enable Two-Factor Authentication (2FA)
                    </label>
                    <small class="form-help">User will need to set up 2FA on first login</small>
                </div>
                
                <div class="form-group">
                    <label>Module Permissions</label>
                    <div class="permissions-grid">
                        ${this.renderPermissionCheckboxes()}
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="submitUserBtn">Add User</button>
                </div>
            </form>
        `;
        
        Modal.show('Add New User', content, 'large');
        
        const form = document.getElementById('userForm');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const submitBtn = document.getElementById('submitUserBtn');
        
        // Password strength indicator
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const strengthDiv = document.getElementById('passwordStrength');
            const errorsDiv = document.getElementById('passwordErrors');
            
            if (password.length > 0) {
                strengthDiv.style.display = 'block';
                const validation = AuthSecurity.validatePassword(password);
                const strengthInfo = AuthSecurity.getPasswordStrengthLabel(validation.strength);
                
                const strengthFill = strengthDiv.querySelector('.strength-fill');
                const strengthText = strengthDiv.querySelector('.strength-text');
                
                strengthFill.style.width = validation.strength + '%';
                strengthFill.style.backgroundColor = strengthInfo.color;
                strengthText.textContent = strengthInfo.label;
                strengthText.style.color = strengthInfo.color;
                
                if (!validation.valid) {
                    errorsDiv.innerHTML = '<ul>' + validation.errors.map(e => `<li>${e}</li>`).join('') + '</ul>';
                    errorsDiv.style.color = '#ef4444';
                } else {
                    errorsDiv.innerHTML = '<span style="color: #10b981;">✓ Password meets requirements</span>';
                }
            } else {
                strengthDiv.style.display = 'none';
                errorsDiv.innerHTML = '';
            }
        });
        
        // Password match validation
        const checkPasswordMatch = () => {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            const matchDiv = document.getElementById('passwordMatch');
            
            if (confirmPassword.length > 0) {
                if (password === confirmPassword) {
                    matchDiv.textContent = '✓ Passwords match';
                    matchDiv.style.color = '#10b981';
                } else {
                    matchDiv.textContent = '✗ Passwords do not match';
                    matchDiv.style.color = '#ef4444';
                }
            } else {
                matchDiv.textContent = '';
            }
        };
        
        passwordInput.addEventListener('input', checkPasswordMatch);
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAdd(e.target);
        });
        
        // Show/hide permissions based on role
        document.getElementById('role').addEventListener('change', (e) => {
            const permissionsGrid = document.querySelector('.permissions-grid');
            permissionsGrid.style.display = e.target.value === 'admin' ? 'none' : 'grid';
        });
    },
    
    renderPermissionCheckboxes() {
        const modules = [
            { id: 'overview', name: 'Overview', icon: 'fa-home' },
            { id: 'blood-sugar', name: 'Blood Sugar', icon: 'fa-heartbeat' },
            { id: 'budget', name: 'Budget', icon: 'fa-money-bill-wave' },
            { id: 'financial', name: 'Financial', icon: 'fa-wallet' },
            { id: 'lending', name: 'Lending', icon: 'fa-hand-holding-usd' },
            { id: 'payroll', name: 'Payroll System', icon: 'fa-money-check-alt' }
        ];
        
        return modules.map(module => `
            <div class="permission-item">
                <div class="permission-header">
                    <i class="fas ${module.icon}"></i>
                    <strong>${module.name}</strong>
                </div>
                <div class="permission-options">
                    <label>
                        <input type="checkbox" name="perm_${module.id}_view" value="1">
                        View
                    </label>
                    <label>
                        <input type="checkbox" name="perm_${module.id}_modify" value="1">
                        Modify
                    </label>
                </div>
            </div>
        `).join('');
    },
    
    async handleAdd(form) {
        const formData = new FormData(form);
        const username = AuthSecurity.sanitizeInput(formData.get('username'));
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const role = formData.get('role');
        
        // Validate username
        if (!AuthSecurity.validateUsername(username)) {
            Notification.error('Invalid username format. Use 3-20 alphanumeric characters and underscore only.');
            return;
        }
        
        // Validate password
        const passwordValidation = AuthSecurity.validatePassword(password);
        if (!passwordValidation.valid) {
            Notification.error('Password does not meet requirements: ' + passwordValidation.errors.join(', '));
            return;
        }
        
        // Check password match
        if (password !== confirmPassword) {
            Notification.error('Passwords do not match');
            return;
        }
        
        // Check if username already exists
        const existingUser = await FirebaseAPI.getUserByUsername(username);
        if (existingUser.success && existingUser.data) {
            Notification.error('Username already exists');
            return;
        }
        
        // Hash password
        const { hash, salt } = await AuthSecurity.hashPassword(password);
        
        // Build permissions object
        const permissions = {};
        if (role !== 'admin') {
            const modules = ['overview', 'blood-sugar', 'budget', 'financial', 'lending', 'payroll'];
            modules.forEach(module => {
                const view = formData.get(`perm_${module}_view`);
                const modify = formData.get(`perm_${module}_modify`);
                
                if (view || modify) {
                    permissions[module] = {
                        view: !!view,
                        modify: !!modify
                    };
                }
            });
        }
        
        const userData = {
            username: username,
            passwordHash: hash,
            passwordSalt: salt,
            role: role,
            status: formData.get('status'),
            permissions: role === 'admin' ? null : permissions,
            twoFactorEnabled: formData.get('enable2FA') === 'on',
            twoFactorSecret: formData.get('enable2FA') === 'on' ? AuthSecurity.generate2FASecret() : null,
            createdBy: AppState.currentUser?.username || 'system',
            passwordChangedAt: Date.now()
        };
        
        try {
            await FirebaseAPI.addUser(userData);
            
            // Log security event
            await AuthSecurity.logSecurityEvent({
                type: 'user_management',
                username: AppState.currentUser?.username,
                action: 'user_created',
                success: true,
                details: { newUser: username, role: role }
            });
            
            Notification.success('User added successfully');
            Modal.hide();
            await this.loadData();
        } catch (error) {
            console.error('Add user error:', error);
            Notification.error('Failed to add user: ' + error.message);
            
            await AuthSecurity.logSecurityEvent({
                type: 'user_management',
                username: AppState.currentUser?.username,
                action: 'user_create_failed',
                success: false,
                details: { error: error.message }
            });
        }
    },
    
    async edit(id) {
        const user = AppState.data.users.find(u => u.id === id);
        if (!user) return;
        
        const content = `
            <form id="userForm" class="form">
                <div class="form-group">
                    <label for="username">Username *</label>
                    <input type="text" id="username" name="username" value="${user.username}" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Password (leave blank to keep current)</label>
                    <input type="password" id="password" name="password">
                </div>
                
                <div class="form-group">
                    <label for="role">Role *</label>
                    <select id="role" name="role" required>
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="status">Status *</label>
                    <select id="status" name="status" required>
                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Module Permissions</label>
                    <div class="permissions-grid">
                        ${this.renderPermissionCheckboxes(user.permissions)}
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update User</button>
                </div>
            </form>
        `;
        
        Modal.show('Edit User', content, 'large');
        
        // Pre-check permissions
        if (user.permissions) {
            Object.keys(user.permissions).forEach(module => {
                const perms = user.permissions[module];
                if (perms.view) {
                    document.querySelector(`input[name="perm_${module}_view"]`).checked = true;
                }
                if (perms.modify) {
                    document.querySelector(`input[name="perm_${module}_modify"]`).checked = true;
                }
            });
        }
        
        document.getElementById('userForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUpdate(id, e.target);
        });
        
        // Show/hide permissions based on role
        document.getElementById('role').addEventListener('change', (e) => {
            const permissionsGrid = document.querySelector('.permissions-grid');
            permissionsGrid.style.display = e.target.value === 'admin' ? 'none' : 'grid';
        });
    },
    
    async handleUpdate(id, form) {
        const formData = new FormData(form);
        const role = formData.get('role');
        
        // Build permissions object
        const permissions = {};
        if (role !== 'admin') {
            const modules = ['overview', 'blood-sugar', 'budget', 'financial', 'lending', 'payroll'];
            modules.forEach(module => {
                const view = formData.get(`perm_${module}_view`);
                const modify = formData.get(`perm_${module}_modify`);
                
                if (view || modify) {
                    permissions[module] = {
                        view: !!view,
                        modify: !!modify
                    };
                }
            });
        }
        
        const userData = {
            username: formData.get('username'),
            role: role,
            status: formData.get('status'),
            permissions: role === 'admin' ? null : permissions
        };
        
        // Only update password if provided
        const password = formData.get('password');
        if (password) {
            userData.password = password; // In production, hash this!
        }
        
        try {
            await FirebaseAPI.updateUser(id, userData);
            Notification.success('User updated successfully');
            Modal.hide();
            await this.loadData();
        } catch (error) {
            Notification.error('Failed to update user: ' + error.message);
        }
    },
    
    async delete(id) {
        const user = AppState.data.users.find(u => u.id === id);
        if (!user) return;
        
        // Prevent deleting yourself
        if (AppState.currentUser && AppState.currentUser.id === id) {
            Notification.warning('You cannot delete your own account');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) {
            return;
        }
        
        try {
            await FirebaseAPI.deleteUser(id);
            Notification.success('User deleted successfully');
            await this.loadData();
        } catch (error) {
            Notification.error('Failed to delete user: ' + error.message);
        }
    },
    
    async loadData() {
        try {
            const response = await FirebaseAPI.getUsers();
            AppState.data.users = response.data;
            this.renderTable();
        } catch (error) {
            console.error('Error loading users:', error);
            Notification.error('Failed to load users');
        }
    }
};


// Made with Bob
