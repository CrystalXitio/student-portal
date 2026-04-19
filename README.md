# 🎓 Academic Student Portal

A full-stack, role-based academic management system built with **HTML/CSS/JavaScript** (frontend) and **Node.js + Express + MongoDB Atlas** (backend). Designed to streamline academic operations for students, teachers, and administrators in a single unified platform.

---

## ✨ Features

### 👨‍🎓 Student Portal
- View personal dashboard with enrolled subjects and schedule
- Track attendance records per subject
- View ICA marks and results
- Check fee payment status and due dates
- Access personal profile (with profile picture support)
- Submit helpdesk/support tickets
- View institution announcements

### 👨‍🏫 Teacher Portal
- Dedicated teacher dashboard
- Manage assigned classes and subjects
- Update student attendance and ICA marks
- Submit and track helpdesk requests
- Manage Letter of Recommendation (LOR) requests
- View and update personal profile

### 🛡️ Admin Portal
- Full administrative dashboard with live stats
  - Total students, teachers, courses, subjects, classes
  - Pending support tickets counter
- Manage students (add, view)
- Manage teachers
- Manage courses and subjects (add, view)
- Manage class schedules
- Handle fee records
- Post and manage announcements
- Review and respond to support tickets
- Admin profile management

### 🌗 General
- **Dark / Light mode** toggle with `localStorage` persistence
- Responsive sidebar navigation with animated drawer
- Role-based routing on login (`student` / `teacher` / `admin`)

---

## 🛠️ Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript   |
| Backend    | Node.js, Express.js               |
| Database   | MongoDB Atlas (via Mongoose ODM)  |
| Env Config | dotenv                            |
| Dev Tools  | CORS, nodemon (optional)          |

---

## 📁 Project Structure

```
student-portal/
├── index.html              # Login page (entry point)
├── server.js               # Express backend + Mongoose models + API routes
├── package.json
├── .env                    # ⚠️ Not committed — add your own (see setup)
├── .gitignore
│
├── assets/                 # All application pages + logo
│   ├── dashboard.html
│   ├── teacher-dashboard.html
│   ├── admin-dashboard.html
│   ├── profile.html
│   ├── attendance.html
│   ├── results.html
│   ├── fees.html
│   ├── subject.html
│   ├── helpdesk.html
│   ├── calendar.html
│   ├── teacher-classes.html
│   ├── teacher-subject.html
│   ├── teacher-helpdesk.html
│   ├── teacher-lor.html
│   ├── teacher-profile.html
│   ├── update-marks.html
│   ├── admin-*.html        # All admin pages
│   └── logo.png
│
├── css/
│   ├── style-index.css     # Login page styles
│   ├── style-dashboard.css # Main dashboard styles (shared)
│   └── style-subject.css   # Subject page styles
│
└── js/
    └── app.js              # Universal scripts (sidebar, theme, modals)
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) account

### 1. Clone the Repository
```bash
git clone https://github.com/CrystalXitio/student-portal.git
cd student-portal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
MONGO_URI=your_mongodb_atlas_connection_string_here
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

### 4. Start the Server
```bash
npm start
```
The server will start on **http://localhost:3000**.

### 5. Open the App
Open your browser and navigate to:
```
http://localhost:3000
```
> The `index.html` entry point handles login routing.

---

## 🔑 Default Test Credentials

These are seeded automatically on first server start:

| Role    | User ID   | Password     |
|---------|-----------|--------------|
| Admin   | `ADM-001` | `admin123`   |
| Teacher | `FAC-1029`| `prof123`    |
| Student | `N005`    | `student123` |

> ⚠️ These credentials are for development/demo only. Change them before deploying to production.

---

## 🗃️ Database Models

| Model        | Description                                      |
|--------------|--------------------------------------------------|
| `User`       | Students, teachers, and admins with role & profile |
| `Course`     | Academic programs (e.g., MBA Tech CE)            |
| `Subject`    | Subjects linked to courses and semesters         |
| `Class`      | Class schedules linking teachers and subjects    |
| `Enrollment` | Student–class links with attendance and marks    |
| `Fee`        | Fee records with status (Paid / Pending / Overdue) |
| `Announcement` | Institution-wide notices                       |
| `Ticket`     | Helpdesk support requests                        |

---

## 📌 API Endpoints

| Method | Endpoint                  | Description                   |
|--------|---------------------------|-------------------------------|
| POST   | `/api/login`              | Authenticate a user           |
| GET    | `/api/admin/stats`        | Get dashboard summary counts  |
| GET    | `/api/admin/courses`      | List all courses              |
| POST   | `/api/admin/courses`      | Add a new course              |
| GET    | `/api/admin/subjects`     | List all subjects             |
| POST   | `/api/admin/subjects`     | Add a new subject             |
| POST   | `/api/admin/add-student`  | Register a new student        |

---

## 📄 License

This project is for academic and educational purposes.

---

> Built with ❤️ by [CrystalXitio](https://github.com/CrystalXitio)
