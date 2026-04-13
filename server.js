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
// 2. MONGOOSE SCHEMAS (The new "Tables")
// ==========================================
// This defines the structure of a User document
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, // e.g., 'N005' or 'ADM-001'
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
    sapId: { type: String } // Optional for admins
});

// Compile the schema into a Model (like compiling a class in Java/C++)
const User = mongoose.model('User', userSchema);

// ==========================================
// 3. DATABASE SEEDING (Test Accounts)
// ==========================================
// This checks if the DB is empty and injects test accounts if it is
const seedDatabase = async () => {
    try {
        const adminExists = await User.findOne({ userId: 'ADM-001' });
        if (!adminExists) {
            await User.create([
                { userId: 'ADM-001', name: 'System Admin', password: 'admin123', role: 'admin' },
                { userId: 'FAC-1029', name: 'Prof. MKA', password: 'prof123', role: 'teacher' },
                { userId: 'N005', name: 'Agrim Arya', password: 'student123', role: 'student', sapId: '70472400005' }
            ]);
            console.log('Test accounts successfully injected into MongoDB!');
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
        // Grab the ID and Password sent from the HTML form
        const { userId, password } = req.body;
        
        // Query MongoDB to find a matching document
        const user = await User.findOne({ userId: userId, password: password });
        
        if (user) {
            // Match found! Send back success and user details
            res.json({ 
                success: true, 
                userId: user.userId, 
                role: user.role, 
                name: user.name 
            });
        } else {
            // No match found
            res.status(401).json({ success: false, message: "Invalid ID or Password!" });
        }
    } catch (error) {
        console.error("Login error:", error);
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