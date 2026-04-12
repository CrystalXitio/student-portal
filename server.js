// 1. Import Required Tools
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

// 2. Initialize the Server
const app = express();
app.use(cors()); // Allows your HTML files to talk to this server
app.use(express.json()); // Allows the server to read JSON data

// 3. Connect to the XAMPP MySQL Database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Default XAMPP user
    password: '',      // Default XAMPP password is empty
    database: 'college_portal', // The database we created in Phase 1
    port: 3306         // The port you verified was running in XAMPP
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL Database successfully!');
});

// ==========================================
// API ENDPOINTS (The Waiters)
// ==========================================

// --- LOGIN SYSTEM ---
app.post('/api/login', (req, res) => {
    // Grab the ID and Password sent from the HTML form
    const submittedId = req.body.userId;
    const submittedPassword = req.body.password;

    // Query the Database to see if they match a record
    const sqlQuery = "SELECT user_id, name, role FROM users WHERE user_id = ? AND password = ?";
    
    db.query(sqlQuery, [submittedId, submittedPassword], (err, results) => {
        if (err) {
            console.error("Database error during login:", err);
            return res.status(500).json({ success: false, message: "Server error occurred." });
        }

        // Check if a user was found
        if (results.length > 0) {
            // A match was found! Send back success, their role, and their name.
            const user = results[0];
            res.json({ 
                success: true, 
                userId: user.user_id, 
                role: user.role, 
                name: user.name 
            });
        } else {
            // No match found in the database
            res.status(401).json({ success: false, message: "Invalid ID or Password!" });
        }
    });
});

// ==========================================
// API: ADMIN PORTAL
// ==========================================

// 1. Get Dashboard Statistics
app.get('/api/admin/stats', (req, res) => {
    // This is a neat SQL trick: running multiple COUNT queries in one go!
    const sqlQuery = `
        SELECT 
            (SELECT COUNT(*) FROM users WHERE role='student') AS total_students,
            (SELECT COUNT(*) FROM users WHERE role='teacher') AS total_teachers,
            (SELECT COUNT(*) FROM courses) AS total_courses,
            (SELECT COUNT(*) FROM subjects) AS total_subjects,
            (SELECT COUNT(*) FROM classes) AS total_classes,
            (SELECT COUNT(*) FROM tickets WHERE status='Open') AS pending_tickets
    `;
    
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false });
        }
        res.json({ success: true, data: results[0] });
    });
});

// 2. Add a New Student
app.post('/api/admin/add-student', (req, res) => {
    const { name, rollNo, sapId, courseId } = req.body;
    const defaultPassword = 'password123'; // Standard default password for new students

    const sqlQuery = `INSERT INTO users (user_id, name, sap_id, password, role) VALUES (?, ?, ?, ?, 'student')`;
    
    db.query(sqlQuery, [rollNo, name, sapId, defaultPassword], (err, result) => {
        if (err) {
            console.error(err);
            // If the Roll No or SAP ID already exists, MySQL throws an error
            return res.status(400).json({ success: false, message: "Error: Roll No or SAP ID might already exist." });
        }
        res.json({ success: true, message: "Student added successfully to the database!" });
    });
});

// 4. Start the Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});