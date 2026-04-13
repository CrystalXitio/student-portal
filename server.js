require('dotenv').config(); // Loads the secret MONGO_URI from your .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. DATABASE CONNECTION
// ==========================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch((err) => console.error('MongoDB connection error:', err));

// ==========================================
// 2. MONGOOSE SCHEMAS (The Blueprints)
// ==========================================

// --- USERS SCHEMA ---
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, // e.g., 'N005' or 'ADM-001'
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
    sapId: { type: String }, // Optional for admins
    profile: { // For the profile pages later
        email: String,
        phone: String,
        bloodGroup: String,
        address: String,
        profilePictureUrl: String
    }
});
const User = mongoose.model('User', userSchema);

// --- COURSES SCHEMA ---
const courseSchema = new mongoose.Schema({
    courseId: { type: String, required: true, unique: true }, // e.g., 'mbatech_ce'
    courseName: { type: String, required: true },
    durationYears: Number,
    totalCredits: Number
});
const Course = mongoose.model('Course', courseSchema);

// --- SUBJECTS SCHEMA ---
const subjectSchema = new mongoose.Schema({
    subjectCode: { type: String, required: true, unique: true },
    subjectName: { type: String, required: true },
    courseId: { type: String, required: true }, // Links to Course
    semester: Number
});
const Subject = mongoose.model('Subject', subjectSchema);

// --- CLASSES SCHEMA ---
const classSchema = new mongoose.Schema({
    classId: { type: String, required: true, unique: true },
    className: { type: String, required: true },
    subjectId: { type: String, required: true },
    teacherId: { type: String, required: true },
    type: { type: String, enum: ['Theory', 'Lab', 'Tutorial'] },
    schedule: [{
        dayOfWeek: String,
        startTime: String,
        endTime: String,
        roomNumber: String
    }]
});
const Class = mongoose.model('Class', classSchema);

// --- ENROLLMENTS & ACADEMIC RECORDS SCHEMA ---
const enrollmentSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    classId: { type: String, required: true },
    attendance: {
        totalLectures: { type: Number, default: 0 },
        attendedLectures: { type: Number, default: 0 }
    },
    marks: {
        ica1: { type: Number, default: 0 },
        ica2: { type: Number, default: 0 },
        endSem: { type: Number, default: 0 }
    }
});
const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

// --- FEES SCHEMA ---
const feeSchema = new mongoose.Schema({
    receiptNo: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    academicYear: String,
    amountDue: Number,
    amountPaid: { type: Number, default: 0 },
    status: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' },
    dueDate: Date
});
const Fee = mongoose.model('Fee', feeSchema);

// --- ANNOUNCEMENTS SCHEMA ---
const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    authorId: String,
    targetAudience: String,
    datePosted: { type: Date, default: Date.now },
    expiresOn: Date
});
const Announcement = mongoose.model('Announcement', announcementSchema);

// --- TICKETS SCHEMA ---
const ticketSchema = new mongoose.Schema({
    submitterId: { type: String, required: true },
    category: { type: String, enum: ['IT Issue', 'Administration', 'Academic'] },
    subject: String,
    message: String,
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
    responseNotes: String,
    dateSubmitted: { type: Date, default: Date.now }
});
const Ticket = mongoose.model('Ticket', ticketSchema);


// ==========================================
// 3. DATABASE SEEDING (Test Accounts & Base Data)
// ==========================================
const seedDatabase = async () => {
    try {
        // Seed Users
        const adminExists = await User.findOne({ userId: 'ADM-001' });
        if (!adminExists) {
            await User.create([
                { userId: 'ADM-001', name: 'System Admin', password: 'admin123', role: 'admin' },
                { userId: 'FAC-1029', name: 'Prof. MKA', password: 'prof123', role: 'teacher' },
                { userId: 'N005', name: 'Agrim Arya', password: 'student123', role: 'student', sapId: '70472400005' }
            ]);
            console.log('Test users successfully injected!');
        }

        // Seed Courses
        const courseExists = await Course.findOne({ courseId: 'mbatech_ce' });
        if (!courseExists) {
            await Course.create({
                courseId: 'mbatech_ce',
                courseName: 'MBA Tech in Computer Engineering',
                durationYears: 5,
                totalCredits: 220
            });
            console.log('Base courses successfully injected!');
        }

        // Seed Subjects
        const subjectExists = await Subject.findOne({ subjectCode: 'CE-DBMS-01' });
        if (!subjectExists) {
            await Subject.create([
                { subjectCode: 'CE-DBMS-01', subjectName: 'Database Management Systems', courseId: 'mbatech_ce', semester: 4 },
                { subjectCode: 'CE-DSA-02', subjectName: 'Data Structures and Algorithms', courseId: 'mbatech_ce', semester: 3 }
            ]);
            console.log('Base subjects successfully injected!');
        }
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};
seedDatabase();

// ==========================================
// 4. API ENDPOINTS
// ==========================================

// --- LOGIN SYSTEM ---
app.post('/api/login', async (req, res) => {
    try {
        const { userId, password } = req.body;
        const user = await User.findOne({ userId: userId, password: password });
        
        if (user) {
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
        const total_students = await User.countDocuments({ role: 'student' });
        const total_teachers = await User.countDocuments({ role: 'teacher' });
        const total_courses = await Course.countDocuments();
        const total_subjects = await Subject.countDocuments();
        const total_classes = await Class.countDocuments();
        const pending_tickets = await Ticket.countDocuments({ status: 'Open' });
        
        res.json({ 
            success: true, 
            data: { total_students, total_teachers, total_courses, total_subjects, total_classes, pending_tickets }
        });
    } catch (error) {
        console.error("Stats error:", error);
        res.status(500).json({ success: false });
    }
});

// --- ADMIN: ADD STUDENT ---
app.post('/api/admin/add-student', async (req, res) => {
    try {
        const { name, rollNo, sapId, courseId } = req.body;

        const existingUser = await User.findOne({ $or: [{ userId: rollNo }, { sapId: sapId }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Error: Roll No or SAP ID already exists!" });
        }

        const newStudent = new User({
            userId: rollNo,
            name: name,
            password: 'password123', // Standard default password
            sapId: sapId,
            role: 'student'
        });

        await newStudent.save();
        res.json({ success: true, message: "Student added successfully!" });

    } catch (error) {
        console.error("Add student error:", error);
        res.status(500).json({ success: false, message: "Server error occurred." });
    }
});

// --- ADMIN: GET ALL COURSES ---
app.get('/api/admin/courses', async (req, res) => {
    try {
        const courses = await Course.find({});
        res.json({ success: true, data: courses });
    } catch (error) {
        console.error("Fetch courses error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch courses from database." });
    }
});

// --- ADMIN: ADD NEW COURSE ---
app.post('/api/admin/courses', async (req, res) => {
    try {
        const { courseId, courseName, durationYears, totalCredits } = req.body;

        const existingCourse = await Course.findOne({ courseId: courseId });
        if (existingCourse) {
            return res.status(400).json({ success: false, message: "Error: Course ID already exists!" });
        }

        const newCourse = new Course({
            courseId: courseId,
            courseName: courseName,
            durationYears: durationYears,
            totalCredits: totalCredits
        });

        await newCourse.save();
        res.json({ success: true, message: "Course added successfully to the Cloud Database!" });

    } catch (error) {
        console.error("Add course error:", error);
        res.status(500).json({ success: false, message: "Server error occurred." });
    }
});

// --- ADMIN: GET ALL SUBJECTS ---
app.get('/api/admin/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find({});
        res.json({ success: true, data: subjects });
    } catch (error) {
        console.error("Fetch subjects error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch subjects from database." });
    }
});

// --- ADMIN: ADD NEW SUBJECT ---
app.post('/api/admin/subjects', async (req, res) => {
    try {
        const { subjectCode, subjectName, courseId, semester } = req.body;

        const existingSubject = await Subject.findOne({ subjectCode: subjectCode });
        if (existingSubject) {
            return res.status(400).json({ success: false, message: "Error: Subject Code already exists!" });
        }

        const newSubject = new Subject({
            subjectCode: subjectCode,
            subjectName: subjectName,
            courseId: courseId,
            semester: semester
        });

        await newSubject.save();
        res.json({ success: true, message: "Subject added successfully to the Cloud Database!" });

    } catch (error) {
        console.error("Add subject error:", error);
        res.status(500).json({ success: false, message: "Server error occurred." });
    }
});

// ==========================================
// 5. START SERVER
// ==========================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});