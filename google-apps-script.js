// ===================================
// Google Apps Script Backend
// Deploy as Web App
// ===================================

// Configuration
const SHEET_ID = '1szqMnrEbMSJ2yC4RajKu6-43CLYbQsFpL6si5p0BJmM'; // Replace with your Google Sheet ID
const SHEET_NAMES = {
  bloodSugar: 'BloodSugar',
  financial: 'Financial',
  lending: 'Lending'
};

// ===================================
// Main Handler
// ===================================
function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    
    let response;
    
    switch(action) {
      // Blood Sugar Actions
      case 'getBloodSugar':
        response = getBloodSugar();
        break;
      case 'addBloodSugar':
        response = addBloodSugar(request.data);
        break;
      case 'updateBloodSugar':
        response = updateBloodSugar(request.id, request.data);
        break;
      case 'deleteBloodSugar':
        response = deleteBloodSugar(request.id);
        break;
        
      // Financial Actions
      case 'getFinancial':
        response = getFinancial();
        break;
      case 'addFinancial':
        response = addFinancial(request.data);
        break;
      case 'updateFinancial':
        response = updateFinancial(request.id, request.data);
        break;
      case 'deleteFinancial':
        response = deleteFinancial(request.id);
        break;
        
      // Lending Actions
      case 'getLending':
        response = getLending();
        break;
      case 'addLending':
        response = addLending(request.data);
        break;
      case 'updateLending':
        response = updateLending(request.id, request.data);
        break;
      case 'deleteLending':
        response = deleteLending(request.id);
        break;
        
      default:
        response = { error: 'Invalid action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ===================================
// Helper Functions
// ===================================
function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(sheetName);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    initializeSheet(sheet, sheetName);
  }
  
  return sheet;
}

function initializeSheet(sheet, sheetName) {
  let headers;
  
  switch(sheetName) {
    case SHEET_NAMES.bloodSugar:
      headers = ['ID', 'DateTime', 'Level', 'Notes', 'CreatedAt'];
      break;
    case SHEET_NAMES.financial:
      headers = ['ID', 'Date', 'Category', 'Description', 'Amount', 'Status', 'CreatedAt'];
      break;
    case SHEET_NAMES.lending:
      headers = ['ID', 'Borrower', 'Amount', 'InterestRate', 'DueDate', 'Status', 'CreatedAt'];
      break;
    default:
      headers = ['ID', 'Data', 'CreatedAt'];
  }
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function generateId() {
  return Utilities.getUuid();
}

function arrayToObject(headers, row) {
  const obj = {};
  headers.forEach((header, index) => {
    obj[header.toLowerCase()] = row[index];
  });
  return obj;
}

// ===================================
// Blood Sugar Functions
// ===================================
function getBloodSugar() {
  const sheet = getSheet(SHEET_NAMES.bloodSugar);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return { data: [] };
  }
  
  const headers = data[0];
  const records = data.slice(1).map(row => arrayToObject(headers, row));
  
  return { data: records };
}

function addBloodSugar(data) {
  const sheet = getSheet(SHEET_NAMES.bloodSugar);
  const id = generateId();
  const timestamp = new Date().toISOString();
  
  const row = [
    id,
    data.datetime,
    data.level,
    data.notes || '',
    timestamp
  ];
  
  sheet.appendRow(row);
  
  return { 
    success: true, 
    data: {
      id: id,
      datetime: data.datetime,
      level: data.level,
      notes: data.notes || ''
    }
  };
}

function updateBloodSugar(id, data) {
  const sheet = getSheet(SHEET_NAMES.bloodSugar);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      sheet.getRange(i + 1, 2).setValue(data.datetime);
      sheet.getRange(i + 1, 3).setValue(data.level);
      sheet.getRange(i + 1, 4).setValue(data.notes || '');
      return { success: true };
    }
  }
  
  return { error: 'Record not found' };
}

function deleteBloodSugar(id) {
  const sheet = getSheet(SHEET_NAMES.bloodSugar);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  
  return { error: 'Record not found' };
}

// ===================================
// Financial Functions
// ===================================
function getFinancial() {
  const sheet = getSheet(SHEET_NAMES.financial);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return { data: [] };
  }
  
  const headers = data[0];
  const records = data.slice(1).map(row => arrayToObject(headers, row));
  
  return { data: records };
}

function addFinancial(data) {
  const sheet = getSheet(SHEET_NAMES.financial);
  const id = generateId();
  const timestamp = new Date().toISOString();
  
  const row = [
    id,
    data.date,
    data.category,
    data.description,
    data.amount,
    data.status,
    timestamp
  ];
  
  sheet.appendRow(row);
  
  return { 
    success: true, 
    data: {
      id: id,
      date: data.date,
      category: data.category,
      description: data.description,
      amount: data.amount,
      status: data.status
    }
  };
}

function updateFinancial(id, data) {
  const sheet = getSheet(SHEET_NAMES.financial);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      sheet.getRange(i + 1, 2).setValue(data.date);
      sheet.getRange(i + 1, 3).setValue(data.category);
      sheet.getRange(i + 1, 4).setValue(data.description);
      sheet.getRange(i + 1, 5).setValue(data.amount);
      sheet.getRange(i + 1, 6).setValue(data.status);
      return { success: true };
    }
  }
  
  return { error: 'Record not found' };
}

function deleteFinancial(id) {
  const sheet = getSheet(SHEET_NAMES.financial);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  
  return { error: 'Record not found' };
}

// ===================================
// Lending Functions
// ===================================
function getLending() {
  const sheet = getSheet(SHEET_NAMES.lending);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return { data: [] };
  }
  
  const headers = data[0];
  const records = data.slice(1).map(row => arrayToObject(headers, row));
  
  return { data: records };
}

function addLending(data) {
  const sheet = getSheet(SHEET_NAMES.lending);
  const id = generateId();
  const timestamp = new Date().toISOString();
  
  const row = [
    id,
    data.borrower,
    data.amount,
    data.interestRate,
    data.dueDate,
    data.status,
    timestamp
  ];
  
  sheet.appendRow(row);
  
  return { 
    success: true, 
    data: {
      id: id,
      borrower: data.borrower,
      amount: data.amount,
      interestRate: data.interestRate,
      dueDate: data.dueDate,
      status: data.status
    }
  };
}

function updateLending(id, data) {
  const sheet = getSheet(SHEET_NAMES.lending);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      sheet.getRange(i + 1, 2).setValue(data.borrower);
      sheet.getRange(i + 1, 3).setValue(data.amount);
      sheet.getRange(i + 1, 4).setValue(data.interestRate);
      sheet.getRange(i + 1, 5).setValue(data.dueDate);
      sheet.getRange(i + 1, 6).setValue(data.status);
      return { success: true };
    }
  }
  
  return { error: 'Record not found' };
}

function deleteLending(id) {
  const sheet = getSheet(SHEET_NAMES.lending);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  
  return { error: 'Record not found' };
}

// ===================================
// Test Function (for debugging)
// ===================================
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'API is running',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// Made with Bob
