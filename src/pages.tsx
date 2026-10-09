import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Activity, ArrowUpRight, Award, BarChart3, BookOpen, Check, CircleAlert, Clock3,
  Download, FilePlus2, GraduationCap, Plus, Search, Sparkles, Users
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from "recharts";
import { assessments as seedAssessments, mentoringPlans, predictions, scoreTrend, skillCatalog, subjects } from "./data";
import { Badge, Button, Card, CardTitle, EmptyState, LinkButton, PageHeading, StatCard, useToast } from "./components";
import { readDemoState, updateDemoState } from "./services";
import type { Assessment, MentoringPlan, Project, Role, SkillSubmission, Student } from "./types";

const pct = (values: number[]) => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
const toneFor = (status: string): "green" | "amber" | "red" | "blue" | "slate" => status === "On track" || status === "Present" || status === "Faculty reviewed" || status === "Approved" ? "green" : status === "Needs review" || status === "Due soon" || status === "In progress" || status === "Pending review" ? "amber" : status === "At risk" || status === "Absent" || status === "Needs changes" ? "red" : status === "Upcoming" ? "blue" : "slate";

function useDemoData() {
  const [revision, setRevision] = useState(0);
  const state = useMemo(() => readDemoState(), [revision]);
  useEffect(() => {
    const handler = () => setRevision(value => value + 1);
    window.addEventListener("demo-data-updated", handler);
    return () => window.removeEventListener("demo-data-updated", handler);
  }, []);
  return state;
}

export function StudentAssessmentsPage() {
  const state = useDemoData();
  const student = state.students[0];
  const [status, setStatus] = useState("All assessments");
  const records = state.assessments.map((item, index) => {
    const result = readAssessmentResults()[item.id]?.[student.id];
    const published = result !== undefined || item.status === "Results published";
    return {
      ...item,
      result: result ?? (published ? Math.round(student.score + [4, -3, 2, -1][index % 4]) : null),
      personalStatus: published ? "Results published" : index === 1 ? "Submission received" : "Upcoming"
    };
  }).filter(item => status === "All assessments" || (status === "Upcoming" ? item.personalStatus === "Upcoming" : item.personalStatus !== "Upcoming"));
  return <><PageHeading eyebrow="Student workspace" title="My assessments" description="Your own assessment schedule, results and submission status." action={<select className="field w-auto" value={status} onChange={event => setStatus(event.target.value)} aria-label="Filter my assessments"><option>All assessments</option><option>Upcoming</option><option>Submitted or graded</option></select>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><StatCard label="Current academic average" value={`${student.score}%`} note="this semester" tone="teal" icon={<BarChart3 size={17} />} /><StatCard label="Completed assessments" value={`${records.filter(item => item.personalStatus !== "Upcoming").length} / ${state.assessments.length}`} note="submitted or graded" icon={<Check size={17} />} /><StatCard label="Upcoming" value={state.assessments.filter(item => item.date >= new Date().toISOString().slice(0, 10) && item.status === "Upcoming").length} note="scheduled assessments" tone="amber" icon={<Clock3 size={17} />} /></div>
    <Card><CardTitle title="Assessment timeline" subtitle={`${student.name} · private student view`} /><div className="px-5 pb-5 pt-3"><DataTable headers={["Assessment", "Subject", "Date", "Maximum marks", "Your result", "Status"]} empty={!records.length}>{records.map(item => <tr key={item.id}><td className="px-5 py-3.5"><span className="block text-xs font-semibold">{item.title}</span><span className="text-[10px] text-slate-400">{item.type}</span></td><td className="px-4 py-3 text-xs">{item.subject}</td><td className="px-4 py-3 text-xs">{item.date}</td><td className="px-4 py-3 text-xs">{item.maxMarks}</td><td className="px-4 py-3 text-xs font-semibold">{item.result === null ? "—" : `${item.result} / ${item.maxMarks}`}</td><td className="px-4 py-3"><Badge tone={toneFor(item.personalStatus)}>{item.personalStatus}</Badge></td></tr>)}</DataTable></div></Card>
  </>;
}

function DataTable({ headers, children, empty }: { headers: string[]; children: React.ReactNode; empty?: boolean }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr>{headers.map(header => <th key={header} className="table-head px-4 py-3 first:pl-5 last:pr-5">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{empty ? <tr><td colSpan={headers.length}><EmptyState title="No records found" description="Adjust your search or filters and try again." /></td></tr> : children}</tbody></table></div>;
}

export function Dashboard({ role }: { role: Role }) {
  const state = useDemoData();
  const [period, setPeriod] = useState("This semester");
  const avg = pct(state.students.map(student => student.score));
  const attendanceAvg = pct(state.students.map(student => student.attendance));
  const assignmentCompletion = state.assignments.reduce((sum, item) => sum + item.submissions, 0);
  const assignmentCapacity = state.assignments.reduce((sum, item) => sum + item.total, 0);
  const completionPercent = assignmentCapacity ? Math.round(assignmentCompletion / assignmentCapacity * 100) : 0;
  const attention = state.students.filter(student => student.status !== "On track");
  const subjectScores = subjects.map((subject, index) => ({ subject: subject.split(" ")[0], score: pct(state.students.map(student => Math.max(0, Math.min(100, student.score + [-5, 2, -3, 4, 1][index])))) }));
  const trendData = period === "This semester" ? scoreTrend.slice(-4) : period === "Last semester" ? scoreTrend.slice(0, 4) : scoreTrend;
  const student = state.students[0];
  const myProjects = state.projects.filter(project => project.owner === student.name);
  const assessmentsDue = state.assessments.filter(item => item.status === "Upcoming").length;
  return <>
    <PageHeading eyebrow={role === "faculty" ? "Faculty workspace · Fall 2026" : "Student workspace · Fall 2026"} title={role === "faculty" ? "Good morning, Neha" : `Welcome back, ${student.name.split(" ")[0]}`} description={role === "faculty" ? "A clear view of progress across your assigned cohort." : "Your learning journey at a glance. Keep up the great work."} action={role === "faculty" ? <><select className="field w-auto" value={period} onChange={event => setPeriod(event.target.value)} aria-label="Select dashboard period"><option>This semester</option><option>Last semester</option><option>Academic year</option></select><Link to="/faculty/reports"><Button><ArrowUpRight size={14} />Reports</Button></Link></> : <Badge tone="blue">Fall semester · 2026</Badge>} />
    {role === "faculty" ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Assigned students" value={state.students.length} note="across 3 programs" icon={<Users size={17} />} />
      <StatCard label="Class average" value={`${avg}%`} note="academic performance" trend="+4.2%" icon={<BarChart3 size={17} />} tone="teal" />
      <StatCard label="Attendance rate" value={`${attendanceAvg}%`} note="this semester" trend="+2.8%" icon={<GraduationCap size={17} />} tone="teal" />
      <StatCard label="Require review" value={attention.length} note="recommended faculty check-in" icon={<CircleAlert size={17} />} tone="amber" />
    </div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Academic average" value={`${student.score}%`} note="across your current courses" trend="+3.4%" icon={<BarChart3 size={17} />} tone="teal" />
      <StatCard label="Attendance" value={`${student.attendance}%`} note="this semester" trend="+1.8%" icon={<GraduationCap size={17} />} tone="teal" />
      <StatCard label="Assessments due" value={assessmentsDue} note="scheduled evaluations" icon={<Clock3 size={17} />} tone="amber" />
      <StatCard label="Portfolio progress" value={`${Math.min(100, Math.round(myProjects.length / 4 * 100))}%`} note={`${myProjects.length} project${myProjects.length === 1 ? "" : "s"} documented`} icon={<Award size={17} />} />
    </div>}
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
      <Card><CardTitle title={role === "faculty" ? "Academic performance trend" : "Your academic progress"} subtitle={`Average assessment score · ${period.toLowerCase()}`} action={<Badge tone="blue">{period}</Badge>} />
        <div className="h-[245px] px-3 pb-3 pt-4 sm:px-5"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData}><defs><linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4465e8" stopOpacity={0.2} /><stop offset="95%" stopColor="#4465e8" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#edf0f5" vertical={false} /><XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={8} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} domain={[50, 100]} /><Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} /><Area type="monotone" dataKey="score" stroke="#4465e8" strokeWidth={2.5} fill="url(#scoreFill)" name="Academic score" /></AreaChart></ResponsiveContainer></div>
      </Card>
      <Card><CardTitle title="Attendance trend" subtitle="Cohort attendance rate by month" />
        <div className="h-[245px] px-3 pb-3 pt-4 sm:px-5"><ResponsiveContainer width="100%" height="100%"><LineChart data={trendData}><CartesianGrid stroke="#edf0f5" vertical={false} /><XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={8} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} domain={[60, 100]} /><Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} /><Line type="monotone" dataKey="attendance" stroke="#139b83" strokeWidth={2.5} dot={{ r: 3, fill: "#139b83" }} name="Attendance" /></LineChart></ResponsiveContainer></div>
      </Card>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_1fr_1fr]">
      <Card><CardTitle title={role === "faculty" ? "Students to check in with" : "Upcoming assessments"} subtitle={role === "faculty" ? `${attention.length} students may benefit from a check-in` : "Your next important dates"} action={<LinkButton to={role === "faculty" ? "/faculty/students" : "/student/assessments"}>View all</LinkButton>} />
        <div className="px-5 pb-3 pt-3">{role === "faculty" ? attention.slice(0, 4).map(item => <Link key={item.id} to={`/faculty/students/${item.id}`} className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0"><span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">{item.name.split(" ").map(part => part[0]).join("")}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{item.name}</span><span className="text-[10px] text-slate-500">{item.id} · score {item.score}%</span></span><Badge tone={toneFor(item.status)}>{item.status}</Badge></Link>) : seedAssessments.slice(0, 3).map(item => <div key={item.id} className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0"><span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600"><BookOpen size={16} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{item.title}</span><span className="text-[10px] text-slate-500">{item.subject} · {item.date}</span></span><Badge tone={toneFor(item.status)}>{item.status}</Badge></div>)}</div>
      </Card>
      <Card><CardTitle title="Assignment completion" subtitle="Student submissions across current assignments" /><div className="h-[150px] px-4 pt-3"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ value: completionPercent, color: "#4465e8" }, { value: 100 - completionPercent, color: "#edf0f5" }]} dataKey="value" innerRadius={43} outerRadius={59} startAngle={90} endAngle={-270} stroke="none">{[0, 1].map(i => <Cell key={i} fill={i === 0 ? "#4465e8" : "#edf0f5"} />)}</Pie><Tooltip /><text x="50%" y="48%" textAnchor="middle" className="fill-slate-800 text-[21px] font-semibold">{completionPercent}%</text><text x="50%" y="61%" textAnchor="middle" className="fill-slate-400 text-[9px]">SUBMITTED</text></PieChart></ResponsiveContainer></div><div className="flex justify-center gap-5 pb-4 text-[10px] text-slate-500"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-brand" />Submitted {completionPercent}%</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-200" />Pending {100 - completionPercent}%</span></div></Card>
      <Card><CardTitle title={role === "faculty" ? "Quick actions" : "Your learning goals"} subtitle={role === "faculty" ? "Common faculty tasks" : "Recommended next steps"} /><div className="space-y-2 p-4 pt-3">{(role === "faculty" ? [["/faculty/attendance", "Take attendance", "Open today's class register"], ["/faculty/assessments/new", "Create an assessment", "Set up a new evaluation"], ["/faculty/mentoring", "Review mentoring plans", "Follow up on student goals"]] : [["/student/portfolio", "Update your portfolio", "Add recent projects and evidence"], ["/student/portfolio", "Review your skill profile", "Reflect on demonstrated strengths"], ["/student/assessments", "Prepare for assessments", "See upcoming course dates"]]).map(([href, label, note]) => <Link key={label} to={href} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/40"><span><span className="block text-xs font-semibold text-slate-700">{label}</span><span className="mt-1 block text-[10px] text-slate-500">{note}</span></span><span className="text-brand"><ArrowUpRight size={15} /></span></Link>)}</div></Card>
    </div>
    {role === "faculty" && <div className="mt-5 grid gap-5 lg:grid-cols-2"><Card><CardTitle title="Subject performance" subtitle="Average assessment scores across the cohort" /><div className="h-[210px] px-3 py-4"><ResponsiveContainer width="100%" height="100%"><BarChart data={subjectScores}><CartesianGrid stroke="#edf0f5" vertical={false} /><XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} domain={[0, 100]} /><Tooltip /><Bar dataKey="score" fill="#4465e8" radius={[5, 5, 0, 0]} barSize={26} name="Average score" /></BarChart></ResponsiveContainer></div></Card><Card><CardTitle title="Recent academic activity" subtitle="Updates across your faculty workspace" /><div className="px-5 pb-4 pt-3">{[["Diya Sharma submitted SQL case study", "12 minutes ago"], ["Attendance recorded · Data Structures", "1 hour ago"], ["Aarav Mehta's project reviewed", "Yesterday, 3:42 PM"], ["Mid-semester results published", "Yesterday, 11:18 AM"]].map(([text, time], i) => <div key={text} className="flex gap-3 border-b border-slate-100 py-3 last:border-0"><span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${i % 2 ? "bg-teal-50 text-teal" : "bg-blue-50 text-brand"}`}><Activity size={13} /></span><span><span className="block text-xs font-medium text-slate-700">{text}</span><span className="mt-1 block text-[10px] text-slate-400">{time}</span></span></div>)}</div></Card></div>}
    {role === "faculty" && <Card className="mt-5"><CardTitle title="Pending assignment evaluations" subtitle="Submitted work awaiting faculty review" action={<LinkButton to="/faculty/assignments">Open assignments</LinkButton>} /><div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">{state.assignments.map(item => <Link key={item.id} to="/faculty/assignments" className="rounded-lg border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/30"><span className="block text-xs font-semibold">{item.title}</span><span className="mt-1 block text-[10px] text-slate-500">{item.subject} · due {item.due}</span><span className="mt-3 flex items-center justify-between"><span className="text-[10px] text-slate-500">{item.submissions} submitted · {item.total - item.submissions} missing</span><Badge tone="amber">{item.status}</Badge></span></Link>)}</div></Card>}
    {role === "student" && <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <Card><CardTitle title="Subject-wise marks" subtitle="Current average by subject · your student view" /><div className="px-5 pb-4 pt-3"><DataTable headers={["Subject", "Current average", "Recent assessment", "Progress"]}>{subjects.map((subjectName, index) => { const score = Math.max(40, Math.min(100, student.score + [-4, 2, -7, 3, 1][index])); return <tr key={subjectName}><td className="px-5 py-3 text-xs font-medium">{subjectName}</td><td className="px-4 py-3 text-xs font-semibold">{score}%</td><td className="px-4 py-3 text-xs text-slate-500">{index < 2 ? "Graded" : "Upcoming"}</td><td className="px-4 py-3 text-teal"><ArrowUpRight size={14} /></td></tr>; })}</DataTable></div></Card>
      <Card><CardTitle title="Skill profile" subtitle="Keep interest and demonstrated ability distinct" /><div className="space-y-3 p-5">{skillCatalog.slice(0, 4).map(skill => <div key={skill.name}><div className="mb-1.5 flex justify-between text-[11px]"><span className="font-medium">{skill.name}</span><span className="text-slate-500">Assessed {skill.assessed}% · Evidence {skill.demonstrated}%</span></div><div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal" style={{ width: `${skill.assessed}%` }} /></div></div>)}<Link to="/student/portfolio" className="inline-flex pt-1 text-xs font-semibold text-brand">Add project evidence <ArrowUpRight size={14} /></Link></div></Card>
      <Card><CardTitle title="Project & portfolio progress" subtitle="Practical evidence from your work" action={<LinkButton to="/student/portfolio">My portfolio</LinkButton>} /><div className="p-5 pt-3">{state.projects.filter(project => project.owner === student.name).length ? state.projects.filter(project => project.owner === student.name).map(project => <div key={project.id} className="mb-3 rounded-lg border border-slate-100 p-3 last:mb-0"><div className="flex justify-between gap-3"><span className="text-xs font-semibold">{project.title}</span><Badge tone={toneFor(project.status)}>{project.status}</Badge></div><p className="mt-1 text-[10px] text-slate-500">{project.skills.join(" · ")}</p></div>) : <EmptyState title="No projects documented yet" description="Start building your portfolio with projects and evidence." />}</div></Card>
      <Card><CardTitle title="Faculty feedback" subtitle="Recent note on your academic progress" /><div className="p-5 pt-3"><div className="rounded-lg border border-slate-100 bg-slate-50/70 p-4"><p className="text-xs leading-relaxed text-slate-700">“Strong progress in applied problem-solving. Keep documenting your project contributions and continue the consistent attendance trend.”</p><p className="mt-3 text-[10px] font-medium text-slate-500">Prof. Neha Iyer · Academic advisor</p></div><Link to="/student/assessments" className="mt-3 inline-flex text-xs font-semibold text-brand">Review assessment feedback <ArrowUpRight size={14} /></Link></div></Card>
    </div>}
  </>;
}

export function StudentsPage() {
  const data = useDemoData().students;
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [adding, setAdding] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", email: "", department: "Computer Science", course: "B.Tech Computer Science", year: "1", semester: "1" });
  const [formError, setFormError] = useState("");
  const toast = useToast();
  const [status, setStatus] = useState("All statuses");
  const [department, setDepartment] = useState("All departments");
  const [sort, setSort] = useState<"name" | "score" | "attendance">("name");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const filtered = useMemo(() => data.filter(student => `${student.name} ${student.id} ${student.course}`.toLowerCase().includes(query.toLowerCase()) && (status === "All statuses" || student.status === status) && (department === "All departments" || student.department === department)).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : b[sort] - a[sort]), [data, query, status, department, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const saveStudent = (event: React.FormEvent) => {
    event.preventDefault();
    if (newStudent.name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStudent.email)) { setFormError("Enter a student name and a valid email address."); return; }
    if (data.some(student => student.email.toLowerCase() === newStudent.email.trim().toLowerCase())) { setFormError("A student with this email already exists."); return; }
    const student: Student = { id: `STU-2026-${Date.now().toString().slice(-4)}`, name: newStudent.name.trim(), email: newStudent.email.trim(), department: newStudent.department, course: newStudent.course, year: Number(newStudent.year), semester: Number(newStudent.semester), attendance: 100, score: 0, status: "On track" };
    updateDemoState("students", [...data, student]);
    setAdding(false); setFormError(""); setNewStudent({ name: "", email: "", department: "Computer Science", course: "B.Tech Computer Science", year: "1", semester: "1" }); toast.show("Student added to the demo roster.");
  };
  return <><PageHeading eyebrow="Faculty workspace" title="Students" description="Search, compare and review student progress across your assigned programs." action={<Button onClick={() => setAdding(true)}><Plus size={14} />Add student</Button>} />
    <div className="mb-4 grid gap-3 sm:grid-cols-3"><StatCard label="Total students" value={data.length} note="across all programs" icon={<Users size={17} />} /><StatCard label="On track" value={data.filter(s => s.status === "On track").length} note="current semester" tone="teal" icon={<Check size={17} />} /><StatCard label="Review needed" value={data.filter(s => s.status !== "On track").length} note="faculty follow-up recommended" tone="amber" icon={<CircleAlert size={17} />} /></div>
    <Card><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Search students" className="field pl-9" placeholder="Search by name, student ID or course..." value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} /></div><select className="field w-auto min-w-[155px]" aria-label="Filter by department" value={department} onChange={e => setDepartment(e.target.value)}><option>All departments</option>{[...new Set(data.map(s => s.department))].map(dep => <option key={dep}>{dep}</option>)}</select><select className="field w-auto min-w-[145px]" aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)}><option>All statuses</option><option>On track</option><option>Needs review</option><option>At risk</option></select><select className="field w-auto min-w-[130px]" aria-label="Sort students" value={sort} onChange={e => setSort(e.target.value as typeof sort)}><option value="name">Sort: name</option><option value="score">Sort: score</option><option value="attendance">Sort: attendance</option></select></div>
      <DataTable headers={["Student", "Program", "Year / semester", "Attendance", "Academic score", "Status", ""]} empty={!filtered.length}>{filtered.slice((page - 1) * pageSize, page * pageSize).map(student => <tr key={student.id} className="hover:bg-slate-50/70"><td className="px-4 py-3.5 pl-5"><Link to={`/faculty/students/${student.id}`} className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-[10px] font-semibold text-blue-700">{student.name.split(" ").map(part => part[0]).join("")}</span><span><span className="block text-xs font-semibold text-slate-800">{student.name}</span><span className="text-[10px] text-slate-400">{student.id}</span></span></Link></td><td className="px-4 py-3 text-xs text-slate-600">{student.department}</td><td className="px-4 py-3 text-xs text-slate-600">Year {student.year} · Sem {student.semester}</td><td className="px-4 py-3 text-xs font-medium">{student.attendance}%</td><td className="px-4 py-3 text-xs font-semibold text-ink">{student.score}%</td><td className="px-4 py-3"><Badge tone={toneFor(student.status)}>{student.status}</Badge></td><td className="px-4 py-3 pr-5"><Link className="text-xs font-semibold text-brand" to={`/faculty/students/${student.id}`}>View</Link></td></tr>)}</DataTable>
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} students</span><div className="flex gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button></div></div>
    </Card>
    {adding && <div className="fixed inset-0 z-40 grid place-items-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-labelledby="add-student-title"><form onSubmit={saveStudent} className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><div><h2 id="add-student-title" className="text-base font-semibold">Add a student</h2><p className="mt-1 text-xs text-slate-500">Create a local demo roster record.</p></div><button type="button" onClick={() => { setAdding(false); setFormError(""); }} className="text-slate-400" aria-label="Close add student form">×</button></div><div className="grid gap-4 sm:grid-cols-2"><label><span className="label">Full name</span><input autoFocus className="field" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} /></label><label><span className="label">Email</span><input type="email" className="field" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} /></label><label><span className="label">Department</span><select className="field" value={newStudent.department} onChange={e => setNewStudent({ ...newStudent, department: e.target.value })}>{["Computer Science", "Information Technology", "Data Science"].map(option => <option key={option}>{option}</option>)}</select></label><label><span className="label">Program</span><select className="field" value={newStudent.course} onChange={e => setNewStudent({ ...newStudent, course: e.target.value })}>{["B.Tech Computer Science", "B.Tech Information Technology", "B.Sc Data Science"].map(option => <option key={option}>{option}</option>)}</select></label><label><span className="label">Year</span><select className="field" value={newStudent.year} onChange={e => setNewStudent({ ...newStudent, year: e.target.value, semester: String((Number(e.target.value) - 1) * 2 + 1) })}>{[1, 2, 3, 4].map(value => <option key={value} value={value}>{value}</option>)}</select></label><label><span className="label">Semester</span><select className="field" value={newStudent.semester} onChange={e => setNewStudent({ ...newStudent, semester: e.target.value })}>{[1, 2, 3, 4, 5, 6, 7, 8].map(value => <option key={value} value={value}>{value}</option>)}</select></label></div>{formError && <p role="alert" className="mt-3 text-xs text-rose-600">{formError}</p>}<div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={() => { setAdding(false); setFormError(""); }}>Cancel</Button><Button type="submit"><Plus size={14} />Add student</Button></div></form></div>}
    {toast.toast}
  </>;
}

export function StudentProfile({ self = false }: { self?: boolean }) {
  const data = useDemoData().students;
  const { id = "" } = useParams();
  const student = self ? data[0] : data.find(item => item.id === id) ?? data[0];
  const [tab, setTab] = useState("Overview");
  const tabs = ["Overview", "Academics", "Attendance", "Assessments", "Skills", "Projects", "Portfolio", "Development Plan"];
  return <><PageHeading eyebrow={self ? "My learning journey" : "Student record"} title={student.name} description={`${student.id} · ${student.course} · Year ${student.year}, semester ${student.semester}`} action={<Badge tone={toneFor(student.status)}>{student.status}</Badge>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><StatCard label="Academic average" value={`${student.score}%`} note="current semester" tone="teal" icon={<BarChart3 size={17} />} /><StatCard label="Attendance" value={`${student.attendance}%`} note="current semester" tone={student.attendance < 75 ? "amber" : "teal"} icon={<GraduationCap size={17} />} /><StatCard label="Completed assessments" value="8 / 10" note="2 items in progress" icon={<BookOpen size={17} />} /></div>
    <Card><div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-4 pt-2 sm:px-5">{tabs.map(item => <button key={item} onClick={() => setTab(item)} className={`shrink-0 border-b-2 px-3 py-3 text-xs font-medium transition ${tab === item ? "border-brand text-brand" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{item}</button>)}</div>
      {tab === "Overview" && <div className="grid gap-6 p-5 lg:grid-cols-[1.3fr_1fr]"><div><h3 className="text-sm font-semibold">Semester performance</h3><p className="mt-1 text-[11px] text-slate-500">A steady upward trend across recent terms</p><div className="mt-3 h-[230px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={scoreTrend}><CartesianGrid stroke="#edf0f5" vertical={false} /><XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} domain={[50, 100]} /><Tooltip /><Area dataKey="score" type="monotone" stroke="#4465e8" fill="#4465e81a" name="Academic score" /></AreaChart></ResponsiveContainer></div></div><div><h3 className="text-sm font-semibold">Student information</h3><div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100 px-3">{[["Email", student.email], ["Department", student.department], ["Program", student.course], ["Year", `Year ${student.year}`], ["Semester", `Semester ${student.semester}`], ["Faculty advisor", "Prof. Neha Iyer"]].map(([key, value]) => <div key={key} className="flex justify-between gap-3 py-3 text-xs"><span className="text-slate-500">{key}</span><span className="text-right font-medium text-slate-700">{value}</span></div>)}</div></div></div>}
      {tab === "Academics" && <div className="p-5"><h3 className="mb-4 text-sm font-semibold">Subject-wise results</h3><DataTable headers={["Subject", "Mid-semester", "Assignments", "Current average", "Trend"]}>{subjects.slice(0, 4).map((subject, i) => <tr key={subject}><td className="px-5 py-3 text-xs font-medium">{subject}</td><td className="px-4 py-3 text-xs">{[82, 75, 88, 79][i]} / 100</td><td className="px-4 py-3 text-xs">{[4, 3, 5, 4][i]} / 5</td><td className="px-4 py-3 text-xs font-semibold">{[83, 76, 85, 80][i]}%</td><td className="px-4 py-3 text-teal"><ArrowUpRight size={15} /></td></tr>)}</DataTable></div>}
      {tab === "Attendance" && <div className="p-5"><h3 className="mb-4 text-sm font-semibold">Attendance history</h3><DataTable headers={["Month", "Classes held", "Present", "Attendance"]}>{["October", "September", "August"].map((m, i) => <tr key={m}><td className="px-5 py-3 text-xs font-medium">{m} 2026</td><td className="px-4 py-3 text-xs">24</td><td className="px-4 py-3 text-xs">{[22, 21, 20][i]}</td><td className="px-4 py-3 text-xs font-semibold">{[92, 88, 83][i]}%</td></tr>)}</DataTable></div>}
      {tab !== "Overview" && tab !== "Academics" && tab !== "Attendance" && <div className="p-5"><h3 className="mb-3 text-sm font-semibold">{tab}</h3>{tab === "Skills" ? <div className="grid gap-3 sm:grid-cols-2">{skillCatalog.slice(0, 4).map(skill => <div key={skill.name} className="rounded-xl border border-slate-100 p-4"><div className="flex justify-between text-xs font-medium"><span>{skill.name}</span><Badge tone={skill.validated ? "green" : "slate"}>{skill.validated ? "Validated" : "In progress"}</Badge></div><div className="mt-3 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand" style={{ width: `${skill.assessed}%` }} /></div><p className="mt-2 text-[10px] text-slate-500">Assessed ability · {skill.assessed}% · Project evidence {skill.demonstrated}%</p></div>)}</div> : <EmptyState title={`${tab} records`} description="Records and learning evidence are available in the connected student workspace." />}</div>}
    </Card>
  </>;
}

const attendanceSchema = z.object({ date: z.string().min(1, "Select a class date"), subject: z.string().min(1, "Select a subject") });
export function AttendancePage() {
  const state = useDemoData();
  const [subject, setSubject] = useState(subjects[0]);
  const [date, setDate] = useState("2026-10-12");
  const [courseFilter, setCourseFilter] = useState(`${state.students[0].course} · Year ${state.students[0].year}`);
  const [query, setQuery] = useState("");
  const [register, setRegister] = useState<Record<string, "Present" | "Absent" | "Leave">>({});
  const [error, setError] = useState("");
  const toast = useToast();
  const classStudents = state.students.filter(student => `${student.course} · Year ${student.year}` === courseFilter);
  const students = classStudents.filter(student => `${student.name} ${student.id}`.toLowerCase().includes(query.toLowerCase()));
  const classes = [...new Set(state.students.map(student => `${student.course} · Year ${student.year}`))];
  const presentCount = Object.values(register).filter(value => value === "Present").length;
  const setAll = (status: "Present" | "Absent" | "Leave") => setRegister(Object.fromEntries(classStudents.map(student => [student.id, status])));
  const save = () => {
    const valid = attendanceSchema.safeParse({ date, subject });
    if (!valid.success) { setError(valid.error.issues[0]?.message ?? "Enter a valid class date and subject."); return; }
    const classStudentIds = new Set(classStudents.map(student => student.id));
    const existing = state.attendance.some(record => classStudentIds.has(record.studentId) && record.date === date && record.subject === subject);
    if (existing && !window.confirm("A session already exists for this subject and date. Replace its attendance?")) return;
    if (!Object.keys(register).length) { setError("Mark attendance for at least one student before saving."); return; }
    const next = [...state.attendance.filter(record => !classStudentIds.has(record.studentId) || record.date !== date || record.subject !== subject), ...Object.entries(register).map(([studentId, status]) => ({ studentId, date, subject, status }))];
    updateDemoState("attendance", next);
    updateDemoState("students", state.students.map(student => {
      const status = register[student.id];
      if (!status) return student;
      const previous = state.attendance.find(record => record.studentId === student.id && record.date === date && record.subject === subject);
      const attendanceChange = (status === "Present" ? 1 : 0) - (previous?.status === "Present" ? 1 : 0);
      return { ...student, attendance: Math.max(0, Math.min(100, Math.round(student.attendance + attendanceChange * (100 / 30)))) };
    }));
    setError("");
    toast.show("Attendance register saved.");
  };
  return <><PageHeading eyebrow="Faculty workspace" title="Attendance" description="Record class attendance and review historical sessions." action={<Button variant="secondary" onClick={() => { setRegister({}); setError(""); }}>Reset register</Button>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><StatCard label="Class attendance" value={`${pct(classStudents.map(student => student.attendance))}%`} note="selected class average" tone="teal" icon={<GraduationCap size={17} />} /><StatCard label="Students in register" value={classStudents.length} note={courseFilter} icon={<Users size={17} />} /><StatCard label="Marked present" value={`${presentCount} / ${classStudents.length}`} note="current session" tone="blue" icon={<Check size={17} />} /></div>
    <Card><div className="grid gap-4 border-b border-slate-100 p-5 md:grid-cols-[1fr_1fr_1fr_auto]"><label><span className="label">Class / course</span><select className="field" value={courseFilter} onChange={e => { setCourseFilter(e.target.value); setRegister({}); setError(""); }}>{classes.map(item => <option key={item}>{item}</option>)}</select></label><label><span className="label">Subject</span><select className="field" value={subject} onChange={e => { setSubject(e.target.value); setRegister({}); }}>{subjects.map(item => <option key={item}>{item}</option>)}</select></label><label><span className="label">Session date</span><input className="field" type="date" value={date} onChange={e => { setDate(e.target.value); setRegister({}); }} /></label><div className="flex items-end"><Button onClick={() => setAll("Present")}><Check size={14} />Mark all present</Button></div></div>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative max-w-sm flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="field pl-9" placeholder="Filter students..." aria-label="Filter attendance roster" value={query} onChange={e => setQuery(e.target.value)} /></div><div className="flex gap-2"><Button variant="secondary" onClick={() => setAll("Absent")}>Mark all absent</Button><Button variant="secondary" onClick={() => setAll("Leave")}>Mark all leave</Button></div></div>
      <DataTable headers={["Student", "Student ID", "Current attendance", "Session status"]}>{students.map(student => <tr key={student.id}><td className="px-5 py-3 text-xs font-semibold">{student.name}</td><td className="px-4 py-3 text-xs text-slate-500">{student.id}</td><td className="px-4 py-3 text-xs">{student.attendance}%</td><td className="px-4 py-3"><select aria-label={`Attendance status for ${student.name}`} className="field w-36 py-1.5" value={register[student.id] ?? ""} onChange={e => setRegister(current => ({ ...current, [student.id]: e.target.value as "Present" | "Absent" | "Leave" }))}><option value="">Not marked</option><option>Present</option><option>Absent</option><option>Leave</option></select></td></tr>)}</DataTable>
      {error && <p role="alert" className="px-5 pt-3 text-xs text-rose-600">{error}</p>}
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4"><span className="text-xs text-slate-500">Session: <b className="font-medium text-slate-700">{subject}</b> · {date}</span><Button onClick={save}>Save attendance</Button></div>
    </Card><div className="mt-5">{toast.toast}</div>
  </>;
}

const assessmentSchema = z.object({ title: z.string().min(3, "Enter at least 3 characters"), subject: z.string().min(1), type: z.string(), date: z.string().min(1), maxMarks: z.coerce.number().positive(), weight: z.coerce.number().min(1).max(100) });
type AssessmentInput = z.infer<typeof assessmentSchema>;
type AssessmentResults = Record<string, Record<string, number>>;
function readAssessmentResults(): AssessmentResults {
  try {
    return JSON.parse(localStorage.getItem("student-intelligence-assessment-results") ?? "{}") as AssessmentResults;
  } catch (error) {
    console.error("Unable to read demo assessment results.", error);
    return {};
  }
}
export function AssessmentsPage({ create = false }: { create?: boolean }) {
  const state = useDemoData();
  const [selected, setSelected] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState("All subjects");
  const [marks, setMarks] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const toast = useToast();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<AssessmentInput>({ resolver: zodResolver(assessmentSchema), defaultValues: { title: "", subject: subjects[0], type: "Examination", date: "", maxMarks: 100, weight: 25 } });
  const createAssessment = handleSubmit(values => {
    const item: Assessment = { ...values, id: `ASM-${Date.now().toString().slice(-5)}`, status: "Upcoming" };
    updateDemoState("assessments", [...state.assessments, item]);
    reset(); toast.show("Assessment created."); navigate("/faculty/assessments");
  });
  if (create) return <><PageHeading eyebrow="Assessments" title="Create an assessment" description="Set up an exam, assignment or practical evaluation for your students." action={<Button variant="secondary" onClick={() => navigate("/faculty/assessments")}>Cancel</Button>} />
    <form onSubmit={createAssessment} className="mx-auto max-w-3xl"><Card><div className="grid gap-5 p-5 sm:grid-cols-2">
      <label className="sm:col-span-2"><span className="label">Assessment title</span><input {...register("title")} className="field" placeholder="e.g. Mid-semester examination" />{errors.title && <span className="mt-1 block text-[11px] text-rose-600">{errors.title.message}</span>}</label>
      <label><span className="label">Subject</span><select {...register("subject")} className="field">{subjects.map(item => <option key={item}>{item}</option>)}</select></label>
      <label><span className="label">Assessment type</span><select {...register("type")} className="field"><option>Examination</option><option>Assignment</option><option>Practical</option><option>Project</option><option>Quiz</option></select></label>
      <label><span className="label">Assessment date</span><input {...register("date")} type="date" className="field" />{errors.date && <span className="mt-1 block text-[11px] text-rose-600">{errors.date.message}</span>}</label>
      <label><span className="label">Maximum marks</span><input {...register("maxMarks")} type="number" min="1" className="field" />{errors.maxMarks && <span className="mt-1 block text-[11px] text-rose-600">{errors.maxMarks.message}</span>}</label>
      <label><span className="label">Course weighting (%)</span><input {...register("weight")} type="number" min="1" max="100" className="field" />{errors.weight && <span className="mt-1 block text-[11px] text-rose-600">{errors.weight.message}</span>}</label>
      <div className="flex items-end text-[11px] text-slate-500">Assessment configurations are saved locally for this demo.</div>
    </div><div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4"><Button type="submit"><Plus size={14} />Create assessment</Button></div></Card></form>{toast.toast}</>;
  return <><PageHeading eyebrow="Faculty workspace" title="Assessments & examinations" description="Create evaluations, enter results and review assessment history." action={<Link to="/faculty/assessments/new"><Button><Plus size={14} />Create assessment</Button></Link>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><StatCard label="Assessments this term" value={state.assessments.length} note="across all subjects" icon={<BookOpen size={17} />} /><StatCard label="Evaluation in progress" value={state.assessments.filter(item => item.status.includes("progress")).length} note="results to publish" tone="amber" icon={<Clock3 size={17} />} /><StatCard label="Average completion" value="74%" note="student submissions" tone="teal" icon={<Check size={17} />} /></div>
    <Card><CardTitle title="Assessment schedule" subtitle="Review upcoming and recent evaluations" action={<select className="field w-auto" aria-label="Filter assessments by subject" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}><option>All subjects</option>{subjects.map(item => <option key={item}>{item}</option>)}</select>} />
      <div className="px-5 pb-5 pt-3"><DataTable headers={["Assessment", "Subject", "Type", "Date", "Weight", "Evaluation status", "Actions"]} empty={!state.assessments.some(item => subjectFilter === "All subjects" || item.subject === subjectFilter)}>{state.assessments.filter(item => subjectFilter === "All subjects" || item.subject === subjectFilter).map(item => <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-5 py-3.5"><span className="block text-xs font-semibold">{item.title}</span><span className="text-[10px] text-slate-400">{item.id} · {item.maxMarks} marks</span></td><td className="px-4 py-3 text-xs">{item.subject}</td><td className="px-4 py-3 text-xs text-slate-500">{item.type}</td><td className="px-4 py-3 text-xs">{item.date}</td><td className="px-4 py-3 text-xs">{item.weight}%</td><td className="px-4 py-3"><Badge tone={toneFor(item.status)}>{item.status}</Badge></td><td className="px-4 py-3"><button onClick={() => { if (selected === item.id) { setSelected(null); return; } setSelected(item.id); setMarks(Object.fromEntries(Object.entries(readAssessmentResults()[item.id] ?? {}).map(([studentId, mark]) => [studentId, String(mark)]))); }} className="text-xs font-semibold text-brand">{selected === item.id ? "Close results" : "Enter marks"}</button></td></tr>)}</DataTable>
        {selected && <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/40 p-4"><div className="mb-3 flex items-center justify-between"><div><h3 className="text-xs font-semibold">Result entry · {selected}</h3><p className="mt-1 text-[10px] text-slate-500">Enter a mark and save. Results are simulated for this demo.</p></div><Button onClick={() => { const assessment = state.assessments.find(item => item.id === selected); const entries = Object.entries(marks).filter(([, mark]) => mark.trim() !== ""); if (!entries.length) { toast.show("Enter at least one result before saving."); return; } if (entries.some(([, mark]) => Number(mark) < 0 || Number(mark) > (assessment?.maxMarks ?? 100))) { toast.show(`Marks must be between 0 and ${assessment?.maxMarks ?? 100}.`); return; } try { const results = readAssessmentResults(); results[selected] = Object.fromEntries(entries.map(([studentId, mark]) => [studentId, Number(mark)])); localStorage.setItem("student-intelligence-assessment-results", JSON.stringify(results)); updateDemoState("assessments", state.assessments.map(item => item.id === selected ? { ...item, status: "Results published" } : item)); setSelected(null); toast.show("Assessment results saved."); } catch (error) { console.error("Unable to save demo assessment results.", error); toast.show("Could not save results. Check browser storage and try again."); } }}>Save results</Button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{state.students.map(student => <label key={student.id} className="text-[11px]"><span className="label">{student.name}</span><input type="number" min="0" max={state.assessments.find(a => a.id === selected)?.maxMarks} className="field bg-white" placeholder="Not graded" value={marks[student.id] ?? ""} onChange={e => setMarks({ ...marks, [student.id]: e.target.value })} /></label>)}</div></div>}
      </div>
    </Card>{toast.toast}
  </>;
}

export function AssignmentsPage() {
  const state = useDemoData();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(subjects[0]);
  const [due, setDue] = useState("");
  const [expanded, setExpanded] = useState("");
  const [review, setReview] = useState({ studentId: "", marks: "", rubric: "", feedback: "" });
  const toast = useToast();
  const add = () => {
    if (title.trim().length < 3 || !due) { toast.show("Enter an assignment title and deadline first."); return; }
    updateDemoState("assignments", [...state.assignments, { id: `ASG-${Date.now().toString().slice(-4)}`, title: title.trim(), subject, due, submissions: 0, total: state.students.length, status: "Accepting submissions" }]);
    setTitle(""); setDue(""); toast.show("Assignment created.");
  };
  const loadReview = (assignmentId: string, studentId: string) => {
    try {
      const saved = JSON.parse(localStorage.getItem("student-intelligence-assignment-reviews") ?? "{}") as Record<string, Partial<typeof review>>;
      const existing = saved[`${assignmentId}:${studentId}`];
      setReview({ studentId, marks: existing?.marks ?? "", rubric: existing?.rubric ?? "", feedback: existing?.feedback ?? "" });
    } catch (error) {
      console.error("Unable to read saved assignment review.", error);
      toast.show("Could not load this saved review from browser storage.");
      setReview({ studentId, marks: "", rubric: "", feedback: "" });
    }
  };
  const openReview = (assignmentId: string) => {
    if (expanded === assignmentId) { setExpanded(""); return; }
    setExpanded(assignmentId);
    loadReview(assignmentId, state.students[0]?.id ?? "");
  };
  return <><PageHeading eyebrow="Faculty workspace" title="Assignments" description="Manage deadlines, submissions and evaluation feedback." action={<Button onClick={() => document.getElementById("new-assignment-title")?.focus()}><Plus size={14} />Create assignment</Button>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><StatCard label="Open assignments" value={state.assignments.length} note="across your subjects" icon={<BookOpen size={17} />} /><StatCard label="Awaiting evaluation" value={state.assignments.reduce((sum, item) => sum + item.submissions, 0)} note="submissions to review" tone="amber" icon={<Clock3 size={17} />} /><StatCard label="Missing submissions" value={state.assignments.reduce((sum, item) => sum + item.total - item.submissions, 0)} note="student follow-up may help" tone="rose" icon={<CircleAlert size={17} />} /></div>
    <Card className="mb-5"><CardTitle title="Create an assignment" subtitle="Instructions and learning materials can be added after creation." /><div className="grid gap-3 p-5 sm:grid-cols-[1.5fr_1fr_1fr_auto]"><label><span className="label">Assignment title</span><input id="new-assignment-title" className="field" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Database design exercise" /></label><label><span className="label">Subject</span><select className="field" value={subject} onChange={e => setSubject(e.target.value)}>{subjects.map(item => <option key={item}>{item}</option>)}</select></label><label><span className="label">Deadline</span><input className="field" type="date" value={due} onChange={e => setDue(e.target.value)} /></label><div className="flex items-end"><Button onClick={add}><Plus size={14} />Create</Button></div></div></Card>
    <Card><CardTitle title="Assignment submissions" subtitle="Open a row to review marks, rubric and faculty feedback" /><div className="px-5 pb-4 pt-3"><DataTable headers={["Assignment", "Subject", "Due date", "Submissions", "Missing", "Status", ""]}>{state.assignments.map(item => <Fragment key={item.id}><tr className="hover:bg-slate-50/70"><td className="px-5 py-3.5"><span className="block text-xs font-semibold">{item.title}</span><span className="text-[10px] text-slate-400">{item.id}</span></td><td className="px-4 py-3 text-xs">{item.subject}</td><td className="px-4 py-3 text-xs">{item.due}</td><td className="px-4 py-3 text-xs">{item.submissions} / {item.total}</td><td className="px-4 py-3 text-xs">{item.total - item.submissions}</td><td className="px-4 py-3"><Badge tone={toneFor(item.status)}>{item.status}</Badge></td><td className="px-4 py-3"><button className="text-xs font-semibold text-brand" onClick={() => openReview(item.id)}>{expanded === item.id ? "Close" : "Review"}</button></td></tr>{expanded === item.id && <tr><td colSpan={7} className="bg-blue-50/40 px-5 py-4"><div className="grid gap-4 md:grid-cols-4"><label><span className="label">Student submission</span><select className="field" value={review.studentId} onChange={e => loadReview(item.id, e.target.value)}>{state.students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label><label><span className="label">Marks awarded</span><input className="field" type="number" min="0" value={review.marks} onChange={e => setReview({ ...review, marks: e.target.value })} placeholder="e.g. 18" /></label><label><span className="label">Rubric score (1–5)</span><select className="field" value={review.rubric} onChange={e => setReview({ ...review, rubric: e.target.value })}><option value="">Select score</option>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}</option>)}</select></label><label><span className="label">Faculty feedback</span><input className="field" value={review.feedback} onChange={e => setReview({ ...review, feedback: e.target.value })} placeholder="Add a note for the student" /></label></div><div className="mt-3 flex items-center justify-between"><button className="inline-flex items-center gap-2 text-xs font-medium text-brand" onClick={() => toast.show("Material upload is a placeholder until a file service is connected.")}><FilePlus2 size={14} />Add learning material</button><Button onClick={() => { if (!review.studentId || !review.marks || Number(review.marks) < 0 || !review.rubric) { toast.show("Select a student, enter marks and choose a rubric score."); return; } try { const existing = JSON.parse(localStorage.getItem("student-intelligence-assignment-reviews") ?? "{}") as Record<string, unknown>; localStorage.setItem("student-intelligence-assignment-reviews", JSON.stringify({ ...existing, [`${item.id}:${review.studentId}`]: { ...review, savedAt: new Date().toISOString() } })); setExpanded(""); toast.show("Marks and feedback saved for this student."); } catch (error) { console.error("Unable to save assignment review.", error); toast.show("Could not save this review. Check browser storage and try again."); } }}>Save review</Button></div></td></tr>}</Fragment>)}</DataTable></div></Card>{toast.toast}</>;
}

type SkillAssessmentRecord = { id: string; skill: string; level: number; evidence: string; validated: boolean; updatedAt: string };
function readSkillAssessments(): SkillAssessmentRecord[] {
  try {
    return JSON.parse(localStorage.getItem("student-intelligence-skill-assessments") ?? "[]") as SkillAssessmentRecord[];
  } catch (error) {
    console.error("Unable to read demo skill assessment history.", error);
    return [];
  }
}
export function SkillsPage() {
  const state = useDemoData();
  const [filter, setFilter] = useState("All evidence");
  const [selected, setSelected] = useState(skillCatalog[0].name);
  const [rating, setRating] = useState("3");
  const [evidence, setEvidence] = useState("");
  const [validated, setValidated] = useState(false);
  const [history, setHistory] = useState(readSkillAssessments);
  const [submissionFeedback, setSubmissionFeedback] = useState<Record<string, string>>({});
  const toast = useToast();
  const colors = ["#4465e8", "#139b83", "#9eb0e9"];
  const submissions = state.skillSubmissions;
  const pendingSubmissions = submissions.filter(item => item.status === "Pending review");
  const reviewSubmission = (submission: SkillSubmission, status: "Approved" | "Needs changes") => {
    const feedback = submissionFeedback[submission.id]?.trim() ?? "";
    if (status === "Needs changes" && !feedback) {
      toast.show("Add feedback to explain what the student should update.");
      return;
    }
    const next = submissions.map(item => item.id === submission.id
      ? { ...item, status, facultyFeedback: feedback || undefined, reviewedAt: new Date().toISOString() }
      : item);
    updateDemoState("skillSubmissions", next);
    toast.show(status === "Approved" ? "Skill and knowledge submission approved." : "Feedback sent to the student.");
  };
  const saveAssessment = () => {
    if (!evidence.trim()) { toast.show("Add supporting evidence before saving a skill assessment."); return; }
    const record: SkillAssessmentRecord = { id: `SKL-${Date.now()}`, skill: selected, level: Number(rating), evidence: evidence.trim(), validated, updatedAt: new Date().toLocaleDateString() };
    const next = [record, ...history];
    try {
      localStorage.setItem("student-intelligence-skill-assessments", JSON.stringify(next));
      setHistory(next); setEvidence(""); setValidated(false); toast.show(`${selected} assessment saved.`);
    } catch (error) {
      console.error("Unable to save demo skill assessment.", error);
      toast.show("Could not save this skill assessment. Check browser storage and try again.");
    }
  };
  return <><PageHeading eyebrow="Faculty workspace" title="Skill mapping" description="Review student-submitted skills and knowledge alongside assessed, project-demonstrated and faculty-validated abilities." action={<Button variant="secondary" onClick={() => document.getElementById("skill-assessment-form")?.scrollIntoView({ behavior: "smooth", block: "center" })}><Plus size={14} />New evaluation</Button>} />
    <div className="mb-5 flex flex-wrap gap-2"><Badge tone="blue">Student-reported interest</Badge><Badge tone="green">Assessed abilities</Badge><Badge tone="amber">Project-demonstrated abilities</Badge><Badge>Faculty-validated skills</Badge></div>
    <Card className="mb-5"><CardTitle title="Student skill & knowledge submissions" subtitle={`${pendingSubmissions.length} awaiting faculty review · student-reported claims are not validated until approved`} action={<Badge tone={pendingSubmissions.length ? "amber" : "green"}>{pendingSubmissions.length} pending</Badge>} />
      {submissions.length === 0 ? <EmptyState title="No student submissions yet" description="Student-submitted skills and knowledge will appear here for faculty review." /> : <div className="px-5 pb-4 pt-3"><DataTable headers={["Student", "Skill", "Self-rated level", "Knowledge & evidence", "Status", "Faculty action"]}>{submissions.map(submission => {
        const student = state.students.find(item => item.id === submission.studentId);
        return <Fragment key={submission.id}><tr className="align-top"><td className="px-5 py-3 text-xs"><span className="block font-semibold">{student?.name ?? "Student"}</span><span className="text-[10px] text-slate-400">{submission.studentId} · {submission.submittedAt}</span></td><td className="px-4 py-3 text-xs font-medium">{submission.skill}</td><td className="px-4 py-3"><Badge tone="slate">{submission.level} · student-reported</Badge></td><td className="max-w-sm px-4 py-3 text-xs text-slate-600"><p>{submission.knowledge}</p>{submission.evidence && <p className="mt-1 text-[10px] text-brand">Evidence: {submission.evidence}</p>}{submission.facultyFeedback && <p className="mt-2 rounded bg-amber-50 p-2 text-[10px] text-amber-800">Previous feedback: {submission.facultyFeedback}</p>}</td><td className="px-4 py-3"><Badge tone={toneFor(submission.status)}>{submission.status}</Badge></td><td className="min-w-52 px-4 py-3">{submission.status === "Pending review" ? <div className="space-y-2"><textarea className="field min-h-16 resize-y text-[11px]" aria-label={`Feedback for ${submission.skill} from ${student?.name ?? "student"}`} placeholder="Optional note, required to request changes" value={submissionFeedback[submission.id] ?? ""} onChange={event => setSubmissionFeedback({ ...submissionFeedback, [submission.id]: event.target.value })} /><div className="flex flex-wrap gap-2"><Button onClick={() => reviewSubmission(submission, "Approved")}><Check size={13} />Approve</Button><Button variant="secondary" onClick={() => reviewSubmission(submission, "Needs changes")}>Request changes</Button></div></div> : <span className="text-[10px] text-slate-500">{submission.reviewedAt ? `Reviewed ${new Date(submission.reviewedAt).toLocaleDateString()}` : submission.status}</span>}</td></tr></Fragment>;
      })}</DataTable></div>}
    </Card>
    <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]"><Card><CardTitle title="Cohort skill profile" subtitle="Evidence type shown separately — interest does not imply proficiency" /><div className="h-[310px] px-2 py-5 sm:px-5"><ResponsiveContainer width="100%" height="100%"><BarChart data={skillCatalog} margin={{ left: -15 }}><CartesianGrid stroke="#edf0f5" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9 }} interval={0} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} domain={[0, 100]} /><Tooltip /><Bar dataKey="interest" name="Student-reported interest" fill={colors[0]} radius={[4, 4, 0, 0]} /><Bar dataKey="assessed" name="Assessed ability" fill={colors[1]} radius={[4, 4, 0, 0]} /><Bar dataKey="demonstrated" name="Project-demonstrated" fill={colors[2]} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pb-4 text-[10px] text-slate-500">{["Interest", "Assessed ability", "Project-demonstrated"].map((label, i) => <span key={label}><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: colors[i] }} />{label}</span>)}</div></Card>
      <Card><CardTitle title="Record a skill assessment" subtitle="Document evidence and a transparent rubric score" /><div id="skill-assessment-form" className="space-y-4 p-5"><label><span className="label">Skill</span><select className="field" value={selected} onChange={e => setSelected(e.target.value)}>{skillCatalog.map(item => <option key={item.name}>{item.name}</option>)}</select></label><label><span className="label">Rubric level</span><select className="field" value={rating} onChange={e => setRating(e.target.value)}><option value="1">1 · Emerging</option><option value="2">2 · Developing</option><option value="3">3 · Capable</option><option value="4">4 · Proficient</option><option value="5">5 · Advanced</option></select></label><label><span className="label">Evidence / observation</span><textarea className="field min-h-24 resize-y" placeholder="Describe observed work, assessment or project evidence..." value={evidence} onChange={e => setEvidence(e.target.value)} /></label><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" className="accent-brand" checked={validated} onChange={e => setValidated(e.target.checked)} />Mark as faculty-validated</label><Button onClick={saveAssessment}><Check size={14} />Save assessment</Button></div></Card></div>
    <Card className="mt-5"><CardTitle title="Skill evidence register" subtitle="Student interests, demonstrated work and faculty validation" action={<select className="field w-auto" value={filter} onChange={e => setFilter(e.target.value)}><option>All evidence</option><option>Faculty validated</option><option>Needs validation</option></select>} /><div className="px-5 pb-4 pt-3"><DataTable headers={["Skill", "Student interest", "Assessed ability", "Project evidence", "Faculty validation"]}>{skillCatalog.filter(skill => filter === "All evidence" || (filter === "Faculty validated" ? skill.validated : !skill.validated)).map(skill => <tr key={skill.name}><td className="px-5 py-3 text-xs font-semibold">{skill.name}</td><td className="px-4 py-3 text-xs">{skill.interest}% <span className="text-[10px] text-slate-400">self-reported</span></td><td className="px-4 py-3 text-xs">{skill.assessed}%</td><td className="px-4 py-3 text-xs">{skill.demonstrated}%</td><td className="px-4 py-3"><Badge tone={skill.validated ? "green" : "amber"}>{skill.validated ? "Validated" : "Needs evidence review"}</Badge></td></tr>)}</DataTable></div></Card>
    <Card className="mt-5"><CardTitle title="Evaluation history" subtitle={`${history.length} saved evidence records`} /><div className="px-5 pb-4 pt-3"><DataTable headers={["Skill", "Rubric level", "Evidence", "Faculty validation", "Recorded"]} empty={!history.length}>{history.map(record => <tr key={record.id}><td className="px-5 py-3 text-xs font-semibold">{record.skill}</td><td className="px-4 py-3 text-xs">{record.level} / 5</td><td className="max-w-md px-4 py-3 text-xs text-slate-600">{record.evidence}</td><td className="px-4 py-3"><Badge tone={record.validated ? "green" : "slate"}>{record.validated ? "Validated" : "Not validated"}</Badge></td><td className="px-4 py-3 text-xs">{record.updatedAt}</td></tr>)}</DataTable></div></Card>{toast.toast}</>;
}

export function ProjectsPage({ portfolio = false }: { portfolio?: boolean }) {
  const state = useDemoData();
  const [selected, setSelected] = useState<Project | null>(null);
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [toastState, setToast] = useState("");
  const [skillName, setSkillName] = useState(skillCatalog[0].name);
  const [skillLevel, setSkillLevel] = useState<SkillSubmission["level"]>("Beginner");
  const [skillKnowledge, setSkillKnowledge] = useState("");
  const [skillEvidence, setSkillEvidence] = useState("");
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [skillError, setSkillError] = useState("");
  const list = portfolio ? state.projects.filter(item => item.owner === state.students[0].name) : state.projects;
  const mySkillSubmissions = portfolio ? state.skillSubmissions.filter(item => item.studentId === state.students[0].id) : [];
  const add = () => {
    if (!title.trim()) { setToast("Add a project title before saving."); return; }
    updateDemoState("projects", [...state.projects, { id: `PRJ-${Date.now().toString().slice(-4)}`, title: title.trim(), owner: state.students[0].name, description: "Student project added in demo workspace.", skills: ["Project evidence pending"], status: "In progress" }]);
    setTitle(""); setToast("Project added to portfolio.");
  };
  const remove = (id: string) => {
    if (!window.confirm("Delete this project record? This cannot be undone.")) return;
    updateDemoState("projects", state.projects.filter(item => item.id !== id)); setSelected(null); setToast("Project deleted.");
  };
  const submitSkill = (event: React.FormEvent) => {
    event.preventDefault();
    if (skillKnowledge.trim().length < 10) { setSkillError("Describe what you know in at least 10 characters."); return; }
    const existing = state.skillSubmissions.find(item => item.id === editingSubmissionId && item.studentId === state.students[0].id);
    const submission: SkillSubmission = {
      id: existing?.id ?? `SKSUB-${Date.now()}`,
      studentId: state.students[0].id,
      skill: skillName,
      level: skillLevel,
      knowledge: skillKnowledge.trim(),
      evidence: skillEvidence.trim(),
      status: "Pending review",
      submittedAt: new Date().toLocaleDateString(),
      facultyFeedback: undefined,
      reviewedAt: undefined
    };
    updateDemoState("skillSubmissions", existing
      ? state.skillSubmissions.map(item => item.id === existing.id ? submission : item)
      : [submission, ...state.skillSubmissions]);
    setSkillKnowledge(""); setSkillEvidence(""); setEditingSubmissionId(null); setSkillError("");
    setToast("Submitted for faculty review. It will remain unverified until approved.");
  };
  const editSubmission = (submission: SkillSubmission) => {
    setEditingSubmissionId(submission.id); setSkillName(submission.skill); setSkillLevel(submission.level);
    setSkillKnowledge(submission.knowledge); setSkillEvidence(submission.evidence); setSkillError("");
    document.getElementById("student-skill-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  return <><PageHeading eyebrow={portfolio ? "Student workspace" : "Faculty workspace"} title={portfolio ? "My portfolio" : "Projects & portfolios"} description={portfolio ? "Showcase your projects, evidence and skills developed through practical work." : "Review student projects and the skills evidenced by their work."} action={<Button onClick={() => document.getElementById("project-title")?.focus()}><Plus size={14} />Add project</Button>} />
    {portfolio && <Card className="mb-5"><div className="grid gap-3 p-5 sm:grid-cols-[1fr_auto]"><label><span className="label">Project title</span><input id="project-title" className="field" placeholder="Give your project a clear name" value={title} onChange={e => setTitle(e.target.value)} /></label><div className="flex items-end"><Button onClick={add}><Plus size={14} />Add to portfolio</Button></div></div></Card>}
    {toastState && <div role="status" className="mb-4 rounded-lg bg-blue-50 px-4 py-2.5 text-xs text-blue-700">{toastState}</div>}
    {portfolio && <div className="mb-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
      <Card><CardTitle title="Share a skill & knowledge" subtitle="Tell faculty what you know and provide evidence for review." /><form id="student-skill-form" onSubmit={submitSkill} className="space-y-4 p-5">
        <label><span className="label">Skill or knowledge area</span><select className="field" value={skillName} onChange={event => setSkillName(event.target.value)}>{skillCatalog.map(skill => <option key={skill.name}>{skill.name}</option>)}</select></label>
        <label><span className="label">Your current level (self-reported)</span><select className="field" value={skillLevel} onChange={event => setSkillLevel(event.target.value as SkillSubmission["level"])}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
        <label><span className="label">What have you learned or can you do?</span><textarea className="field min-h-24 resize-y" required minLength={10} placeholder="Describe concepts, techniques or practical knowledge you have learned..." value={skillKnowledge} onChange={event => setSkillKnowledge(event.target.value)} /></label>
        <label><span className="label">Evidence (optional)</span><input className="field" placeholder="Project, course, certificate or evidence link" value={skillEvidence} onChange={event => setSkillEvidence(event.target.value)} /></label>
        <p className="rounded-lg bg-blue-50 px-3 py-2.5 text-[11px] leading-relaxed text-blue-800">Your level is self-reported, not a verified ability. Faculty will review your description and evidence before approving it.</p>
        {skillError && <p role="alert" className="text-xs text-rose-600">{skillError}</p>}
        <div className="flex gap-2"><Button type="submit"><Plus size={14} />{editingSubmissionId ? "Resubmit for review" : "Submit for faculty approval"}</Button>{editingSubmissionId && <Button variant="secondary" onClick={() => { setEditingSubmissionId(null); setSkillKnowledge(""); setSkillEvidence(""); setSkillError(""); }}>Cancel edit</Button>}</div>
      </form></Card>
      <Card><CardTitle title="My submitted skills & knowledge" subtitle="Track faculty review status and feedback" action={<Badge tone="blue">{mySkillSubmissions.length} submissions</Badge>} />
        {mySkillSubmissions.length === 0 ? <EmptyState title="Nothing submitted yet" description="Add a skill or knowledge area and submit it for faculty review." /> : <div className="space-y-3 p-5">{mySkillSubmissions.map(submission => <article key={submission.id} className="rounded-xl border border-slate-100 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-xs font-semibold text-ink">{submission.skill}</h3><p className="mt-1 text-[10px] text-slate-500">{submission.level} · self-reported · submitted {submission.submittedAt}</p></div><Badge tone={toneFor(submission.status)}>{submission.status}</Badge></div><p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{submission.knowledge}</p>{submission.evidence && <p className="mt-2 break-all text-[10px] text-brand">Evidence: {submission.evidence}</p>}{submission.facultyFeedback && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900"><b>Faculty feedback:</b> {submission.facultyFeedback}</p>}{submission.status === "Needs changes" && <Button variant="secondary" onClick={() => editSubmission(submission)}>Update and resubmit</Button>}{submission.status === "Approved" && <p className="mt-3 text-[10px] font-medium text-emerald-700">Faculty approved · {submission.reviewedAt ? new Date(submission.reviewedAt).toLocaleDateString() : ""}</p>}</article>)}</div>}
      </Card>
    </div>}
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><StatCard label="Projects documented" value={list.length} note="learning evidence records" icon={<Award size={17} />} /><StatCard label="Faculty reviewed" value={list.filter(project => project.status === "Faculty reviewed").length} note="validated project evidence" tone="teal" icon={<Check size={17} />} /><StatCard label="In progress" value={list.filter(project => project.status === "In progress").length} note="active portfolio projects" tone="amber" icon={<Clock3 size={17} />} /></div>
    {!list.length ? <Card><EmptyState title="Your portfolio is ready to grow" description="Add a project to begin documenting skills, outcomes and evidence." /></Card> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map(project => <Card key={project.id} className="p-5"><div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-brand"><Award size={18} /></span><Badge tone={toneFor(project.status)}>{project.status}</Badge></div><h2 className="mt-4 text-sm font-semibold text-ink">{project.title}</h2><p className="mt-1 text-[11px] text-slate-400">{project.id} · {project.owner}</p><p className="mt-3 min-h-10 text-xs leading-relaxed text-slate-600">{project.description}</p><div className="mt-3 flex flex-wrap gap-1.5">{project.skills.map(skill => <Badge key={skill} tone="blue">{skill}</Badge>)}</div><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3"><button className="text-xs font-semibold text-brand" onClick={() => setSelected(project)}>View details</button><button className="text-xs text-slate-500 hover:text-rose-600" onClick={() => remove(project.id)}>Delete</button></div></Card>)}</div>}
    {selected && <div className="fixed inset-0 z-40 grid place-items-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-label={`${selected.title} details`}><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><div className="flex justify-between"><div><Badge tone={toneFor(selected.status)}>{selected.status}</Badge>{editing ? <label className="mt-3 block"><span className="label">Project title</span><input className="field" value={editTitle} onChange={e => setEditTitle(e.target.value)} /></label> : <h2 className="mt-3 text-lg font-semibold">{selected.title}</h2>}</div><button className="text-slate-400" onClick={() => { setSelected(null); setEditing(false); }} aria-label="Close project details">×</button></div>{editing ? <label className="mt-3 block"><span className="label">Description</span><textarea className="field min-h-24" value={editDescription} onChange={e => setEditDescription(e.target.value)} /></label> : <p className="mt-3 text-sm leading-relaxed text-slate-600">{selected.description}</p>}<p className="mt-4 text-xs font-semibold">Demonstrated skills</p><div className="mt-2 flex flex-wrap gap-2">{selected.skills.map(skill => <Badge key={skill} tone="blue">{skill}</Badge>)}</div><div className="mt-5 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">Evidence links and certificates can be attached in a connected deployment.</div><div className="mt-5 flex justify-end gap-2">{editing ? <><Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button><Button onClick={() => { if (!editTitle.trim()) { setToast("Project title cannot be empty."); return; } const changed = { ...selected, title: editTitle.trim(), description: editDescription.trim() }; updateDemoState("projects", state.projects.map(project => project.id === selected.id ? changed : project)); setSelected(changed); setEditing(false); setToast("Project details updated."); }}>Save changes</Button></> : <><Button variant="secondary" onClick={() => { setEditTitle(selected.title); setEditDescription(selected.description); setEditing(true); }}>Edit project</Button><Button variant="secondary" onClick={() => { setSelected(null); setEditing(false); }}>Close</Button></>}</div></div></div>}
  </>;
}

export function AnalyticsPage() {
  const state = useDemoData();
  const [department, setDepartment] = useState("All departments");
  const filtered = state.students.filter(student => department === "All departments" || student.department === department);
  const distribution = [{ range: "Below 50", count: filtered.filter(s => s.score < 50).length }, { range: "50–59", count: filtered.filter(s => s.score >= 50 && s.score < 60).length }, { range: "60–69", count: filtered.filter(s => s.score >= 60 && s.score < 70).length }, { range: "70–79", count: filtered.filter(s => s.score >= 70 && s.score < 80).length }, { range: "80–89", count: filtered.filter(s => s.score >= 80 && s.score < 90).length }, { range: "90+", count: filtered.filter(s => s.score >= 90).length }];
  const scoreDelta = pct(filtered.map(student => student.score)) - pct(state.students.map(student => student.score));
  const attendanceDelta = pct(filtered.map(student => student.attendance)) - pct(state.students.map(student => student.attendance));
  const trend = scoreTrend.map(point => ({ ...point, score: Math.max(0, Math.min(100, point.score + scoreDelta)), attendance: Math.max(0, Math.min(100, point.attendance + attendanceDelta)) }));
  const subject = subjects.map((name, index) => ({
    subject: name,
    average: pct(filtered.map(student => Math.max(0, Math.min(100, student.score + [-5, 2, -3, 4, 1][index])))),
    attendance: pct(filtered.map(student => Math.max(0, Math.min(100, student.attendance + [-3, 1, -4, 0, 3][index]))))
  }));
  return <><PageHeading eyebrow="Faculty workspace" title="Performance analytics" description="Explore academic outcomes, attendance patterns and cohort progress." action={<select className="field w-auto" value={department} onChange={e => setDepartment(e.target.value)} aria-label="Filter analytics by department"><option>All departments</option>{[...new Set(state.students.map(s => s.department))].map(dep => <option key={dep}>{dep}</option>)}</select>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><StatCard label="Cohort average" value={`${pct(filtered.map(s => s.score))}%`} note="academic score" tone="teal" icon={<BarChart3 size={17} />} /><StatCard label="Attendance average" value={`${pct(filtered.map(s => s.attendance))}%`} note="current semester" tone="blue" icon={<GraduationCap size={17} />} /><StatCard label="Students to review" value={filtered.filter(s => s.status !== "On track").length} note="faculty follow-up suggested" tone="amber" icon={<CircleAlert size={17} />} /></div>
    <div className="grid gap-5 xl:grid-cols-2"><Card><CardTitle title="Academic score distribution" subtitle="Number of students by current average" /><div className="h-[270px] p-5"><ResponsiveContainer width="100%" height="100%"><BarChart data={distribution}><CartesianGrid stroke="#edf0f5" vertical={false} /><XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} /><Tooltip /><Bar dataKey="count" fill="#4465e8" radius={[5, 5, 0, 0]} name="Students" /></BarChart></ResponsiveContainer></div></Card>
      <Card><CardTitle title="Semester-over-semester trend" subtitle={`${department} · score and attendance movement`} /><div className="h-[270px] p-5"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><CartesianGrid stroke="#edf0f5" vertical={false} /><XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} /><YAxis domain={[50, 100]} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} /><Tooltip /><Line dataKey="score" stroke="#4465e8" strokeWidth={2} name="Academic score" /><Line dataKey="attendance" stroke="#139b83" strokeWidth={2} name="Attendance" /></LineChart></ResponsiveContainer></div></Card>
      <Card><CardTitle title="Subject-wise comparison" subtitle="Average scores and attendance by subject" /><div className="h-[280px] p-5"><ResponsiveContainer width="100%" height="100%"><BarChart data={subject}><CartesianGrid stroke="#edf0f5" vertical={false} /><XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9 }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} /><Tooltip /><Bar dataKey="average" fill="#4465e8" name="Average score" /><Bar dataKey="attendance" fill="#139b83" name="Attendance" /></BarChart></ResponsiveContainer></div></Card>
      <Card><CardTitle title="Assessment completion" subtitle="Completion status across current assessments" /><div className="space-y-5 p-5 pt-6">{[["Mid-semester examination", 92], ["SQL case study", 75], ["Model evaluation lab", 61], ["Responsive portfolio", 48]].map(([name, value]) => <div key={name}><div className="mb-2 flex justify-between text-xs"><span>{name}</span><span className="font-semibold">{value}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand" style={{ width: `${value}%` }} /></div></div>)}</div></Card>
    </div></>;
}

export function PredictionsPage() {
  const students = useDemoData().students;
  return <><PageHeading eyebrow="Faculty workspace" title="Prediction center" description="Review transparent, rules-based demo indicators. These are not AI-generated outcomes." action={<Badge tone="amber">DEMO PREDICTION DATA</Badge>} />
    <div className="mb-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><span className="text-amber-700"><CircleAlert size={17} /></span><p className="text-xs leading-relaxed text-amber-900"><b>For faculty review only.</b> Indicators below use synthetic sample data and simple demonstration rules. They are not real model inference, should not be used for consequential decisions, and require human review.</p></div>
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><StatCard label="Demo records" value={predictions.length} note="synthetic predictions" tone="blue" icon={<Activity size={17} />} /><StatCard label="Elevated review priority" value={predictions.filter(p => p.risk.startsWith("Elevated")).length} note="review evidence below" tone="rose" icon={<CircleAlert size={17} />} /><StatCard label="Ruleset version" value="v1.2" note="demo only · updated Oct 9" icon={<Sparkles size={17} />} /></div>
    <div className="space-y-4">{predictions.map(record => { const student = students.find(item => item.id === record.studentId); return <Card key={record.studentId} className="p-5"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-start"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">{student?.name ?? record.studentId}</h2><Badge tone={record.risk.startsWith("Elevated") ? "red" : "amber"}>{record.risk}</Badge><Badge tone="slate">{record.target}</Badge></div><p className="mt-1 text-[11px] text-slate-500">Student ID: {record.studentId} · Data period: {record.period}</p></div><div className="text-[10px] text-slate-500">Updated {record.updated} · {record.version}</div></div><div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Contributing evidence</p><div className="mt-2 flex flex-wrap gap-2">{record.factors.map(factor => <Badge key={factor}>{factor}</Badge>)}</div></div><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Recommended review action</p><p className="mt-2 text-xs text-slate-700">{record.action}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Indicator certainty</p><p className="mt-2 text-sm font-semibold">{record.confidence}% <span className="text-[10px] font-normal text-slate-400">demo heuristic</span></p></div></div><div className="mt-4 border-t border-slate-100 pt-3 text-[10px] text-slate-400">Synthetic sample record · Review the original attendance and assessment evidence before taking action.</div></Card>; })}</div>
  </>;
}

export function MentoringPage() {
  const state = useDemoData();
  const [plans, setPlans] = useState<MentoringPlan[]>(readDemoState().mentoringPlans.length ? readDemoState().mentoringPlans : mentoringPlans);
  const [studentId, setStudentId] = useState(state.students[0].id);
  const [goal, setGoal] = useState("");
  const toast = useToast();
  const update = (next: MentoringPlan[]) => { setPlans(next); updateDemoState("mentoringPlans", next); };
  const add = () => {
    if (goal.trim().length < 5) { toast.show("Enter a clear mentoring goal (at least five characters)."); return; }
    update([...plans, { id: `MEN-${Date.now().toString().slice(-4)}`, studentId, goal: goal.trim(), faculty: "Prof. Neha Iyer", target: "2026-11-15", followUp: "2026-10-22", status: "In progress" }]); setGoal(""); toast.show("Mentoring plan created.");
  };
  return <><PageHeading eyebrow="Faculty workspace" title="Mentoring & development" description="Coordinate targeted academic support and follow-up with students." action={<Badge tone="blue">{plans.length} active plans</Badge>} />
    <Card className="mb-5"><CardTitle title="Create a mentoring plan" subtitle="Set an actionable goal and a follow-up checkpoint." /><div className="grid gap-3 p-5 sm:grid-cols-[1fr_2fr_auto]"><label><span className="label">Student</span><select className="field" value={studentId} onChange={e => setStudentId(e.target.value)}>{state.students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label><label><span className="label">Academic development goal</span><input className="field" value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Build a consistent revision routine" /></label><div className="flex items-end"><Button onClick={add}><Plus size={14} />Create plan</Button></div></div></Card>
    <Card><CardTitle title="Intervention history" subtitle="Plans, responsible faculty and scheduled reviews" /><div className="px-5 pb-4 pt-3"><DataTable headers={["Student", "Development action", "Responsible faculty", "Target date", "Follow-up", "Progress"]}>{plans.map(plan => <tr key={plan.id}><td className="px-5 py-3"><span className="block text-xs font-semibold">{state.students.find(s => s.id === plan.studentId)?.name ?? plan.studentId}</span><span className="text-[10px] text-slate-400">{plan.id}</span></td><td className="px-4 py-3 text-xs">{plan.goal}</td><td className="px-4 py-3 text-xs">{plan.faculty}</td><td className="px-4 py-3 text-xs">{plan.target}</td><td className="px-4 py-3 text-xs">{plan.followUp}</td><td className="px-4 py-3"><button onClick={() => { update(plans.map(item => item.id === plan.id ? { ...item, status: item.status === "Completed" ? "In progress" : "Completed" } : item)); toast.show("Mentoring plan progress updated."); }}><Badge tone={toneFor(plan.status)}>{plan.status}</Badge></button></td></tr>)}</DataTable></div></Card>{toast.toast}</>;
}

export function ReportsPage() {
  const state = useDemoData();
  const [report, setReport] = useState("Individual progress");
  const [period, setPeriod] = useState("Fall 2026");
  const [query, setQuery] = useState("");
  const rows = state.students.filter(student => `${student.name} ${student.id}`.toLowerCase().includes(query.toLowerCase()));
  const exportCSV = () => {
    const body = [["Student", "Student ID", "Department", "Semester", "Attendance", "Academic score", "Status"], ...rows.map(s => [s.name, s.id, s.department, `Semester ${s.semester}`, `${s.attendance}%`, `${s.score}%`, s.status])].map(row => row.map(value => `"${value.replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([body], { type: "text/csv" })); link.download = `student-report-${period.toLowerCase().replace(/\s/g, "-")}.csv`; link.click(); URL.revokeObjectURL(link.href);
  };
  return <><PageHeading eyebrow="Faculty workspace" title="Reports" description="Create filtered progress and academic summaries for faculty review." action={<Button onClick={exportCSV}><Download size={14} />Export CSV</Button>} />
    <Card className="mb-5"><div className="grid gap-3 p-5 md:grid-cols-[1fr_1fr_2fr]"><label><span className="label">Report type</span><select className="field" value={report} onChange={e => setReport(e.target.value)}>{["Individual progress", "Attendance", "Assessments", "Academic trends", "Skill development", "Semester comparison"].map(item => <option key={item}>{item}</option>)}</select></label><label><span className="label">Academic period</span><select className="field" value={period} onChange={e => setPeriod(e.target.value)}><option>Fall 2026</option><option>Spring 2026</option><option>Academic year 2025–26</option></select></label><label><span className="label">Filter students</span><input className="field" placeholder="Search a student or ID..." value={query} onChange={e => setQuery(e.target.value)} /></label></div></Card>
    <Card><CardTitle title={`${report} · ${period}`} subtitle="Demo report generated from the current browser data" /><div className="grid gap-3 p-5 sm:grid-cols-3"><StatCard label="Students included" value={rows.length} note="matching report filters" icon={<Users size={17} />} /><StatCard label="Average academic score" value={`${pct(rows.map(s => s.score))}%`} note="current semester cohort" tone="teal" icon={<BarChart3 size={17} />} /><StatCard label="Average attendance" value={`${pct(rows.map(s => s.attendance))}%`} note="current semester cohort" icon={<GraduationCap size={17} />} /></div><div className="px-5 pb-5"><DataTable headers={["Student", "Department", "Semester", "Attendance", "Academic score", "Review status"]} empty={!rows.length}>{rows.map(student => <tr key={student.id}><td className="px-5 py-3"><span className="block text-xs font-semibold">{student.name}</span><span className="text-[10px] text-slate-400">{student.id}</span></td><td className="px-4 py-3 text-xs">{student.department}</td><td className="px-4 py-3 text-xs">Semester {student.semester}</td><td className="px-4 py-3 text-xs">{student.attendance}%</td><td className="px-4 py-3 text-xs font-semibold">{student.score}%</td><td className="px-4 py-3"><Badge tone={toneFor(student.status)}>{student.status}</Badge></td></tr>)}</DataTable></div></Card>
  </>;
}

function readSettings(role: Role, tab: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(`student-intelligence-settings-${role}-${tab}`) ?? "{}") as Record<string, string>;
  } catch (error) {
    console.error("Unable to load saved demo settings.", error);
    return {};
  }
}
export function SettingsPage({ role }: { role: Role }) {
  const [tab, setTab] = useState(role === "faculty" ? "Academic structure" : "Profile preferences");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const tabs = role === "faculty" ? ["Academic structure", "Subjects & assessment", "Skills & rubrics", "Profile preferences", "Users & roles"] : ["Profile preferences"];
  const values = readSettings(role, tab);
  const saveSettings = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const entries = Object.fromEntries(new FormData(event.currentTarget).entries());
      localStorage.setItem(`student-intelligence-settings-${role}-${tab}`, JSON.stringify(entries));
      setSaveError(""); setSaved(true);
    } catch (error) {
      console.error("Unable to save demo settings.", error);
      setSaved(false); setSaveError("Settings could not be saved. Check browser storage and try again.");
    }
  };
  return <><PageHeading eyebrow="Workspace administration" title="Settings" description="Manage demo academic structure and workspace preferences." />
    <Card><div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-4 pt-2">{tabs.map(item => <button onClick={() => { setTab(item); setSaved(false); }} key={item} className={`shrink-0 border-b-2 px-3 py-3 text-xs ${tab === item ? "border-brand font-semibold text-brand" : "border-transparent text-slate-500"}`}>{item}</button>)}</div>
      <form onSubmit={saveSettings} className="max-w-3xl p-5"><h2 className="text-sm font-semibold">{tab}</h2><p className="mt-1 text-xs text-slate-500">These settings are illustrative and saved only in this browser.</p>
        {tab === "Academic structure" && <div className="mt-5 grid gap-4 sm:grid-cols-2">{[["Institution", "Northstar College"], ["Academic year", "2026–27"], ["Departments", "Computer Science, Information Technology, Data Science"], ["Semester structure", "2 semesters per academic year"]].map(([label, value]) => <label key={label}><span className="label">{label}</span><input name={label} className="field" defaultValue={values[label] ?? value} /></label>)}</div>}
        {tab === "Subjects & assessment" && <div className="mt-5 space-y-3">{subjects.map((subject, i) => <label key={subject} className="grid items-center gap-2 rounded-lg border border-slate-100 p-3 sm:grid-cols-[1fr_auto]"><span className="text-xs font-medium">{subject}</span><span className="flex items-center gap-2 text-[11px] text-slate-500">Weighting <input aria-label={`${subject} weighting`} name={subject} className="field w-24" type="number" min="0" max="100" defaultValue={values[subject] ?? [30, 15, 20, 25, 10][i]} />%</span></label>)}</div>}
        {tab === "Skills & rubrics" && <div className="mt-5 space-y-4"><div className="flex flex-wrap gap-2">{skillCatalog.map(skill => <Badge key={skill.name} tone="blue">{skill.name}</Badge>)}</div><label className="block"><span className="label">Rubric levels</span><input name="rubricLevels" className="field" defaultValue={values.rubricLevels ?? "Emerging, Developing, Capable, Proficient, Advanced"} /></label></div>}
        {tab === "Profile preferences" && <div className="mt-5 space-y-4"><label className="block"><span className="label">Display name</span><input name="displayName" className="field max-w-md" defaultValue={values.displayName ?? (role === "faculty" ? "Neha Iyer" : "Aarav Mehta")} /></label><label className="block"><span className="label">Email notifications</span><select name="emailNotifications" className="field max-w-md" defaultValue={values.emailNotifications ?? "Important updates only"}><option>Important updates only</option><option>All academic updates</option><option>None</option></select></label></div>}
        {tab === "Users & roles" && <div className="mt-5"><p className="mb-4 text-xs text-slate-600">Role-aware navigation is simulated. Use the profile menu to switch between Faculty and Student previews.</p><div className="flex gap-2"><Badge tone="blue">Faculty demo</Badge><Badge tone="green">Student demo</Badge></div></div>}
        {saveError && <p role="alert" className="mt-3 text-xs text-rose-600">{saveError}</p>}
        <div className="mt-6 border-t border-slate-100 pt-4"><Button type="submit"><Check size={14} />Save preferences</Button>{saved && <span role="status" className="ml-3 text-xs text-teal">Settings saved in demo workspace.</span>}</div>
      </form>
    </Card>
  </>;
}

export function AuthPage({ forgot = false, onSignIn }: { forgot?: boolean; onSignIn: (role: Role) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("faculty");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.includes("@") || (!forgot && password.length < 6)) { setError(forgot ? "Enter a valid email address." : "Enter a valid email and a password of at least 6 characters."); return; }
    if (forgot) { setSent(true); setError(""); return; }
    onSignIn(role);
    navigate(role === "faculty" ? "/faculty/dashboard" : "/student/dashboard");
  };
  return <div className="grid min-h-screen bg-white lg:grid-cols-[1fr_1fr]"><div className="hidden flex-col justify-between bg-ink p-12 text-white lg:flex"><Link to="/login" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand"><GraduationCap size={22} /></span><span className="text-sm font-semibold">Student Intelligence</span></Link><div className="max-w-lg"><Badge tone="blue">ACADEMIC INSIGHT, MADE ACTIONABLE</Badge><h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">Help every student see what's possible.</h1><p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">A thoughtful workspace for faculty to spot progress, support growth and make student development visible.</p><div className="mt-8 flex gap-8 text-xs text-slate-300"><span>01 · Understand progress</span><span>02 · Support potential</span></div></div><p className="text-xs text-slate-500">© 2026 Student Intelligence · Prototype</p></div><div className="flex items-center justify-center p-6 sm:p-12"><div className="w-full max-w-[390px]"><div className="mb-8 flex items-center gap-3 lg:hidden"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white"><GraduationCap size={20} /></span><span className="font-semibold text-ink">Student Intelligence</span></div><div className="text-[10px] font-semibold uppercase tracking-[.14em] text-brand">DEMO AUTHENTICATION</div><h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{forgot ? "Reset your password" : "Welcome back"}</h2><p className="mt-2 text-sm text-slate-500">{forgot ? "Enter your email and we'll simulate a password reset." : "Sign in to your academic workspace."}</p>
      {sent ? <div role="status" className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">If an account exists for <b>{email}</b>, password reset instructions would be sent. This prototype does not send email.</div> : <form className="mt-7 space-y-4" onSubmit={submit}><label className="block"><span className="label">Email address</span><input type="email" required autoComplete="email" className="field" placeholder="you@northstar.edu" value={email} onChange={e => setEmail(e.target.value)} /></label>{!forgot && <><label className="block"><span className="label">Password</span><input type="password" required minLength={6} autoComplete="current-password" className="field" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} /></label><label className="block"><span className="label">Preview as</span><select className="field" value={role} onChange={e => setRole(e.target.value as Role)}><option value="faculty">Faculty</option><option value="student">Student — Aarav Mehta</option></select></label></>}
      {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}<Button type="submit">{forgot ? "Send reset instructions" : "Sign in to demo"}<ArrowUpRight size={14} /></Button></form>}
      {!forgot && <div className="mt-5 flex justify-between text-xs text-slate-500"><span>Demo only · No real account verification</span><Link to="/forgot-password" className="font-medium text-brand">Forgot password?</Link></div>}{forgot && <Link className="mt-5 inline-block text-xs font-medium text-brand" to="/login">Back to sign in</Link>}
    </div></div></div>;
}

export function NotFound() { return <div className="grid min-h-[70vh] place-items-center text-center"><div><div className="text-6xl font-semibold tracking-tighter text-brand">404</div><h1 className="mt-3 text-xl font-semibold text-ink">This page isn't here</h1><p className="mt-2 text-sm text-slate-500">The page may have moved or the link may be incorrect.</p><Link to="/faculty/dashboard" className="mt-5 inline-block"><Button>Return to dashboard</Button></Link></div></div>; }
