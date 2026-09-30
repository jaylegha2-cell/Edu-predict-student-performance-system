/**
 * Core Machine Learning / Formula Prediction Engine for EduPredict AI
 */

function calculatePrediction(studyHours, attendance, assignmentCompletion, practiceTests) {
  const hours = Math.max(0, Math.min(12, Number(studyHours) || 0));
  const att = Math.max(0, Math.min(100, Number(attendance) || 0));
  const assign = Math.max(0, Math.min(100, Number(assignmentCompletion) || 0));
  const tests = Math.max(0, Math.min(10, Number(practiceTests) || 0));

  // Weighted Linear Formula
  let rawScore = 15.0 + (2.5 * hours) + (0.30 * att) + (0.25 * assign) + (1.5 * tests);
  let score = Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10));

  // Grade Boundaries
  let grade = 'F';
  if (score >= 90) grade = 'A+';
  else if (score >= 85) grade = 'A';
  else if (score >= 78) grade = 'B+';
  else if (score >= 70) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 50) grade = 'D';

  // Risk Classification
  let riskLevel = 'Low Risk';
  if (score < 60 || att < 75) {
    riskLevel = 'High Risk';
  } else if (score < 72 || att < 82) {
    riskLevel = 'Medium Risk';
  }

  return {
    predictedScore: score,
    grade,
    riskLevel
  };
}

function calculateGoalRequirements(metrics, targetScore) {
  const currentStudy = Math.max(0, Number(metrics.study_hours || metrics.studyHours || 0));
  const currentAttendance = Math.max(0, Number(metrics.attendance_pct || metrics.attendancePct || 0));
  const currentAssignments = Math.max(0, Number(metrics.assignment_pct || metrics.assignmentPct || 0));
  const currentTests = Math.max(0, Number(metrics.practice_tests || metrics.practiceTests || 0));

  const target = Number(targetScore);

  // Get current baseline score
  const currentPred = calculatePrediction(currentStudy, currentAttendance, currentAssignments, currentTests);
  const currentScore = currentPred.predictedScore;

  // FIX: Invalid or 0 target check
  if (isNaN(target) || target <= 0) {
    return {
      targetScore: 0,
      requiredStudyHours: currentStudy,
      studyDelta: 0,
      requiredAttendance: Math.max(75, Math.round(currentAttendance)),
      requiredTests: currentTests,
      isAchieved: true,
      message: 'Please enter a target score greater than 0%.'
    };
  }

  // FIX: Target score already reached or lower than current standing
  if (target <= currentScore) {
    return {
      targetScore: target,
      requiredStudyHours: currentStudy,
      studyDelta: 0,
      requiredAttendance: Math.round(currentAttendance),
      requiredTests: currentTests,
      isAchieved: true,
      message: 'Target already achieved with current habits!'
    };
  }

  // Calculate required study hours increase
  const scoreGap = target - currentScore;
  const additionalHoursNeeded = scoreGap / 2.5; // 1 study hour = +2.5% score

  let requiredStudyHours = Math.min(12, Math.round((currentStudy + additionalHoursNeeded) * 10) / 10);
  let studyDelta = Math.max(0, Math.round((requiredStudyHours - currentStudy) * 10) / 10);

  // Proportional Attendance & Practice Test Adjustments
  let requiredAttendance = Math.min(100, Math.max(75, Math.round(currentAttendance + (scoreGap * 0.15))));
  let requiredTests = Math.min(10, Math.max(currentTests, Math.round(currentTests + (scoreGap / 12))));

  return {
    targetScore: target,
    requiredStudyHours,
    studyDelta,
    requiredAttendance,
    requiredTests,
    isAchieved: false
  };
}

module.exports = {
  calculatePrediction,
  calculateGoalRequirements
};