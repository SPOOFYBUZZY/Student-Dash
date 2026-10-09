import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BookOpenCheck, BriefcaseBusiness,
  CalendarDays, ChartNoAxesCombined, Check, ChevronDown, ClipboardList, FileBarChart, FolderKanban, GraduationCap,
  LayoutDashboard, LogOut, Menu, MessageSquareText, Search, Settings, ShieldCheck, Sparkles, Users, X
} from "lucide-react";
import type { ReactNode } from "react";
import type { Role } from "./types";

export const Icon = ({ name, size = 17 }: { name: string; size?: number }) => {
  const icons: Record<string, typeof Activity> = {
    dashboard: LayoutDashboard, students: Users, attendance: CalendarDays, assessments: BookOpenCheck, assignments: ClipboardList,
    skills: Sparkles, projects: FolderKanban, analytics: ChartNoAxesCombined, predictions: Activity, mentoring: MessageSquareText,
    reports: FileBarChart, settings: Settings, portfolio: BriefcaseBusiness
  };
  const Component = icons[name] || Activity;
  return <Component size={size} strokeWidth={1.8} />;
};

const facultyLinks = [
  { label: "Overview", to: "/faculty/dashboard", icon: "dashboard" }, { label: "Students", to: "/faculty/students", icon: "students" },
  { label: "Attendance", to: "/faculty/attendance", icon: "attendance" }, { label: "Assessments", to: "/faculty/assessments", icon: "assessments" },
  { label: "Assignments", to: "/faculty/assignments", icon: "assignments" }, { label: "Skill mapping", to: "/faculty/skills", icon: "skills" },
  { label: "Projects", to: "/faculty/projects", icon: "projects" }, { label: "Analytics", to: "/faculty/analytics", icon: "analytics" },
  { label: "Prediction center", to: "/faculty/predictions", icon: "predictions" }, { label: "Mentoring", to: "/faculty/mentoring", icon: "mentoring" },
  { label: "Reports", to: "/faculty/reports", icon: "reports" }
];
const studentLinks = [
  { label: "My dashboard", to: "/student/dashboard", icon: "dashboard" }, { label: "My assessments", to: "/student/assessments", icon: "assessments" }, { label: "My portfolio", to: "/student/portfolio", icon: "portfolio" }
];

export function Shell({ role, setRole, children }: { role: Role; setRole: (role: Role | null) => void; children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const [profile, setProfile] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const items = role === "faculty" ? facultyLinks : studentLinks;
  const title = items.find(item => item.to === location.pathname)?.label ?? "Student profile";

  useEffect(() => { setDrawer(false); }, [location.pathname]);

  const sidebar = <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-ink text-white transition-transform lg:translate-x-0 ${drawer ? "translate-x-0" : "-translate-x-full"}`}>
    <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white"><GraduationCap size={21} /></div>
      <div><div className="text-[15px] font-semibold tracking-tight">Student Intelligence</div><div className="mt-0.5 text-[10px] text-slate-400">ACADEMIC INSIGHTS PLATFORM</div></div>
      <button className="ml-auto rounded-lg p-1 text-slate-400 hover:text-white lg:hidden" onClick={() => setDrawer(false)} aria-label="Close navigation"><X size={18} /></button>
    </div>
    <div className="px-4 pt-5">
      <label className="mb-2 block px-2 text-[10px] font-semibold uppercase tracking-[.13em] text-slate-500">{role === "faculty" ? "Faculty workspace" : "Student workspace"}</label>
      {items.map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => `mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${isActive ? "bg-brand text-white shadow-md shadow-brand/20" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}><Icon name={item.icon} />{item.label}{item.label === "Prediction center" && <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px]">DEMO</span>}</NavLink>)}
    </div>
    <div className="mt-auto p-4">
      <div className="mb-3 rounded-xl border border-white/10 bg-white/[.04] p-3">
        <div className="flex items-center gap-2 text-xs font-medium"><ShieldCheck size={15} className="text-teal-300" /> Demo environment</div>
        <p className="mb-0 mt-1.5 text-[11px] leading-relaxed text-slate-400">Sample academic data. Changes are saved in this browser.</p>
      </div>
      <NavLink to="/settings" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-slate-300 hover:bg-white/5"><Icon name="settings" />{role === "faculty" ? "Settings" : "Preferences"}</NavLink>
    </div>
  </aside>;

  return <div className="min-h-screen">
    {drawer && <button aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={() => setDrawer(false)} />}
    {sidebar}
    <div className="min-h-screen lg:pl-[248px]">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setDrawer(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex"><span>Workspace</span><span>/</span><span className="font-medium text-slate-600">{title}</span></div>
          <span className="font-semibold text-slate-800 sm:hidden">{title}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className={`relative hidden ${role === "faculty" ? "md:block" : ""}`}>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input aria-label="Search students" className="w-52 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none transition focus:border-brand focus:bg-white" placeholder="Search students..." value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && search.trim()) navigate(`/faculty/students?q=${encodeURIComponent(search.trim())}`); }} />
          </div>
          <div className="relative">
            <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell size={18} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" /></button>
            {notificationsOpen && <div className="absolute right-0 top-12 z-30 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"><div className="flex items-center justify-between border-b border-slate-100 px-1 pb-2"><span className="text-xs font-semibold">Notifications</span><span className="text-[10px] text-slate-400">Demo updates</span></div><div className="py-1">{(role === "faculty" ? [["Review students", "3 students may benefit from a check-in", "/faculty/students"], ["Assignment reviews", "Submitted work is awaiting evaluation", "/faculty/assignments"]] : [["Assessment update", "Check your upcoming assessment dates", "/student/assessments"], ["Portfolio", "Keep documenting project evidence", "/student/portfolio"]]).map(([label, note, href]) => <Link key={label} to={href} onClick={() => setNotificationsOpen(false)} className="block rounded-lg px-2 py-2.5 hover:bg-slate-50"><span className="block text-xs font-medium">{label}</span><span className="mt-1 block text-[10px] text-slate-500">{note}</span></Link>)}</div><p className="px-2 pt-1 text-[10px] text-slate-400">Notifications are simulated for this demo.</p></div>}
          </div>
          <div className="relative">
            <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50" onClick={() => setProfile(!profile)} aria-expanded={profile}>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">{role === "faculty" ? "NI" : "AM"}</span>
              <span className="hidden text-left sm:block"><span className="block text-xs font-semibold">{role === "faculty" ? "Neha Iyer" : "Aarav Mehta"}</span><span className="block text-[10px] capitalize text-slate-500">{role} · Demo</span></span><ChevronDown size={14} className="text-slate-400" />
            </button>
            {profile && <div className="absolute right-0 top-12 z-30 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
              <p className="px-2.5 py-2 text-[11px] text-slate-500">Switch simulated role</p>
              {(["faculty", "student"] as Role[]).map(next => <button key={next} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs capitalize hover:bg-slate-50" onClick={() => { setRole(next); setProfile(false); navigate(next === "faculty" ? "/faculty/dashboard" : "/student/dashboard"); }}>{next}{role === next && <Check size={14} className="text-teal" />}</button>)}
              <div className="my-1 border-t" /><button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50" onClick={() => { setRole(null); navigate("/login"); }}><LogOut size={14} />Sign out</button>
            </div>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1480px] p-4 sm:p-7 lg:p-8">{children}</main>
    </div>
  </div>;
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div>{eyebrow && <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[.14em] text-brand">{eyebrow}</div>}<h1 className="text-[22px] font-semibold tracking-tight text-ink sm:text-[25px]">{title}</h1>{description && <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-slate-500">{description}</p>}</div>{action && <div className="flex shrink-0 items-center gap-2">{action}</div>}</div>;
}
export function Button({ children, variant = "primary", onClick, type = "button", disabled = false }: { children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger"; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean }) {
  const style = variant === "primary" ? "bg-brand text-white hover:bg-blue-700 shadow-sm shadow-brand/15" : variant === "danger" ? "bg-rose-600 text-white hover:bg-rose-700" : variant === "ghost" ? "text-slate-600 hover:bg-slate-100" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
  return <button type={type} disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${style}`}>{children}</button>;
}
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`panel ${className}`}>{children}</section>; }
export function CardTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) { return <div className="flex items-start justify-between gap-3 px-5 pt-5"><div><h2 className="text-sm font-semibold text-ink">{title}</h2>{subtitle && <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>}</div>{action}</div>; }
export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "amber" | "red" | "blue" }) {
  const tones = { slate: "bg-slate-100 text-slate-600", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", red: "bg-rose-50 text-rose-700", blue: "bg-blue-50 text-blue-700" };
  return <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${tones[tone]}`}>{children}</span>;
}
export function StatCard({ label, value, note, trend, icon, tone = "blue" }: { label: string; value: string | number; note: string; trend?: string; icon: ReactNode; tone?: "blue" | "teal" | "amber" | "rose" }) {
  const color = { blue: "bg-blue-50 text-blue-600", teal: "bg-teal-50 text-teal", amber: "bg-amber-50 text-amber-600", rose: "bg-rose-50 text-rose-600" }[tone];
  return <Card className="p-4 sm:p-5"><div className="flex items-start justify-between"><div className="text-xs font-medium text-slate-500">{label}</div><span className={`grid h-8 w-8 place-items-center rounded-lg ${color}`}>{icon}</span></div><div className="mt-3 text-[26px] font-semibold tracking-tight text-ink">{value}</div><div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">{trend && <span className="inline-flex items-center text-teal">{trend.startsWith("-") ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}{trend}</span>}{note}</div></Card>;
}
export function EmptyState({ title, description }: { title: string; description: string }) { return <div className="grid min-h-44 place-items-center px-5 text-center"><div><div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500"><AlertTriangle size={17} /></div><p className="text-sm font-semibold text-slate-700">{title}</p><p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p></div></div>; }
export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onClose, 3200); return () => window.clearTimeout(timer); }, [message, onClose]);
  return <div role="status" className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-xs font-medium text-white shadow-lg"><Check size={15} className="text-teal-300" />{message}<button className="ml-2 text-slate-400 hover:text-white" onClick={onClose} aria-label="Dismiss notification"><X size={14} /></button></div>;
}
export function useToast() {
  const [message, setMessage] = useState("");
  const show = (text: string) => setMessage(text);
  const toast = message ? <Toast message={message} onClose={() => setMessage("")} /> : null;
  return { show, toast };
}
export function LinkButton({ to, children }: { to: string; children: ReactNode }) { return <Link to={to} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-blue-800">{children}<ArrowRight size={13} /></Link>; }
