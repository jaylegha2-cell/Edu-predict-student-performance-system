require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const getDB = require('./db');
const { calculatePrediction, calculateGoalRequirements } = require('./predictionEngine');

const app = express();
const PORT = process.env.PORT || 5000;
const PYTHON_ML_URL = process.env.PYTHON_ML_URL || 'http://127.0.0.1:8000';

app.use(cors());
app.use(express.json());

// Auto-detect static frontend directory
const isFlatStructure = fs.existsSync(path.join(__dirname, 'index.html'));

const staticPath = isFlatStructure
  ? __dirname
  : path.join(__dirname, '../');

const indexPath = isFlatStructure
  ? path.join(__dirname, 'index.html')
  : path.join(__dirname, '../index.html');

app.use(express.static(staticPath));

app.get('/', (req, res) => {
  res.sendFile(indexPath);
});

/**
 * Fetch ML predictions from Python FastAPI server
 * with automatic fallback to JS predictionEngine.
 */
async function getPredictionData(
  studyHours,
  attendance,
  assignmentCompletion,
  practiceTests
) {
  try {
    const response = await fetch(`${PYTHON_ML_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        study_hours: Number(studyHours) || 0,
        attendance_pct: Number(attendance) || 0,
        assignment_pct: Number(assignmentCompletion) || 0,
        practice_tests: Number(practiceTests) || 0
      }),
      signal: AbortSignal.timeout(1500)
    });

    if (response.ok) {
      const mlResult = await response.json();

      return {
        predictedScore: mlResult.predicted_score,
        riskLevel: mlResult.risk_level,
        grade:
          mlResult.predicted_score >= 90
            ? 'A+'
            : mlResult.predicted_score >= 80
              ? 'A'
              : mlResult.predicted_score >= 70
                ? 'B'
                : mlResult.predicted_score >= 60
                  ? 'C'
                  : 'F',
        source: 'Python ML Model'
      };
    }
  } catch (err) {
    // Fallback to JS engine if Python service is offline
  }

  return calculatePrediction(
    Number(studyHours) || 0,
    Number(attendance) || 0,
    Number(assignmentCompletion) || 0,
    Number(practiceTests) || 0
  );
}

// -------------------------------------------------------------------
// AI ASSISTANT ENDPOINT
// -------------------------------------------------------------------

app.post('/api/ai/assistant', async (req, res) => {
  try {
    const { student_id, studentId, message } = req.body;

    const targetId = student_id || studentId || 1;
    const userMsg = (message || '').trim().toLowerCase();

    const db = await getDB();

    const student = await db.get(
      'SELECT * FROM students WHERE id = ?',
      [targetId]
    );

    const metrics = await db.get(
      'SELECT * FROM student_metrics WHERE student_id = ?',
      [targetId]
    );

    const scores = await db.all(
      'SELECT subject_name, score FROM subject_scores WHERE student_id = ?',
      [targetId]
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student profile not found'
      });
    }

    const prediction = await getPredictionData(
      metrics ? metrics.study_hours : 5,
      metrics ? metrics.attendance_pct : 85,
      metrics ? metrics.assignment_pct : 80,
      metrics ? metrics.practice_tests : 2
    );

    const sortedSubjects = [...scores].sort(
      (a, b) => a.score - b.score
    );

    const weakSubject = sortedSubjects[0]
      ? sortedSubjects[0].subject_name
      : 'Mathematics';

    const strongSubject =
      sortedSubjects.length > 0
        ? sortedSubjects[sortedSubjects.length - 1].subject_name
        : 'Computer Science';

    const avgScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((a, c) => a + c.score, 0) / scores.length
          )
        : 75;

    let reply = '';

    // 1. Compliments
    if (
      /(good|nice|awesome|great|cool|love|helping|helpful|amazing|best|thank|thanks|apprec|smart|super|brilliant)/i.test(
        userMsg
      ) &&
      !userMsg.includes('predict') &&
      !userMsg.includes('grade') &&
      !userMsg.includes('score')
    ) {
      reply = `Thank you so much, **${student.name}**! 😊 I'm really happy to help. You're doing a fantastic job with your preparation. Let me know whenever you want to analyze scores, review subjects, or organize your study routine!`;
    }

    // 2. Greetings
    else if (
      /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|sup|yo|namaste)\b/i.test(
        userMsg
      )
    ) {
      reply = `Hello **${student.name}**! 👋 How are your studies going today? Ask me anything about your predicted grades, weak subjects, attendance, or study techniques!`;
    }

    // 3. Farewells
    else if (
      /^(bye|goodbye|see you|farewell|exit|quit|take care|cya|night|goodnight)\b/i.test(
        userMsg
      )
    ) {
      reply = `Goodbye **${student.name}**! 👋 Work hard, stay consistent, and feel free to reach out whenever you need academic assistance!`;
    }

    // 4. Casual conversation
    else if (
      /(how are you|how are u|what's up|how's it going|how do you do|who are you|who r u)/i.test(
        userMsg
      )
    ) {
      reply = `I'm doing great, **${student.name}**! I'm your EduPredict AI assistant. I'm here to help track your academic performance, offer study strategies, and keep you on target for your target grades!`;
    }

    // 5. Exam stress
    else if (
      /(stress|anxious|scared|nervous|tired|difficult|hard|cannot study|can't focus|exam tomorrow)/i.test(
        userMsg
      )
    ) {
      reply = `Take a deep breath, **${student.name}**! 💙 Exam preparation can be challenging, but breaking your study time into 25-minute Pomodoro blocks with short breaks works wonders. You have a current predicted score of **${prediction.predictedScore}%**—stay consistent and focus on one topic at a time!`;
    }

    // 6. Predictions
    else if (
      userMsg.includes('predict') ||
      userMsg.includes('score') ||
      userMsg.includes('grade') ||
      userMsg.includes('marks') ||
      userMsg.includes('percentage')
    ) {
      reply = `📊 **Academic Projection for ${student.name}:**
• **Predicted Score:** **${prediction.predictedScore}%**
• **Predicted Grade:** **${prediction.grade}**
• **Risk Standing:** **${prediction.riskLevel}**
• **Current Class Avg:** **${avgScore}%**`;
    }

    // 7. Weak subjects
    else if (
      userMsg.includes('weak') ||
      userMsg.includes('improve') ||
      userMsg.includes('focus') ||
      userMsg.includes('struggling') ||
      userMsg.includes('low score')
    ) {
      reply = `⚠️ **Target Focus Area:**
Your current lowest-performing subject is **${weakSubject}** with **${sortedSubjects[0]?.score || 60}%**.

💡 **Action Plan:**
1. Allocate 45 mins daily to **${weakSubject}** practice questions.
2. Review past exam papers and formula sheets.
3. Join peer study sessions twice weekly.`;
    }

    // 8. Strengths
    else if (
      userMsg.includes('strong') ||
      userMsg.includes('best') ||
      userMsg.includes('highest') ||
      userMsg.includes('top subject')
    ) {
      reply = `🏆 **Top Subject Standing:**
Your highest score is in **${strongSubject}** at **${sortedSubjects[sortedSubjects.length - 1]?.score || 90}%**! Great work maintaining high proficiency here.`;
    }

    // 9. Attendance
    else if (
      userMsg.includes('attend') ||
      userMsg.includes('absence') ||
      userMsg.includes('class') ||
      userMsg.includes('bunk')
    ) {
      const att = metrics?.attendance_pct || 85;

      reply = `📅 **Attendance Status:**
• **Current Rate:** **${att}%**
${
  att < 75
    ? '⚠️ **Warning:** Attendance is below the mandatory 75% threshold. Please attend upcoming lectures to remain eligible for exams.'
    : '✅ Your attendance is in safe standing!'
}`;
    }

    // 10. Study hours
    else if (
      userMsg.includes('study') ||
      userMsg.includes('hours') ||
      userMsg.includes('schedule') ||
      userMsg.includes('routine') ||
      userMsg.includes('technique') ||
      userMsg.includes('tip')
    ) {
      const hours = metrics?.study_hours || 5;

      reply = `⏰ **Study Discipline Audit:**
• **Daily Self-Study:** **${hours} hrs/day**
• **Practice Tests:** **${metrics?.practice_tests || 2}/week**

🎯 **Recommendation:** ${
        hours < 5.5
          ? 'Adding 1 hour of daily study time can boost your predicted score by up to 6.5%!'
          : 'Your daily study discipline is optimal. Maintain consistency!'
      }`;
    }

    // 11. Subject help
    else if (
      userMsg.includes('math') ||
      userMsg.includes('calculus') ||
      userMsg.includes('physics') ||
      userMsg.includes('code') ||
      userMsg.includes('electronics')
    ) {
      reply = `📚 **Subject Support:** Focusing on core principles and solving 5-10 practical problems daily is the fastest way to boost your understanding in **${userMsg.toUpperCase()}**. Let me know if you want targeted revision advice!`;
    }

    // 12. Fallback
    else {
      reply = `Got it, **${student.name}**! I'm here whenever you want to discuss your coursework, check grade projections, or review study schedules. What would you like to work on next?`;
    }

    res.json({
      success: true,
      reply,
      data: {
        reply
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// -------------------------------------------------------------------
// LIVE SEARCH API
// -------------------------------------------------------------------

app.get('/api/students/search', async (req, res) => {
  try {
    const query = req.query.q || '';

    if (!query.trim()) {
      return res.json({
        success: true,
        data: []
      });
    }

    const db = await getDB();

    const students = await db.all(
      `SELECT s.id, s.name, s.roll_no, s.email,
              s.class_section, s.department
       FROM students s
       WHERE s.name LIKE ?
          OR s.roll_no LIKE ?
          OR s.email LIKE ?
       LIMIT 10`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );

    res.json({
      success: true,
      data: students
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// -------------------------------------------------------------------
// GET ALL STUDENTS
// -------------------------------------------------------------------

app.get('/api/students', async (req, res) => {
  try {
    const db = await getDB();

    const students = await db.all(`
      SELECT s.id,
             s.name,
             s.roll_no,
             s.email,
             s.class_section,
             s.department,
             m.attendance_pct,
             m.study_hours,
             m.assignment_pct,
             m.practice_tests
      FROM students s
      LEFT JOIN student_metrics m
        ON s.id = m.student_id
      ORDER BY s.id ASC
    `);

    const formatted = await Promise.all(
      students.map(async (st) => {
        const pred = await getPredictionData(
          st.study_hours || 5,
          st.attendance_pct || 80,
          st.assignment_pct || 75,
          st.practice_tests || 2
        );

        return {
          id: st.id,
          name: st.name,
          rollNo: st.roll_no,
          email: st.email,
          classSection: st.class_section,
          department: st.department || 'Computer Science',
          attendance: st.attendance_pct || 0,
          studyHours: st.study_hours || 0,
          assignmentPct: st.assignment_pct || 0,
          predictedScore: pred.predictedScore,
          grade: pred.grade,
          risk: pred.riskLevel
        };
      })
    );

    res.json({
      success: true,
      data: formatted
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// -------------------------------------------------------------------
// SINGLE STUDENT DASHBOARD
// -------------------------------------------------------------------

app.get('/api/students/:id/dashboard', async (req, res) => {
  try {
    const studentId = req.params.id;

    const db = await getDB();

    const student = await db.get(
      'SELECT * FROM students WHERE id = ?',
      [studentId]
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    const metrics = await db.get(
      'SELECT * FROM student_metrics WHERE student_id = ?',
      [studentId]
    );

    const scores = await db.all(
      'SELECT subject_name, score FROM subject_scores WHERE student_id = ?',
      [studentId]
    );

    // Personalized notifications
    const dynamicNotifications = [
      {
        id: 1,
        title: '⚠️ Attendance Alert',
        message: `Attention ${student.name}, your attendance is dropping in core subjects. Please ensure you attend the next 3 lectures.`,
        is_read: 0
      },
      {
        id: 2,
        title: '📈 Score Improved',
        message: `Great work, ${student.name}! Your predicted score increased by 2.4% based on your recent practice tests.`,
        is_read: 0
      },
      {
        id: 3,
        title: '📝 Pending Assignment',
        message: `Reminder: You have a pending Lab Report due this Friday at 11:59 PM.`,
        is_read: 0
      },
      {
        id: 4,
        title: '🎯 Goal Track Reminder',
        message: `You need 2 more practice tests this week to stay on track for your target grade.`,
        is_read: 0
      },
      {
        id: 5,
        title: '📚 Syllabus Update',
        message: `New study materials and formula sheets have been uploaded to your portal.`,
        is_read: 1
      },
      {
        id: 6,
        title: '🗓️ Faculty Review',
        message: `Your faculty mentor has requested a brief 1-on-1 review session next week.`,
        is_read: 1
      }
    ];

    const avgScore =
      scores.length > 0
        ? Math.round(
            (scores.reduce(
              (acc, curr) => acc + curr.score,
              0
            ) /
              scores.length) *
              10
          ) / 10
        : 0;

    const prediction = await getPredictionData(
      metrics ? metrics.study_hours : 5,
      metrics ? metrics.attendance_pct : 85,
      metrics ? metrics.assignment_pct : 80,
      metrics ? metrics.practice_tests : 2
    );

    const sortedSubjects = [...scores].sort(
      (a, b) => a.score - b.score
    );

    const weakSubject1 = sortedSubjects[0]
      ? sortedSubjects[0].subject_name
      : 'Mathematics';

    const weakSubject2 = sortedSubjects[1]
      ? sortedSubjects[1].subject_name
      : 'Physics';

    const weakSubject3 = sortedSubjects[2]
      ? sortedSubjects[2].subject_name
      : 'Computer Science';

    const focusAreas = sortedSubjects
      .slice(0, 3)
      .map((sub, idx) => ({
        subject: sub.subject_name,
        score: sub.score,

        subtopic:
          sub.subject_name === 'Chemistry'
            ? 'Physical Chemistry & Electrochemistry'
            : sub.subject_name === 'Mathematics'
              ? 'Calculus & Linear Algebra'
              : sub.subject_name === 'Physics'
                ? 'Electromagnetism & Wave Optics'
                : sub.subject_name === 'Electronics'
                  ? 'Digital Logic & Circuit Analysis'
                  : sub.subject_name === 'English'
                    ? 'Technical Writing & Communication'
                    : 'Data Structures & Algorithm Complexity',

        sessions: `${3 - idx} sessions, ${(3 - idx) * 2}h total`,

        priority:
          idx === 0
            ? 'Urgent'
            : idx === 1
              ? 'High'
              : 'Medium'
      }));

    const planner = [
      {
        day: 'Monday',
        time: '05:00 PM - 07:00 PM',
        subject: weakSubject1,
        topic: 'Core Concept Revision & Problem Solving',
        tag: 'High Priority'
      },
      {
        day: 'Tuesday',
        time: '06:00 PM - 07:30 PM',
        subject: weakSubject2,
        topic: 'Theory Practice & Assignment Review',
        tag: 'Urgent'
      },
      {
        day: 'Wednesday',
        time: '05:30 PM - 07:00 PM',
        subject: weakSubject3,
        topic: 'Lab Algorithms & Coding Exercises',
        tag: 'Regular'
      },
      {
        day: 'Thursday',
        time: '06:00 PM - 08:00 PM',
        subject: weakSubject1,
        topic: 'Mock Practice Test & Error Analysis',
        tag: 'High Priority'
      },
      {
        day: 'Friday',
        time: '05:00 PM - 06:30 PM',
        subject: weakSubject2,
        topic: 'Formula Sheets & Past Papers Review',
        tag: 'Urgent'
      },
      {
        day: 'Saturday',
        time: '10:00 AM - 12:30 PM',
        subject: 'General Revision',
        topic: 'Comprehensive Weekly Review & Quiz',
        tag: 'Assessment'
      }
    ];

    const riskBreakdown = {
      attendanceImpact: metrics
        ? metrics.attendance_pct
        : 0,

      assignmentCompletion: metrics
        ? metrics.assignment_pct
        : 0,

      testPerformance: avgScore,

      studyConsistency: metrics
        ? Math.min(
            100,
            Math.round((metrics.study_hours / 10) * 100)
          )
        : 0
    };

    res.json({
      success: true,

      data: {
        profile: student,

        metrics: metrics
          ? {
              studyHours: metrics.study_hours,
              sleepHours: metrics.sleep_hours,
              screenTime: metrics.screen_time,
              attendancePct: metrics.attendance_pct,
              assignmentPct: metrics.assignment_pct,
              practiceTests: metrics.practice_tests
            }
          : {},

        kpis: {
          predictedScore: prediction.predictedScore,
          predictedGrade: prediction.grade,
          overallPerformance: avgScore,
          attendance: metrics
            ? metrics.attendance_pct
            : 0,
          riskLevel: prediction.riskLevel
        },

        riskBreakdown,

        focusAreas,

        subjectScores: scores,

        notifications: dynamicNotifications,

        planner
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// -------------------------------------------------------------------
// UPDATE PROFILE
// -------------------------------------------------------------------

app.put('/api/students/:id', async (req, res) => {
  try {
    const studentId = req.params.id;

    const {
      name,
      rollNo,
      department,
      email
    } = req.body;

    if (!name || !rollNo || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name, Roll No, and Email are required fields'
      });
    }

    const db = await getDB();

    const result = await db.run(
      `UPDATE students
       SET name = ?,
           roll_no = ?,
           department = ?,
           email = ?
       WHERE id = ?`,
      [
        name,
        rollNo,
        department || 'Computer Science',
        email,
        studentId
      ]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Student ID not found'
      });
    }

    const updatedProfile = await db.get(
      'SELECT * FROM students WHERE id = ?',
      [studentId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// -------------------------------------------------------------------
// MARK NOTIFICATIONS AS READ
// -------------------------------------------------------------------

app.post(
  '/api/students/:id/notifications/read',
  async (req, res) => {
    try {
      res.json({
        success: true
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
);

// -------------------------------------------------------------------
// WHAT-IF PREDICTION
// -------------------------------------------------------------------

app.post('/api/predict/what-if', async (req, res) => {
  try {
    const {
      studyHours,
      attendance,
      assignmentCompletion,
      practiceTests
    } = req.body;

    const result = await getPredictionData(
      studyHours,
      attendance,
      assignmentCompletion,
      practiceTests
    );

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// -------------------------------------------------------------------
// TARGET GOAL CALCULATOR
// -------------------------------------------------------------------

app.post('/api/predict/goal', async (req, res) => {
  try {
    const {
      studentId,
      targetScore,
      currentMetrics
    } = req.body;

    const db = await getDB();

    let metrics;

    if (currentMetrics) {
      metrics = {
        study_hours:
          Number(currentMetrics.studyHours) || 0,

        attendance_pct:
          Number(currentMetrics.attendance) || 0,

        assignment_pct:
          Number(currentMetrics.assignmentCompletion) || 0,

        practice_tests:
          Number(currentMetrics.practiceTests) || 0
      };
    } else if (studentId) {
      metrics = await db.get(
        'SELECT * FROM student_metrics WHERE student_id = ?',
        [studentId]
      );
    }

    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'Metrics unavailable'
      });
    }

    const requirement = calculateGoalRequirements(
      metrics,
      Number(targetScore) || 75
    );

    res.json({
      success: true,
      data: requirement
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// -------------------------------------------------------------------
// START EXPRESS SERVER
// -------------------------------------------------------------------

getDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `🚀 Server running on http://localhost:${PORT}`
      );
    });
  })
  .catch(err => {
    console.error(
      '❌ Failed to initialize database on startup:',
      err
    );
  });