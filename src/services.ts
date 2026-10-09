import axios from "axios";
import { assessments, attendance, assignments, mentoringPlans, predictions, projects, skillCatalog, students } from "./data";
import type { Assessment, MentoringPlan, SkillSubmission, Student } from "./types";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" }
});

const KEY = "student-intelligence-demo-v1";
type DemoState = {
  students: Student[];
  assessments: Assessment[];
  attendance: typeof attendance;
  assignments: typeof assignments;
  projects: typeof projects;
  mentoringPlans: MentoringPlan[];
  skillSubmissions: SkillSubmission[];
};
const initialState: DemoState = { students, assessments, attendance, assignments, projects, mentoringPlans, skillSubmissions: [] };
export function readDemoState(): DemoState {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? { ...initialState, ...JSON.parse(saved) as Partial<DemoState> } : initialState;
  } catch (error) {
    console.error("Unable to load demo data from local storage.", error);
    return initialState;
  }
}
export function updateDemoState<K extends keyof DemoState>(key: K, value: DemoState[K]) {
  const current = readDemoState();
  const next = { ...current, [key]: value };
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("demo-data-updated"));
}
export const demoReferenceData = { skillCatalog, predictions };
