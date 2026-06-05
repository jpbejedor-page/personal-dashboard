// ===================================
// Payroll System Module
// ===================================

const PayrollModule = {
    currentProjectId: null,
    projects: [],
    employees: [],
    
    // Initialize the payroll module
    init() {
        console.log('Initializing Payroll Module...');
        this.attachEventListeners();
        this.loadProjects();
    },
    
    // Attach event listeners
    attachEventListeners() {
        // Project management
        document.getElementById('addProjectBtn')?.addEventListener('click', () => this.showAddProjectModal());
        document.getElementById('backToProjectsBtn')?.addEventListener('click', () => this.showProjectsList());
        
        // Employee management
        document.getElementById('addEmployeeBtn')?.addEventListener('click', () => this.showAddEmployeeModal());
        document.getElementById('downloadProjectSummaryBtn')?.addEventListener('click', () => this.downloadProjectSummary());
    },
    
    // ===================================
    // Project Management
    // ===================================
    async loadProjects() {
        try {
            const response = await FirebaseAPI.getPayrollProjects();
            this.projects = response.data || [];
            
            // Load all employees to calculate totals
            await this.loadAllEmployees();
            
            this.renderProjectsTable();
        } catch (error) {
            console.error('Error loading projects:', error);
            Notification.error('Error loading projects');
        }
    },
    
    async loadAllEmployees() {
        try {
            // Load employees for all projects
            const allEmployees = [];
            for (const project of this.projects) {
                const response = await FirebaseAPI.getProjectEmployees(project.id);
                const projectEmployees = (response.data || []).map(emp => ({
                    ...emp,
                    projectId: project.id
                }));
                allEmployees.push(...projectEmployees);
            }
            this.employees = allEmployees;
        } catch (error) {
            console.error('Error loading all employees:', error);
        }
    },
    
    renderProjectsTable() {
        const tbody = document.getElementById('projectsTableBody');
        if (!tbody) return;
        
        if (this.projects.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No projects yet. Click "New Project" to get started.</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.projects.map(project => {
            const totalPayroll = this.calculateProjectTotalPayroll(project.id);
            const employeeCount = this.getProjectEmployeeCount(project.id);
            
            return `
                <tr>
                    <td><strong>${project.name}</strong></td>
                    <td>${employeeCount}</td>
                    <td>₱${totalPayroll.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td><span class="badge badge-${project.status === 'active' ? 'success' : 'secondary'}">${project.status || 'active'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="PayrollModule.viewProject('${project.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="PayrollModule.editProject('${project.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="PayrollModule.deleteProject('${project.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    showAddProjectModal() {
        const modalContent = `
            <form id="projectForm">
                <div class="form-group">
                    <label for="projectName">Project Name *</label>
                    <input type="text" id="projectName" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="projectDescription">Description</label>
                    <textarea id="projectDescription" class="form-control" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="projectStatus">Status</label>
                    <select id="projectStatus" class="form-control">
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="on-hold">On Hold</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Project</button>
                </div>
            </form>
        `;
        
        Modal.show('New Project', modalContent);
        
        document.getElementById('projectForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveProject();
        });
    },
    
    async saveProject(projectId = null) {
        const projectData = {
            name: document.getElementById('projectName').value,
            description: document.getElementById('projectDescription').value,
            status: document.getElementById('projectStatus').value
        };
        
        try {
            if (projectId) {
                await FirebaseAPI.updatePayrollProject(projectId, projectData);
                Notification.success('Project updated successfully');
            } else {
                await FirebaseAPI.addPayrollProject(projectData);
                Notification.success('Project created successfully');
            }
            
            Modal.hide();
            await this.loadProjects();
        } catch (error) {
            console.error('Error saving project:', error);
            Notification.error('Error saving project');
        }
    },
    
    async editProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;
        
        const modalContent = `
            <form id="projectForm">
                <div class="form-group">
                    <label for="projectName">Project Name *</label>
                    <input type="text" id="projectName" class="form-control" value="${project.name}" required>
                </div>
                <div class="form-group">
                    <label for="projectDescription">Description</label>
                    <textarea id="projectDescription" class="form-control" rows="3">${project.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="projectStatus">Status</label>
                    <select id="projectStatus" class="form-control">
                        <option value="active" ${project.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="on-hold" ${project.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Project</button>
                </div>
            </form>
        `;
        
        Modal.show('Edit Project', modalContent);
        
        document.getElementById('projectForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveProject(projectId);
        });
    },
    
    async deleteProject(projectId) {
        if (!confirm('Are you sure you want to delete this project? All employee data will be lost.')) {
            return;
        }
        
        try {
            await FirebaseAPI.deletePayrollProject(projectId);
            Notification.success('Project deleted successfully');
            await this.loadProjects();
        } catch (error) {
            console.error('Error deleting project:', error);
            Notification.error('Error deleting project');
        }
    },
    
    async viewProject(projectId) {
        this.currentProjectId = projectId;
        const project = this.projects.find(p => p.id === projectId);
        
        if (!project) return;
        
        // Hide projects list, show project details
        document.querySelector('.payroll-projects-section').style.display = 'none';
        document.getElementById('projectDetailsView').style.display = 'block';
        document.getElementById('projectDetailsTitle').textContent = project.name;
        
        await this.loadProjectEmployees(projectId);
    },
    
    showProjectsList() {
        document.querySelector('.payroll-projects-section').style.display = 'block';
        document.getElementById('projectDetailsView').style.display = 'none';
        this.currentProjectId = null;
    },
    
    // ===================================
    // Employee Management
    // ===================================
    async loadProjectEmployees(projectId) {
        try {
            const response = await FirebaseAPI.getProjectEmployees(projectId);
            this.employees = response.data || [];
            this.renderEmployeesTable();
            this.updateProjectSummary();
        } catch (error) {
            console.error('Error loading employees:', error);
            Notification.error('Error loading employees');
        }
    },
    
    renderEmployeesTable() {
        const tbody = document.getElementById('employeesTableBody');
        if (!tbody) return;
        
        if (this.employees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No employees yet. Click "Add Employee" to get started.</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.employees.map(employee => {
            const grossPay = this.calculateGrossPay(employee);
            const deductions = this.calculateDeductions(employee);
            const netPay = grossPay - deductions;
            
            return `
                <tr>
                    <td><strong>${employee.name}</strong></td>
                    <td><span class="badge badge-${employee.type === 'monthly' ? 'primary' : 'info'}">${employee.type === 'monthly' ? 'Monthly' : 'Daily Wage'}</span></td>
                    <td>₱${(employee.type === 'monthly' ? employee.monthlySalary : employee.dailyRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td>${employee.type === 'daily' ? employee.daysWorked || 0 : 'N/A'}</td>
                    <td>₱${grossPay.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td>₱${deductions.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td><strong>₱${netPay.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="PayrollModule.viewPayslip('${employee.id}')">
                            <i class="fas fa-file-invoice"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="PayrollModule.editEmployee('${employee.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="PayrollModule.deleteEmployee('${employee.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    showAddEmployeeModal() {
        const modalContent = `
            <form id="employeeForm">
                <div class="form-group">
                    <label for="employeeName">Employee Name *</label>
                    <input type="text" id="employeeName" class="form-control" required>
                </div>
                
                <div class="payroll-form-section">
                    <h4><i class="fas fa-user-tag"></i> Employment Type</h4>
                    <div class="employee-type-selector">
                        <div class="employee-type-option active" onclick="PayrollModule.selectEmployeeType('monthly')">
                            <input type="radio" name="employeeType" id="typeMonthly" value="monthly" checked>
                            <label for="typeMonthly">
                                <i class="fas fa-calendar-alt"></i>
                                Monthly Salary
                            </label>
                        </div>
                        <div class="employee-type-option" onclick="PayrollModule.selectEmployeeType('daily')">
                            <input type="radio" name="employeeType" id="typeDaily" value="daily">
                            <label for="typeDaily">
                                <i class="fas fa-calendar-day"></i>
                                Daily Wage
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="payroll-form-section">
                    <h4><i class="fas fa-money-bill-wave"></i> Compensation</h4>
                    <div class="conditional-field active" id="monthlySalaryField">
                        <div class="form-group">
                            <label for="monthlySalary">Monthly Salary *</label>
                            <input type="number" id="monthlySalary" class="form-control" step="0.01" min="0" required>
                        </div>
                    </div>
                    <div class="conditional-field" id="dailyWageFields">
                        <div class="payroll-form-grid">
                            <div class="form-group">
                                <label for="dailyRate">Daily Rate *</label>
                                <input type="number" id="dailyRate" class="form-control" step="0.01" min="0">
                            </div>
                            <div class="form-group">
                                <label for="daysWorked">Days Worked *</label>
                                <input type="number" id="daysWorked" class="form-control" min="0" max="31">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="payroll-form-section">
                    <h4><i class="fas fa-plus-circle"></i> Additional Compensation</h4>
                    <div class="payroll-form-grid">
                        <div class="form-group">
                            <label for="additionalPay">Additional Pay</label>
                            <input type="number" id="additionalPay" class="form-control" step="0.01" min="0" value="0">
                        </div>
                        <div class="form-group">
                            <label for="bonus">Bonus</label>
                            <input type="number" id="bonus" class="form-control" step="0.01" min="0" value="0">
                        </div>
                        <div class="form-group">
                            <label for="others">Others</label>
                            <input type="number" id="others" class="form-control" step="0.01" min="0" value="0">
                        </div>
                    </div>
                </div>
                
                <div class="payroll-form-section">
                    <h4><i class="fas fa-minus-circle"></i> Deductions</h4>
                    <div class="payroll-form-grid">
                        <div class="form-group">
                            <label for="cashAdvance">Cash Advance</label>
                            <input type="number" id="cashAdvance" class="form-control" step="0.01" min="0" value="0">
                        </div>
                        <div class="form-group">
                            <label for="otherDeductions">Other Deductions</label>
                            <input type="number" id="otherDeductions" class="form-control" step="0.01" min="0" value="0">
                        </div>
                    </div>
                </div>
                
                <div class="payroll-calculation-summary">
                    <h4>Salary Summary</h4>
                    <div class="calculation-row">
                        <label>Gross Pay:</label>
                        <span id="calcGrossPay">₱0.00</span>
                    </div>
                    <div class="calculation-row">
                        <label>Total Deductions:</label>
                        <span id="calcDeductions">₱0.00</span>
                    </div>
                    <div class="calculation-row">
                        <label>Net Pay:</label>
                        <span id="calcNetPay">₱0.00</span>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Employee</button>
                </div>
            </form>
        `;
        
        Modal.show('Add Employee', modalContent, 'large');
        
        // Attach calculation listeners
        this.attachCalculationListeners();
        
        document.getElementById('employeeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveEmployee();
        });
    },
    
    selectEmployeeType(type) {
        // Update radio buttons
        document.querySelectorAll('.employee-type-option').forEach(opt => opt.classList.remove('active'));
        event.currentTarget.classList.add('active');
        document.getElementById(type === 'monthly' ? 'typeMonthly' : 'typeDaily').checked = true;
        
        // Show/hide fields and manage required attributes
        const monthlySalaryField = document.getElementById('monthlySalaryField');
        const dailyWageFields = document.getElementById('dailyWageFields');
        const monthlySalaryInput = document.getElementById('monthlySalary');
        const dailyRateInput = document.getElementById('dailyRate');
        const daysWorkedInput = document.getElementById('daysWorked');
        
        if (type === 'monthly') {
            monthlySalaryField.classList.add('active');
            dailyWageFields.classList.remove('active');
            monthlySalaryInput.required = true;
            monthlySalaryInput.disabled = false;
            dailyRateInput.required = false;
            dailyRateInput.disabled = true;
            daysWorkedInput.required = false;
            daysWorkedInput.disabled = true;
        } else {
            monthlySalaryField.classList.remove('active');
            dailyWageFields.classList.add('active');
            monthlySalaryInput.required = false;
            monthlySalaryInput.disabled = true;
            dailyRateInput.required = true;
            dailyRateInput.disabled = false;
            daysWorkedInput.required = true;
            daysWorkedInput.disabled = false;
        }
        
        this.updateCalculation();
    },
    
    attachCalculationListeners() {
        const fields = ['monthlySalary', 'dailyRate', 'daysWorked', 'additionalPay', 'bonus', 'others', 'cashAdvance', 'otherDeductions'];
        fields.forEach(field => {
            document.getElementById(field)?.addEventListener('input', () => this.updateCalculation());
        });
    },
    
    updateCalculation() {
        const type = document.querySelector('input[name="employeeType"]:checked').value;
        let grossPay = 0;
        
        if (type === 'monthly') {
            grossPay = parseFloat(document.getElementById('monthlySalary').value) || 0;
        } else {
            const rate = parseFloat(document.getElementById('dailyRate').value) || 0;
            const days = parseFloat(document.getElementById('daysWorked').value) || 0;
            grossPay = rate * days;
        }
        
        grossPay += parseFloat(document.getElementById('additionalPay').value) || 0;
        grossPay += parseFloat(document.getElementById('bonus').value) || 0;
        grossPay += parseFloat(document.getElementById('others').value) || 0;
        
        const deductions = (parseFloat(document.getElementById('cashAdvance').value) || 0) +
                          (parseFloat(document.getElementById('otherDeductions').value) || 0);
        
        const netPay = grossPay - deductions;
        
        document.getElementById('calcGrossPay').textContent = `₱${grossPay.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
        document.getElementById('calcDeductions').textContent = `₱${deductions.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
        document.getElementById('calcNetPay').textContent = `₱${netPay.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    },
    
    async saveEmployee(employeeId = null) {
        const type = document.querySelector('input[name="employeeType"]:checked').value;
        
        const employeeData = {
            name: document.getElementById('employeeName').value,
            type: type,
            additionalPay: parseFloat(document.getElementById('additionalPay').value) || 0,
            bonus: parseFloat(document.getElementById('bonus').value) || 0,
            others: parseFloat(document.getElementById('others').value) || 0,
            cashAdvance: parseFloat(document.getElementById('cashAdvance').value) || 0,
            otherDeductions: parseFloat(document.getElementById('otherDeductions').value) || 0
        };
        
        if (type === 'monthly') {
            employeeData.monthlySalary = parseFloat(document.getElementById('monthlySalary').value) || 0;
        } else {
            employeeData.dailyRate = parseFloat(document.getElementById('dailyRate').value) || 0;
            employeeData.daysWorked = parseFloat(document.getElementById('daysWorked').value) || 0;
        }
        
        try {
            if (employeeId) {
                await FirebaseAPI.updateEmployee(this.currentProjectId, employeeId, employeeData);
                Notification.success('Employee updated successfully');
            } else {
                await FirebaseAPI.addEmployee(this.currentProjectId, employeeData);
                Notification.success('Employee added successfully');
            }
            
            Modal.hide();
            await this.loadProjectEmployees(this.currentProjectId);
        } catch (error) {
            console.error('Error saving employee:', error);
            Notification.error('Error saving employee');
        }
    },
    
    async editEmployee(employeeId) {
        const employee = this.employees.find(e => e.id === employeeId);
        if (!employee) return;
        
        // Similar to showAddEmployeeModal but with pre-filled values
        // For brevity, showing simplified version
        this.showAddEmployeeModal();
        
        // Pre-fill form after modal is shown
        setTimeout(() => {
            document.getElementById('employeeName').value = employee.name;
            this.selectEmployeeType(employee.type);
            
            if (employee.type === 'monthly') {
                document.getElementById('monthlySalary').value = employee.monthlySalary || 0;
            } else {
                document.getElementById('dailyRate').value = employee.dailyRate || 0;
                document.getElementById('daysWorked').value = employee.daysWorked || 0;
            }
            
            document.getElementById('additionalPay').value = employee.additionalPay || 0;
            document.getElementById('bonus').value = employee.bonus || 0;
            document.getElementById('others').value = employee.others || 0;
            document.getElementById('cashAdvance').value = employee.cashAdvance || 0;
            document.getElementById('otherDeductions').value = employee.otherDeductions || 0;
            
            this.updateCalculation();
            
            // Update form submission
            document.getElementById('employeeForm').onsubmit = async (e) => {
                e.preventDefault();
                await this.saveEmployee(employeeId);
            };
        }, 100);
    },
    
    async deleteEmployee(employeeId) {
        if (!confirm('Are you sure you want to delete this employee?')) {
            return;
        }
        
        try {
            await FirebaseAPI.deleteEmployee(this.currentProjectId, employeeId);
            Notification.success('Employee deleted successfully');
            await this.loadProjectEmployees(this.currentProjectId);
        } catch (error) {
            console.error('Error deleting employee:', error);
            Notification.error('Error deleting employee');
        }
    },
    
    // ===================================
    // Calculations
    // ===================================
    calculateGrossPay(employee) {
        let gross = 0;
        
        if (employee.type === 'monthly') {
            gross = employee.monthlySalary || 0;
        } else {
            gross = (employee.dailyRate || 0) * (employee.daysWorked || 0);
        }
        
        gross += (employee.additionalPay || 0);
        gross += (employee.bonus || 0);
        gross += (employee.others || 0);
        
        return gross;
    },
    
    calculateDeductions(employee) {
        return (employee.cashAdvance || 0) + (employee.otherDeductions || 0);
    },
    
    calculateNetPay(employee) {
        return this.calculateGrossPay(employee) - this.calculateDeductions(employee);
    },
    
    updateProjectSummary() {
        const totalEmployees = this.employees.length;
        let totalPayroll = 0;
        let monthlySalaryTotal = 0;
        let dailyWageTotal = 0;
        
        this.employees.forEach(emp => {
            const netPay = this.calculateNetPay(emp);
            totalPayroll += netPay;
            
            if (emp.type === 'monthly') {
                monthlySalaryTotal += netPay;
            } else {
                dailyWageTotal += netPay;
            }
        });
        
        document.getElementById('projectTotalEmployees').textContent = totalEmployees;
        document.getElementById('projectTotalPayroll').textContent = `₱${totalPayroll.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
        document.getElementById('projectMonthlySalary').textContent = `₱${monthlySalaryTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
        document.getElementById('projectDailyWage').textContent = `₱${dailyWageTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    },
    
    calculateProjectTotalPayroll(projectId) {
        // Calculate total payroll for a specific project
        const projectEmployees = this.employees.filter(e => e.projectId === projectId);
        return projectEmployees.reduce((total, employee) => {
            const grossPay = this.calculateGrossPay(employee);
            const deductions = this.calculateDeductions(employee);
            return total + (grossPay - deductions);
        }, 0);
    },
    
    getProjectEmployeeCount(projectId) {
        // Get employee count for a specific project
        return this.employees.filter(e => e.projectId === projectId).length;
    },
    
    // ===================================
    // Payslip & Export
    // ===================================
    viewPayslip(employeeId) {
        const employee = this.employees.find(e => e.id === employeeId);
        if (!employee) return;
        
        const project = this.projects.find(p => p.id === this.currentProjectId);
        const grossPay = this.calculateGrossPay(employee);
        const deductions = this.calculateDeductions(employee);
        const netPay = grossPay - deductions;
        
        const payslipContent = `
            <div class="payslip-container" id="payslipContent">
                <div class="payslip-header">
                    <h2>PAYSLIP</h2>
                    <p>${project.name}</p>
                    <p>Pay Period: ${new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}</p>
                </div>
                
                <div class="payslip-info">
                    <div class="payslip-info-item">
                        <label>Employee Name:</label>
                        <span>${employee.name}</span>
                    </div>
                    <div class="payslip-info-item">
                        <label>Employment Type:</label>
                        <span>${employee.type === 'monthly' ? 'Monthly Salary' : 'Daily Wage'}</span>
                    </div>
                    <div class="payslip-info-item">
                        <label>Date Issued:</label>
                        <span>${new Date().toLocaleDateString('en-PH')}</span>
                    </div>
                    ${employee.type === 'daily' ? `
                    <div class="payslip-info-item">
                        <label>Days Worked:</label>
                        <span>${employee.daysWorked || 0}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="payslip-details">
                    <h3>Earnings</h3>
                    <table class="payslip-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th class="amount">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${employee.type === 'monthly' ? 'Monthly Salary' : `Daily Rate (${employee.daysWorked || 0} days × ₱${(employee.dailyRate || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })})`}</td>
                                <td class="amount">₱${(employee.type === 'monthly' ? employee.monthlySalary : (employee.dailyRate || 0) * (employee.daysWorked || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            ${employee.additionalPay ? `
                            <tr>
                                <td>Additional Pay</td>
                                <td class="amount">₱${employee.additionalPay.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            ` : ''}
                            ${employee.bonus ? `
                            <tr>
                                <td>Bonus</td>
                                <td class="amount">₱${employee.bonus.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            ` : ''}
                            ${employee.others ? `
                            <tr>
                                <td>Others</td>
                                <td class="amount">₱${employee.others.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            ` : ''}
                            <tr style="font-weight: 600; background: var(--bg-secondary);">
                                <td>Gross Pay</td>
                                <td class="amount">₱${grossPay.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="payslip-details">
                    <h3>Deductions</h3>
                    <table class="payslip-table">
                        <tbody>
                            ${employee.cashAdvance ? `
                            <tr>
                                <td>Cash Advance</td>
                                <td class="amount">₱${employee.cashAdvance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            ` : ''}
                            ${employee.otherDeductions ? `
                            <tr>
                                <td>Other Deductions</td>
                                <td class="amount">₱${employee.otherDeductions.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            ` : ''}
                            <tr style="font-weight: 600; background: var(--bg-secondary);">
                                <td>Total Deductions</td>
                                <td class="amount">₱${deductions.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="payslip-details">
                    <table class="payslip-table">
                        <tbody>
                            <tr class="payslip-total">
                                <td><strong>NET PAY</strong></td>
                                <td class="amount"><strong>₱${netPay.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="payslip-footer">
                    <p>This is a computer-generated payslip. No signature required.</p>
                    <p>Generated on ${new Date().toLocaleString('en-PH')}</p>
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Close</button>
                <button type="button" class="btn btn-primary" onclick="PayrollModule.downloadPayslipPDF('${employeeId}')">
                    <i class="fas fa-download"></i> Download PDF
                </button>
            </div>
        `;
        
        Modal.show('Payslip - ' + employee.name, payslipContent, 'large');
    },
    
    downloadPayslipPDF(employeeId) {
        const employee = this.employees.find(e => e.id === employeeId);
        if (!employee) return;
        
        // Use browser's print functionality to save as PDF
        const printWindow = window.open('', '_blank');
        const payslipContent = document.getElementById('payslipContent').innerHTML;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payslip - ${employee.name}</title>
                <link rel="stylesheet" href="style.css">
                <style>
                    body { padding: 20px; }
                    @media print {
                        .modal-actions { display: none; }
                    }
                </style>
            </head>
            <body>
                ${payslipContent}
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    },
    
    downloadProjectSummary() {
        if (!this.currentProjectId || this.employees.length === 0) {
            Notification.warning('No data to export');
            return;
        }
        
        const project = this.projects.find(p => p.id === this.currentProjectId);
        
        // Prepare data for Excel
        const data = this.employees.map(emp => {
            const grossPay = this.calculateGrossPay(emp);
            const deductions = this.calculateDeductions(emp);
            const netPay = grossPay - deductions;
            
            return {
                'Employee Name': emp.name,
                'Type': emp.type === 'monthly' ? 'Monthly Salary' : 'Daily Wage',
                'Rate/Salary': emp.type === 'monthly' ? emp.monthlySalary : emp.dailyRate,
                'Days Worked': emp.type === 'daily' ? emp.daysWorked : 'N/A',
                'Additional Pay': emp.additionalPay || 0,
                'Bonus': emp.bonus || 0,
                'Others': emp.others || 0,
                'Gross Pay': grossPay,
                'Cash Advance': emp.cashAdvance || 0,
                'Other Deductions': emp.otherDeductions || 0,
                'Total Deductions': deductions,
                'Net Pay': netPay
            };
        });
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Payroll Summary');
        
        // Generate filename
        const filename = `${project.name}_Payroll_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Download
        XLSX.writeFile(wb, filename);
        Notification.success('Payroll summary downloaded successfully');
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('payroll-module')) {
            PayrollModule.init();
        }
    });
} else {
    if (document.getElementById('payroll-module')) {
        PayrollModule.init();
    }
}

console.log('Payroll module loaded');

// Made with Bob