const mysql = require('mysql2/promise');

async function initializeDatabase() {
    console.log("Connecting to MySQL to initialize the database (student_portal_db)...");

    // Connect without a specific database first to create it if it doesn't exist
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'Neoprene98',
    });

    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS student_portal_db;`);
        await connection.query(`USE student_portal_db;`);

        console.log("Creating tables...");

        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                userId VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                password VARCHAR(100) NOT NULL,
                role ENUM('admin', 'teacher', 'student') NOT NULL,
                sapId VARCHAR(50) NULL
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS courses (
                courseId VARCHAR(50) PRIMARY KEY,
                courseName VARCHAR(150) NOT NULL,
                durationYears INT,
                totalCredits INT
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS subjects (
                subjectCode VARCHAR(50) PRIMARY KEY,
                subjectName VARCHAR(150) NOT NULL,
                courseId VARCHAR(50) NOT NULL,
                semester INT,
                FOREIGN KEY (courseId) REFERENCES courses(courseId)
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS ica_records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                studentId VARCHAR(50) NOT NULL,
                subjectCode VARCHAR(50) NOT NULL,
                ica1 INT DEFAULT 0,
                ica2 INT DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_student_subject (studentId, subjectCode),
                FOREIGN KEY (studentId) REFERENCES users(userId)
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS attendance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                studentId VARCHAR(50) NOT NULL,
                subjectCode VARCHAR(50) NOT NULL,
                date DATE NOT NULL,
                status ENUM('present', 'absent') NOT NULL,
                UNIQUE KEY unique_daily_attendance (studentId, subjectCode, date),
                FOREIGN KEY (studentId) REFERENCES users(userId)
            );
        `);

        console.log("Seeding initial data...");

        // Seed Users
        await connection.query(`
            INSERT IGNORE INTO users (userId, name, password, role, sapId) VALUES
            ('ADM-001', 'System Admin', 'admin123', 'admin', NULL),
            ('FAC-1029', 'Prof. MKA', 'prof123', 'teacher', NULL),
            ('N005', 'Agrim Arya', 'student123', 'student', '70472400005'),
            ('N001', 'Aarav Patel', 'student123', 'student', '70472400001'),
            ('N006', 'Rahul Sharma', 'student123', 'student', '70472400006');
        `);

        // Seed Courses
        await connection.query(`
            INSERT IGNORE INTO courses (courseId, courseName, durationYears, totalCredits) VALUES
            ('mbatech_ce', 'MBA Tech in Computer Engineering', 5, 220);
        `);

        // Seed Subjects
        await connection.query(`
            INSERT IGNORE INTO subjects (subjectCode, subjectName, courseId, semester) VALUES
            ('CE-DBMS-01', 'Database Management Systems', 'mbatech_ce', 4),
            ('CE-DSA-02', 'Data Structures and Algorithms', 'mbatech_ce', 3);
        `);

        // Seed a default ICA record for visual testing on the student dashboard
        await connection.query(`
            INSERT IGNORE INTO ica_records (studentId, subjectCode, ica1, ica2) VALUES
            ('N005', 'CE-DBMS-01', 24, 21),
            ('N005', 'CE-DSA-02', 19, 22);
        `);

        console.log("Database initialized and safely seeded successfully!");
    } catch (err) {
        console.error("Error initializing database:", err);
    } finally {
        await connection.end();
    }
}

if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;
