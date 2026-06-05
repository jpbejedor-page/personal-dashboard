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
        lending: [],
        simpleLoans: [],
        users: []
    },
    charts: {},
    isLoading: false,
    
    // Check if current user has permission for a module
    hasPermission(module, action = 'view') {
        if (!this.currentUser) return false;
        if (this.currentUser.role === 'admin') return true;
        
        const permissions = this.currentUser.permissions || {};
        const modulePerms = permissions[module];
        
        if (!modulePerms) return false;
        if (action === 'view') return modulePerms.view || modulePerms.modify;
        if (action === 'modify') return modulePerms.modify;
        
        return false;
    },
    
    // Check if current user is admin
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }
};

console.log('AppState module loaded');

// Made with Bob
