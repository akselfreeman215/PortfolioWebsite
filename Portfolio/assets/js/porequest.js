/*
 * File: purchasing.js
 * Project: PO Request Forms
 * Author: Aksel Freeman
 * Version: 1.0.0
 * Description: Script code for purchasing HTML file.
 */



/*-------------------------------------------------DEFAULT/ON-LOAD FUNCTIONS----------------------------------------------------------*/
// Get today's date in the format "YYYY-MM-DD"
const today = new Date().toISOString().split('T')[0];

// Set the default value of the date input to today's date
document.getElementById('date').value = today;

//set date of table to today as well
document.getElementById('userTable')


/*-------------------------------------------------DROPDOWN----------------------------------------------------------*/
function toggleDropdown() {
    var dropdownContent = document.getElementById("dropdown-content");
    if (dropdownContent.style.display === "none" || dropdownContent.style.display === "") {
        dropdownContent.style.display = "block";
    } else {
        dropdownContent.style.display = "none";
    }
}

function scrollToTop() {
window.scrollTo({
        top: 0,
        behavior: 'smooth'  // Use smooth scrolling for a nicer effect
    });
}


/*-------------------------------------------------DARK/LIGHT MODE----------------------------------------------------------*/
function toggleSwitch() {
    const slider = document.querySelector('.slider');
    slider.classList.toggle('active');
    document.getElementById('nav').classList.toggle('light');
    document.getElementById('body').classList.toggle('light');
    document.getElementById('clear-all').classList.toggle('light');
    document.getElementById('slider').classList.toggle('light');
    document.getElementById('switch').classList.toggle('light');
    document.getElementById('debugTest').classList.toggle('light');
    document.getElementById('form-container').classList.toggle('light');
    document.getElementById('submit').classList.toggle('light');
    document.getElementById('add-row').classList.toggle('light');
    document.getElementById('remove-row').classList.toggle('light');
    document.getElementById('drop-zone').classList.toggle('light');
    document.getElementById('footer').classList.toggle('light');
    document.getElementById('email-portal').classList.toggle('light');
}
  

/*----------------------------------------------------FORM OUTPUT------------------------------------------------------*/
let uploadedFiles = [];
let employeeEmail = '';
let manager = '';

function postForm() {
    const formData = new FormData(document.getElementById('pdfForm'));

    // Include the table data in the formDataObject as a 2D array
    const tableData = [];
    const table = document.getElementById("userTable").getElementsByTagName('tbody')[0];
    const rows = table.rows;

    //populate table object
    for (let i = 0; i < rows.length; i++) {
        const rowData = [];
        const cells = rows[i].cells;
        for (let j = 0; j < cells.length; j++) {
            rowData.push(cells[j].innerText);
        }
        tableData.push(rowData);
    }

    formData.append('tableData', JSON.stringify(tableData));

    //check if box is checked
    const checkbox = document.getElementById("checkbox");

    if (checkbox.checked) {
        const emailOptInValue = employeeEmail.trim();
        formData.append('emailOptIn', `${emailOptInValue}`)
    } else {
        formData.append('emailOptIn', 'NO');
    }
    
    if(document.getElementById("userName").value == '***OTHER***'){
        formData.set('userName', 'OTHER');
    }

    // Add file data to the formData
    uploadedFiles.forEach((file, index) => {
        formData.append(`file${index}`, file);
        console.log((file instanceof File));
    });


    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/porequest/upload'); // Adjust the URL accordingly
        xhr.send(formData);

        xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                console.log('Form data submitted successfully.');
                alert('Submitted! If on mobile, device may not open pdf. Use button below to view PDF.');
                openPdf()
                refreshPage();
            }
            else {
                let errorMessage;
                try {
                    const jsonResponse = JSON.parse(xhr.responseText);
                    errorMessage = jsonResponse.message;
                } catch (error) {
                    errorMessage = 'An error occurred while processing your request.';
                }
            
                alert('Error: ' + errorMessage);
                console.error('Error submitting form data. Message:', errorMessage);
            }
        }
    };
}

const inputField = document.getElementById('description');
const charCount = document.getElementById('charCount');
const charCountWarning = document.getElementById('charCountWarning');

inputField.addEventListener('input', updateCharCount);

//updates the text box character amount
function updateCharCount() {
    const count = inputField.value.length;

    charCountWarning.style.display = 'none';
    charCount.style.color = '#b1a07a';

    if(count > 250){
        charCount.style.color = 'red';
        charCountWarning.style.color = 'red';
        charCountWarning.style.display = 'block';
    }

  charCount.textContent = `Character count: ${count}`;
}


/*-------------------------------------------------DROPDOWN SELECT----------------------------------------------------------*/
const departmentList = document.getElementById('departmentDropdown');
const employeeList = document.getElementById('employeeDropdown');
const managerList = document.getElementById('managerDropdown');

const MASTER_PATH = 'assets/js/DATA'; 

document.addEventListener('DOMContentLoaded', function () {
    loadCSV(`${MASTER_PATH}/departments.csv`, populateDepartment);
    loadCSV(`${MASTER_PATH}/employees.csv`, populateEmployee);
    loadCSV(`${MASTER_PATH}/managers.csv`, populateManagers);
});

function loadCSV(file, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', file);
    xhr.onload = function () {
      if (xhr.status === 200) {
        callback(xhr.responseText);
      } else {
        console.error('Failed to load the CSV file.');
      }
    };
    xhr.send();
}
  
function populateDepartment(csv) {
    const lines = csv.split('\n');
  
    lines.forEach((line, index) => {
        if (index === 0) {
        return; // Skip the header line if it exists
        }
        const parts = line.split(',');
        if (parts[1]) { // Use the second column (index 1)
            const li = document.createElement('li');
            li.setAttribute('onclick','departmentSetVal(this);');
            li.textContent = parts[1].trim();
            departmentList.appendChild(li);
        }
    });
}

function populateEmployee(csv) {
    const lines = csv.split('\n');
  
    lines.forEach((line, index) => {
        if (index === 0) {
        return; // Skip the header line if it exists
        }
        const parts = line.split(',');
        if (parts[2]) { 
            const li = document.createElement('li');
            li.setAttribute('onclick','employeeSetVal(this);');
            li.textContent = parts[2].trim();
            li.dataset.email = parts[5].trim();
            employeeList.appendChild(li);
        }
    });
}

function populateManagers(csv) {
    const lines = csv.split('\n');
  
    lines.forEach((line, index) => {
        if (index === 0) {
            return; // Skip the header line if it exists
        }
        const parts = line.split(',');
        if (parts[1]) { // Use the second column (index 1)
            const li = document.createElement('li');
            li.setAttribute('onclick','managerSetVal(this);');
            li.textContent = parts[1].trim();
            li.dataset.email = parts[2].trim();
            managerList.appendChild(li);
        }
    });
}
  

function showDepartment(){
    departmentList.classList.remove("hidden");
    document.getElementById("department-pad").classList.remove("hidden");
}

function hideDepartment(){
    setTimeout(function () {
        departmentList.classList.add("hidden");
        document.getElementById("department-pad").classList.add("hidden");
    }, 200);
}

function showEmployee(){
    employeeList.classList.remove("hidden");
    document.getElementById("userName-pad").classList.remove("hidden");
}

function hideEmployee(){
    setTimeout(function () {
        employeeList.classList.add("hidden");
        document.getElementById("userName-pad").classList.add("hidden");
    }, 200);
}
function showManager(){
    managerList.classList.remove("hidden");
    document.getElementById("manager-pad").classList.remove("hidden");
}

function hideManager(){
    setTimeout(function () {
        managerList.classList.add("hidden");
        document.getElementById("manager-pad").classList.add("hidden");
    }, 200);
}

function departmentSetVal(element) {
    document.getElementById('department').value = element.textContent;
    document.getElementById('departmentDropdown').classList.add('hidden');
}


function employeeSetVal(element) {
    document.getElementById('userName').value = element.textContent;
    document.getElementById('employeeDropdown').classList.add('hidden');
    if(element.textContent == "***OTHER***"){
        document.getElementById('manager-container').classList.remove('hidden');
    }else{
        document.getElementById('manager-container').classList.add('hidden');
        employeeEmail = element.dataset.email;
    }
}

function managerSetVal(element) {
    document.getElementById('manager').value = element.textContent;
    manager = element.dataset.manager;
    employeeEmail = element.dataset.email;
    document.getElementById('managerDropdown').classList.add('hidden');
}


  

/*-------------------------------------------------FILE UPLOAD----------------------------------------------------------*/
function triggerFileInput() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', handleFileSelect);
    document.body.appendChild(fileInput);

    fileInput.click(); // Trigger the file input
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      console.log('File dropped:', file.name);
      displayFileName(file);
    }
  }

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      console.log('File selected:', file.name);
      displayFileName(file);
    }
    event.target.remove(); // Remove the dynamically created file input
  }

function displayFileName(file) {
    const fileList = document.getElementById('files');
    const listItem = document.createElement('li');
    listItem.className = 'file-item';

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'x';
    deleteButton.addEventListener('click', () => {
      listItem.remove();
      removeFileFromArray(file);
    });

    addFileToArray(file);

    const fileName = document.createElement('span');
    fileName.className = 'file-name';
    fileName.textContent = file.name;

    listItem.appendChild(deleteButton);
    listItem.appendChild(fileName);
    fileList.appendChild(listItem);
}

// Add the file data to the global array
function addFileToArray(file) {
    uploadedFiles.push(file);
    console.log('Files array:', uploadedFiles);
}

//removes file from array
function removeFileFromArray(file) {
    uploadedFiles = uploadedFiles.filter((uploadedFile) => uploadedFile !== file);
}



/*-------------------------------------------------FORM VALIDATION----------------------------------------------------------*/
let unfilledFields = [];

document.getElementById('submit').addEventListener('click', function(event) {
    const validation = validateForm();
    event.preventDefault();


    if (validation == 1) {

        // Highlight the unfilled fields
        unfilledFields.forEach(fieldId => {
        document.getElementById(fieldId).classList.add('highlight');
        });
    } else {
        postForm();
  }
});

function validateForm() {
    const fieldErrors = [];
    const maxDescriptionLength = 250;
    let flag = 0;

    // Check if the required fields are filled
    const date = document.getElementById('date').value;
    const department = document.getElementById('department').value;
    const userName = document.getElementById('userName').value;
    const description = document.getElementById('description').value;
    const manager = document.getElementById('manager').value;
    fieldErrors.push('NOT SUBMITTED:')

    if (!date){
        fieldErrors.push('Date: Required');
        unfilledFields.push('date');
        document.getElementById('dateError').style.display = 'block';
        flag = 1;
    }
    if (!department){
        fieldErrors.push('Department Name: Required');
        unfilledFields.push('department');
        document.getElementById('departmentError').style.display = 'block';
        flag = 1;
    }
    if (!userName){
        fieldErrors.push('Requested By: Required');
        unfilledFields.push('userName');
        document.getElementById('userNameError').style.display = 'block';
        flag = 1;
    }
    if(!validateUserName()){
        fieldErrors.push('Requested By: Name Must Be In List');
        document.getElementById('userNameError').style.display = 'block';
        document.getElementById('userNameError').textContent = 'NAME MUST BE IN LIST';
        document.getElementById('userName').classList.add('highlight');
        flag = 1;
    }
    if(!validateDepartment()){
        fieldErrors.push('Department: Name Must Be In List');
        document.getElementById('departmentError').style.display = 'block';
        document.getElementById('departmentError').textContent = 'NAME MUST BE IN LIST';
        document.getElementById('department').classList.add('highlight');
        flag = 1;
    }
    if (userName == '***OTHER***'){
        if(!manager){
            fieldErrors.push('Manager: Required');
            unfilledFields.push('manager');
            document.getElementById('managerError').style.display = 'block';
            document.getElementById('manager').classList.add('highlight');
            flag = 1;
        }
        if(!validateManager()){
            fieldErrors.push('Manager: Name Must Be In List');
            document.getElementById('manager').style.display = 'block';
            document.getElementById('manager').textContent = 'NAME MUST BE IN LIST';
            document.getElementById('manager').classList.add('highlight');
            flag = 1;
        }
    }
    if (description.length > maxDescriptionLength) {
        unfilledFields.push('description');
        fieldErrors.push('Description: Needs Less Than 250 Characters');
        flag = 1;
    }
    fieldErrors.push('\n');

    removeEmptyRows();

    const qtyCheck = checkAllQty();
    const dateCheck = checkAllDate();
    const costCheck = checkAllCost();
    const descCheck = checkAllDesc();
    const tableErrors = [];

    if(qtyCheck.length > 0 || dateCheck.length > 0  || costCheck.length > 0 || descCheck.length > 0 ){
        fieldErrors.push('TABLE ERRORS:');
    }
    if(qtyCheck.length > 0 ){
        tableErrors.push('QTY Invalid');
        flag = 1;
    }
    if(dateCheck.length > 0 ){
        tableErrors.push('DATE Invalid');
        flag = 1;
    }
    if(costCheck.length > 0 ){
        tableErrors.push('COST Invalid');
        flag = 1;
    }
    if(descCheck.length > 0 ){
        tableErrors.push('DESCRIPTION Invalid');
        flag = 1;
    }

    tableErrorString = tableErrors.join(', ');
    fieldErrors.push(tableErrorString);

    if(flag == 1){
        alert(fieldErrors.join('\n'));
    }

    return flag;
}

function validateUserName() {
    const userNameInput = document.getElementById('userName').value;
    const userNamesList = document.querySelectorAll('#employeeDropdown li');
    let isNameValid = false;
  
    userNamesList.forEach((li) => {
      if (li.textContent === userNameInput) {
        isNameValid = true;
        return;
      }
    });
  
    if (!isNameValid) {
      document.getElementById('userNameError').style.display = 'block';
      document.getElementById('userName').classList.add('highlight');
      return false; // Prevent form submission
    } else {
      document.getElementById('userNameError').style.display = 'none';
      document.getElementById('userName').classList.remove('highlight');
      return true; // Allow form submission
    }
  }

  function validateDepartment() {
    const departmentInput = document.getElementById('department').value;
    const departmentList = document.querySelectorAll('#departmentDropdown li');
    let isNameValid = false;
  
    departmentList.forEach((li) => {
      if (li.textContent === departmentInput) {
        isNameValid = true;
        return;
      }
    });
  
    if (!isNameValid) {
      document.getElementById('departmentError').style.display = 'block';
      document.getElementById('department').classList.add('highlight');
      return false; // Prevent form submission
    } else {
      document.getElementById('departmentError').style.display = 'none';
      document.getElementById('department').classList.remove('highlight');
      return true; // Allow form submission
    }
  }

  function validateManager() {
    const managerInput = document.getElementById('manager').value;
    const managerList = document.querySelectorAll('#managerDropdown li');
    let isNameValid = false;

    managerList.forEach((li) => {
      if (li.textContent === managerInput) {
        isNameValid = true;
        return;
      }
    });
  
    if (!isNameValid) {
      document.getElementById('managerError').style.display = 'block';
      document.getElementById('manager').classList.add('highlight');
      return false; // Prevent form submission
    } else {
      document.getElementById('managerError').style.display = 'none';
      document.getElementById('manager').classList.remove('highlight');
      return true; // Allow form submission
    }
  }



/*-------------------------------------------------TABLE FUNCTIONS----------------------------------------------------------*/
//var table = document.getElementById("userTable").getElementsByTagName('tbody')[0];


// Get the table by ID
var table = document.getElementById("userTable");

// Check if the table exists and has at least two rows
if (table && table.rows.length >= 2) {
    // Access the second row
    var secondRow = table.rows[1];

    // Check if the second row exists and has cells
    if (secondRow && secondRow.cells.length > 0) {
        // Get the last cell in the second row
        var lastCellSecondRow = secondRow.cells[secondRow.cells.length - 1];

        setTodayDate(lastCellSecondRow);
    } else {
        console.error("CRITICAL ERROR: NO ROW FOUND");
    }
} else {
    console.error("Error: Insufficient rows in the table.");
}

function addRow() {

    // Check if the maximum limit is reached
    if (table.rows.length >= 15) {
        // Display the error message
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('error-message').textContent = "You've reached the maximum limit of 15 rows.";
        return; // Stop adding rows
    }

    // Hide the error message (if previously shown)
    document.getElementById('error-message').style.display = 'none';

    var qtyErrors = checkAllQty();
    var descErrors = checkAllDesc();
    var costErrors = checkAllCost();
    var dateErrors = checkAllDate();

    document.getElementById("missing-data-error").classList.add('hidden');
    //check everything is filled out prior to adding row
    if((qtyErrors.length == 0)&&(descErrors.length == 0)&&(costErrors.length == 0)&&(dateErrors.length == 0)){
        var newRow = table.insertRow(table.rows.length);
        for (var i = 0; i < 6; i++) {
            var cell = newRow.insertCell(i);
            if(i!=4){
                cell.contentEditable = true;
            }
            if(i==0){
                cell.setAttribute('onblur','updateTable(); checkInteger(this);');
                cell.setAttribute('onkeydown','handleKeyPress(event)');
            }
            if(i==2){
                cell.setAttribute('onblur','updateTable(); checkDesc(this); hideTableCount();');
                cell.setAttribute('onkeydown','handleKeyPress(event)');
                cell.setAttribute('oninput','updateCharacterCount(this);');
                cell.setAttribute('onclick','showTableCount(this);');
            }
            if(i==3){
                cell.setAttribute('onblur','updateTable(); checkCost(this);');
                cell.setAttribute('onkeydown','handleKeyPress(event)');
            }
            if(i==5){
                // Set today's date as the default value
                setDate(cell);

                cell.setAttribute('onblur', 'updateTable(); checkDate(this);');
                cell.setAttribute('onkeydown', 'handleKeyPress(event)');
            }
        }
    }else{
        document.getElementById("missing-data-error").classList.remove('hidden');
    }
}

function removeRow() {
    var table = document.getElementById("userTable").getElementsByTagName('tbody')[0];

    // Hide the error message (if previously shown)
    document.getElementById('error-message').style.display = 'none';

    // Check if there are rows to remove
    if (table.rows.length > 1) {
        table.deleteRow(table.rows.length - 1);
    } else {
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('error-message').textContent = "Cannot remove more rows. There must be at least 1 row.";
        return; // Stop adding rows
    }
}

// Function to set today's date as the default for the given cell
function setDate(cell) {
    var table = document.getElementById("userTable");
    var firstRow = table.rows[1];
    var lastCellFirstRow = firstRow.cells[firstRow.cells.length - 1];
    if(checkDate(lastCellFirstRow)){
        cell.textContent = lastCellFirstRow.innerText;
    }
}

function setTodayDate(cell) {
    var today = new Date();
    var formattedDate = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
    cell.innerText = formattedDate;
}

const tableCharCountWarning = document.getElementById('tableCharCountWarning');
const tableCharCount = document.getElementById('characterCount');

function updateCharacterCount(cell) {
    tableCharCountWarning.style.display = 'none';
    tableCharCount.style.color = '#b1a07a';
    tableCharCount.style.display = 'block';
    
    var cellText = cell.textContent;
    var charCount = cellText.length;
    
    if (charCount > 80) {
        tableCharCountWarning.style.color = 'red';
        tableCharCount.style.color = 'red';
        tableCharCountWarning.style.display = 'block';
    } 
    
    tableCharCount.innerText = `Selected Description Character Count: ${charCount}`;
}

function hideTableCount(){
    tableCharCount.style.display = 'none';
}

function showTableCount(cell){
    tableCharCount.innerText = `Selected Description Character Count: ${cell.textContent.length}`;
    tableCharCount.style.display = 'block';
}

function updateTable(){
    var tbody = document.getElementById("userTable").getElementsByTagName('tbody')[0];
    var rows = tbody.getElementsByTagName('tr');
    document.getElementById("missing-data-error").classList.add("hidden");

    for (var i = 0; i < rows.length; i++) {
        var cells = rows[i].getElementsByTagName('td');
        if (cells.length >= 5) {
            var qty = parseInt(cells[0].innerText || cells[0].textContent, 10); // 1st column
            var unitCost = parseFloat(cells[3].innerText || cells[3].textContent); // 4th column

            //if nothing in either qty or unitCost, then display nothing
            //if one has nothing, display the other object being needed
            //if both present, display the multiplied amount
            if(isNaN(qty) && isNaN(unitCost)){
                cells[4].innerText = 'Need QTY and Cost';
            }else if (isNaN(qty)) {
                cells[4].innerText = 'Need QTY';
            } else if(isNaN(unitCost)) {
                cells[4].innerText = 'Need Cost';
            } else{
                var extCost = qty * unitCost; 
                cells[4].innerText = `$${extCost.toFixed(2)}`;
            }
        }
    }
}

function refreshPage() {
    // Reload the current page
    location.reload();
}



/*-------------------------------------------------ERROR-CHECKS----------------------------------------------------------*/
function isInteger(value) {
    return /^-?\d+$/.test(value);
}

function isValidDateFormat(input) {
    // Define a regular expression pattern for MM/DD/YYYY format
    const dateFormatPattern = /^([0-9][0-9])\/([0-9][0-9])\/\d{4}$/;

    // Test the input against the pattern
    return dateFormatPattern.test(input);
}

function isNumber(value) {
    // Use a regular expression to check if the value is a valid integer or float
    // The pattern allows for an optional sign, followed by digits, an optional decimal point, and more digits
    const pattern = /^[-+]?\d*\.?\d+$/;
    return pattern.test(value);
}

let errorMessages = [];

function checkInteger(input) {
    const value = input.textContent.trim();

    if(!(value)){
        input.classList.add("highlight");
        document.getElementById("qty-error").innerText = "Please Fill In QTY.";
        document.getElementById("qty-error").classList.remove("hidden");
        return false;
    }else if (!isInteger(value)) {
        document.getElementById("qty-error").innerText = "Only Full Integers Allowed in QTY.";
        document.getElementById("qty-error").classList.remove("hidden");
        input.classList.add("highlight");
        return false;
    } else {
        input.classList.remove("highlight");
        document.getElementById("qty-error").classList.add("hidden");
        return true;
    }
}

function checkDate(input) {
    const value = input.textContent.trim();

    if (!value) {
        input.classList.add("highlight");
        document.getElementById("date-error").innerText = "Please Fill In Date.";
        document.getElementById("date-error").classList.remove("hidden");
        return false;
    } else if (!isValidDateFormat(value)) {
        input.classList.add("highlight");
        document.getElementById("date-error").innerText = "Please Format Data as: MM/DD/YYYY";
        document.getElementById("date-error").classList.remove("hidden");
        return false;
    } else {
        const dateParts = value.split('/');
        const month = parseInt(dateParts[0], 10);
        const day = parseInt(dateParts[1], 10);
        const year = parseInt(dateParts[2], 10);

        // Check if month is within the valid range (1 to 12)
        if (month < 1 || month > 12) {
            input.classList.add("highlight");
            document.getElementById("date-error").innerText = "Invalid month. Please enter a valid month (1 to 12).";
            document.getElementById("date-error").classList.remove("hidden");
            return false;
        }

        // Check if day is within the valid range (1 to 31)
        if (day < 1 || day > 31) {
            input.classList.add("highlight");
            document.getElementById("date-error").innerText = "Invalid day. Please enter a valid day (1 to 31).";
            document.getElementById("date-error").classList.remove("hidden");
            return false;
        }

        // You may add more checks for the year if needed

        // If all checks pass, remove highlighting and hide error message
        input.classList.remove("highlight");
        document.getElementById("date-error").classList.add("hidden");
        return true;
    }
}

function checkCost(input){
    const value = input.textContent.trim();

    if(!(value)){
        input.classList.add("highlight");
        document.getElementById("cost-error").innerText = "Please Fill In Unit Cost.";
        document.getElementById("cost-error").classList.remove("hidden");
        return false;
    }else if (!isNumber(value)) {
        document.getElementById("cost-error").innerText = "Only Float Values Allowed in Unit Cost";
        document.getElementById("cost-error").classList.remove("hidden");
        input.classList.add("highlight");
        return false;
    } else {
        input.classList.remove("highlight");
        document.getElementById("cost-error").classList.add("hidden");
        return true;
    }
}

function checkDesc(input){
    const value = input.textContent.trim();

    if(!(value)){
        input.classList.add("highlight");
        document.getElementById("desc-error").innerText = "Please Provide a Description.";
        document.getElementById("desc-error").classList.remove("hidden");
        return false;
    }else if (value.length>80) {
        document.getElementById("desc-error").innerText = "Less than 80 Characters Allowed in Description.";
        document.getElementById("desc-error").classList.remove("hidden");
        input.classList.add("highlight");
        return false;
    } else {
        input.classList.remove("highlight");
        document.getElementById("desc-error").classList.add("hidden");
        return true;
    }
}

function checkAllQty() {
    const table = document.getElementById("userTable");
    const rows = table.getElementsByTagName('tr');

    const errorLocations = [];

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        if (cells.length > 0) {
            const value = cells[0].textContent.trim();
            if (!isInteger(value)) {
                errorLocations.push({ row: i, column: 0 });
                cells[0].classList.add('highlight');
            }
        }
    }

    return errorLocations;
}

function checkAllCost() {
    const table = document.getElementById("userTable");
    const rows = table.getElementsByTagName('tr');

    const errorLocations = [];

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        if (cells.length > 0) {
            const value = cells[3].textContent.trim();
            if (!isNumber(value)) {
                errorLocations.push({ row: i, column: 0 });
                cells[3].classList.add('highlight');
            }
        }
    }

    return errorLocations;
}

function checkAllDesc() {
    const table = document.getElementById("userTable");
    const rows = table.getElementsByTagName('tr');

    const errorLocations = [];

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        if (cells.length > 0) {
            const value = cells[2].textContent.trim();
            if (value.trim()=='') {
                errorLocations.push({ row: i, column: 0 });
                cells[2].classList.add('highlight');
            }
        }
    }

    return errorLocations;
}

function checkAllDate() {
    const table = document.getElementById("userTable");
    const rows = table.getElementsByTagName('tr');

    const errorLocations = [];

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        if (cells.length > 0) {
            const value = cells[5].textContent.trim();
            if (!isValidDateFormat(value)) {
                errorLocations.push({ row: i, column: 0 });
                cells[5].classList.add('highlight');
            }
        }
    }

    return errorLocations;
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent the default Enter key action (newline)
      event.target.blur(); // Remove focus from the editable cell
    }
}

function resetError(element){
    element.classList.remove('highlight');
    document.getElementById(`${element.id}Error`).style.display= 'none';
}

function removeEmptyRows() {
    // Get a reference to the table
    var table = document.getElementById("userTable");

    // Iterate through the rows in reverse order to avoid index issues
    for (var i = table.rows.length - 1; i >= 2; i--) {
        var row = table.rows[i];
        var isEmpty = true;

        // Iterate through the cells in the current row
        for (var j = 0; j < row.cells.length; j++) {
            if(j!=4 || j!=5){
                var cell = row.cells[j];
                if (cell.textContent.trim() !== '') {
                    isEmpty = false;
                    break;
                }
            }
        }

        // If the row is empty, remove it
        if (isEmpty) {
            table.deleteRow(i);
        }
    }
}



/*-------------------------------------------------DEBUG----------------------------------------------------------*/
function autofill(){
    document.getElementById('date').value = '2023-11-23';
    document.getElementById('department').value = 'IT';
    document.getElementById('userName').value = '***OTHER***';
    document.getElementById('manager').value = 'David Freeman';
    document.getElementById('manager-container').classList.remove('hidden');
    document.getElementById('supplierName').value = 'TexDev';
    document.getElementById('description').value = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure do';
    employeeEmail = 'dfreeman@test.com';
    
    const table = document.getElementById("userTable");

    // Iterate through the rows of the table
    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];
        
        // Iterate through the cells in the first three columns and the fifth column (skip the fourth column)
        for (let j = 0; j < row.cells.length; j++) {
            if (j ==0) { // Skip both the fourth and fifth columns
                const cell = row.cells[j];

                const min = 1;
                const max = 10;
                const randomInt = Math.floor(Math.random() * (max - min + 1)) + min;
                cell.textContent = randomInt; // Replace 'New Value' with the desired value
            }
            if(j == 1){
                const cell = row.cells[j];

                cell.textContent = i;
            }
            if (j === 2) {
                const cell = row.cells[j];
                cell.textContent = 'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequa';
            }
            if(j == 3){
                const cell = row.cells[j];

                const min = 1;
                const max = 1000;
                const randomNum = Math.random() * (max - min) + min;
                // Round the random number to 2 decimal places
                const roundedNum = Math.round(randomNum * 100) / 100;

                cell.textContent = roundedNum;
            }
            if (j === 5) {
                const cell = row.cells[j];
                cell.textContent = '11/23/2023';
            }
        }
    }

    updateTable();

    document.getElementById('link1').value = 'www.google.com';
    document.getElementById('link2').value = 'www.youtube.com';
    document.getElementById('link3').value = 'www.yahoo.com';
}


/*-------------------------------------------------PDF POST----------------------------------------------------------*/
function openPdf() {
    window.open('assets/js/DATA/GENERATED_POR.pdf', '_blank');
}
