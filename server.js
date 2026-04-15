const express = require('express');
const cors = require('cors');
const db = require('./db');
const initializeDatabase = require('./init_db');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize database schema and data automatically on startup
initializeDatabase().catch(err => {
    console.error("Failed to initialize database securely:", err);
});

// ==========================================
// 1. AUTH & DASHBOARD METRICS
// ==========================================

// --- LOGIN SYSTEM ---
app.post('/api/login', async (req, res) => {
    try {
        const { userId, password } = req.body;
        const [rows] = await db.query('SELECT userId, role, name FROM users WHERE userId = ? AND password = ?', [userId, password]);
        
        if (rows.length > 0) {
            const user = rows[0];
            res.json({ success: true, userId: user.userId, role: user.role, name: user.name });
        } else {
            res.status(401).json({ success: false, message: "Invalid ID or Password!" });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error occurred." });
    }
});

// --- ADMIN: GET DASHBOARD STATS ---
app.get('/api/admin/stats', async (req, res) => {
    try {
        const [[studentCount]] = await db.query("SELECT COUNT(*) AS count FROM users WHERE role = 'student'");
        const [[teacherCount]] = await db.query("SELECT COUNT(*) AS count FROM users WHERE role = 'teacher'");
        const [[courseCount]] = await db.query("SELECT COUNT(*) AS count FROM courses");
        const [[subjectCount]] = await db.query("SELECT COUNT(*) AS count FROM subjects");
        
        res.json({ 
            success: true, 
            data: { 
                total_students: studentCount.count,
                total_teachers: teacherCount.count, 
                total_courses: courseCount.count, 
                total_subjects: subjectCount.count, 
                total_classes: 0, 
                pending_tickets: 0 
            }
        });
    } catch (error) {
        console.error("Stats error:", error);
        res.status(500).json({ success: false });
    }
});

// ==========================================
// 2. TEACHER FEATURES (ICA & ATTENDANCE)
// ==========================================

// --- TEACHER: SCORE UPLOAD ---
// Accepts: { subjectCode: '...', records: [{studentId: '...', ica1: 20, ica2: 24}, ...] }
app.post('/api/teacher/ica', async (req, res) => {
    try {
        const { subjectCode, records } = req.body;
        
        if (!subjectCode || !records || !Array.isArray(records)) {
            return res.status(400).json({ success: false, message: "Invalid payload format." });
        }

        // We use INSERT ... ON DUPLICATE KEY UPDATE to allow partial edits/overrides safely
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const record of records) {
                await connection.query(
                    `INSERT INTO ica_records (studentId, subjectCode, ica1, ica2) 
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE ica1 = VALUES(ica1), ica2 = VALUES(ica2)`,
                    [record.studentId, subjectCode, record.ica1 || 0, record.ica2 || 0]
                );
            }
            await connection.commit();
            res.json({ success: true, message: "ICA Marks securely saved to MySQL!" });
        } catch (trxErr) {
            await connection.rollback();
            throw trxErr;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("ICA Upload Error:", error);
        res.status(500).json({ success: false, message: "Database failure occurred while saving marks." });
    }
});

// --- TEACHER: ATTENDANCE UPLOAD ---
// Accepts: { subjectCode: '...', date: 'YYYY-MM-DD', records: [{studentId: '...', status: 'present'}, ...] }
app.post('/api/teacher/attendance', async (req, res) => {
    try {
        const { subjectCode, date, records } = req.body;
        
        if (!subjectCode || !date || !records || !Array.isArray(records)) {
            return res.status(400).json({ success: false, message: "Invalid payload format." });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const record of records) {
                await connection.query(
                    `INSERT INTO attendance (studentId, subjectCode, date, status) 
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE status = VALUES(status)`,
                    [record.studentId, subjectCode, date, record.status]
                );
            }
            await connection.commit();
            res.json({ success: true, message: "Attendance securely saved to MySQL!" });
        } catch (trxErr) {
            await connection.rollback();
            throw trxErr;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Attendance Upload Error:", error);
        res.status(500).json({ success: false, message: "Database failure occurred while saving attendance." });
    }
});


// ==========================================
// 3. STUDENT FEATURES (ICA VISIBILITY)
// ==========================================

// --- STUDENT: GET ICA RESULTS ---
app.get('/api/student/ica', async (req, res) => {
    try {
        const studentId = req.query.studentId;
        if (!studentId) {
            return res.status(400).json({ success: false, message: "Missing studentId param." });
        }

        const [rows] = await db.query(
            `SELECT i.subjectCode, s.subjectName, i.ica1, i.ica2, i.last_updated
             FROM ica_records i 
             JOIN subjects s ON i.subjectCode = s.subjectCode 
             WHERE i.studentId = ?`, 
            [studentId]
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Fetch Student ICA error:", error);
        res.status(500).json({ success: false, message: "Database mapping failed." });
    }
});


// --- STUDENT: GET ATTENDANCE ---
app.get('/api/student/attendance', async (req, res) => {
    try {
        const studentId = req.query.studentId;
        if (!studentId) return res.status(400).json({ success: false, message: "Missing studentId param." });

        const [rows] = await db.query(
            `SELECT subjectCode, 
                    COUNT(*) as total, 
                    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as attended 
             FROM attendance 
             WHERE studentId = ? 
             GROUP BY subjectCode`, 
            [studentId]
        );

        const [subjectRows] = await db.query(`SELECT subjectCode, subjectName FROM subjects`);
        
        const finalData = rows.map(r => {
            const sub = subjectRows.find(s => s.subjectCode === r.subjectCode) || {subjectName: 'Unknown Subject'};
            return {
                code: r.subjectCode,
                name: sub.subjectName,
                type: 'Theory', // Default placeholder
                total: r.total,
                attended: r.attended
            };
        });

        res.json({ success: true, data: finalData });
    } catch (error) {
        console.error("Fetch Student Attendance error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// ==========================================
// 4. START SERVER
// ==========================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running securely on http://localhost:${PORT}`);
});