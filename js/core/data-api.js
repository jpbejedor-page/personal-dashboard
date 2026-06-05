// ===================================
// Data API Layer
// ===================================

// Mock API for offline mode
const MockAPI = {
    data: {
        bloodSugar: [],
        budget: [],
        financial: [],
        lending: [],
        simpleLoans: []
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
    },
    
    async getSimpleLoans() {
        return { data: this.data.simpleLoans };
    },
    
    async addSimpleLoan(data) {
        const record = { id: Utils.generateId(), ...data };
        this.data.simpleLoans.push(record);
        return { success: true, data: record };
    },
    
    async updateSimpleLoan(id, data) {
        const index = this.data.simpleLoans.findIndex(item => item.id === id);
        if (index !== -1) {
            this.data.simpleLoans[index] = { ...this.data.simpleLoans[index], ...data };
            return { success: true };
        }
        return { error: 'Record not found' };
    },
    
    async deleteSimpleLoan(id) {
        this.data.simpleLoans = this.data.simpleLoans.filter(item => item.id !== id);
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

console.log('Data API module loaded');

// Made with Bob
