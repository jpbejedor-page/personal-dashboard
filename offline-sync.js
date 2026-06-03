// ===================================
// Offline-First Sync Manager
// Add this script before script.js in index.html
// ===================================

// Extend AppState with offline capabilities
if (typeof AppState !== 'undefined') {
    AppState.isOnline = navigator.onLine;
    AppState.pendingSync = {
        bloodSugar: [],
        financial: [],
        lending: []
    };
}

// ===================================
// Offline Storage Manager
// ===================================
const OfflineStorage = {
    // Save data to localStorage
    saveToLocal(key, data) {
        try {
            localStorage.setItem(`dashboard_${key}`, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },
    
    // Load data from localStorage
    loadFromLocal(key) {
        try {
            const data = localStorage.getItem(`dashboard_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    },
    
    // Save all module data
    saveAllData() {
        this.saveToLocal('bloodSugar', AppState.data.bloodSugar);
        this.saveToLocal('financial', AppState.data.financial);
        this.saveToLocal('lending', AppState.data.lending);
    },
    
    // Load all module data
    loadAllData() {
        const bloodSugar = this.loadFromLocal('bloodSugar');
        const financial = this.loadFromLocal('financial');
        const lending = this.loadFromLocal('lending');
        
        if (bloodSugar) AppState.data.bloodSugar = bloodSugar;
        if (financial) AppState.data.financial = financial;
        if (lending) AppState.data.lending = lending;
    },
    
    // Save pending sync operations
    savePendingSync(module, operation, data) {
        const pending = this.loadFromLocal('pendingSync') || { bloodSugar: [], financial: [], lending: [] };
        pending[module].push({
            operation,
            data,
            timestamp: Date.now(),
            syncId: Date.now().toString(36) + Math.random().toString(36).substr(2)
        });
        this.saveToLocal('pendingSync', pending);
        if (typeof AppState !== 'undefined') {
            AppState.pendingSync = pending;
        }
        return pending;
    },
    
    // Clear pending sync for a module
    clearPendingSync(module) {
        const pending = this.loadFromLocal('pendingSync') || { bloodSugar: [], financial: [], lending: [] };
        pending[module] = [];
        this.saveToLocal('pendingSync', pending);
        if (typeof AppState !== 'undefined') {
            AppState.pendingSync = pending;
        }
    },
    
    // Get all pending syncs
    getPendingSync() {
        return this.loadFromLocal('pendingSync') || { bloodSugar: [], financial: [], lending: [] };
    },
    
    // Get pending count
    getPendingCount() {
        const pending = this.getPendingSync();
        return pending.bloodSugar.length + pending.financial.length + pending.lending.length;
    }
};

// ===================================
// Sync Manager
// ===================================
const SyncManager = {
    isSyncing: false,
    syncInterval: null,
    
    // Initialize sync listeners
    init() {
        // Load cached data first
        OfflineStorage.loadAllData();
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            if (typeof AppState !== 'undefined') {
                AppState.isOnline = true;
            }
            console.log('Back online! Syncing data...');
            if (typeof Notification !== 'undefined' && Notification.success) {
                Notification.success('Back online! Syncing data...');
            }
            this.syncAll();
        });
        
        window.addEventListener('offline', () => {
            if (typeof AppState !== 'undefined') {
                AppState.isOnline = false;
            }
            console.log('You are offline. Changes will sync when back online.');
            if (typeof Notification !== 'undefined' && Notification.warning) {
                Notification.warning('You are offline. Changes will sync when back online.');
            }
        });
        
        // Check for pending syncs on load
        const pendingCount = OfflineStorage.getPendingCount();
        if (pendingCount > 0 && navigator.onLine) {
            console.log(`Found ${pendingCount} pending changes. Syncing...`);
            setTimeout(() => this.syncAll(), 2000); // Wait 2 seconds after page load
        }
        
        // Periodic sync check (every 30 seconds)
        this.syncInterval = setInterval(() => {
            if (navigator.onLine && OfflineStorage.getPendingCount() > 0) {
                this.syncAll();
            }
        }, 30000);
    },
    
    // Sync all pending changes
    async syncAll() {
        if (this.isSyncing || !navigator.onLine) return;
        
        this.isSyncing = true;
        const pending = OfflineStorage.getPendingSync();
        let syncCount = 0;
        let errorCount = 0;
        
        try {
            // Check if DataAPI is available
            if (typeof DataAPI === 'undefined') {
                console.warn('DataAPI not available, skipping sync');
                return;
            }
            
            // Sync Blood Sugar
            for (const item of pending.bloodSugar) {
                try {
                    await this.syncItem('bloodSugar', item);
                    syncCount++;
                } catch (error) {
                    console.error('Error syncing blood sugar item:', error);
                    errorCount++;
                }
            }
            if (errorCount === 0) {
                OfflineStorage.clearPendingSync('bloodSugar');
            }
            
            // Sync Financial
            for (const item of pending.financial) {
                try {
                    await this.syncItem('financial', item);
                    syncCount++;
                } catch (error) {
                    console.error('Error syncing financial item:', error);
                    errorCount++;
                }
            }
            if (errorCount === 0) {
                OfflineStorage.clearPendingSync('financial');
            }
            
            // Sync Lending
            for (const item of pending.lending) {
                try {
                    await this.syncItem('lending', item);
                    syncCount++;
                } catch (error) {
                    console.error('Error syncing lending item:', error);
                    errorCount++;
                }
            }
            if (errorCount === 0) {
                OfflineStorage.clearPendingSync('lending');
            }
            
            if (syncCount > 0) {
                console.log(`Successfully synced ${syncCount} changes`);
                if (typeof Notification !== 'undefined' && Notification.success) {
                    Notification.success(`Synced ${syncCount} changes to Google Sheets`);
                }
                
                // Reload data from server if Dashboard is available
                if (typeof Dashboard !== 'undefined' && Dashboard.loadAllData) {
                    await Dashboard.loadAllData();
                }
            }
            
            if (errorCount > 0) {
                console.warn(`${errorCount} items failed to sync. Will retry later.`);
                if (typeof Notification !== 'undefined' && Notification.warning) {
                    Notification.warning('Some changes could not be synced. Will retry later.');
                }
            }
        } catch (error) {
            console.error('Sync error:', error);
            if (typeof Notification !== 'undefined' && Notification.error) {
                Notification.error('Sync failed. Will retry later.');
            }
        } finally {
            this.isSyncing = false;
        }
    },
    
    // Sync individual item
    async syncItem(module, item) {
        if (typeof DataAPI === 'undefined') {
            throw new Error('DataAPI not available');
        }
        
        try {
            switch (item.operation) {
                case 'add':
                    if (module === 'bloodSugar') {
                        await DataAPI.addBloodSugar(item.data);
                    } else if (module === 'financial') {
                        await DataAPI.addFinancial(item.data);
                    } else if (module === 'lending') {
                        await DataAPI.addLending(item.data);
                    }
                    break;
                case 'update':
                    if (module === 'bloodSugar') {
                        await DataAPI.updateBloodSugar(item.data.id, item.data);
                    } else if (module === 'financial') {
                        await DataAPI.updateFinancial(item.data.id, item.data);
                    } else if (module === 'lending') {
                        await DataAPI.updateLending(item.data.id, item.data);
                    }
                    break;
                case 'delete':
                    if (module === 'bloodSugar') {
                        await DataAPI.deleteBloodSugar(item.data.id);
                    } else if (module === 'financial') {
                        await DataAPI.deleteFinancial(item.data.id);
                    } else if (module === 'lending') {
                        await DataAPI.deleteLending(item.data.id);
                    }
                    break;
            }
        } catch (error) {
            console.error(`Error syncing ${module}:`, error);
            throw error;
        }
    },
    
    // Manual sync trigger
    triggerSync() {
        if (navigator.onLine) {
            this.syncAll();
        } else {
            if (typeof Notification !== 'undefined' && Notification.warning) {
                Notification.warning('Cannot sync while offline');
            }
        }
    }
};

// Auto-save data to localStorage whenever it changes
if (typeof window !== 'undefined') {
    // Save data periodically
    setInterval(() => {
        if (typeof AppState !== 'undefined' && AppState.data) {
            OfflineStorage.saveAllData();
        }
    }, 5000); // Save every 5 seconds
    
    // Save before page unload
    window.addEventListener('beforeunload', () => {
        if (typeof AppState !== 'undefined' && AppState.data) {
            OfflineStorage.saveAllData();
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        SyncManager.init();
    });
} else {
    SyncManager.init();
}

console.log('Offline-First Sync Manager loaded');

// Made with Bob
