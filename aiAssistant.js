
const KNOWLEDGE_BASE = {
  mathematics: {
    topics: {
      calculus: "Calculus focuses on limits, derivatives, integrals, and infinite series. Key focus areas: Chain Rule, Integration by Parts, Taylor Series, and Partial Derivatives.",
      linear_algebra: "Linear Algebra covers vector spaces, matrices, linear transformations, eigenvalues, and eigenvectors. Practice matrix inversion, Gaussian elimination, and diagonalizability.",
      differential_equations: "Covers first-order differential equations, linear second-order equations, Laplace transforms, and series solutions."
    },
    tips: "Solve at least 5-10 practice problems daily. Focus on deriving formulas rather than memorizing them."
  },
  computer_science: {
    topics: {
      data_structures: "Core structures include Arrays, Linked Lists, Stacks, Queues, Binary Trees, Heaps, Hash Tables, and Graphs.",
      algorithms: "Key algorithms include Sorting (QuickSort, MergeSort), Searching (Binary Search), Dynamic Programming, Greedy Algorithms, and Graph Traversals (BFS, DFS).",
      web_development: "Covers HTML5, CSS3, JavaScript (ES6+), Node.js, Express, REST APIs, database integration (SQL/NoSQL), and frontend frameworks like React."
    },
    tips: "Write and execute code daily. Trace algorithm execution manually on paper before coding."
  },
  physics: {
    topics: {
      electromagnetism: "Covers Coulomb's Law, Electric Fields, Gauss's Law, Magnetic Fields, Ampere's Law, and Faraday's Law.",
      wave_optics: "Focuses on Interference, Diffraction, Polarization, Huygens' Principle, and Young's Double Slit Experiment.",
      quantum_physics: "Covers Photoelectric Effect, De Broglie Wavelength, Wave-Particle Duality, and Schrödinger Equation."
    },
    tips: "Master vector analysis and draw free-body or field line diagrams for every physics problem."
  },
  electronics: {
    topics: {
      digital_logic: "Focuses on Boolean Algebra, Logic Gates, Karnaugh Maps (K-Maps), Multiplexers, Flip-Flops (JK, D, T), Counters, and Sequential State Machines.",
      circuit_analysis: "Covers Ohm's Law, Kirchhoff's Laws (KVL/KCL), Thevenin and Norton Theorems, and AC Transient Response."
    },
    tips: "Build truth tables and timing diagrams to verify logic state transitions step-by-step."
  }
};

const STUDY_TECHNIQUES = [
  {
    name: "Pomodoro Technique",
    rule: "Study intensely for 25 minutes, followed by a 5-minute break. After 4 cycles, take a 15-30 minute break.",
    bestFor: "Maintaining focus and preventing mental burnout during long study sessions."
  },
  {
    name: "Active Recall",
    rule: "Test yourself constantly using closed-book retrieval, flashcards, or practice questions instead of re-reading.",
    bestFor: "Long-term memory retention and exam preparation."
  },
  {
    name: "Spaced Repetition",
    rule: "Review material at increasing intervals (1 day, 3 days, 7 days, 14 days, 30 days).",
    bestFor: "Mastering foundational concepts, vocabulary, and mathematical formulas."
  },
  {
    name: "Feynman Technique",
    rule: "Explain a concept out loud in simple, plain language as if teaching a beginner. Identify gaps and revisit notes.",
    bestFor: "Deep understanding of complex engineering and theoretical topics."
  }
];

const INTENT_RULES = [
  // 1. GREETINGS & INTROS
  {
    patterns: [/^\b(hi|hello|hey|greetings|good morning|good afternoon|good evening|sup|yo)\b/i],
    handler: (ctx) => `Hello **${ctx.studentName}**! 👋 Welcome to EduPredict AI Assistant. I can analyze your predicted grades, review subject weaknesses, generate custom study plans, or answer academic questions across Computer Science, Math, Physics, and Electronics. How can I help you today?`
  },

  // 2. FAREWELLS
  {
    patterns: [/^\b(bye|goodbye|see you|farewell|exit|quit|take care|cya)\b/i],
    handler: (ctx) => `Goodbye **${ctx.studentName}**! 👋 Best of luck with your studies. Stay consistent, follow your review schedule, and check back anytime you need updated performance insights!`
  },

  // 3. GRATITUDE
  {
    patterns: [/^\b(thanks|thank you|thx|awesome|great|cool|perfect|appreciated)\b/i],
    handler: (ctx) => `You're very welcome, **${ctx.studentName}**! 🌟 Keep up the great work. Let me know if you need further help with your coursework or study planning.`
  },

  // 4. IDENTITY & CAPABILITIES
  {
    patterns: [/who are you/i, /what can you do/i, /your capabilities/i, /help me/i],
    handler: (ctx) => `I am your **EduPredict AI Assistant**, a specialized academic companion. I can:\n• **Predict Academic Scores & Grades** based on your study metrics.\n• **Identify Weak Subjects & Topics** that need intervention.\n• **Evaluate Attendance & Disqualification Risk**.\n• **Provide Subject Tutoring & Formulas** across CS, Math, Physics & Electronics.\n• **Recommend Study Schedules & Learning Methods** (Pomodoro, Active Recall).`
  },

  // 5. PREDICTION & SCORE INQUIRIES
  {
    patterns: [/predict/i, /score/i, /grade/i, /marks/i, /performance/i, /result/i],
    handler: (ctx) => `📊 **Academic Performance Summary:**\n• **Student Name:** **${ctx.studentName}** (${ctx.rollNo})\n• **Predicted Score:** **${ctx.prediction.predictedScore}%**\n• **Predicted Grade:** **${ctx.prediction.grade}**\n• **Risk Standing:** **${ctx.prediction.riskLevel}**\n• **Class Average Marks:** **${ctx.avgScore}%**\n• **Current Attendance:** **${ctx.attendancePct}%**`
  },

  // 6. WEAKNESS & FOCUS AREA ANALYSIS
  {
    patterns: [/weak/i, /improve/i, /focus/i, /struggl/i, /lowest/i, /bad score/i],
    handler: (ctx) => `⚠️ **Priority Focus Identification:**\nYour lowest scoring area is **${ctx.weakSubject}** with a score of **${ctx.weakScore}%**.\n\n💡 **Recommended Action Plan:**\n1. Dedicate 45 minutes daily to solving **${ctx.weakSubject}** practice questions.\n2. Review past exam papers and formula sheets.\n3. Form a peer study group or attend instructor office hours before the next midterm.`
  },

  // 7. STRENGTHS & TOP SUBJECTS
  {
    patterns: [/strong/i, /best/i, /highest/i, /good at/i, /top subject/i],
    handler: (ctx) => `🏆 **Top Subject Standing:**\nYour highest scoring subject is **${ctx.strongSubject}** with **${ctx.strongScore}%** proficiency!\n\nKeep maintaining this strong momentum while allocating remaining study buffers toward **${ctx.weakSubject}**.`
  },

  // 8. ATTENDANCE & RISK AUDIT
  {
    patterns: [/attend/i, /absence/i, /bunk/i, /shortage/i, /disqualif/i],
    handler: (ctx) => {
      const att = ctx.attendancePct;
      if (att < 75) {
        return `🚨 **CRITICAL ATTENDANCE WARNING:**\nYour current attendance is **${att}%**, which is below the mandatory **75%** threshold! You are at high risk of academic probation or exam disqualification. Attend all upcoming lectures without exception.`;
      } else {
        return `📅 **Attendance Status Audit:**\nYour attendance rate is **${att}%**, which is well above the safe academic margin (75%). Maintain this consistency to ensure internal assessment credits!`;
      }
    }
  },

  // 9. STUDY HOURS & TIME DISCIPLINE
  {
    patterns: [/study hour/i, /time/i, /schedule/i, /routine/i, /planner/i, /daily habit/i],
    handler: (ctx) => `⏰ **Study Discipline Audit:**\n• **Daily Self-Study:** **${ctx.studyHours} hrs/day**\n• **Weekly Practice Tests:** **${ctx.practiceTests} tests/week**\n• **Assignment Rate:** **${ctx.assignmentPct}%**\n\n🎯 **Optimization Tip:** ${ctx.studyHours < 5 ? `Increasing daily study time by 1.5 hours can increase your overall predicted score by up to 8%!` : `Your daily study dedication of ${ctx.studyHours}h/day is commendable. Maintain consistency as exams approach.`}`
  },

  // 10. STUDY TECHNIQUES & METHODOLOGY
  {
    patterns: [/technique/i, /method/i, /pomodoro/i, /active recall/i, /how to study/i, /tip/i],
    handler: () => {
      let response = `🧠 **Scientifically Proven Learning Strategies:**\n\n`;
      STUDY_TECHNIQUES.forEach((t, i) => {
        response += `**${i + 1}. ${t.name}**\n• **Rule:** ${t.rule}\n• **Best For:** ${t.bestFor}\n\n`;
      });
      return response.trim();
    }
  },

  // 11. SUBJECT-SPECIFIC TUTORING
  {
    patterns: [/math/i, /calculus/i, /linear algebra/i, /differential/i],
    handler: () => `📐 **Mathematics Guidance:**\n${KNOWLEDGE_BASE.mathematics.topics.calculus}\n\n${KNOWLEDGE_BASE.mathematics.topics.linear_algebra}\n\n💡 **Tip:** ${KNOWLEDGE_BASE.mathematics.tips}`
  },
  {
    patterns: [/computer science/i, /data structure/i, /algorithm/i, /coding/i, /programming/i, /web dev/i],
    handler: () => `💻 **Computer Science Guidance:**\n${KNOWLEDGE_BASE.computer_science.topics.data_structures}\n\n${KNOWLEDGE_BASE.computer_science.topics.algorithms}\n\n💡 **Tip:** ${KNOWLEDGE_BASE.computer_science.tips}`
  },
  {
    patterns: [/physics/i, /electromagnetism/i, /optics/i, /quantum/i],
    handler: () => `⚡ **Physics Guidance:**\n${KNOWLEDGE_BASE.physics.topics.electromagnetism}\n\n${KNOWLEDGE_BASE.physics.topics.wave_optics}\n\n💡 **Tip:** ${KNOWLEDGE_BASE.physics.tips}`
  },
  {
    patterns: [/electronics/i, /digital logic/i, /circuit/i, /flip flop/i, /k-map/i, /gate/i],
    handler: () => `🔌 **Digital Logic & Electronics Guidance:**\n${KNOWLEDGE_BASE.electronics.topics.digital_logic}\n\n${KNOWLEDGE_BASE.electronics.topics.circuit_analysis}\n\n💡 **Tip:** ${KNOWLEDGE_BASE.electronics.tips}`
  }
];

/**
 * Process incoming query and construct structured contextual AI response
 */
async function processAIQuery(db, studentId, message, getPredictionDataFn) {
  const targetId = studentId || 1;
  const userMsg = (message || '').trim();

  // Load student contextual data
  const student = await db.get('SELECT * FROM students WHERE id = ?', [targetId]);
  if (!student) {
    throw new Error('Student profile not found');
  }

  const metrics = await db.get('SELECT * FROM student_metrics WHERE student_id = ?', [targetId]);
  const scores = await db.all('SELECT subject_name, score FROM subject_scores WHERE student_id = ?', [targetId]);

  const prediction = await getPredictionDataFn(
    metrics ? metrics.study_hours : 5,
    metrics ? metrics.attendance_pct : 85,
    metrics ? metrics.assignment_pct : 80,
    metrics ? metrics.practice_tests : 2
  );

  const sortedScores = [...scores].sort((a, b) => a.score - b.score);
  const avgScore = scores.length > 0 
    ? Math.round(scores.reduce((acc, curr) => acc + curr.score, 0) / scores.length) 
    : 75;

  const context = {
    studentName: student.name,
    rollNo: student.roll_no,
    department: student.department || student.class_section || 'Computer Science',
    email: student.email,
    studyHours: metrics ? metrics.study_hours : 5,
    attendancePct: metrics ? metrics.attendance_pct : 85,
    assignmentPct: metrics ? metrics.assignment_pct : 80,
    practiceTests: metrics ? metrics.practice_tests : 2,
    avgScore,
    prediction,
    weakSubject: sortedScores[0] ? sortedScores[0].subject_name : 'Mathematics',
    weakScore: sortedScores[0] ? sortedScores[0].score : 60,
    strongSubject: sortedScores[sortedScores.length - 1] ? sortedScores[sortedScores.length - 1].subject_name : 'Computer Science',
    strongScore: sortedScores[sortedScores.length - 1] ? sortedScores[sortedScores.length - 1].score : 90
  };

  // Match message against intent rules
  for (const rule of INTENT_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(userMsg)) {
        return rule.handler(context);
      }
    }
  }

  // Fallback Mini-ChatGPT response
  return `Hello **${context.studentName}**! I parsed your query regarding "${userMsg}". Here is a summary of your academic standing:\n\n` +
         `• **Predicted Score:** **${context.prediction.predictedScore}%** (${context.prediction.grade})\n` +
         `• **Attendance Standing:** **${context.attendancePct}%**\n` +
         `• **Primary Focus Area:** **${context.weakSubject}** (${context.weakScore}%)\n\n` +
         `Feel free to ask me about "weak subjects", "study techniques", "predicted grade", or "attendance status"!`;
}

module.exports = {
  processAIQuery,
  KNOWLEDGE_BASE,
  STUDY_TECHNIQUES
};