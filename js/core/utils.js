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
    },
    
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

console.log('Utils module loaded');

// Made with Bob
