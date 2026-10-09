import type { Assessment, Assignment, AttendanceRecord, MentoringPlan, Prediction, Project, Skill, Student } from "./types";

export const students: Student[] = [
  { id: "STU-2024-001", name: "Aarav Mehta", email: "aarav.mehta@northstar.edu", department: "Computer Science", course: "B.Tech Computer Science", year: 3, semester: 6, attendance: 92, score: 86, status: "On track" },
  { id: "STU-2024-002", name: "Diya Sharma", email: "diya.sharma@northstar.edu", department: "Computer Science", course: "B.Tech Computer Science", year: 3, semester: 6, attendance: 74, score: 68, status: "Needs review" },
  { id: "STU-2024-003", name: "Kabir Patel", email: "kabir.patel@northstar.edu", department: "Information Technology", course: "B.Tech Information Technology", year: 2, semester: 4, attendance: 81, score: 73, status: "On track" },
  { id: "STU-2024-004", name: "Ananya Rao", email: "ananya.rao@northstar.edu", department: "Computer Science", course: "B.Tech Computer Science", year: 4, semester: 8, attendance: 66, score: 59, status: "At risk" },
  { id: "STU-2024-005", name: "Ishaan Gupta", email: "ishaan.gupta@northstar.edu", department: "Data Science", course: "B.Sc Data Science", year: 2, semester: 4, attendance: 88, score: 82, status: "On track" },
  { id: "STU-2024-006", name: "Mira Nair", email: "mira.nair@northstar.edu", department: "Information Technology", course: "B.Tech Information Technology", year: 3, semester: 6, attendance: 79, score: 77, status: "Needs review" },
  { id: "STU-2024-007", name: "Rohan Shah", email: "rohan.shah@northstar.edu", department: "Data Science", course: "B.Sc Data Science", year: 1, semester: 2, attendance: 95, score: 91, status: "On track" },
  { id: "STU-2024-008", name: "Sara Khan", email: "sara.khan@northstar.edu", department: "Computer Science", course: "B.Tech Computer Science", year: 2, semester: 4, attendance: 71, score: 64, status: "At risk" }
];

export const subjects = ["Data Structures", "Database Systems", "Machine Learning", "Web Development", "Communication Skills"];
export const assessments: Assessment[] = [
  { id: "ASM-201", title: "Mid-semester examination", subject: "Data Structures", type: "Examination", date: "2026-10-08", maxMarks: 100, weight: 30, status: "Results published" },
  { id: "ASM-202", title: "SQL case study", subject: "Database Systems", type: "Assignment", date: "2026-10-22", maxMarks: 50, weight: 15, status: "Evaluation in progress" },
  { id: "ASM-203", title: "Model evaluation lab", subject: "Machine Learning", type: "Practical", date: "2026-10-28", maxMarks: 25, weight: 10, status: "Upcoming" },
  { id: "ASM-204", title: "Responsive portfolio", subject: "Web Development", type: "Project", date: "2026-11-02", maxMarks: 100, weight: 25, status: "Upcoming" }
];
export const assignments: Assignment[] = [
  { id: "ASG-31", title: "SQL query optimization", subject: "Database Systems", due: "2026-10-14", submissions: 21, total: 28, status: "Evaluation in progress" },
  { id: "ASG-32", title: "Sorting algorithms lab", subject: "Data Structures", due: "2026-10-17", submissions: 26, total: 28, status: "Due soon" },
  { id: "ASG-33", title: "Portfolio reflection", subject: "Web Development", due: "2026-10-20", submissions: 14, total: 28, status: "Accepting submissions" }
];
export const attendance: AttendanceRecord[] = students.flatMap((student, index) =>
  Array.from({ length: 6 }, (_, day) => ({
    studentId: student.id,
    date: `2026-10-${String(1 + day * 2).padStart(2, "0")}`,
    subject: subjects[(index + day) % subjects.length],
    status: (day === 2 && index % 3 === 0 ? "Absent" : day === 4 && index % 4 === 0 ? "Leave" : "Present") as AttendanceRecord["status"]
  }))
);
export const skillCatalog: Skill[] = [
  { name: "Programming", interest: 86, assessed: 78, demonstrated: 82, validated: true },
  { name: "Communication", interest: 72, assessed: 68, demonstrated: 74, validated: true },
  { name: "Problem-solving", interest: 90, assessed: 84, demonstrated: 88, validated: true },
  { name: "Teamwork", interest: 76, assessed: 81, demonstrated: 79, validated: false },
  { name: "Leadership", interest: 68, assessed: 72, demonstrated: 65, validated: false },
  { name: "Creativity", interest: 82, assessed: 77, demonstrated: 85, validated: true },
  { name: "Content writing", interest: 59, assessed: 63, demonstrated: 61, validated: false },
  { name: "Business aptitude", interest: 65, assessed: 70, demonstrated: 66, validated: false }
];
export const projects: Project[] = [
  { id: "PRJ-101", title: "Campus sustainability tracker", owner: "Aarav Mehta", description: "A student-led dashboard that makes campus energy use easier to understand.", skills: ["React", "Data visualization", "Teamwork"], status: "Faculty reviewed" },
  { id: "PRJ-102", title: "Accessible study planner", owner: "Diya Sharma", description: "An inclusive planner concept with a focus on accessible interactions.", skills: ["UX research", "Prototyping", "Communication"], status: "Submitted" },
  { id: "PRJ-103", title: "Library demand forecast", owner: "Rohan Shah", description: "Exploring library occupancy patterns using historical check-in data.", skills: ["Python", "Machine learning"], status: "In progress" }
];
export const predictions: Prediction[] = [
  { studentId: students[3].id, target: "Semester academic outcome", risk: "Elevated review priority", factors: ["Attendance below 70%", "Two recent assessment declines"], period: "Aug – Oct 2026", updated: "Oct 9, 2026", version: "Ruleset demo v1.2", confidence: 68, action: "Review attendance and offer a check-in" },
  { studentId: students[1].id, target: "Semester academic outcome", risk: "Moderate review priority", factors: ["Attendance trending down", "One incomplete assessment"], period: "Aug – Oct 2026", updated: "Oct 9, 2026", version: "Ruleset demo v1.2", confidence: 61, action: "Confirm assessment support needs" },
  { studentId: students[7].id, target: "Semester academic outcome", risk: "Moderate review priority", factors: ["Recent scores below cohort average"], period: "Aug – Oct 2026", updated: "Oct 9, 2026", version: "Ruleset demo v1.2", confidence: 57, action: "Discuss study plan at next mentoring session" }
];
export const mentoringPlans: MentoringPlan[] = [
  { id: "MEN-21", studentId: students[3].id, goal: "Build a consistent attendance and revision routine", faculty: "Prof. Neha Iyer", target: "2026-11-15", followUp: "2026-10-21", status: "In progress" },
  { id: "MEN-22", studentId: students[1].id, goal: "Complete pending database assessment", faculty: "Prof. Arjun Rao", target: "2026-10-30", followUp: "2026-10-16", status: "On track" }
];
export const scoreTrend = [
  { period: "Mar", score: 69, attendance: 79 }, { period: "Apr", score: 72, attendance: 82 },
  { period: "May", score: 70, attendance: 80 }, { period: "Jun", score: 76, attendance: 84 },
  { period: "Jul", score: 79, attendance: 86 }, { period: "Aug", score: 77, attendance: 85 },
  { period: "Sep", score: 83, attendance: 88 }, { period: "Oct", score: 86, attendance: 90 }
];
