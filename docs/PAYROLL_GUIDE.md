# Payroll System Guide

## Overview
The Payroll System module allows you to manage multiple projects, track employees, calculate salaries for both monthly and daily wage earners, and generate payslips with detailed breakdowns.

## Features

### 1. Project Management
- Create multiple projects to organize employees
- Track project status (Active, Completed, On Hold)
- View total employees and payroll per project
- Edit and delete projects

### 2. Employee Management
- Add employees to specific projects
- Support for two employment types:
  - **Monthly Salary**: Fixed monthly compensation
  - **Daily Wage**: Rate-based compensation with days worked tracking

### 3. Salary Calculation
The system automatically calculates:
- **Gross Pay**: Base salary/wage + additional compensation
- **Deductions**: Cash advances and other deductions
- **Net Pay**: Final take-home amount

#### For Monthly Salary Employees:
```
Gross Pay = Monthly Salary + Additional Pay + Bonus + Others
Net Pay = Gross Pay - Cash Advance - Other Deductions
```

#### For Daily Wage Employees:
```
Gross Pay = (Daily Rate × Days Worked) + Additional Pay + Bonus + Others
Net Pay = Gross Pay - Cash Advance - Other Deductions
```

### 4. Payslip Generation
- View detailed payslips for each employee
- Download payslips as PDF
- Professional format with all earnings and deductions

### 5. Export Functionality
- Download project summary as Excel file
- Includes all employee data and calculations
- Formatted for easy reporting

## Getting Started

### Creating a New Project

1. Navigate to the **Payroll System** module from the sidebar
2. Click the **"New Project"** button
3. Fill in the project details:
   - **Project Name** (required)
   - **Description** (optional)
   - **Status** (Active, Completed, or On Hold)
4. Click **"Create Project"**

### Adding Employees

1. Click on a project to view its details
2. Click the **"Add Employee"** button
3. Fill in employee information:
   - **Employee Name** (required)
   - **Employment Type**: Choose Monthly Salary or Daily Wage
   
#### For Monthly Salary:
   - Enter the monthly salary amount

#### For Daily Wage:
   - Enter the daily rate
   - Enter the number of days worked

4. Add optional compensation:
   - **Additional Pay**: Extra payments
   - **Bonus**: Performance bonuses
   - **Others**: Miscellaneous earnings

5. Add deductions:
   - **Cash Advance**: Advances given to employee
   - **Other Deductions**: Any other deductions

6. Review the **Salary Summary** showing:
   - Gross Pay
   - Total Deductions
   - Net Pay

7. Click **"Add Employee"**

### Viewing and Managing Employees

From the project details view, you can:
- View all employees in a table format
- See calculated gross pay, deductions, and net pay
- **View Payslip**: Click the invoice icon to see detailed payslip
- **Edit**: Click the edit icon to modify employee details
- **Delete**: Click the trash icon to remove an employee

### Generating Payslips

1. In the project details view, click the **invoice icon** next to an employee
2. Review the payslip showing:
   - Employee information
   - Pay period
   - Detailed earnings breakdown
   - Detailed deductions breakdown
   - Net pay amount
3. Click **"Download PDF"** to save the payslip

### Exporting Project Summary

1. In the project details view, click **"Download Summary"**
2. An Excel file will be downloaded containing:
   - All employee names
   - Employment types
   - Rates/salaries
   - Days worked (for daily wage)
   - All compensation components
   - All deductions
   - Calculated totals

## Project Summary Cards

The project details view shows four summary cards:
- **Total Employees**: Number of employees in the project
- **Total Payroll**: Sum of all net pay amounts
- **Monthly Salary**: Total for monthly salary employees
- **Daily Wage**: Total for daily wage employees

## Best Practices

### 1. Project Organization
- Create separate projects for different departments or locations
- Use descriptive project names
- Update project status regularly

### 2. Employee Data Entry
- Double-check all amounts before saving
- Keep cash advances and deductions up to date
- Review the salary summary before confirming

### 3. Regular Backups
- Use the "Download Summary" feature regularly
- Keep Excel exports for record-keeping
- Download payslips for employee records

### 4. Payslip Management
- Generate payslips at the end of each pay period
- Provide copies to employees
- Keep digital copies for your records

## Data Structure

### Project Data
```javascript
{
  name: "Project Name",
  description: "Project description",
  status: "active" | "completed" | "on-hold",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Employee Data
```javascript
{
  name: "Employee Name",
  type: "monthly" | "daily",
  
  // For monthly employees
  monthlySalary: number,
  
  // For daily wage employees
  dailyRate: number,
  daysWorked: number,
  
  // Additional compensation
  additionalPay: number,
  bonus: number,
  others: number,
  
  // Deductions
  cashAdvance: number,
  otherDeductions: number,
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Firebase Database Structure

```
payroll/
├── projects/
│   ├── {projectId}/
│   │   ├── name
│   │   ├── description
│   │   ├── status
│   │   ├── createdAt
│   │   └── updatedAt
│   └── ...
└── employees/
    ├── {projectId}/
    │   ├── {employeeId}/
    │   │   ├── name
    │   │   ├── type
    │   │   ├── monthlySalary (if monthly)
    │   │   ├── dailyRate (if daily)
    │   │   ├── daysWorked (if daily)
    │   │   ├── additionalPay
    │   │   ├── bonus
    │   │   ├── others
    │   │   ├── cashAdvance
    │   │   ├── otherDeductions
    │   │   ├── createdAt
    │   │   └── updatedAt
    │   └── ...
    └── ...
```

## Troubleshooting

### Issue: Projects not loading
**Solution**: Check your internet connection and Firebase configuration

### Issue: Cannot add employees
**Solution**: Ensure you have selected a project first

### Issue: Calculations seem incorrect
**Solution**: Verify all input values are numbers and not empty

### Issue: PDF download not working
**Solution**: Ensure your browser allows pop-ups for this site

### Issue: Excel export fails
**Solution**: Check that you have employees in the project

## Security Considerations

- All data is stored in Firebase Realtime Database
- Access is controlled through Firebase security rules
- User permissions apply to the payroll module
- Only authorized users can view/modify payroll data

## Tips for Efficient Use

1. **Batch Entry**: Add all employees for a project at once
2. **Templates**: Use similar settings for employees with the same role
3. **Regular Updates**: Update days worked and deductions regularly
4. **Archive Projects**: Mark completed projects as "Completed" status
5. **Export Often**: Download summaries for backup and reporting

## Future Enhancements

Potential features for future versions:
- Payroll history tracking
- Tax calculations
- Government contributions (SSS, PhilHealth, Pag-IBIG)
- Automated payroll scheduling
- Email payslips to employees
- Payroll reports and analytics
- Multi-currency support

## Support

For issues or questions:
1. Check this guide first
2. Review the main README.md
3. Check Firebase console for data integrity
4. Verify user permissions

---

**Made with Bob** - Personal Dashboard Payroll System