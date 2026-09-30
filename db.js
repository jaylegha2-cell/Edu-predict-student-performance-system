const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let dbPromise = null;

const STUDENT_NAMES = [
  "Arjun Rathore", "Priya Sharma", "Rohan Verma", "Ananya Iyer", "Rahul Nair",
  "Sneha Patel", "Vikram Singh", "Neha Gupta", "Aditya Joshi", "Kavya Reddy",
  "Devansh Mehta", "Pooja Agarwal", "Siddharth Rao", "Riya Kapoor", "Ishaan Malhotra",
  "Tanvi Bose", "Kabir Deshmukh", "Anish Choudhury", "Divya Pillai", "Yash Saxena",
  "Aarav Kulkarni", "Meera Nambiar", "Varun Bhatia", "Shreya Das", "Kunal Banerjee",
  "Tarun Mishra", "Sanya Roy", "Gaurav Bhatt", "Aaliyah Khan", "Manish Pandey",
  "Nikhil Sen", "Roshni Dutta", "Akash Shinde", "Deepika Pillai", "Harsh Vardhan",
  "Simran Gill", "Karan Ahuja", "Nisha Sethi", "Pranav Mahajan", "Isha Mukherji",
  "Rishabh Jain", "Aditi Rastogi", "Vivek Menon", "Bhavna Trivedi", "Dhruv Sawant",
  "Tanya Saxena", "Saurabh Shukla", "Ritika Hegde", "Ayush Sengupta", "Shruti Murthy",
  "Abhishek Tyagi", "Bhakti Salunkhe", "Chirag Singhal", "Drishti Shah", "Eshan Khurana",
  "Farhan Ali", "Gitanjali Som", "Himanshu Rawat", "Indrani Ghosh", "Jatin Solanki",
  "Kirti Nagpal", "Lokesh Yaduvanshi", "Monika Bishnoi", "Naman Grover", "Ojaswini Kaushik",
  "Parth Samthaan", "Quasar Raza", "Radhika Merchant", "Samarth Jha", "Trisha Shetty",
  "Utkarsh Tripathi", "Vaishnavi Rane", "Wasim Siddiqui", "Yashaswini Rao", "Zaid Ansari",
  "Aman Deep", "Bhavya Chawla", "Chetan Bhagat", "Dhanush Kumar", "Ekta Kapoor",
  "Firoz Khan", "Geetika Mohan", "Hrithik Roshan", "Irfan Pathan", "Jahnavi Kapoor",
  "Kartik Aaryan", "Lavanya Tripathi", "Madhavan Nair", "Navya Naveli", "Omkar Kapoor",
  "Payal Rajput", "Raghava Lawrence", "Samantha Ruth", "Tiger Shroff", "Urfi Javed",
  "Vidyut Jammwal", "Yamuna Prasad", "Zubeen Garg", "Aishwarya Rai", "Boman Irani"
];

async function initializeDatabase() {
  const db = await open({
    filename: path.join(__dirname, 'edupredict.db'),
    driver: sqlite3.Database
  });

  await db.run('PRAGMA foreign_keys = ON;');
  await db.run('PRAGMA journal_mode = WAL;');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      roll_no TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      class_section TEXT DEFAULT 'CS-A',
      department TEXT DEFAULT 'Computer Science'
    );

    CREATE TABLE IF NOT EXISTS student_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER UNIQUE,
      study_hours REAL DEFAULT 5.0,
      sleep_hours REAL DEFAULT 7.0,
      screen_time REAL DEFAULT 3.0,
      attendance_pct REAL DEFAULT 85.0,
      assignment_pct REAL DEFAULT 80.0,
      practice_tests INTEGER DEFAULT 2,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subject_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      subject_name TEXT,
      score REAL,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      title TEXT,
      message TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);

  const countObj = await db.get('SELECT COUNT(*) as count FROM students');
  if (countObj.count === 0) {
    console.log('Seeding 100 students with varied metrics...');

    await db.run('BEGIN TRANSACTION');
    try {
      for (let i = 0; i < 100; i++) {
        const fullName = STUDENT_NAMES[i];
        const nameParts = fullName.toLowerCase().split(' ');
        const email = `${nameParts[0]}.${nameParts[1] || 'st'}@edu.in`;
        const roll_no = `CS2025${String(i + 1).padStart(3, '0')}`;
        const dept = i % 2 === 0 ? 'Computer Science' : 'Information Technology';

        const res = await db.run(
          `INSERT INTO students (name, roll_no, email, class_section, department) VALUES (?, ?, ?, 'CS-A', ?)`,
          [fullName, roll_no, email, dept]
        );

        const studentId = res.lastID;

        // Mathematical variance for diverse attendance, study hours, and risk groups
        const studyHours = parseFloat((2.0 + ((i * 7 + 13) % 75) / 10).toFixed(1));
        const attendancePct = parseFloat((55 + ((i * 13 + 7) % 44)).toFixed(1));
        const assignmentPct = parseFloat((50 + ((i * 17 + 11) % 49)).toFixed(1));
        const practiceTests = ((i * 3 + 2) % 6) + 1;
        const sleepHours = parseFloat((6.0 + (i % 3) * 0.5).toFixed(1));
        const screenTime = parseFloat((2.5 + (i % 4) * 0.8).toFixed(1));

        await db.run(
          `INSERT INTO student_metrics (student_id, study_hours, sleep_hours, screen_time, attendance_pct, assignment_pct, practice_tests)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [studentId, studyHours, sleepHours, screenTime, attendancePct, assignmentPct, practiceTests]
        );

        const subjects = ['Mathematics', 'Physics', 'Computer Science', 'Data Structures', 'Electronics'];
        for (let j = 0; j < subjects.length; j++) {
          const sub = subjects[j];
          const baseScore = 40 + ((i * 11 + j * 19) % 58);
          await db.run(
            `INSERT INTO subject_scores (student_id, subject_name, score) VALUES (?, ?, ?)`,
            [studentId, sub, Math.min(99, Math.max(42, baseScore))]
          );
        }

        // Add contextual notification per student
        const notifMsg = attendancePct < 75 
          ? 'Attendance critical alert: falling below university mandatory threshold.'
          : 'Monthly performance assessment report is available for review.';
        
        await db.run(
          `INSERT INTO notifications (student_id, title, message, is_read) VALUES (?, ?, ?, 0)`,
          [studentId, attendancePct < 75 ? 'Academic Warning' : 'System Notice', notifMsg]
        );
      }
      await db.run('COMMIT');
      console.log('Seeding complete! 100 students inserted with unique profiles.');
    } catch (err) {
      await db.run('ROLLBACK');
      console.error('Seeding failed:', err);
    }
  }

  return db;
}

function getDB() {
  if (!dbPromise) {
    dbPromise = initializeDatabase();
  }
  return dbPromise;
}

module.exports = getDB;