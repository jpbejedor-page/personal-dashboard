#!/usr/bin/env node

/**
 * Backup Script for Personal Dashboard
 * 
 * This script fetches all data from Firebase and saves it as XLSX files
 * in the backups/ directory, which can then be committed to GitHub.
 * 
 * Usage:
 *   node backup-to-github.js
 * 
 * Requirements:
 *   npm install firebase-admin xlsx
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configuration - Update these with your Firebase credentials
const FIREBASE_CONFIG = {
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'YOUR_FIREBASE_DATABASE_URL'
};

// Backup directory
const BACKUP_DIR = path.join(__dirname, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Format date for filenames
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}_${hours}${minutes}`;
}

/**
 * Fetch data from Firebase (mock implementation)
 * Replace this with actual Firebase Admin SDK implementation
 */
async function fetchDataFromFirebase() {
    // This is a placeholder - implement actual Firebase fetch
    console.log('Fetching data from Firebase...');
    
    // For now, return empty data structure
    return {
        bloodSugar: [],
        budget: [],
        financial: [],
        lending: []
    };
}

/**
 * Create XLSX backup file
 */
function createBackupFile(data, timestamp) {
    const wb = XLSX.utils.book_new();
    
    // Blood Sugar Sheet
    if (data.bloodSugar && data.bloodSugar.length > 0) {
        const bloodSugarData = data.bloodSugar.map(item => ({
            'Date & Time': item.datetime,
            'Meal Timing': item.mealTiming === 'fasting' ? 'Fasting' : `${item.mealTiming}h after meal`,
            'Level (mg/dL)': item.level,
            'Notes': item.notes || ''
        }));
        const ws1 = XLSX.utils.json_to_sheet(bloodSugarData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Blood Sugar');
    }
    
    // Budget Sheet
    if (data.budget && data.budget.length > 0) {
        const budgetData = [];
        data.budget.forEach(budget => {
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
            
            budgetData.push({ 'Month': '', 'Monthly Salary': '', 'Category': '', 'Amount': '', 'Percentage': '' });
        });
        const ws2 = XLSX.utils.json_to_sheet(budgetData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Budget');
    }
    
    // Financial Sheet
    if (data.financial && data.financial.length > 0) {
        const financialData = data.financial.map(item => ({
            'Date': item.date,
            'Category': item.category,
            'Description': item.description,
            'Amount': parseFloat(item.amount),
            'Status': item.status
        }));
        const ws3 = XLSX.utils.json_to_sheet(financialData);
        XLSX.utils.book_append_sheet(wb, ws3, 'Financial');
    }
    
    // Lending Sheet
    if (data.lending && data.lending.length > 0) {
        const lendingData = data.lending.map(item => {
            const principal = parseFloat(item.principal || 0);
            const interestRate = parseFloat(item.interestRate || 0);
            const totalDue = principal + (principal * interestRate / 100);
            const totalPaid = (item.payments || []).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            const balance = totalDue - totalPaid;
            
            return {
                'Borrower': item.borrower,
                'Start Date': item.startDate,
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
    
    // Save file
    const filename = `dashboard_backup_${timestamp}.xlsx`;
    const filepath = path.join(BACKUP_DIR, filename);
    XLSX.writeFile(wb, filepath);
    
    return filename;
}

/**
 * Main backup function
 */
async function performBackup() {
    try {
        console.log('Starting backup process...');
        
        const timestamp = formatDate(new Date());
        const data = await fetchDataFromFirebase();
        
        const filename = createBackupFile(data, timestamp);
        
        console.log(`✅ Backup created successfully: backups/${filename}`);
        console.log('\nTo commit to GitHub, run:');
        console.log('  git add backups/');
        console.log(`  git commit -m "Backup: ${timestamp}"`);
        console.log('  git push');
        
        return filename;
    } catch (error) {
        console.error('❌ Backup failed:', error);
        process.exit(1);
    }
}

// Run backup if called directly
if (require.main === module) {
    performBackup();
}

module.exports = { performBackup, createBackupFile };

// Made with Bob
