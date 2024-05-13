/*
 * File: server.js
 * Project: PO Request Form
 * Author: Aksel Freeman
 * Version: 1.0.0
 * Description: Script code for server for PO Requests.
 */


/*-------------------------------------------------DEPENDENCIES----------------------------------------------------------*/
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fsp = require('fs').promises;
const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');
const Papa = require('papaparse');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { file } = require('pdfkit');
const { promisify } = require('util');
const { exec } = require('child_process');
const mysql = require('mysql');
var iconvlite = require('iconv-lite');


/*-------------------------------------------------GLOBALS----------------------------------------------------------*/
const app = express();
const router = express.Router();
//removed to be exported
//const port = 80;

const MASTER_PATH = 'Portfolio/assets/js/DATA';         //this is where DATA.csv, por_template.pdf, and POR_INDEX.txt should be located
const POR_PATH = ``;                                    //sub-directory for PDFs and additional files
const indexPath = `${MASTER_PATH}/POR_INDEX.txt`;         //index path
const csvPath = `${MASTER_PATH}/data/DATA.csv`;           //csv path
const pdfTemplate = `${MASTER_PATH}/por_template.pdf`;    //template for pdf generation path

// email support
// const transporter = nodemailer.createTransport({  //email variable
//   host: 'smtp-mail.outlook.com',
//   port: 587,
//   secure: false,
//   auth: {
//     user: 'USERNAME',
//     pass: 'PASSWORD'
//   },
//   encoding: 'base64',
// });


/*-------------------------------------------------SERVER----------------------------------------------------------*/
app.use(express.static(path.join(__dirname, 'Portfolio')));
app.use(bodyParser.json());
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Portfolio', 'PORequest.html'));
});

router.post('/upload', async (req, res) => {
  console.log('Received a POST request at /upload');
  try {
    

    //define formData
    let formData = {};

    app.use(express.json());

    // Use the updated upload middlewar
    const upload = multer().any();


    // Use the updated upload middleware
    upload(req, res, async function (err) {
      if (err) {
        console.error('Error uploading files:', err);
        return res.status(500).json({ success: false, message: 'Error uploading files' });
      }

      //log what was received
      formData = req.body;
      const files = req.files;
      console.log('Uploaded Form:', formData);
      console.log('Uploaded Files:', files);


      //incremenet counter
      const counter = POCounter();

      //name file
      const fullName = formData.userName;
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0];

      const por_num =  `POR-${counter.toString().padStart(6, '0')}`;
      const fileName = `GENERATED_POR`;
      const directoryPath = `${MASTER_PATH}`;
      
      //old path and names
      // const por_num =  `POR-${counter.toString().padStart(6, '0')}`;
      // const fileName = `${por_num}-${firstName}`;
      // const directoryPath = `${MASTER_PATH}/${POR_PATH}/${fileName}/`;

      // Ensure the directory exists, create it if not
      if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
      }

      // Generate PDF using the form data
      await generatePdf(formData, directoryPath, fileName, counter, files, por_num);

      res.json({ success: true, message: 'PO Request Submitted!' });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

//removed so it could be exported
// app.listen(port, () => {
//   console.log(`Server is running at http://www.aksel.dev/PORequest`);
// });



/*-------------------------------------------------PDF GENERATION----------------------------------------------------------*/
async function generatePdf(formData, directoryPath, fileName, counter, files, por_num) {
  try {

    //output path for pdf
    const pdfOutput = `${directoryPath}/${fileName}.pdf`;   //pdf output path

    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    // Load the base PDF
    const basePdfBuffer = await fsp.readFile(pdfTemplate);
    const pdfDoc = await PDFDocument.load(basePdfBuffer);

    // Get the first page of the PDF
    const [page] = pdfDoc.getPages();

    // Set font size and type (use the default font)
    const fontSize = 15;

    //determine manager
    let manager = 'N/A';
    let fullUserName = `${formData.userName}`;
    if(formData.userName == 'OTHER'){
      manager = formData.manager;
      fullUserName = `${formData.userName} - ${shortName(manager)}`;
    }

    // Draw text using the form data
    page.drawText(`${formData.date}`, { x: 160, y: 685, size: fontSize });
    page.drawText(`${por_num}`, { x: 395, y: 685, size: fontSize });
    page.drawText(`${formData.department}`, { x: 160, y: 664, size: fontSize });
    page.drawText(`${fullUserName}`, { x: 395, y: 664, size: fontSize });
    page.drawText(`${formData.supplierName}`, { x: 160, y: 644, size: fontSize });

    const desc = breakString(`${formData.description}`, 90);
    for (let i = 0; i < desc.length; i++) {
      page.drawText(`${desc[i]}`, { x: 50, y: 245-(12*i), size: 12 });
    }


    //check if table can be parsed
    let tableData;

    try {
      if (formData.tableData) {
        // Attempt to parse formData.tableData as JSON
        tableData = JSON.parse(formData.tableData);
        console.log('Parsed tableData:', tableData);
      } else {
        console.error('formData.tableData is undefined or empty.');
      }
    } catch (error) {
      console.error('Error parsing tableData JSON:', error);
    }

    if (!tableData) {
      // Handle the situation where formData.tableData is not a valid JSON
      console.error('formData.tableData is not valid JSON.');
      // You might want to handle this error case appropriately
      return res.status(400).json({ success: false, message: 'Invalid tableData JSON' });
    }



    //table font size
    const tableFontSize = 11;
    
    //table being drawn
    let i = 0;
    let amounts = [];

    tableData.forEach( row=> {
      page.drawText(`${row[0]}`, { x: 74+((129-74-(`${row[0]}`).length*5)/2), y: 580-(i*21.5), size: tableFontSize });
      page.drawText(`${row[1]}`, { x: 129+((217-129-(`${row[1]}`).length*5)/2), y: 580-(i*21.5), size: tableFontSize });

      const itemDesc = breakString(`${row[2]}`, 45);
      for (let j = 0; j < itemDesc.length; j++) {
        page.drawText(`${itemDesc[j]}`, { x: 217+((382-217-(`${itemDesc[j]}`).length*3.4)/2), y: 587-(i*21.5)-(j*10), size: 8 });
      }

      page.drawText(`${row[3]}`, { x: 382+((446-382-(`${row[3]}`).length*5)/2), y: 580-(i*21.5), size: tableFontSize });
      page.drawText(`${row[4]}`, { x: 446+((505-446-(`${row[4]}`).length*5)/2), y: 580-(i*21.5), size: tableFontSize });
      amounts.push(row[4]);
      page.drawText(`${row[5]}`, { x: 505+((565-505-(`${row[5]}`).length*5)/2), y: 580-(i*21.5), size: tableFontSize });
      i++;
    });

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();

    //write PDF bytes to a Buffer
    const pdfBuffer = Buffer.from(pdfBytes);


    // Write the PDF to a file
    await fsp.writeFile(pdfOutput, pdfBytes);

    //server output
    console.log('PDF generated and saved at:', pdfOutput);

    //creating data for .csv file
    const newRow = {
      POR_NUMBER: `${por_num}`,
      DATE_REQUESTED: `${formatDate(formData.date)}`,
      //if needed, uncomment both this and the html code
      //CUSTOMER_NUMBER: `${formData.purchaseOrder}`,
      DEPARTMENT: `${formData.department}`,
      REQUESTED: `${formData.userName}`,
      MANAGER: `${manager}`,
      EMAIL:  `${formData.emailOptIn.replace(/\*/g, '')}`,
      SUPPLIER: `${formData.supplierName}`,
      COMMENTS: `${formData.description}`,
      COST: `$${calcTotal(amounts)}`,
      LINKS: `${joinLinks(formData.link1, formData.link2, formData.link3)}`,
      PO_ID:  `${counter}`,
      STATUS: 'PENDING',
      DATE_CREATED: getCurrentDate(),
      TIME_CREATED: getCurrentTime(),
      DATE_MODIFIED: getCurrentDate()
    };

    //headers for .csv, uncomment customer_number if necessarry, requires a new csv
    const headers = ['POR_NUMBER', 'DATE_REQUESTED', /*'CUSTOMER_NUMBER',*/ 'DEPARTMENT', 'REQUESTED', 'MANAGER','EMAIL', 'SUPPLIER', 'COMMENTS', 'COST', 'LINKS', 'PO_ID', 'STATUS', 'DATE_CREATED', 'TIME_CREATED', 'DATE_MODIFIED']; // Example headers

    //call .csv function
    //CSVEdit(headers, newRow);

    //insert data into db    getCurrentDateDB()
    //insertInDb(`${por_num}`, `${formData.date}`, `${formData.department}`, `${formData.userName}`, `${manager}`, `${formData.emailOptIn.replace(/\*/g, '')}`, `${formData.supplierName}`, `${formData.description}`, `${calcTotal(amounts)}`, `${joinLinks(formData.link1, formData.link2, formData.link3)}`, `${counter}`, 'PENDING', getCurrentDateDB(), getCurrentTimeDB(), getCurrentDateDB());

    //email data to users
    //emailData(files, directoryPath, `${fileName}.pdf`, formData.link1, formData.link2, formData.link3, calcTotal(amounts), `${formData.emailOptIn.replace(/\*/g, '')}`);

    //catch errors and display in pop up window
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
}

function breakString(str, maxLineLength) {
  const lines = [];
  let currentPosition = 0;

  while (currentPosition < str.length) {
    const line = str.substring(currentPosition, currentPosition + maxLineLength);
    lines.push(line);
    currentPosition += maxLineLength;
  }
  return lines;
}

function calcTotal(amounts) {
  let totalAmount = 0;

  for (const amount of amounts) {
    // Remove the '$' and parse the amount as a float
    const parsedAmount = parseFloat(amount.replace('$', ''));
    
    // Check if the parsedAmount is a valid number
    if (!isNaN(parsedAmount)) {
      totalAmount += parsedAmount;
    }
  }
  return totalAmount.toFixed(2);
}

function joinLinks(link1, link2, link3){
  let links = [link1, link2, link3];
  let filtered = links.filter(str => str.trim().length > 0);
  return filtered.join(' , ')
}

function shortName(fullName) {
  // Split the full name into an array of words
  const words = fullName.split(" ");

  // Ensure there are at least two words (first name and last name)
  if (words.length < 2) {
    return "";
  }

  // Extract the first name and the first letter of the last name
  const firstName = words[0];
  const lastInitial = words[words.length - 1].charAt(0) + ".";

  // Combine and return the result
  return firstName + " " + lastInitial;
}




/*-------------------------------------------------CSV FUNCTION----------------------------------------------------------*/
// CSV DATA TO SAVE PDF's
// function CSVEdit(headers, row) {
//   try{

//     //if it doesnt exist, create the .csv file
//     if (!fs.existsSync(csvPath)) {
//       const csvData = Papa.unparse( [headers] );
//       fs.writeFileSync(csvPath, csvData);
//       console.log('CSV file created with headers:', csvPath);
//     } else {
//       console.log('CSV file already exists:', csvPath);
//     }

//     // Read the existing CSV data
//     const csvData = fs.readFileSync(csvPath, 'utf8');
//     const parsedData = Papa.parse(csvData, { header: true });

//     // Append the new row
//     parsedData.data.push(row);

//     // Convert data to CSV format
//     const updatedCSV = Papa.unparse(parsedData);

//     // Write the updated CSV data back to the file
//     fs.writeFileSync(csvPath, updatedCSV);
//     console.log('Row added to CSV.');

//     //catch error and display it
//   } catch(error){
//     console.error('Error editing CSV:', error);
//     throw new Error('Error editing CSV');
//   }
// }

//time function
function getCurrentTime() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');

  let amPm = 'AM';

  if (hours >= 12) {
    amPm = 'PM';
    if (hours > 12) {
      hours -= 12;
    }
  }

  const formattedHours = hours.toString().padStart(2, '0');

  return `${formattedHours}:${minutes} ${amPm}`;
}

//formatted time for db
function getCurrentTimeDB() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

//date function
function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[now.getMonth()];
  const day = now.getDate().toString().padStart(2, '0');

  return `${month}-${day}-${year}`;
}

function formatDate(inputDate) {
  const dateParts = inputDate.split('-');
  console.log(inputDate);
  if (dateParts.length === 3) {
    const year = dateParts[0];
    const month = dateParts[1];
    const day = dateParts[2];
    
    // Create a date object to get the month name
    const dateObj = new Date(`${month}/01/${year}`);
    const monthName = dateObj.toLocaleString('default', { month: 'short' });

    return `${monthName}-${day}-${year}`;
  } else {
    return 'Invalid date format';
  }
}

//db formatted date
function getCurrentDateDB() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed, so add 1 and pad with '0' if needed
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

//indexing for por naming
function POCounter() {
  let counter = 1;

  if (fs.existsSync(indexPath)) {
    // Read the content of the file and parse it to an integer
    const fileContent = fs.readFileSync(indexPath, 'utf-8');
    counter = parseInt(fileContent, 10);

    if (!isNaN(counter)) {
      // Increment the counter by one
      counter++;
    }
  } else {
    // If the file doesn't exist, create it with the initial value '2'
    fs.writeFileSync(indexPath, '2');
  }

  // Save the updated counter to the file
  fs.writeFileSync(indexPath, counter.toString());

  return counter;
}


/*-------------------------------------------------EMAIL----------------------------------------------------------*/
async function emailData(files, directoryPath, fileName, link1, link2, link3, cost, email){
  try{

    // Save files to the specified directory
    await Promise.all(files.map(async (file) => {
      const filePath = path.join(directoryPath, file.originalname);
      file.path = filePath;
      await fsp.writeFile(filePath, file.buffer);
      console.log('File saved:', filePath);
    }));

    //attach the files to the email
    let attachedFiles = [];

    //atach files
    const pdfFile = path.join(directoryPath, fileName); // Specify the correct PDF file name
    // Check if the PDF file exists
    if (fs.existsSync(pdfFile)) {
      attachedFiles.push({ path: pdfFile, filename: fileName, originalname: fileName});
      console.log('PDF file attached successfully.');
    } else {
      console.log('PDF file not found in the specified directory.');
    }
    attachedFiles = attachedFiles.concat(files);

    attachedFiles.forEach(file => {
      file.filename = file.originalname;
    });

    const mailOptions = {
      from: 'SENDER',
      to: 'RECIPIENT',  //replace with email variable plus whoever needs to see the email
      subject: 'TexDev Official Forms Purchase Order Request',
      html: `
      <html>
        <body>
          <div style="text-align: center; font-weight: bolder;">
            <h1 style="font-size: 24px;">TexDev Official Forms Purchase Order Request</h1>
          </div>
          <div style="text-align: center;">
            <p>A new Purchase Order Request Form has been filled out and archived, see the Attachments above.</p>
          </div>
          ${generateLinksHtml(link1,link2,link3)}
          <div style="font-weight: bold;">
            <p>Grand Total: $${cost}</p>
          </div>

          <div style="font-style: italic; font-weight:bold">
            <p>Thank You</p>
          </div>
          <div style="font-weight: bold">
            <p>TexDev IT Team</p>
          </div>
        </body>
      </html>
      `,
      attachments: attachedFiles,
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
  }catch(error){
    console.error('Error in emailData:', error);
  }
}

function generateLinksHtml(link1, link2, link3) {
  let linksHtml = '<div style="font-weight: bold;">\n<p>Links:</p>\n<ul style="list-style: none;">\n';
  
  if (link1) {
    linksHtml += `<li><a href="${link1}">${link1}</a></li>\n`;
  }
  
  if (link2) {
    linksHtml += `<li><a href="${link2}">${link2}</a></li>\n`;
  }
  
  if (link3) {
    linksHtml += `<li><a href="${link3}">${link3}</a></li>\n`;
  }

  if(!link1 && !link2 && !link3){
    linksHtml = '';
    linksHtml = '<div style="font-weight: bold; font-style: italic;">\n<p>No Links</p>\n<ul style="list-style: none;">\n';;
  }

  linksHtml += '</ul>\n</div>\n';

  return linksHtml;
}

function readFileSync_encoding(filename, encoding) {
  var content = fs.readFileSync(filename);
  return iconvlite.decode(content, encoding);
}



/*-------------------------------------------------DATABASE----------------------------------------------------------*/
//DATABASE SUPPORT
// async function insertInDb(por_number, date_requested, department, requested, manager, email, supplier, comments, cost, links, po_id, status, date_created, time_created, date_modified) {
//   const dbName = 'mydb';
//   const tableName = 'table_name';

//   //create connection
//   const con = mysql.createConnection({
//     host: 'IP',
//     user: 'USER',
//     password: 'PASSWORD',
//     database: dbName
//   });

//   try {
//     //connect to mysql
//     await new Promise((resolve, reject) => {
//       con.connect((err) => {
//         if (err) {
//           console.error('CONNECT TO DATABASE ERROR: ', err);
//           reject(err);
//         } else {
//           console.log('Connected to the MySQL database');
//           resolve();
//         }
//       });
//     });

//     //create the db
//     await new Promise((resolve, reject) => {
//       con.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, function (err, result) {
//         if (err) {
//           console.error('CREATE DATABASE ERROR: ', err);
//           reject(err);
//         } else {
//           console.log('Database created or already exists');
//           resolve();
//         }
//       });
//     });

//     //use the db
//     await new Promise((resolve, reject) => {
//       con.query(`USE ${dbName}`, function (err) {
//         if (err) {
//           console.error('DATABASE SWITCH ERROR: ', err);
//           reject(err);
//         } else {
//           console.log(`Using ${dbName} database`);
//           resolve();
//         }
//       });
//     });

//     //create the table
//     await new Promise((resolve, reject) => {
//       const createTable = `
//         CREATE TABLE IF NOT EXISTS ${tableName} (
//           POR_NUMBER VARCHAR(10) PRIMARY KEY,
//           PO_ID INT,
//           DATE_REQUESTED DATE,
//           DEPARTMENT VARCHAR(20),
//           REQUESTED VARCHAR(20),
//           MANAGER VARCHAR(20),
//           EMAIL VARCHAR(50),
//           SUPPLIER VARCHAR(50),
//           COMMENTS VARCHAR(255),
//           COST DECIMAL(10, 2),
//           LINKS VARCHAR(255),
//           STATUS VARCHAR(10),
//           DATE_CREATED DATE,
//           TIME_CREATED TIME,
//           DATE_MODIFIED DATE
//         )`;
//       con.query(createTable, function (err) {
//         if (err) {
//           console.error('CREATE TABLE ERROR: ', err);
//           reject(err);
//         } else {
//           console.log('Table created or already exists');
//           resolve();
//         }
//       });
//     });

//     //insert into table
//     await new Promise((resolve, reject) => {
//       const insertTable = `
//         INSERT INTO ${tableName} (
//           POR_NUMBER, 
//           PO_ID, 
//           DATE_REQUESTED, 
//           DEPARTMENT, 
//           REQUESTED, 
//           MANAGER, 
//           EMAIL, 
//           SUPPLIER, 
//           COMMENTS, 
//           COST, 
//           LINKS, 
//           STATUS, 
//           DATE_CREATED, 
//           TIME_CREATED, 
//           DATE_MODIFIED
//         ) 
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
//       con.query(insertTable, [por_number, po_id, date_requested, department, requested, manager, email, supplier, comments, cost, links, status, date_created, time_created, date_modified], function (err, result) {
//         if (err) {
//           console.error('INSERT ERROR: ', err);
//           reject(err);
//         } else {
//           console.log("1 record inserted");
//           resolve();
//         }
//       });
//     });
    
//   } catch (err) {
//     // Handle any errors here
//   } finally {
//     //end connection
//     con.end();
//   }
// }

module.exports = router;