# New Modular Project Structure

## Overview
The project has been reorganized into a modular structure for better maintainability and debugging.

## Directory Structure

```
/MyPersonalWebsite
├── js/
│   ├── config.js                    # Configuration (moved from root)
│   ├── firebase-api.js              # Firebase API wrapper (moved from root)
│   ├── auth-security.js             # Authentication & Security (moved from root)
│   │
│   ├── core/                        # Core system modules
│   │   ├── app-state.js            # Global state management
│   │   ├── utils.js                # Utility functions
│   │   ├── notification.js         # Notification system
│   │   ├── modal.js                # Modal system
│   │   └── data-api.js             # Data API layer (Firebase/Mock)
│   │
│   ├── modules/                     # Feature modules
│   │   ├── auth.js                 # Authentication module
│   │   ├── dashboard.js            # Dashboard & navigation
│   │   ├── overview.js             # Overview/stats module
│   │   ├── blood-sugar.js          # Blood sugar tracking
│   │   ├── budget.js               # Budget management
│   │   ├── financial.js            # Financial transactions
│   │   ├── lending.js              # Lending business
│   │   ├── simple-loans.js         # Simple loan tracker
│   │   ├── user-management.js      # User management
│   │   └── payroll.js              # Payroll system (moved from root)
│   │
│   └── app.js                       # Main application orchestrator
│
├── index.html                       # Main HTML file
├── style.css                        # Styles
├── script.js                        # LEGACY - To be deprecated
└── docs/                            # Documentation

```

## Module Dependencies

### Load Order (Critical)
Scripts must be loaded in this order in index.html:

1. **External Libraries**
   - Firebase SDK
   - Chart.js
   - XLSX (SheetJS)

2. **Configuration**
   - `js/config.js`

3. **Core Modules** (no dependencies on each other)
   - `js/core/app-state.js`
   - `js/core/utils.js`
   - `js/core/notification.js`
   - `js/core/modal.js`

4. **API Layer** (depends on config, utils)
   - `js/firebase-api.js`
   - `js/auth-security.js`
   - `js/core/data-api.js`

5. **Feature Modules** (depend on core + API)
   - `js/modules/auth.js`
   - `js/modules/dashboard.js`
   - `js/modules/overview.js`
   - `js/modules/blood-sugar.js`
   - `js/modules/budget.js`
   - `js/modules/financial.js`
   - `js/modules/lending.js`
   - `js/modules/simple-loans.js`
   - `js/modules/user-management.js`
   - `js/modules/payroll.js`

6. **Application Orchestrator**
   - `js/app.js`

## Module Descriptions

### Core Modules

#### `app-state.js`
- Global application state
- Current user management
- Data storage
- Permission checking

#### `utils.js`
- Date/time formatting
- Currency formatting
- Data export (XLSX)
- Backup functionality
- Helper functions

#### `notification.js`
- Toast notification system
- Success/error/warning/info messages

#### `modal.js`
- Modal dialog system
- Dynamic content loading

#### `data-api.js`
- Abstraction layer for data operations
- Switches between Firebase and Mock API
- Consistent interface for all modules

### API Layer

#### `firebase-api.js`
- Firebase Realtime Database wrapper
- CRUD operations for all data types
- Real-time listeners

#### `auth-security.js`
- Password hashing (SHA-256)
- Session management
- Rate limiting
- 2FA support
- Security logging
- Password validation

### Feature Modules

#### `auth.js`
- Login/logout functionality
- Session restoration
- 2FA verification
- Google OAuth integration

#### `dashboard.js`
- Navigation management
- Module switching
- Permission-based UI
- Dark mode
- Mobile menu

#### `overview.js`
- Statistics dashboard
- Charts (blood sugar, financial)
- Data summaries

#### `blood-sugar.js`
- Blood sugar tracking
- Health indicators
- Data visualization

#### `budget.js`
- Monthly budget planning
- Allocation management
- Budget vs actual tracking

#### `financial.js`
- Income/expense tracking
- Transaction management
- Financial reports

#### `lending.js`
- Lending business management
- Loan tracking
- Payment schedules
- Interest calculations

#### `simple-loans.js`
- Simple loan tracker
- Payment tracking
- Balance calculations

#### `user-management.js`
- User CRUD operations
- Role management
- Permission assignment

#### `payroll.js`
- Project-based payroll
- Employee management
- Salary calculations
- Payslip generation

## Migration Strategy

### Phase 1: Core Extraction (COMPLETED)
- ✅ Created modular directory structure
- ✅ Extracted core modules (app-state, utils, notification, modal, data-api)
- ✅ Moved existing modular files (config, firebase-api, auth-security, payroll)

### Phase 2: Feature Module Extraction (IN PROGRESS)
- Extract remaining modules from script.js
- Create individual module files
- Maintain functionality

### Phase 3: Integration
- Update index.html with new script tags
- Create app.js orchestrator
- Test all functionality

### Phase 4: Cleanup
- Remove script.js
- Update documentation
- Final testing

## Benefits

1. **Easier Debugging**
   - Each module is in its own file
   - Clear separation of concerns
   - Easier to locate issues

2. **Better Maintainability**
   - Smaller, focused files
   - Clear dependencies
   - Easier to understand

3. **Improved Collaboration**
   - Multiple developers can work on different modules
   - Reduced merge conflicts
   - Clear module boundaries

4. **Better Testing**
   - Each module can be tested independently
   - Mock dependencies easily
   - Unit testing friendly

5. **Performance**
   - Browser can cache individual modules
   - Easier to implement code splitting
   - Selective loading possible

## Usage

### Adding a New Feature Module

1. Create file in `js/modules/your-module.js`
2. Follow this template:

```javascript
// ===================================
// Your Module Name
// ===================================
const YourModule = {
    init() {
        // Initialize module
        this.setupEventListeners();
        this.loadData();
    },
    
    setupEventListeners() {
        // Attach event listeners
    },
    
    async loadData() {
        // Load data from API
    },
    
    // Other methods...
};

console.log('YourModule loaded');
```

3. Add script tag to index.html in correct order
4. Call `YourModule.init()` from appropriate place

### Accessing Other Modules

All modules are global objects. Access them directly:

```javascript
// From any module
AppState.currentUser
Utils.formatCurrency(1000)
Notification.success('Done!')
Modal.show('Title', 'Content')
DataAPI.getBloodSugar()
```

## Notes

- All modules use global scope for simplicity
- No module bundler required
- Compatible with existing codebase
- Gradual migration possible
- Original script.js kept as reference during transition

## Next Steps

1. Complete extraction of remaining modules from script.js
2. Update index.html with new script references
3. Test all functionality
4. Remove script.js
5. Update all documentation

---

**Created**: 2026-06-05
**Status**: In Progress
**Original File**: script.js (3892 lines)
**Target**: ~15 modular files (~200-400 lines each)