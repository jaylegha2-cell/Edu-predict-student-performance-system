const API_BASE = 'http://localhost:5000/api';
let currentStudentId = 1;
let trendChartInstance = null;
let radarChartInstance = null;
let monthlyChartInstance = null;

// ================================================================
// COMMON COLLEGE STUDENT NAMES
// Only the displayed student names are changed.
// Student IDs, roll numbers, scores, attendance and other data remain intact.
// ================================================================
const COMMON_STUDENT_NAMES = [
  "Snehal Patil",
  "Rahul Jadhav",
  "Priya Shinde",
  "Akash Pawar",
  "Neha Deshmukh",
  "Rohit More",
  "Pooja Chavan",
  "Sagar Kulkarni",
  "Riya Patil",
  "Omkar Shinde",
  "Tanmay Joshi",
  "Sakshi Pawar",
  "Aniket Jadhav",
  "Komal More",
  "Atharva Patil",
  "Vaishnavi Shinde",
  "Kunal Chavan",
  "Tejas Pawar",
  "Shreya Deshmukh",
  "Aditya More",
  "Pratik Patil",
  "Aarti Jadhav",
  "Nikhil Shinde",
  "Manasi Pawar",
  "Yash More",
  "Rutuja Chavan",
  "Harsh Kulkarni",
  "Kavya Patil",
  "Vivek Jadhav",
  "Mrunal Shinde",
  "Soham Pawar",
  "Anjali More",
  "Abhishek Chavan",
  "Sneha Kulkarni",
  "Rohan Patil",
  "Pallavi Jadhav",
  "Akshay Shinde",
  "Swati Pawar",
  "Chetan More",
  "Mitali Chavan"
];

function applyCommonStudentNames(students) {
  if (!Array.isArray(students)) return students;

  return students.map((student, index) => ({
    ...student,
    name: COMMON_STUDENT_NAMES[index % COMMON_STUDENT_NAMES.length]
  }));
}


document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  setupNavigation();
  setupDarkMode();
  setupNotifications();
  setupStudentSelector();
  setupPredictionSliders();
  setupGoalPredictor();
  setupLiveSearch();
  setupReportGenerator();
  setupSettingsForm();
  setupAIChatWidget();

  await loadStudentDashboard(currentStudentId);
  await loadTeacherRoster();
  await renderReportsTable();
}

function formatPercentage(value) {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  const cleanVal = String(value).replace(/%+/g, '').trim();
  return `${cleanVal}%`;
}

function getInitials(name) {
  if (!name) return 'ST';

  const parts = name.trim().split(' ');

  if (parts.length >= 2) {
    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }

  return parts[0].substring(0, 2).toUpperCase();
}


// ================================================================
// STUDENT DASHBOARD
// ================================================================

async function loadStudentDashboard(studentId) {
  try {
    const res =
      await fetch(`${API_BASE}/students/${studentId}/dashboard`);

    const result = await res.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    const {
      profile,
      metrics,
      kpis,
      riskBreakdown,
      focusAreas,
      subjectScores,
      notifications,
      planner
    } = result.data;


    // ------------------------------------------------------------
    // PROFILE
    // ------------------------------------------------------------

    const initials = getInitials(profile.name);

    document
      .querySelectorAll('.profile-avatar, .topbar-avatar')
      .forEach(el => {
        el.textContent = initials;
      });

    document
      .querySelectorAll('.profile-name')
      .forEach(el => {
        el.textContent = profile.name;
      });

    document
      .querySelectorAll('.profile-role')
      .forEach(
        el =>
          el.textContent =
            `Student • ${
              profile.department ||
              profile.class_section ||
              'CS-A'
            }`
      );


    const formInputs =
      document.querySelectorAll(
        '#page-settings .form-input'
      );

    const nameInput =
      document.getElementById('setting-name') ||
      formInputs[0];

    const rollInput =
      document.getElementById('setting-roll') ||
      formInputs[1];

    const deptInput =
      document.getElementById('setting-dept') ||
      formInputs[2];

    const emailInput =
      document.getElementById('setting-email') ||
      formInputs[3];


    if (nameInput) {
      nameInput.value = profile.name || '';
    }

    if (rollInput) {
      rollInput.value = profile.roll_no || '';
    }

    if (deptInput) {
      deptInput.value =
        profile.department ||
        profile.class_section ||
        'Computer Science';
    }

    if (emailInput) {
      emailInput.value = profile.email || '';
    }


    const studentSelect =
      document.getElementById('student-select');

    if (studentSelect) {
      studentSelect.value = profile.id;
    }


    // ------------------------------------------------------------
    // KPI CARDS
    // ------------------------------------------------------------

    const kpiPred =
      document.getElementById('kpi-predicted');

    const kpiGrade =
      document.getElementById('kpi-grade');

    const kpiPerf =
      document.getElementById('kpi-performance');

    const kpiAtt =
      document.getElementById('kpi-attendance');


    if (kpiPred) {
      kpiPred.textContent =
        formatPercentage(kpis.predictedScore);
    }

    if (kpiGrade) {
      kpiGrade.textContent =
        kpis.predictedGrade;

      kpiGrade.className =
        `kpi-value grade-badge grade-${
          kpis.predictedGrade
            .charAt(0)
            .toLowerCase()
        }`;
    }

    if (kpiPerf) {
      kpiPerf.textContent =
        formatPercentage(kpis.overallPerformance);
    }

    if (kpiAtt) {
      kpiAtt.textContent =
        formatPercentage(kpis.attendance);
    }


    // ------------------------------------------------------------
    // KPI GAUGE
    // ------------------------------------------------------------

    const ringCircle =
      document.getElementById(
        'kpi-ring-circle'
      );

    const ringText =
      document.getElementById(
        'kpi-ring-text'
      );


    if (ringCircle && ringText) {
      const offset =
        150.8 -
        (150.8 * kpis.predictedScore) /
          100;

      ringCircle.style.strokeDashoffset =
        offset;

      ringText.textContent =
        formatPercentage(
          Math.round(kpis.predictedScore)
        );
    }


    // ------------------------------------------------------------
    // RISK
    // ------------------------------------------------------------

    const riskBadge =
      document.getElementById('risk-badge');

    const riskIndicator =
      document.getElementById(
        'risk-indicator'
      );


    if (riskBadge && riskIndicator) {

      riskBadge.textContent =
        kpis.riskLevel;

      if (kpis.riskLevel === 'High Risk') {

        riskBadge.className =
          'badge badge-red';

        riskIndicator.style.left =
          '80%';

      } else if (
        kpis.riskLevel === 'Medium Risk'
      ) {

        riskBadge.className =
          'badge badge-orange';

        riskIndicator.style.left =
          '50%';

      } else {

        riskBadge.className =
          'badge badge-green';

        riskIndicator.style.left =
          '25%';
      }
    }


    // ------------------------------------------------------------
    // DYNAMIC UI
    // ------------------------------------------------------------

    renderRiskAssessmentBars(
      riskBreakdown,
      kpis.riskLevel
    );

    renderSubjectRadarChart(
      subjectScores
    );

    renderMonthlyBreakdownChart(
      subjectScores,
      profile.id
    );

    renderSubjectList(
      subjectScores
    );

    renderFocusAreas(
      focusAreas
    );

    renderDynamicStudyTips(
      profile.name,
      focusAreas,
      metrics
    );

    renderWeeklyPlanner(
      planner
    );

    renderTrendChart(
      kpis.predictedScore,
      kpis.overallPerformance
    );


    // ------------------------------------------------------------
    // NOTIFICATIONS
    // ------------------------------------------------------------

    const notificationData =
      Array.isArray(notifications) &&
      notifications.length > 0
        ? notifications
        : createFallbackNotifications(
            profile.name,
            kpis
          );

    renderNotificationsList(
      notificationData
    );


    renderStudyHabits(metrics);
    renderAttendance(metrics);

    renderAIRecommendations(
      focusAreas,
      metrics,
      kpis
    );


    // ------------------------------------------------------------
    // SYNC SLIDERS
    // ------------------------------------------------------------

    if (metrics) {

      const sSlider =
        document.getElementById(
          'study-slider'
        ) ||
        document.getElementById(
          'studyHours'
        );

      const aSlider =
        document.getElementById(
          'attend-slider'
        ) ||
        document.getElementById(
          'attendanceRate'
        );

      const asSlider =
        document.getElementById(
          'assign-slider'
        ) ||
        document.getElementById(
          'assignmentCompletion'
        );

      const tSlider =
        document.getElementById(
          'test-slider'
        ) ||
        document.getElementById(
          'practiceTests'
        );


      const sVal =
        document.getElementById(
          'study-val'
        );

      const aVal =
        document.getElementById(
          'attend-val'
        );

      const asVal =
        document.getElementById(
          'assign-val'
        );

      const tVal =
        document.getElementById(
          'test-val'
        );


      if (sSlider) {
        sSlider.value =
          metrics.studyHours;
      }

      if (aSlider) {
        aSlider.value =
          metrics.attendancePct;
      }

      if (asSlider) {
        asSlider.value =
          metrics.assignmentPct;
      }

      if (tSlider) {
        tSlider.value =
          metrics.practiceTests;
      }


      if (sVal) {
        sVal.textContent =
          `${metrics.studyHours}h`;
      }

      if (aVal) {
        aVal.textContent =
          formatPercentage(
            metrics.attendancePct
          );
      }

      if (asVal) {
        asVal.textContent =
          formatPercentage(
            metrics.assignmentPct
          );
      }

      if (tVal) {
        tVal.textContent =
          metrics.practiceTests;
      }


      updatePredictionView(
        metrics.studyHours,
        metrics.attendancePct,
        metrics.assignmentPct,
        metrics.practiceTests
      );
    }

  } catch (err) {

    console.error(
      'Error hydrating dashboard:',
      err
    );
  }
}


// ================================================================
// AI ASSISTANT
// ================================================================

function setupAIChatWidget() {

  const chatToggle =
    document.getElementById(
      'ai-chat-toggle'
    );

  const chatModal =
    document.getElementById(
      'ai-chat-modal'
    );

  const chatClose =
    document.getElementById(
      'chat-close-btn'
    );

  const chatInput =
    document.getElementById(
      'chat-input'
    );

  const chatSend =
    document.getElementById(
      'chat-send-btn'
    );

  const chatBody =
    document.getElementById(
      'chat-body'
    );


  if (!chatToggle || !chatModal) {
    return;
  }


  chatToggle.addEventListener(
    'click',
    () => {

      chatModal.classList.toggle(
        'hidden'
      );

      if (
        !chatModal.classList.contains(
          'hidden'
        ) &&
        chatInput
      ) {
        chatInput.focus();
      }
    }
  );


  chatClose?.addEventListener(
    'click',
    () => {
      chatModal.classList.add(
        'hidden'
      );
    }
  );


  async function handleSendMessage(
    queryText
  ) {

    const message =
      (
        queryText ||
        chatInput?.value ||
        ''
      ).trim();

    if (!message) {
      return;
    }


    appendMessage(
      message,
      'user'
    );


    if (chatInput) {
      chatInput.value = '';
    }


    const typingId =
      appendMessage(
        'Analyzing performance metrics...',
        'bot'
      );


    try {

      const res =
        await fetch(
          `${API_BASE}/ai/assistant`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json'
            },
            body: JSON.stringify({
              student_id:
                currentStudentId,
              message
            })
          }
        );


      const data =
        await res.json();


      const typingEl =
        document.getElementById(
          typingId
        );


      if (typingEl) {
        typingEl.remove();
      }


      if (data.reply) {

        appendMessage(
          data.reply,
          'bot'
        );

      } else if (
        data.success &&
        data.data?.reply
      ) {

        appendMessage(
          data.data.reply,
          'bot'
        );

      } else {

        appendMessage(
          data.error ||
          'I could not process that query right now.',
          'bot'
        );
      }

    } catch (err) {

      console.error(
        'AI Assistant Error:',
        err
      );


      const typingEl =
        document.getElementById(
          typingId
        );


      if (typingEl) {
        typingEl.remove();
      }


      appendMessage(
        'Unable to connect to EduPredict AI service.',
        'bot'
      );
    }
  }


  function appendMessage(
    text,
    sender
  ) {

    if (!chatBody) {
      return;
    }


    const msgDiv =
      document.createElement(
        'div'
      );


    const id =
      'msg-' +
      Date.now() +
      '-' +
      Math.floor(
        Math.random() * 1000
      );


    msgDiv.id = id;

    msgDiv.className =
      `chat-msg ${sender}`;


    let formattedText =
      text
        .replace(
          /&/g,
          '&amp;'
        )
        .replace(
          /</g,
          '&lt;'
        )
        .replace(
          />/g,
          '&gt;'
        )
        .replace(
          /\*\*(.*?)\*\*/g,
          '<strong>$1</strong>'
        )
        .replace(
          /\n/g,
          '<br>'
        );


    msgDiv.innerHTML =
      formattedText;


    chatBody.appendChild(
      msgDiv
    );


    chatBody.scrollTop =
      chatBody.scrollHeight;


    return id;
  }


  chatSend?.addEventListener(
    'click',
    () => handleSendMessage()
  );


  chatInput?.addEventListener(
    'keypress',
    e => {

      if (e.key === 'Enter') {

        e.preventDefault();

        handleSendMessage();
      }
    }
  );


  document
    .querySelectorAll(
      '#quick-actions button, .quick-actions button'
    )
    .forEach(btn => {

      btn.addEventListener(
        'click',
        e => {

          const query =
            e.currentTarget
              .getAttribute(
                'data-query'
              );

          if (query) {
            handleSendMessage(
              query
            );
          }
        }
      );
    });
}


// ================================================================
// DYNAMIC UI COMPONENTS
// ================================================================

function renderStudyHabits(
  metrics
) {

  if (!metrics) {
    return;
  }


  const studyHours =
    metrics.studyHours || 5.2;

  const sleepHours =
    metrics.sleepHours || 6.8;

  const screenTime =
    metrics.screenTime || 3.4;

  const assignmentPct =
    metrics.assignmentPct || 80;


  const studyVal =
    document.getElementById(
      'habit-study-val'
    );

  const sleepVal =
    document.getElementById(
      'habit-sleep-val'
    );

  const screenVal =
    document.getElementById(
      'habit-screen-val'
    );

  const assignVal =
    document.getElementById(
      'habit-assign-val'
    );


  const studyBar =
    document.getElementById(
      'habit-study-bar'
    );

  const sleepBar =
    document.getElementById(
      'habit-sleep-bar'
    );

  const screenBar =
    document.getElementById(
      'habit-screen-bar'
    );

  const assignBar =
    document.getElementById(
      'habit-assign-bar'
    );


  if (studyVal) {
    studyVal.textContent =
      `${studyHours}h`;
  }

  if (sleepVal) {
    sleepVal.textContent =
      `${sleepHours}h`;
  }

  if (screenVal) {
    screenVal.textContent =
      `${screenTime}h`;
  }

  if (assignVal) {
    assignVal.textContent =
      formatPercentage(
        assignmentPct
      );
  }


  if (studyBar) {
    studyBar.style.width =
      `${Math.min(
        100,
        (studyHours / 10) * 100
      )}%`;
  }

  if (sleepBar) {
    sleepBar.style.width =
      `${Math.min(
        100,
        (sleepHours / 9) * 100
      )}%`;
  }

  if (screenBar) {
    screenBar.style.width =
      `${Math.min(
        100,
        (screenTime / 8) * 100
      )}%`;
  }

  if (assignBar) {
    assignBar.style.width =
      `${Math.min(
        100,
        assignmentPct
      )}%`;
  }
}


function renderAttendance(
  metrics
) {

  if (!metrics) {
    return;
  }


  const pct =
    metrics.attendancePct || 85;

  const totalClasses = 124;

  const attended =
    Math.round(
      (pct / 100) *
      totalClasses
    );

  const missed =
    totalClasses -
    attended;


  const circle =
    document.getElementById(
      'att-donut-circle'
    );

  const text =
    document.getElementById(
      'att-donut-text'
    );

  const attendedEl =
    document.getElementById(
      'att-attended'
    );

  const missedEl =
    document.getElementById(
      'att-missed'
    );

  const totalEl =
    document.getElementById(
      'att-total'
    );


  if (circle) {

    const offset =
      327.4 -
      (327.4 * pct) /
        100;

    circle.style.strokeDashoffset =
      offset;
  }


  if (text) {
    text.textContent =
      formatPercentage(pct);
  }

  if (attendedEl) {
    attendedEl.textContent =
      attended;
  }

  if (missedEl) {
    missedEl.textContent =
      missed;
  }

  if (totalEl) {
    totalEl.textContent =
      totalClasses;
  }
}


function renderAIRecommendations(
  focusAreas,
  metrics,
  kpis
) {

  const container =
    document.getElementById(
      'rec-grid'
    );


  if (!container) {
    return;
  }


  const weakSubject =
    focusAreas &&
    focusAreas[0]
      ? focusAreas[0].subject
      : 'Mathematics';


  const secondWeak =
    focusAreas &&
    focusAreas[1]
      ? focusAreas[1].subject
      : 'Physics';


  const attendance =
    metrics
      ? metrics.attendancePct
      : 85;


  const studyHours =
    metrics
      ? metrics.studyHours
      : 5;


  const recs = [

    {
      title:
        `Intensive Review: ${weakSubject}`,

      desc:
        `Your performance in ${weakSubject} (${
          focusAreas &&
          focusAreas[0]
            ? focusAreas[0].score
            : 60
        }%) indicates foundational gaps. Dedicate an extra 45 mins daily to practice sets.`,

      tag:
        'High Priority',

      badgeClass:
        'badge-red',

      border:
        '#ef4444'
    },


    {
      title:
        `Schedule Peer Study: ${secondWeak}`,

      desc:
        `Collaborate with study groups on ${secondWeak} concepts before the upcoming midterm to solidify problem-solving techniques.`,

      tag:
        'Recommended',

      badgeClass:
        'badge-purple',

      border:
        '#818cf8'
    },


    {
      title:
        attendance < 75
          ? 'Critical Attendance Warning'
          : 'Optimal Attendance Habit',

      desc:
        attendance < 75
          ? `Attendance is at ${attendance}%. Missing further lectures directly imperils target grade standing.`
          : `Attendance is well-maintained at ${attendance}%. Keep participating actively in lab sessions.`,

      tag:
        attendance < 75
          ? 'Urgent'
          : 'Good Standing',

      badgeClass:
        attendance < 75
          ? 'badge-red'
          : 'badge-green',

      border:
        attendance < 75
          ? '#ef4444'
          : '#10b981'
    },


    {
      title:
        'Practice Test Consistency',

      desc:
        studyHours < 5
          ? `Daily study time is ${studyHours}h/day. Increasing mock tests from ${
              metrics
                ? metrics.practiceTests
                : 2
            } to 4 per week will boost test confidence.`
          : `Strong study discipline of ${studyHours}h/day. Maintain test velocity into finals.`,

      tag:
        'Strategy',

      badgeClass:
        'badge-orange',

      border:
        '#f59e0b'
    }

  ];


  container.innerHTML =
    recs
      .map(
        r => `
    <div style="
      padding:14px;
      background:rgba(255,255,255,0.03);
      border-radius:10px;
      border-left:4px solid ${r.border};
      margin-bottom:12px;
    ">
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:6px;
      ">
        <strong style="
          font-size:14px;
          color:var(--text-main,#fff);
        ">
          ${r.title}
        </strong>

        <span
          class="badge ${r.badgeClass}"
          style="
            font-size:10px;
            padding:2px 6px;
          "
        >
          ${r.tag}
        </span>
      </div>

      <p style="
        font-size:12px;
        color:#94a3b8;
        margin:0;
        line-height:1.5;
      ">
        ${r.desc}
      </p>
    </div>
  `
      )
      .join('');
}


function renderRiskAssessmentBars(
  risk,
  riskLevel
) {

  if (!risk) {
    return;
  }


  const elements = [

    {
      key:
        'attendanceImpact',

      val:
        risk.attendanceImpact,

      textEl:
        'risk-att-val',

      barEl:
        'risk-att-bar'
    },

    {
      key:
        'assignmentCompletion',

      val:
        risk.assignmentCompletion,

      textEl:
        'risk-assign-val',

      barEl:
        'risk-assign-bar'
    },

    {
      key:
        'testPerformance',

      val:
        risk.testPerformance,

      textEl:
        'risk-test-val',

      barEl:
        'risk-test-bar'
    },

    {
      key:
        'studyConsistency',

      val:
        risk.studyConsistency,

      textEl:
        'risk-study-val',

      barEl:
        'risk-study-bar'
    }

  ];


  elements.forEach(
    item => {

      const textNode =
        document.getElementById(
          item.textEl
        );

      const barNode =
        document.getElementById(
          item.barEl
        );


      if (textNode) {
        textNode.textContent =
          formatPercentage(
            Math.round(item.val)
          );
      }


      if (barNode) {
        barNode.style.width =
          `${Math.min(
            100,
            Math.max(
              5,
              item.val
            )
          )}%`;
      }
    }
  );


  const labels =
    document.querySelectorAll(
      '.risk-metric-val'
    );

  const bars =
    document.querySelectorAll(
      '.risk-metric-progress'
    );


  if (
    labels.length >= 4 &&
    bars.length >= 4
  ) {

    const vals = [

      risk.attendanceImpact,

      risk.assignmentCompletion,

      risk.testPerformance,

      risk.studyConsistency

    ];


    vals.forEach(
      (v, idx) => {

        labels[idx].textContent =
          formatPercentage(
            Math.round(v)
          );

        bars[idx].style.width =
          `${Math.min(
            100,
            Math.max(5, v)
          )}%`;
      }
    );
  }
}


// ================================================================
// RADAR CHART
// ================================================================

function renderSubjectRadarChart(
  subjectScores
) {

  const canvas =
    document.getElementById(
      'subject-radar-chart'
    ) ||
    document.querySelector(
      '.radar-chart-canvas'
    );


  if (
    !canvas ||
    typeof Chart === 'undefined' ||
    !subjectScores ||
    subjectScores.length === 0
  ) {
    return;
  }


  const ctx =
    canvas.getContext('2d');


  if (radarChartInstance) {
    radarChartInstance.destroy();
  }


  const labels =
    subjectScores.map(
      s => s.subject_name
    );

  const scores =
    subjectScores.map(
      s => s.score
    );


  const isDark =
    document.body.classList.contains(
      'dark'
    ) ||
    document.documentElement.getAttribute(
      'data-theme'
    ) === 'dark';


  const textColor =
    isDark
      ? '#cbd5e1'
      : '#334155';


  const gridColor =
    isDark
      ? 'rgba(255,255,255,0.12)'
      : 'rgba(0,0,0,0.08)';


  radarChartInstance =
    new Chart(
      ctx,
      {
        type:
          'radar',

        data: {

          labels,

          datasets: [

            {
              label:
                'Subject Proficiency (%)',

              data:
                scores,

              backgroundColor:
                'rgba(99,102,241,0.25)',

              borderColor:
                '#6366f1',

              borderWidth:
                2,

              pointBackgroundColor:
                '#818cf8',

              pointBorderColor:
                '#fff',

              pointHoverBackgroundColor:
                '#fff',

              pointHoverBorderColor:
                '#6366f1'
            }

          ]
        },

        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          scales: {

            r: {

              angleLines: {
                color:
                  gridColor
              },

              grid: {
                color:
                  gridColor
              },

              pointLabels: {
                color:
                  textColor,

                font: {
                  size:
                    12,

                  weight:
                    '600'
                }
              },

              ticks: {
                color:
                  textColor,

                backdropColor:
                  'transparent',

                stepSize:
                  20
              },

              min:
                0,

              max:
                100
            }
          },

          plugins: {
            legend: {
              display:
                false
            }
          }
        }
      }
    );
}


// ================================================================
// MONTHLY CHART
// ================================================================

function renderMonthlyBreakdownChart(
  subjectScores,
  studentId
) {

  const canvas =
    document.getElementById(
      'monthly-breakdown-chart'
    ) ||
    document.getElementById(
      'monthly-score-chart'
    ) ||
    document.querySelector(
      '.monthly-chart-canvas'
    );


  if (
    !canvas ||
    typeof Chart === 'undefined' ||
    !subjectScores ||
    subjectScores.length === 0
  ) {
    return;
  }


  const ctx =
    canvas.getContext('2d');


  if (monthlyChartInstance) {
    monthlyChartInstance.destroy();
  }


  const isDark =
    document.body.classList.contains(
      'dark'
    ) ||
    document.documentElement.getAttribute(
      'data-theme'
    ) === 'dark';


  const textColor =
    isDark
      ? '#cbd5e1'
      : '#334155';


  const gridColor =
    isDark
      ? 'rgba(255,255,255,0.08)'
      : 'rgba(0,0,0,0.05)';


  const months = [
    'Month 1',
    'Month 2',
    'Month 3',
    'Month 4',
    'Current'
  ];


  const colors = [
    '#6366f1',
    '#a855f7',
    '#f59e0b',
    '#10b981',
    '#ef4444',
    '#3b82f6'
  ];


  const datasets =
    subjectScores.map(
      (s, idx) => {

        const score =
          s.score;

        const seed =
          (studentId * 7 +
            idx * 3) %
          10;


        const monthlyProgression = [

          Math.max(
            40,
            Math.min(
              100,
              Math.round(
                score -
                14 +
                seed
              )
            )
          ),

          Math.max(
            45,
            Math.min(
              100,
              Math.round(
                score -
                9 +
                (seed % 4)
              )
            )
          ),

          Math.max(
            48,
            Math.min(
              100,
              Math.round(
                score -
                5 +
                (seed % 3)
              )
            )
          ),

          Math.max(
            50,
            Math.min(
              100,
              Math.round(
                score - 2
              )
            )
          ),

          score
        ];


        return {

          label:
            s.subject_name,

          data:
            monthlyProgression,

          backgroundColor:
            colors[
              idx %
              colors.length
            ],

          borderRadius:
            4,

          barPercentage:
            0.6
        };
      }
    );


  monthlyChartInstance =
    new Chart(
      ctx,
      {

        type:
          'bar',

        data: {
          labels:
            months,

          datasets
        },

        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          scales: {

            x: {

              grid: {
                display:
                  false
              },

              ticks: {
                color:
                  textColor,

                font: {
                  size:
                    11
                }
              }
            },

            y: {

              min:
                0,

              max:
                100,

              grid: {
                color:
                  gridColor
              },

              ticks: {
                color:
                  textColor,

                stepSize:
                  20
              }
            }
          },

          plugins: {

            legend: {

              display:
                true,

              position:
                'top',

              labels: {
                color:
                  textColor,

                boxWidth:
                  12,

                padding:
                  15
              }
            }
          }
        }
      }
    );
}


// ================================================================
// FOCUS AREAS
// ================================================================

function renderFocusAreas(
  focusAreas
) {

  const containers = [

    document.getElementById(
      'focus-areas-list'
    ),

    document.getElementById(
      'planner-focus-list'
    ),

    ...document.querySelectorAll(
      '.focus-areas-container, .focus-list'
    )

  ].filter(Boolean);


  if (containers.length === 0) {
    return;
  }


  const content =
    !focusAreas ||
    focusAreas.length === 0

      ? `
        <div style="
          padding:12px;
          color:#94a3b8;
          font-size:13px;
        ">
          No priority focus areas required.
        </div>
      `

      : focusAreas
          .map(
            (item, idx) => {

              const badgeClass =
                item.priority ===
                'Urgent'

                  ? 'badge-red'

                  : item.priority ===
                    'High'

                    ? 'badge-orange'

                    : 'badge-purple';


              const scoreColor =
                item.score < 60
                  ? '#ef4444'

                  : item.score < 75
                    ? '#f59e0b'

                    : '#10b981';


              return `
                <div style="
                  padding:12px 16px;
                  margin-bottom:12px;
                  background:rgba(255,255,255,0.03);
                  border-radius:10px;
                  border-left:4px solid ${
                    item.priority === 'Urgent'
                      ? '#ef4444'
                      : item.priority === 'High'
                        ? '#f59e0b'
                        : '#818cf8'
                  };
                  display:flex;
                  justify-content:space-between;
                  align-items:center;
                  box-shadow:0 2px 8px rgba(0,0,0,0.12);
                ">

                  <div>

                    <div style="
                      display:flex;
                      align-items:center;
                      gap:8px;
                    ">

                      <span style="
                        font-weight:800;
                        font-size:14px;
                        color:#64748b;
                      ">
                        0${idx + 1}
                      </span>

                      <strong style="
                        font-size:14px;
                        color:var(--text-main,#fff);
                      ">
                        ${item.subject}
                      </strong>

                      <span
                        class="badge ${badgeClass}"
                        style="
                          font-size:10px;
                          padding:2px 8px;
                          border-radius:4px;
                        "
                      >
                        ${item.priority}
                      </span>

                    </div>


                    <div style="
                      font-size:12px;
                      color:#94a3b8;
                      margin-top:4px;
                    ">

                      ${item.subtopic}

                      —

                      <span style="
                        color:#818cf8;
                        font-weight:600;
                      ">
                        ${item.sessions}
                      </span>

                    </div>

                  </div>


                  <div style="
                    font-size:15px;
                    font-weight:700;
                    color:${scoreColor};
                  ">
                    ${formatPercentage(item.score)}
                  </div>

                </div>
              `;
            }
          )
          .join('');


  containers.forEach(
    container => {
      container.innerHTML =
        content;
    }
  );
}


// ================================================================
// STUDY TIPS
// ================================================================

function renderDynamicStudyTips(
  studentName,
  focusAreas,
  metrics
) {

  const containers = [

    document.getElementById(
      'study-tips-list'
    ),

    ...document.querySelectorAll(
      '.study-tips-container'
    )

  ].filter(Boolean);


  if (containers.length === 0) {
    return;
  }


  const weakSubject =
    focusAreas &&
    focusAreas[0]
      ? focusAreas[0].subject
      : 'Mathematics';


  const studyHours =
    metrics
      ? metrics.studyHours
      : 5;


  const attendance =
    metrics
      ? metrics.attendancePct
      : 85;


  const tips = [

    {
      icon:
        '💡',

      text:
        `Use the Pomodoro Technique (25m study, 5m break) specifically during <strong>${weakSubject}</strong> practice.`
    },

    {
      icon:
        '📖',

      text:
        `Review <strong>${weakSubject}</strong> formulas and notes before sleep — improves retention by up to 23%.`
    },

    {
      icon:
        '🎯',

      text:
        studyHours < 5

          ? `Increase daily study time from <strong>${studyHours}h</strong> to at least <strong>5.5h</strong> to maintain safe target margins.`

          : `Maintain your current strong daily routine of <strong>${studyHours}h</strong> study time.`
    },

    {
      icon:
        '📅',

      text:
        attendance < 75

          ? `🚨 Critical: Attendance is at <strong>${formatPercentage(attendance)}</strong>. Attend all upcoming lectures to avoid exam disqualification.`

          : `Attendance is safe at <strong>${formatPercentage(attendance)}</strong>. Keep up regular lecture attendance.`
    }

  ];


  const html =
    tips
      .map(
        tip => `
          <div style="
            display:flex;
            align-items:flex-start;
            gap:10px;
            margin-bottom:12px;
            font-size:13px;
            color:var(--text-muted,#94a3b8);
            line-height:1.5;
          ">

            <span style="
              font-size:16px;
            ">
              ${tip.icon}
            </span>

            <div>
              ${tip.text}
            </div>

          </div>
        `
      )
      .join('');


  containers.forEach(
    container => {
      container.innerHTML =
        html;
    }
  );
}


// ================================================================
// WEEKLY PLANNER
// ================================================================

function renderWeeklyPlanner(
  planner
) {

  const container =
    document.getElementById(
      'planner-grid'
    ) ||
    document.getElementById(
      'weekly-schedule-grid'
    );


  if (!container || !planner) {
    return;
  }


  container.style.cssText =
    `
      display:grid;
      grid-template-columns:
        repeat(
          auto-fit,
          minmax(240px,1fr)
        );
      gap:14px;
      margin-top:10px;
    `;


  container.innerHTML =
    planner
      .map(
        item => {

          const tagClass =
            item.tag ===
            'Urgent'

              ? 'badge-red'

              : item.tag ===
                'High Priority'

                ? 'badge-orange'

                : 'badge-purple';


          return `
            <div
              class="habit-card"
              style="
                padding:14px;
                background:
                  var(--bg-card,#1e293b);
                border-radius:10px;
                border:
                  1px solid
                  rgba(255,255,255,0.08);
              "
            >

              <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:6px;
              ">

                <strong style="
                  font-size:14px;
                ">
                  ${item.day}
                </strong>

                <span
                  class="badge ${tagClass}"
                  style="
                    font-size:10px;
                    padding:2px 6px;
                  "
                >
                  ${item.tag}
                </span>

              </div>


              <div style="
                font-size:13px;
                font-weight:600;
                color:#818cf8;
                margin-bottom:6px;
              ">
                ${item.subject}
              </div>


              <div style="
                font-size:12px;
                color:#94a3b8;
              ">

                <div>
                  ⏰ ${item.time}
                </div>

                <div style="
                  margin-top:3px;
                ">
                  📖 ${item.topic}
                </div>

              </div>

            </div>
          `;
        }
      )
      .join('');
}


// ================================================================
// SUBJECT LIST
// ================================================================

function renderSubjectList(
  subjectScores
) {

  const container =
    document.getElementById(
      'subject-list'
    );


  if (
    !container ||
    !subjectScores
  ) {
    return;
  }


  container.innerHTML =
    subjectScores
      .map(
        s => {

          const barColor =
            s.score >= 85
              ? '#10b981'

              : s.score >= 70
                ? '#6366f1'

                : '#f59e0b';


          return `
            <div style="
              margin-bottom:14px;
            ">

              <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:4px;
              ">

                <span style="
                  font-weight:600;
                  font-size:13px;
                ">
                  ${s.subject_name}
                </span>

                <span style="
                  font-weight:700;
                  font-size:13px;
                  color:${barColor};
                ">
                  ${formatPercentage(s.score)}
                </span>

              </div>


              <div style="
                height:7px;
                width:100%;
                background:
                  rgba(148,163,184,0.2);
                border-radius:4px;
                overflow:hidden;
              ">

                <div style="
                  width:${s.score}%;
                  height:100%;
                  background:${barColor};
                  border-radius:4px;
                  transition:
                    width 0.4s ease;
                ">
                </div>

              </div>

            </div>
          `;
        }
      )
      .join('');
}


// ================================================================
// TREND CHART
// ================================================================

function renderTrendChart(
  predictedScore,
  currentScore
) {

  const canvas =
    document.getElementById(
      'performance-trend-chart'
    );


  if (
    !canvas ||
    typeof Chart === 'undefined'
  ) {
    return;
  }


  const ctx =
    canvas.getContext('2d');


  if (trendChartInstance) {
    trendChartInstance.destroy();
  }


  const isDark =
    document.body.classList.contains(
      'dark'
    ) ||
    document.documentElement.getAttribute(
      'data-theme'
    ) === 'dark';


  const textColor =
    isDark
      ? '#f8fafc'
      : '#1e293b';


  const gridColor =
    isDark
      ? 'rgba(255,255,255,0.1)'
      : 'rgba(0,0,0,0.05)';


  const baseScore =
    Number(currentScore) || 75;


  const predScore =
    Number(predictedScore) || 80;


  trendChartInstance =
    new Chart(
      ctx,
      {

        type:
          'line',

        data: {

          labels: [
            'Month 1',
            'Month 2',
            'Month 3',
            'Month 4',
            'Month 5',
            'Current'
          ],

          datasets: [

            {

              label:
                'Actual Score',

              data: [
                baseScore - 8,
                baseScore - 5,
                baseScore - 6,
                baseScore - 2,
                baseScore - 1,
                baseScore
              ],

              borderColor:
                '#6366f1',

              backgroundColor:
                'rgba(99,102,241,0.15)',

              fill:
                true,

              tension:
                0.4
            },


            {

              label:
                'Predicted Score',

              data: [
                baseScore - 6,
                baseScore - 3,
                baseScore - 2,
                baseScore + 1,
                baseScore + 2,
                predScore
              ],

              borderColor:
                '#a855f7',

              borderDash:
                [5, 5],

              fill:
                false,

              tension:
                0.4
            }

          ]
        },


        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,

          scales: {

            x: {
              grid: {
                color:
                  gridColor
              },

              ticks: {
                color:
                  textColor
              }
            },


            y: {

              grid: {
                color:
                  gridColor
              },

              ticks: {
                color:
                  textColor
              },

              min:
                40,

              max:
                100
            }

          },


          plugins: {

            legend: {

              labels: {
                color:
                  textColor
              }

            }

          }

        }

      }
    );
}


// ================================================================
// PDF DOWNLOAD
// ================================================================

async function downloadRealTimePDF(
  studentId
) {

  try {

    const res =
      await fetch(
        `${API_BASE}/students/${studentId}/dashboard`
      );


    const result =
      await res.json();


    if (!result.success) {
      throw new Error(
        result.error
      );
    }


    const {
      profile,
      metrics,
      kpis,
      subjectScores
    } =
      result.data;


    if (!window.jspdf) {

      alert(
        'PDF library is loading. Please click Download again in a moment.'
      );

      return;
    }


    const { jsPDF } =
      window.jspdf;


    const doc =
      new jsPDF();


    doc.setFillColor(
      79,
      70,
      229
    );

    doc.rect(
      0,
      0,
      210,
      28,
      'F'
    );


    doc.setTextColor(
      255,
      255,
      255
    );

    doc.setFontSize(
      16
    );

    doc.setFont(
      'helvetica',
      'bold'
    );


    doc.text(
      'EduPredict AI — Academic Performance Report',
      14,
      18
    );


    doc.setTextColor(
      30,
      41,
      59
    );

    doc.setFontSize(
      11
    );


    doc.text(
      'Student Profile Details',
      14,
      38
    );


    doc.setFont(
      'helvetica',
      'normal'
    );

    doc.setFontSize(
      10
    );


    doc.text(
      `Full Name: ${profile.name}`,
      14,
      46
    );


    doc.text(
      `Roll Number: ${profile.roll_no}`,
      14,
      53
    );


    doc.text(
      `Department: ${
        profile.department ||
        profile.class_section
      }`,
      14,
      60
    );


    doc.text(
      `Email Address: ${profile.email}`,
      110,
      46
    );


    doc.text(
      `Generated Date: ${
        new Date().toLocaleDateString()
      }`,
      110,
      53
    );


    doc.text(
      `Risk Evaluation: ${kpis.riskLevel}`,
      110,
      60
    );


    doc.setDrawColor(
      226,
      232,
      240
    );


    doc.line(
      14,
      66,
      196,
      66
    );


    if (doc.autoTable) {

      doc.setFont(
        'helvetica',
        'bold'
      );


      doc.text(
        '1. Performance Metrics Summary',
        14,
        74
      );


      doc.autoTable({

        startY:
          78,

        head: [[
          'Predicted Score',
          'Predicted Grade',
          'Overall Marks Avg',
          'Attendance Rate'
        ]],

        body: [[

          formatPercentage(
            kpis.predictedScore
          ),

          kpis.predictedGrade,

          formatPercentage(
            kpis.overallPerformance
          ),

          formatPercentage(
            kpis.attendance
          )

        ]],

        theme:
          'grid',

        headStyles: {
          fillColor:
            [79,70,229],

          textColor:
            [255,255,255],

          fontStyle:
            'bold'
        },

        styles: {
          fontSize:
            10,

          cellPadding:
            5,

          halign:
            'center'
        }

      });


      doc.setFont(
        'helvetica',
        'bold'
      );


      doc.text(
        '2. Subject-wise Marks Breakdown',
        14,
        doc.lastAutoTable.finalY + 12
      );


      const subjectRows =
        subjectScores.map(
          s => [

            s.subject_name,

            formatPercentage(
              s.score
            ),

            s.score >= 85
              ? 'Excellent'
              : s.score >= 70
                ? 'Good'
                : 'Needs Focus'

          ]
        );


      doc.autoTable({

        startY:
          doc.lastAutoTable.finalY + 16,

        head: [[
          'Subject Name',
          'Score (%)',
          'Evaluation'
        ]],

        body:
          subjectRows,

        theme:
          'striped',

        headStyles: {
          fillColor:
            [51,65,85],

          textColor:
            [255,255,255],

          fontStyle:
            'bold'
        },

        styles: {
          fontSize:
            9,

          cellPadding:
            4
        }

      });


      doc.setFont(
        'helvetica',
        'bold'
      );


      doc.text(
        '3. Detailed Metric Audit',
        14,
        doc.lastAutoTable.finalY + 12
      );


      doc.autoTable({

        startY:
          doc.lastAutoTable.finalY + 16,

        head: [[
          'Metric',
          'Value',
          'Status'
        ]],

        body: [

          [
            'Attendance Percentage',

            formatPercentage(
              metrics.attendancePct
            ),

            metrics.attendancePct >= 75
              ? 'Safe Standing'
              : 'Critical Warning'
          ],


          [
            'Daily Study Hours',

            `${metrics.studyHours} hrs/day`,

            metrics.studyHours >= 5
              ? 'Optimal Routine'
              : 'Low Study Time'
          ],


          [
            'Assignment Completion Rate',

            formatPercentage(
              metrics.assignmentPct
            ),

            metrics.assignmentPct >= 80
              ? 'Good Completion Rate'
              : 'Pending Work'
          ],


          [
            'Weekly Practice Tests',

            `${metrics.practiceTests} tests/week`,

            metrics.practiceTests >= 3
              ? 'Sufficient Practice'
              : 'More Mock Tests Recommended'
          ]

        ],

        theme:
          'grid',

        headStyles: {

          fillColor:
            [15,23,42],

          textColor:
            [255,255,255],

          fontStyle:
            'bold'
        },

        styles: {

          fontSize:
            9,

          cellPadding:
            4
        }

      });

    }


    doc.save(
      `EduPredict_Report_${profile.roll_no}.pdf`
    );


  } catch (err) {

    console.error(
      'PDF Generation Error:',
      err
    );

    alert(
      'Failed to generate PDF report: ' +
      err.message
    );
  }
}


// ================================================================
// REPORTS TABLE
// ================================================================

async function renderReportsTable() {

  const tbody =
    document.getElementById(
      'reports-table-body'
    );


  if (!tbody) {
    return;
  }


  try {

    const res =
      await fetch(
        `${API_BASE}/students`
      );


    const result =
      await res.json();


    if (!result.success) {
      return;
    }


    // Keep report names consistent with the student roster.
    result.data =
      applyCommonStudentNames(
        result.data
      );


    tbody.innerHTML =
      result.data
        .slice(0, 15)
        .map(
          (st, i) => `
            <tr style="
              border-bottom:
                1px solid
                rgba(255,255,255,0.05);
            ">

              <td style="
                padding:14px;
                font-weight:600;
              ">
                Audit Report #${1001 + i}
              </td>


              <td style="
                padding:14px;
                color:#94a3b8;
              ">
                ${st.name}
                (${st.rollNo})
              </td>


              <td style="
                padding:14px;
                color:#94a3b8;
              ">
                ${
                  new Date()
                    .toISOString()
                    .split('T')[0]
                }
              </td>


              <td style="
                padding:14px;
              ">
                <span
                  class="badge badge-green"
                >
                  Generated
                </span>
              </td>


              <td style="
                padding:14px;
              ">

                <button
                  class="btn-sm"
                  onclick="
                    downloadRealTimePDF(
                      ${st.id}
                    )
                  "
                  style="
                    background:#6366f1;
                    color:#fff;
                    border:none;
                    padding:6px 14px;
                    border-radius:6px;
                    cursor:pointer;
                    font-weight:600;
                  "
                >
                  Download PDF
                </button>

              </td>

            </tr>
          `
        )
        .join('');


  } catch (err) {

    console.error(
      'Error fetching reports roster:',
      err
    );
  }
}


// ================================================================
// REPORT GENERATOR
// ================================================================

function setupReportGenerator() {

  document.addEventListener(
    'click',
    e => {

      const btn =
        e.target.closest(
          '#export-report-btn, .btn-export, #new-report-btn'
        );


      if (!btn) {
        return;
      }


      e.preventDefault();


      downloadRealTimePDF(
        currentStudentId
      );
    }
  );
}


// ================================================================
// TEACHER / STUDENT ROSTER
// ================================================================

async function loadTeacherRoster() {

  try {

    const res =
      await fetch(
        `${API_BASE}/students`
      );


    const result =
      await res.json();


    if (!result.success) {
      return;
    }


    // Use common college-student names
    // for the frontend roster.
    result.data =
      applyCommonStudentNames(
        result.data
      );


    const select =
      document.getElementById(
        'student-select'
      );


    if (select) {

      select.innerHTML =
        result.data
          .map(
            st => `
              <option
                value="${st.id}"
                ${
                  st.id === currentStudentId
                    ? 'selected'
                    : ''
                }
              >
                ${st.name}
                — Roll: ${st.rollNo}
                (${
                  st.department ||
                  st.classSection
                })
              </option>
            `
          )
          .join('');


      select.value =
        currentStudentId;
    }


    const tbody =
      document.getElementById(
        'student-table-body'
      );


    if (tbody) {

      tbody.innerHTML =
        result.data
          .map(
            st => {

              const riskClass =
                st.risk === 'High Risk'

                  ? 'badge-red'

                  : st.risk ===
                    'Medium Risk'

                    ? 'badge-orange'

                    : 'badge-green';


              return `
                <tr>

                  <td>
                    <strong>
                      ${st.name}
                    </strong>
                  </td>

                  <td>
                    ${st.rollNo}
                  </td>

                  <td>
                    ${formatPercentage(
                      st.predictedScore
                    )}
                  </td>

                  <td>
                    ${formatPercentage(
                      st.attendance
                    )}
                  </td>

                  <td>
                    <span
                      class="badge ${riskClass}"
                    >
                      ${st.risk}
                    </span>
                  </td>

                  <td>
                    <span
                      class="grade-badge grade-b"
                    >
                      ${st.grade}
                    </span>
                  </td>

                  <td>

                    <button
                      class="btn-sm"
                      onclick="
                        selectStudentById(
                          ${st.id}
                        )
                      "
                    >
                      View
                    </button>

                  </td>

                </tr>
              `;
            }
          )
          .join('');
    }


  } catch (err) {

    console.error(
      'Error loading roster:',
      err
    );
  }
}


// ================================================================
// SELECT STUDENT
// ================================================================

window.selectStudentById =
  function(id) {

    currentStudentId =
      id;

    loadStudentDashboard(
      id
    );

    document
      .querySelector(
        '[data-page="dashboard"]'
      )
      ?.click();
  };


// ================================================================
// LIVE SEARCH
// ================================================================

function setupLiveSearch() {

  const searchInputs =
    document.querySelectorAll(
      'input[placeholder*="Search"]'
    );


  searchInputs.forEach(
    input => {

      const dropdown =
        document.createElement(
          'div'
        );


      dropdown.className =
        'search-dropdown-results';


      dropdown.style.cssText = `
        position:absolute;
        top:100%;
        left:0;
        right:0;
        background:
          var(--bg-card,#1e293b);
        border:
          1px solid
          rgba(255,255,255,0.1);
        border-radius:8px;
        z-index:9999;
        display:none;
        max-height:250px;
        overflow-y:auto;
        box-shadow:
          0 10px 25px
          rgba(0,0,0,0.5);
      `;


      input.parentElement.style.position =
        'relative';


      input.parentElement.appendChild(
        dropdown
      );


      input.addEventListener(
        'input',
        async e => {

          const q =
            e.target.value.trim();


          if (q.length < 1) {

            dropdown.style.display =
              'none';

            return;
          }


          try {

            const res =
              await fetch(
                `${API_BASE}/students/search?q=${encodeURIComponent(q)}`
              );


            const result =
              await res.json();


            if (
              result.success &&
              result.data.length > 0
            ) {

              // Apply common names to
              // search results too.
              result.data =
                applyCommonStudentNames(
                  result.data
                );


              dropdown.innerHTML =
                result.data
                  .map(
                    st => `
                      <div
                        class="search-result-item"
                        style="
                          padding:10px 14px;
                          border-bottom:
                            1px solid
                            rgba(255,255,255,0.05);
                          cursor:pointer;
                        "
                        onclick="
                          selectStudentFromSearch(
                            ${st.id}
                          )
                        "
                      >

                        <strong style="
                          color:
                            var(
                              --text-main,
                              #fff
                            );
                        ">
                          ${st.name}
                        </strong>

                        <div style="
                          font-size:12px;
                          color:#94a3b8;
                        ">
                          ${st.roll_no}
                          •
                          ${
                            st.department ||
                            st.class_section
                          }
                          •
                          ${st.email}
                        </div>

                      </div>
                    `
                  )
                  .join('');


              dropdown.style.display =
                'block';


            } else {

              dropdown.innerHTML =
                `
                  <div style="
                    padding:10px;
                    color:#94a3b8;
                    font-size:13px;
                  ">
                    No students found
                    matching "${q}"
                  </div>
                `;


              dropdown.style.display =
                'block';
            }


          } catch (err) {

            console.error(
              'Search error:',
              err
            );
          }

        }
      );


      document.addEventListener(
        'click',
        e => {

          if (
            !input.parentElement
              .contains(e.target)
          ) {

            dropdown.style.display =
              'none';
          }
        }
      );

    }
  );
}


// ================================================================
// SELECT FROM SEARCH
// ================================================================

window.selectStudentFromSearch =
  function(id) {

    currentStudentId =
      id;


    loadStudentDashboard(
      id
    );


    document
      .querySelectorAll(
        '.search-dropdown-results'
      )
      .forEach(
        el =>
          el.style.display =
            'none'
      );


    document
      .querySelectorAll(
        'input[placeholder*="Search"]'
      )
      .forEach(
        input =>
          input.value = ''
      );


    document
      .querySelector(
        '[data-page="dashboard"]'
      )
      ?.click();
  };


// ================================================================
// PREDICTION SLIDERS
// ================================================================

function setupPredictionSliders() {

  const sliders =
    document.querySelectorAll(
      '.slider, input[type="range"]'
    );


  sliders.forEach(
    slider => {

      slider.addEventListener(
        'input',
        () => {

          const studyEl =
            document.getElementById(
              'study-slider'
            ) ||
            document.getElementById(
              'studyHours'
            );


          const attendEl =
            document.getElementById(
              'attend-slider'
            ) ||
            document.getElementById(
              'attendanceRate'
            );


          const assignEl =
            document.getElementById(
              'assign-slider'
            ) ||
            document.getElementById(
              'assignmentCompletion'
            );


          const testEl =
            document.getElementById(
              'test-slider'
            ) ||
            document.getElementById(
              'practiceTests'
            );


          const studyHours =
            studyEl
              ? studyEl.value
              : 5;


          const attendance =
            attendEl
              ? attendEl.value
              : 85;


          const assignmentCompletion =
            assignEl
              ? assignEl.value
              : 80;


          const practiceTests =
            testEl
              ? testEl.value
              : 2;


          const studyVal =
            document.getElementById(
              'study-val'
            );


          const attendVal =
            document.getElementById(
              'attend-val'
            );


          const assignVal =
            document.getElementById(
              'assign-val'
            );


          const testVal =
            document.getElementById(
              'test-val'
            );


          if (studyVal) {
            studyVal.textContent =
              `${studyHours}h`;
          }


          if (attendVal) {
            attendVal.textContent =
              formatPercentage(
                attendance
              );
          }


          if (assignVal) {
            assignVal.textContent =
              formatPercentage(
                assignmentCompletion
              );
          }


          if (testVal) {
            testVal.textContent =
              practiceTests;
          }


          updatePredictionView(
            studyHours,
            attendance,
            assignmentCompletion,
            practiceTests
          );
        }
      );
    }
  );
}


// ================================================================
// WHAT-IF PREDICTION
// ================================================================

async function updatePredictionView(
  studyHours,
  attendance,
  assignmentCompletion,
  practiceTests
) {

  try {

    const res =
      await fetch(
        `${API_BASE}/predict/what-if`,
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify({
              studyHours,
              attendance,
              assignmentCompletion,
              practiceTests
            })
        }
      );


    const result =
      await res.json();


    if (
      result.success &&
      result.data
    ) {

      const {
        predictedScore,
        grade,
        riskLevel
      } =
        result.data;


      const predScoreEl =
        document.getElementById(
          'pred-score'
        ) ||
        document.getElementById(
          'simPredictedScore'
        );


      const predGradeEl =
        document.getElementById(
          'pred-grade'
        ) ||
        document.getElementById(
          'simPredictedGrade'
        );


      const predBarEl =
        document.getElementById(
          'pred-bar'
        );


      const simRiskEl =
        document.getElementById(
          'simRiskLevel'
        );


      if (predScoreEl) {

        predScoreEl.textContent =
          formatPercentage(
            predictedScore
          );
      }


      if (predGradeEl) {

        predGradeEl.textContent =
          predGradeEl.id ===
          'simPredictedGrade'

            ? `Grade: ${grade}`

            : grade;
      }


      if (predBarEl) {

        predBarEl.style.width =
          `${predictedScore}%`;
      }


      if (simRiskEl) {

        simRiskEl.textContent =
          riskLevel ||
          'Low Risk';
      }
    }


  } catch (err) {

    console.error(
      'Error updating prediction score:',
      err
    );
  }
}


// ================================================================
// TARGET GOAL PREDICTOR
// ================================================================

function setupGoalPredictor() {

  const btn =
    document.getElementById(
      'calc-goal-btn'
    );


  if (!btn) {
    return;
  }


  btn.addEventListener(
    'click',
    async () => {

      const targetScore =
        document.getElementById(
          'goal-input'
        )?.value ||
        75;


      const studyHours =
        document.getElementById(
          'study-slider'
        )?.value ||

        document.getElementById(
          'studyHours'
        )?.value ||

        5;


      const attendance =
        document.getElementById(
          'attend-slider'
        )?.value ||

        document.getElementById(
          'attendanceRate'
        )?.value ||

        85;


      const assignmentCompletion =
        document.getElementById(
          'assign-slider'
        )?.value ||

        document.getElementById(
          'assignmentCompletion'
        )?.value ||

        80;


      const practiceTests =
        document.getElementById(
          'test-slider'
        )?.value ||

        document.getElementById(
          'practiceTests'
        )?.value ||

        2;


      try {

        const res =
          await fetch(
            `${API_BASE}/predict/goal`,
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({

                  studentId:
                    currentStudentId,

                  targetScore,

                  currentMetrics: {

                    studyHours,

                    attendance,

                    assignmentCompletion,

                    practiceTests

                  }

                })
            }
          );


        const result =
          await res.json();


        const container =
          document.getElementById(
            'goal-result'
          );


        if (!container) {
          return;
        }


        if (result.success) {

          const d =
            result.data;


          if (d.message) {

            container.innerHTML = `
              <div style="
                margin-top:16px;
                padding:12px 16px;
                background:
                  rgba(
                    16,
                    185,
                    129,
                    0.1
                  );
                border:
                  1px solid
                  var(
                    --green,
                    #10b981
                  );
                border-radius:8px;
                color:
                  var(
                    --green,
                    #10b981
                  );
                font-weight:600;
              ">
                ✨ ${d.message}
              </div>
            `;


          } else {

            const reqStudy =
              d.requiredStudyHours ??
              d.targetStudyHours ??
              0;


            const studyDelta =
              d.additionalHoursNeeded ??
              d.studyDelta ??
              0;


            const reqAttendance =
              d.requiredAttendancePct ??
              d.requiredAttendance ??
              0;


            const reqTests =
              d.suggestedTestsPerWeek ??
              d.requiredTests ??
              0;


            const deltaText =
              studyDelta > 0
                ? `(+${studyDelta}h)`
                : '(0h)';


            container.innerHTML = `

              <div style="
                margin-top:16px;
                display:flex;
                flex-direction:column;
                gap:10px;
              ">

                <div
                  class="habit-card"
                  style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                  "
                >

                  <span>
                    📚
                    <strong>
                      Target Daily Study:
                    </strong>
                  </span>

                  <span
                    class="badge badge-purple"
                  >
                    ${reqStudy}
                    hrs/day
                    ${deltaText}
                  </span>

                </div>


                <div
                  class="habit-card"
                  style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                  "
                >

                  <span>
                    📅
                    <strong>
                      Required Attendance:
                    </strong>
                  </span>

                  <span
                    class="badge badge-blue"
                  >
                    ${formatPercentage(
                      reqAttendance
                    )}
                  </span>

                </div>


                <div
                  class="habit-card"
                  style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                  "
                >

                  <span>
                    📝
                    <strong>
                      Practice Tests:
                    </strong>
                  </span>

                  <span
                    class="badge badge-green"
                  >
                    ${reqTests}
                    / week
                  </span>

                </div>

              </div>
            `;
          }
        }


      } catch (err) {

        console.error(
          'Error calculating goal requirement:',
          err
        );
      }

    }
  );
}


// ================================================================
// SETTINGS
// ================================================================

function setupSettingsForm() {

  const saveAction =
    async e => {

      if (e) {
        e.preventDefault();
      }


      const formInputs =
        document.querySelectorAll(
          '#page-settings .form-input'
        );


      const nameInput =
        document.getElementById(
          'setting-name'
        ) ||
        formInputs[0];


      const rollInput =
        document.getElementById(
          'setting-roll'
        ) ||
        formInputs[1];


      const deptInput =
        document.getElementById(
          'setting-dept'
        ) ||
        formInputs[2];


      const emailInput =
        document.getElementById(
          'setting-email'
        ) ||
        formInputs[3];


      const name =
        nameInput?.value;


      const rollNo =
        rollInput?.value;


      const department =
        deptInput?.value;


      const email =
        emailInput?.value;


      try {

        const res =
          await fetch(
            `${API_BASE}/students/${currentStudentId}`,
            {
              method:
                'PUT',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({
                  name,
                  rollNo,
                  department,
                  email
                })
            }
          );


        const result =
          await res.json();


        if (result.success) {

          document
            .querySelectorAll(
              '.profile-name'
            )
            .forEach(
              el =>
                el.textContent =
                  name
            );


          document
            .querySelectorAll(
              '.profile-avatar, .topbar-avatar'
            )
            .forEach(
              el =>
                el.textContent =
                  getInitials(name)
            );


          document
            .querySelectorAll(
              '.profile-role'
            )
            .forEach(
              el =>
                el.textContent =
                  `Student • ${
                    department ||
                    'CS-A'
                  }`
            );


          alert(
            'Profile saved successfully!'
          );


          await loadTeacherRoster();

          await loadStudentDashboard(
            currentStudentId
          );


        } else {

          alert(
            'Failed to save profile: ' +
            result.error
          );
        }


      } catch (err) {

        console.error(
          'Error saving profile:',
          err
        );


        alert(
          'Network error while saving profile.'
        );
      }
    };


  const form =
    document.getElementById(
      'profile-settings-form'
    );


  if (form) {
    form.addEventListener(
      'submit',
      saveAction
    );
  }


  const saveBtn =
    document.querySelector(
      '#page-settings .btn-primary'
    );


  if (saveBtn) {

    saveBtn.addEventListener(
      'click',
      saveAction
    );
  }
}


// ================================================================
// NOTIFICATION SYSTEM
// ================================================================

function createFallbackNotifications(
  studentName,
  kpis = {}
) {

  const name =
    studentName ||
    'Student';


  const score =
    formatPercentage(
      Number(
        kpis.predictedScore ||
        61.6
      ).toFixed(1)
    );


  return [

    {
      id:
        1,

      title:
        '⚠️ Attendance Alert',

      message:
        `${name}, please attend your upcoming lectures regularly to maintain your attendance.`,

      type:
        'warning',

      is_read:
        0
    },


    {
      id:
        2,

      title:
        '📈 Performance Update',

      message:
        `${name}, your current predicted academic score is ${score}. Keep following your study plan.`,

      type:
        'success',

      is_read:
        0
    },


    {
      id:
        3,

      title:
        '📝 Assignment Reminder',

      message:
        `${name}, remember to complete and submit your pending assignments before the deadline.`,

      type:
        'warning',

      is_read:
        0
    },


    {
      id:
        4,

      title:
        '🎯 Study Goal Reminder',

      message:
        `${name}, complete your planned practice tests this week to stay on track with your academic goals.`,

      type:
        'info',

      is_read:
        0
    },


    {
      id:
        5,

      title:
        '📚 Study Recommendation',

      message:
        `${name}, spend additional time revising your weaker subjects and solving practice questions.`,

      type:
        'info',

      is_read:
        0
    },


    {
      id:
        6,

      title:
        '🏆 Academic Progress',

      message:
        `Good progress, ${name}! Continue studying consistently and reviewing your performance regularly.`,

      type:
        'success',

      is_read:
        0
    },


    {
      id:
        7,

      title:
        '🗓️ Weekly Review Ready',

      message:
        `${name}, your weekly academic review is ready. Check your dashboard for your latest performance.`,

      type:
        'info',

      is_read:
        0
    }

  ];
}


function escapeNotificationHTML(
  value
) {

  return String(
    value ?? ''
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );
}


let currentNotifications =
  [];


function renderNotificationsList(
  notifications = []
) {

  const list =
    document.getElementById(
      'notif-list'
    );


  const dot =
    document.querySelector(
      '.notif-dot'
    );


  if (!list) {
    return;
  }


  currentNotifications =
    Array.isArray(
      notifications
    )
      ? notifications
      : [];


  const unreadCount =
    currentNotifications.filter(
      n =>
        !Number(
          n.is_read
        )
    ).length;


  if (dot) {

    if (unreadCount > 0) {

      dot.style.display =
        'flex';

      dot.textContent =
        unreadCount > 9
          ? '9+'
          : String(
              unreadCount
            );

    } else {

      dot.style.display =
        'none';
    }
  }


  if (
    currentNotifications.length === 0
  ) {

    list.innerHTML = `
      <div style="
        padding:24px 16px;
        color:#94a3b8;
        font-size:13px;
        text-align:center;
      ">
        🔔 No new notifications
      </div>
    `;

    return;
  }


  list.innerHTML =
    currentNotifications
      .map(
        (n, index) => {

          const unread =
            !Number(
              n.is_read
            );


          let icon =
            n.icon ||
            '🔔';


          if (!n.icon) {

            if (
              n.type ===
              'warning'
            ) {

              icon =
                '⚠️';

            } else if (
              n.type ===
              'success'
            ) {

              icon =
                '✅';

            } else if (
              n.type ===
              'info'
            ) {

              icon =
                'ℹ️️';
            }
          }


          return `

            <div
              class="notif-item"
              data-notification-index="${index}"
              style="
                padding:12px 16px;
                border-bottom:
                  1px solid
                  rgba(255,255,255,0.05);
                ${
                  unread
                    ? 'background:rgba(99,102,241,0.08);'
                    : ''
                }
                cursor:pointer;
              "
            >

              <div style="
                display:flex;
                gap:10px;
                align-items:flex-start;
              ">

                <div style="
                  width:32px;
                  height:32px;
                  min-width:32px;
                  border-radius:9px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  background:
                    rgba(
                      99,
                      102,
                      241,
                      0.12
                    );
                ">
                  ${escapeNotificationHTML(
                    icon
                  )}
                </div>


                <div style="
                  flex:1;
                  min-width:0;
                ">

                  <div style="
                    display:flex;
                    align-items:center;
                    gap:6px;
                    margin-bottom:3px;
                  ">

                    <strong style="
                      font-size:13px;
                      color:#f8fafc;
                    ">
                      ${escapeNotificationHTML(
                        n.title ||
                        'Notification'
                      )}
                    </strong>


                    ${
                      unread
                        ? `
                          <span style="
                            font-size:9px;
                            padding:2px 5px;
                            border-radius:4px;
                            background:#6366f1;
                            color:white;
                            font-weight:700;
                          ">
                            NEW
                          </span>
                        `
                        : ''
                    }

                  </div>


                  <p style="
                    font-size:12px;
                    line-height:1.45;
                    color:#94a3b8;
                    margin:0;
                  ">
                    ${escapeNotificationHTML(
                      n.message ||
                      ''
                    )}
                  </p>

                </div>


                ${
                  unread
                    ? `
                      <span style="
                        width:7px;
                        height:7px;
                        min-width:7px;
                        border-radius:50%;
                        background:#6366f1;
                        margin-top:5px;
                      ">
                      </span>
                    `
                    : ''
                }

              </div>

            </div>
          `;
        }
      )
      .join('');


  list
    .querySelectorAll(
      '.notif-item'
    )
    .forEach(
      item => {

        item.addEventListener(
          'click',
          async () => {

            const index =
              Number(
                item.dataset
                  .notificationIndex
              );


            const notification =
              currentNotifications[
                index
              ];


            if (
              !notification ||
              Number(
                notification.is_read
              )
            ) {
              return;
            }


            notification.is_read =
              1;


            renderNotificationsList(
              currentNotifications
            );


            if (
              notification.id
            ) {

              try {

                await fetch(
                  `${API_BASE}/students/${currentStudentId}/notifications/${notification.id}/read`,
                  {
                    method:
                      'POST'
                  }
                );

              } catch (err) {

                console.warn(
                  'Could not mark notification as read:',
                  err
                );
              }
            }
          }
        );
      }
    );
}


// ================================================================
// NOTIFICATION SETUP
// ================================================================

function setupNotifications() {

  const btn =
    document.getElementById(
      'notif-btn'
    );


  const panel =
    document.getElementById(
      'notif-panel'
    );


  const overlay =
    document.getElementById(
      'notif-overlay'
    );


  const markReadBtn =
    document.getElementById(
      'mark-all-read'
    );


  if (!btn || !panel) {

    console.warn(
      'Notification button or panel not found.'
    );

    return;
  }


  panel.style.position =
    'fixed';

  panel.style.top =
    '75px';

  panel.style.right =
    '25px';

  panel.style.width =
    '400px';

  panel.style.maxWidth =
    'calc(100vw - 30px)';

  panel.style.maxHeight =
    'calc(100vh - 100px)';

  panel.style.overflowY =
    'auto';

  panel.style.zIndex =
    '99999';

  panel.style.display =
    'none';


  if (overlay) {

    overlay.style.position =
      'fixed';

    overlay.style.inset =
      '0';

    overlay.style.zIndex =
      '99998';

    overlay.style.background =
      'rgba(0,0,0,0.35)';

    overlay.style.display =
      'none';
  }


  btn.addEventListener(
    'click',
    event => {

      event.stopPropagation();


      const isOpen =
        panel.style.display ===
        'block';


      if (isOpen) {

        panel.style.display =
          'none';

        if (overlay) {
          overlay.style.display =
            'none';
        }

      } else {

        panel.style.display =
          'block';

        if (overlay) {
          overlay.style.display =
            'block';
        }
      }
    }
  );


  panel.addEventListener(
    'click',
    event => {
      event.stopPropagation();
    }
  );


  overlay?.addEventListener(
    'click',
    () => {

      panel.style.display =
        'none';

      if (overlay) {
        overlay.style.display =
          'none';
      }
    }
  );


  markReadBtn?.addEventListener(
    'click',
    async event => {

      event.stopPropagation();


      currentNotifications =
        currentNotifications.map(
          n => ({
            ...n,
            is_read: 1
          })
        );


      renderNotificationsList(
        currentNotifications
      );


      try {

        await fetch(
          `${API_BASE}/students/${currentStudentId}/notifications/read`,
          {
            method:
              'POST'
          }
        );

      } catch (err) {

        console.error(
          'Error marking notifications read:',
          err
        );
      }
    }
  );


  document.addEventListener(
    'keydown',
    event => {

      if (
        event.key ===
        'Escape'
      ) {

        panel.style.display =
          'none';

        if (overlay) {
          overlay.style.display =
            'none';
        }
      }
    }
  );
}


// ================================================================
// STUDENT SELECTOR
// ================================================================

function setupStudentSelector() {

  const select =
    document.getElementById(
      'student-select'
    );


  if (!select) {
    return;
  }


  select.addEventListener(
    'change',
    e => {

      currentStudentId =
        Number(
          e.target.value
        );


      loadStudentDashboard(
        currentStudentId
      );
    }
  );
}


// ================================================================
// NAVIGATION
// ================================================================

function setupNavigation() {

  const navItems =
    document.querySelectorAll(
      '.nav-item'
    );


  const pages =
    document.querySelectorAll(
      '.page'
    );


  const breadcrumbCurrent =
    document.getElementById(
      'breadcrumb-current'
    );


  navItems.forEach(
    item => {

      item.addEventListener(
        'click',
        e => {

          e.preventDefault();


          const pageId =
            item.getAttribute(
              'data-page'
            );


          navItems.forEach(
            nav =>
              nav.classList.remove(
                'active'
              )
          );


          pages.forEach(
            page =>
              page.classList.remove(
                'active'
              )
          );


          item.classList.add(
            'active'
          );


          const targetPage =
            document.getElementById(
              `page-${pageId}`
            );


          if (targetPage) {

            targetPage.classList.add(
              'active'
            );
          }


          if (breadcrumbCurrent) {

            breadcrumbCurrent.textContent =
              item.textContent.trim();
          }
        }
      );
    }
  );


  const sidebarProfile =
    document.querySelector(
      '.sidebar-profile'
    );


  if (sidebarProfile) {

    sidebarProfile.style.cursor =
      'pointer';


    sidebarProfile.addEventListener(
      'click',
      () => {

        document
          .querySelector(
            '[data-page="settings"]'
          )
          ?.click();
      }
    );
  }
}


// ================================================================
// DARK MODE
// ================================================================

function setupDarkMode() {

  const toggleBtn =
    document.getElementById(
      'dark-mode-toggle'
    );


  const toggleCheckbox =
    document.getElementById(
      'dark-mode-setting'
    );


  const savedTheme =
    localStorage.getItem(
      'theme'
    );


  if (
    savedTheme ===
    'dark'
  ) {

    enableDarkMode(
      true
    );
  }


  function enableDarkMode(
    enable
  ) {

    if (enable) {

      document.body.classList.add(
        'dark'
      );


      document.documentElement
        .setAttribute(
          'data-theme',
          'dark'
        );


      toggleBtn?.setAttribute(
        'aria-checked',
        'true'
      );


      if (toggleCheckbox) {

        toggleCheckbox.checked =
          true;
      }


      localStorage.setItem(
        'theme',
        'dark'
      );


    } else {

      document.body.classList.remove(
        'dark'
      );


      document.documentElement
        .removeAttribute(
          'data-theme'
        );


      toggleBtn?.setAttribute(
        'aria-checked',
        'false'
      );


      if (toggleCheckbox) {

        toggleCheckbox.checked =
          false;
      }


      localStorage.setItem(
        'theme',
        'light'
      );
    }


    loadStudentDashboard(
      currentStudentId
    );
  }


  toggleBtn?.addEventListener(
    'click',
    () => {

      const isDark =
        document.body.classList.contains(
          'dark'
        ) ||
        document.documentElement.getAttribute(
          'data-theme'
        ) === 'dark';


      enableDarkMode(
        !isDark
      );
    }
  );


  toggleCheckbox?.addEventListener(
    'change',
    e => {

      enableDarkMode(
        e.target.checked
      );
    }
  );
}