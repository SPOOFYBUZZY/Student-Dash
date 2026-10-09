import { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Shell } from "./components";
import {
  AnalyticsPage, AssignmentsPage, AssessmentsPage, AttendancePage, AuthPage, Dashboard, MentoringPage, StudentAssessmentsPage,
  NotFound, PredictionsPage, ProjectsPage, ReportsPage, SettingsPage, SkillsPage, StudentProfile, StudentsPage
} from "./pages";
import type { Role } from "./types";

function currentRole(): Role | null {
  const stored = localStorage.getItem("student-intelligence-role");
  return stored === "student" || stored === "faculty" ? stored : null;
}

export default function App() {
  const [role, updateRole] = useState<Role | null>(currentRole);
  const location = useLocation();
  const setRole = (next: Role | null) => {
    if (next) localStorage.setItem("student-intelligence-role", next);
    else localStorage.removeItem("student-intelligence-role");
    updateRole(next);
  };
  const studentPath = location.pathname.startsWith("/student");
  const facultyPath = location.pathname.startsWith("/faculty");
  if (!role && location.pathname !== "/login" && location.pathname !== "/forgot-password") return <Navigate to="/login" replace />;
  if (studentPath && role !== "student") return <Navigate to="/faculty/dashboard" replace />;
  if (facultyPath && role !== "faculty") return <Navigate to="/student/dashboard" replace />;
  const activeRole = role ?? "faculty";

  return <Routes>
    <Route path="/login" element={<AuthPage onSignIn={setRole} />} />
    <Route path="/forgot-password" element={<AuthPage forgot onSignIn={setRole} />} />
    <Route path="/" element={<Navigate to={activeRole === "faculty" ? "/faculty/dashboard" : "/student/dashboard"} replace />} />
    <Route path="/faculty/dashboard" element={<Shell role={activeRole} setRole={setRole}><Dashboard role="faculty" /></Shell>} />
    <Route path="/faculty/students" element={<Shell role={activeRole} setRole={setRole}><StudentsPage /></Shell>} />
    <Route path="/faculty/students/:id" element={<Shell role={activeRole} setRole={setRole}><StudentProfile /></Shell>} />
    <Route path="/faculty/attendance" element={<Shell role={activeRole} setRole={setRole}><AttendancePage /></Shell>} />
    <Route path="/faculty/assessments" element={<Shell role={activeRole} setRole={setRole}><AssessmentsPage /></Shell>} />
    <Route path="/faculty/assessments/new" element={<Shell role={activeRole} setRole={setRole}><AssessmentsPage create /></Shell>} />
    <Route path="/faculty/assignments" element={<Shell role={activeRole} setRole={setRole}><AssignmentsPage /></Shell>} />
    <Route path="/faculty/skills" element={<Shell role={activeRole} setRole={setRole}><SkillsPage /></Shell>} />
    <Route path="/faculty/projects" element={<Shell role={activeRole} setRole={setRole}><ProjectsPage /></Shell>} />
    <Route path="/faculty/analytics" element={<Shell role={activeRole} setRole={setRole}><AnalyticsPage /></Shell>} />
    <Route path="/faculty/predictions" element={<Shell role={activeRole} setRole={setRole}><PredictionsPage /></Shell>} />
    <Route path="/faculty/mentoring" element={<Shell role={activeRole} setRole={setRole}><MentoringPage /></Shell>} />
    <Route path="/faculty/reports" element={<Shell role={activeRole} setRole={setRole}><ReportsPage /></Shell>} />
    <Route path="/student/dashboard" element={<Shell role={activeRole} setRole={setRole}><Dashboard role="student" /></Shell>} />
    <Route path="/student/assessments" element={<Shell role={activeRole} setRole={setRole}><StudentAssessmentsPage /></Shell>} />
    <Route path="/student/portfolio" element={<Shell role={activeRole} setRole={setRole}><ProjectsPage portfolio /></Shell>} />
    <Route path="/settings" element={<Shell role={activeRole} setRole={setRole}><SettingsPage role={activeRole} /></Shell>} />
    <Route path="*" element={<Shell role={activeRole} setRole={setRole}><NotFound /></Shell>} />
  </Routes>;
}
