// ===================================
// Firebase Realtime Database API
// ===================================

// Firebase API wrapper for dashboard
const FirebaseAPI = {
    db: null,
    initialized: false,
    
    // Initialize Firebase
    init(config) {
        if (this.initialized) return;
        
        try {
            // Initialize Firebase
            firebase.initializeApp(config);
            this.db = firebase.database();
            this.initialized = true;
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization error:', error);
            throw error;
        }
    },
    
    // Helper to get reference
    getRef(path) {
        return this.db.ref(path);
    },
    
    // ===================================
    // Blood Sugar API
    // ===================================
    async getBloodSugar() {
        try {
            const snapshot = await this.getRef('bloodSugar').once('value');
            const data = snapshot.val();
            const records = data ? Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })) : [];
            return { data: records };
        } catch (error) {
            console.error('Error getting blood sugar:', error);
            throw error;
        }
    },
    
    async addBloodSugar(data) {
        try {
            const newRef = this.getRef('bloodSugar').push();
            await newRef.set({
                ...data,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            return { 
                success: true, 
                data: { id: newRef.key, ...data }
            };
        } catch (error) {
            console.error('Error adding blood sugar:', error);
            throw error;
        }
    },
    
    async updateBloodSugar(id, data) {
        try {
            await this.getRef(`bloodSugar/${id}`).update({
                ...data,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating blood sugar:', error);
            throw error;
        }
    },
    
    
    // ===================================
    // Budget API
    // ===================================
    async getBudget() {
        try {
            const snapshot = await this.getRef('budget').once('value');
            const data = snapshot.val();
            const records = data ? Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })) : [];
            return { data: records };
        } catch (error) {
            console.error('Error getting budget:', error);
            throw error;
        }
    },
    
    async addBudget(data) {
        try {
            const ref = this.getRef('budget').push();
            await ref.set(data);
            return { success: true, data: { id: ref.key, ...data } };
        } catch (error) {
            console.error('Error adding budget:', error);
            throw error;
        }
    },
    
    async updateBudget(id, data) {
        try {
            await this.getRef(`budget/${id}`).update(data);
            return { success: true };
        } catch (error) {
            console.error('Error updating budget:', error);
            throw error;
        }
    },
    
    async deleteBudget(id) {
        try {
            await this.getRef(`budget/${id}`).remove();
            return { success: true };
        } catch (error) {
            console.error('Error deleting budget:', error);
            throw error;
        }
    },
    async deleteBloodSugar(id) {
        try {
            await this.getRef(`bloodSugar/${id}`).remove();
            return { success: true };
        } catch (error) {
            console.error('Error deleting blood sugar:', error);
            throw error;
        }
    },
    
    // ===================================
    // Financial API
    // ===================================
    async getFinancial() {
        try {
            const snapshot = await this.getRef('financial').once('value');
            const data = snapshot.val();
            const records = data ? Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })) : [];
            return { data: records };
        } catch (error) {
            console.error('Error getting financial:', error);
            throw error;
        }
    },
    
    async addFinancial(data) {
        try {
            const newRef = this.getRef('financial').push();
            await newRef.set({
                ...data,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            return { 
                success: true, 
                data: { id: newRef.key, ...data }
            };
        } catch (error) {
            console.error('Error adding financial:', error);
            throw error;
        }
    },
    
    async updateFinancial(id, data) {
        try {
            await this.getRef(`financial/${id}`).update({
                ...data,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating financial:', error);
            throw error;
        }
    },
    
    async deleteFinancial(id) {
        try {
            await this.getRef(`financial/${id}`).remove();
            return { success: true };
        } catch (error) {
            console.error('Error deleting financial:', error);
            throw error;
        }
    },
    
    // ===================================
    // Lending API
    // ===================================
    async getLending() {
        try {
            const snapshot = await this.getRef('lending').once('value');
            const data = snapshot.val();
            const records = data ? Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })) : [];
            return { data: records };
        } catch (error) {
            console.error('Error getting lending:', error);
            throw error;
        }
    },
    
    async addLending(data) {
        try {
            const newRef = this.getRef('lending').push();
            await newRef.set({
                ...data,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            return { 
                success: true, 
                data: { id: newRef.key, ...data }
            };
        } catch (error) {
            console.error('Error adding lending:', error);
            throw error;
        }
    },
    
    async updateLending(id, data) {
        try {
            await this.getRef(`lending/${id}`).update({
                ...data,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating lending:', error);
            throw error;
        }
    },
    
    async deleteLending(id) {
        try {
            await this.getRef(`lending/${id}`).remove();
            return { success: true };
        } catch (error) {
            console.error('Error deleting lending:', error);
            throw error;
        }
    },
    
    // ===================================
    // Real-time Listeners
    // ===================================
    onBloodSugarChange(callback) {
        this.getRef('bloodSugar').on('value', (snapshot) => {
            const data = snapshot.val();
            const records = data ? Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })) : [];
            callback(records);
        });
    },
    
    onFinancialChange(callback) {
        this.getRef('financial').on('value', (snapshot) => {
            const data = snapshot.val();
            const records = data ? Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })) : [];
            callback(records);
        });
    },
    
    onLendingChange(callback) {
        this.getRef('lending').on('value', (snapshot) => {
            const data = snapshot.val();
            const records = data ? Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })) : [];
            callback(records);
        });
    },
    
    // Remove listeners
    offBloodSugarChange() {
        this.getRef('bloodSugar').off();
    },
    
    offFinancialChange() {
        this.getRef('financial').off();
    },
    
    offLendingChange() {
        this.getRef('lending').off();
    },
    
    // ===================================
    // User Management API
    // ===================================
    async getUsers() {
        try {
            const snapshot = await this.getRef('users').once('value');
            const data = snapshot.val();
            const records = data ? Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })) : [];
            return { data: records };
        } catch (error) {
            console.error('Error getting users:', error);
            throw error;
        }
    },
    
    async addUser(data) {
        try {
            const newRef = this.getRef('users').push();
            await newRef.set({
                ...data,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            return {
                success: true,
                data: { id: newRef.key, ...data }
            };
        } catch (error) {
            console.error('Error adding user:', error);
            throw error;
        }
    },
    
    async updateUser(id, data) {
        try {
            await this.getRef(`users/${id}`).update({
                ...data,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },
    
    async deleteUser(id) {
        try {
            await this.getRef(`users/${id}`).remove();
            return { success: true };
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },
    
    async getUserByUsername(username) {
        try {
            const snapshot = await this.getRef('users')
                .orderByChild('username')
                .equalTo(username)
                .once('value');
            const data = snapshot.val();
            if (data) {
                const userId = Object.keys(data)[0];
                return {
                    success: true,
                    data: { id: userId, ...data[userId] }
                };
            }
            return { success: false, data: null };
        } catch (error) {
            console.error('Error getting user by username:', error);
            throw error;
        }
    },
    
    onUsersChange(callback) {
        this.getRef('users').on('value', (snapshot) => {
            const data = snapshot.val();
            const records = data ? Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })) : [];
            callback(records);
        });
    },
    
    offUsersChange() {
        this.getRef('users').off();
    }
};

// Initialize Firebase when config is available
if (typeof CONFIG !== 'undefined' && CONFIG.firebase && CONFIG.firebase.apiKey) {
    try {
        FirebaseAPI.init(CONFIG.firebase);
    } catch (error) {
        console.warn('Firebase initialization failed, falling back to offline mode');
    }
}

console.log('Firebase API module loaded');

// Made with Bob
