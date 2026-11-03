import { useEffect, useState } from "react";
import api from "./api";
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  ClipboardList,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  GraduationCap,
  ArrowUpRight,
  Clock,
  Target,
  Flame,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const progressData = [
  { day: "Mon", hours: 2 },
  { day: "Tue", hours: 3.5 },
  { day: "Wed", hours: 2.8 },
  { day: "Thu", hours: 4 },
  { day: "Fri", hours: 3.2 },
  { day: "Sat", hours: 5 },
  { day: "Sun", hours: 4.2 },
];

const courses = [
  { name: "Data Structures", progress: 75, color: "bg-violet-500", icon: "DS" },
  { name: "Java Programming", progress: 60, color: "bg-blue-500", icon: "JP" },
  { name: "Machine Learning", progress: 45, color: "bg-emerald-500", icon: "ML" },
];

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My Courses", icon: BookOpen },
  { label: "AI Mentor", icon: Brain },
  { label: "Quizzes", icon: ClipboardList },
  { label: "Analytics", icon: BarChart3 },
];

function App() {
  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [marks, setMarks] = useState([]);
const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);

useEffect(() => {
  api.get("/students/1/marks")
    .then((response) => setMarks(response.data))
    .catch((error) => console.error("Marks error:", error))
    .finally(() => setLoading(false));
}, []);

  const askMentor = async () => {
    if (!question.trim()) return;
    setAsking(true);
    setAnswer("");
    try {
      const response = await api.post("/mentor/1/ask", { question });
      setAnswer(response.data.answer || JSON.stringify(response.data));
    } catch (error) {
      console.error("AI Mentor error:", error);
      setAnswer(error.response?.data?.error || error.message);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Sidebar */}
      <aside
        className={`fixed md:static z-40 inset-y-0 left-0 w-64 bg-white border-r border-slate-200 p-5 flex flex-col transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-violet-600 p-2 rounded-xl text-white">
            <GraduationCap size={25} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">EduMentor</h1>
            <p className="text-xs text-slate-400">Learn smarter</p>
          </div>
        </div>

        <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
          Workspace
        </p>

        <nav className="space-y-1">
          {menuItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => {
                setActive(label);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                active === label
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={19} />
              {label}
              {label === "AI Mentor" && (
                <span className="ml-auto text-xs bg-violet-100 px-2 py-0.5 rounded-full">
                  AI
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <button
            onClick={() => setActive("Settings")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-500 hover:bg-slate-50"
          >
            <Settings size={19} /> Settings
          </button>

          <div className="mt-5 p-4 rounded-2xl bg-violet-50">
            <div className="flex items-center gap-2 text-violet-700 font-semibold text-sm">
              <Flame size={18} /> Keep learning!
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Consistency is the key to success.
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 px-5 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={21} />
            </button>
            <div>
              <p className="text-xs text-slate-400">Workspace / {active}</p>
              <h2 className="font-bold text-lg text-slate-900">{active}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-400 text-sm">
              <Search size={16} /> Search
            </button>
            <button className="p-2 rounded-xl hover:bg-slate-100 relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-10 h-10 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center font-bold">
              S
            </div>
          </div>
        </header>

        {active === "AI Mentor" ? (
          <div className="p-5 md:p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Study Mentor</h1>
            <p className="text-slate-500 mb-6">Ask questions and get help learning.</p>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything about your studies..."
                className="w-full border border-slate-200 rounded-xl p-4 min-h-32 outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                onClick={askMentor}
                disabled={asking}
                className="mt-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl"
              >
                {asking ? "Thinking..." : "Ask AI"}
              </button>
              {answer && (
                <div className="mt-6 bg-violet-50 p-5 rounded-xl">
                  <h3 className="font-bold mb-2">Mentor Response</h3>
                  <p className="whitespace-pre-wrap">{answer}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
        <div className="p-5 md:p-8 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                Welcome back, Student 👋
              </h2>
              <p className="text-slate-500 mt-2">
                Here's your learning progress at a glance.
              </p>
            </div>
            <button
              onClick={() => setActive("My Courses")}
              className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
            >
              Explore courses <ArrowUpRight size={17} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {[
              { title: "Courses Enrolled", value: "06", icon: BookOpen, color: "violet" },
              { title: "Study Hours", value: "24.5h", icon: Clock, color: "blue" },
              { title: "Average Score", value: loading ? "..." : marks.length ? `${Math.round(marks.reduce((sum, m) => sum + (m.score / m.maxScore) * 100, 0) / marks.length)}%` : "0%", icon: Target, color: "emerald" },
              { title: "Learning Streak", value: "7 Days", icon: Flame, color: "orange" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="bg-white border border-slate-200 rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">{stat.title}</span>
                    <div className={`p-2 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                      <Icon size={19} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-4">
                    {stat.value}
                  </p>
                  <p className="text-xs text-emerald-600 mt-2">Your learning overview</p>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 md:p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-slate-900">Study Activity</h3>
                  <p className="text-sm text-slate-400 mt-1">Hours studied this week</p>
                </div>
                <span className="text-xs bg-violet-50 text-violet-700 px-3 py-2 rounded-lg">
                  This week
                </span>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progressData}>
                    <defs>
                      <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      fill="url(#studyGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6">
              <h3 className="font-bold text-slate-900">My Progress</h3>
              <p className="text-sm text-slate-400 mt-1 mb-6">Course completion</p>
              <div className="space-y-6">
                {courses.map((course) => (
                  <div key={course.name}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-700">{course.name}</span>
                      <span className="text-slate-500">{course.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`${course.color} h-full rounded-full`}
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActive("Analytics")}
                className="mt-8 w-full border border-slate-200 rounded-xl py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                View analytics
              </button>
            </div>
          </div>

          {/* AI Mentor */}
          <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-violet-200 text-sm font-semibold mb-3">
                <Brain size={19} /> YOUR AI STUDY COMPANION
              </div>
              <h3 className="text-xl md:text-2xl font-bold">
                Stuck on a difficult topic?
              </h3>
              <p className="text-violet-100 mt-2 text-sm">
                Ask EduMentor AI to explain concepts and help you study smarter.
              </p>
            </div>
            <button
              onClick={() => setActive("AI Mentor")}
              className="bg-white text-violet-700 px-5 py-3 rounded-xl font-semibold text-sm hover:bg-violet-50 whitespace-nowrap"
            >
              Ask AI Mentor →
            </button>
          </div>


          
<div className="bg-white border border-slate-200 rounded-2xl p-6 mt-6">
  <h3 className="text-lg font-bold mb-4">Recent Marks</h3>

  {loading ? (
    <p>Loading marks...</p>
  ) : marks.length === 0 ? (
    <p className="text-slate-500">No marks available yet.</p>
  ) : (
    marks.map((mark) => (
      <div key={mark.id} className="flex justify-between border-b py-3">
        <span>{mark.subject} - {mark.topic}</span>
        <strong>{mark.score}/{mark.maxScore}</strong>
      </div>
    ))
  )}
</div>




        </div>
        )}
      </main>
    </div>
  );
}

export default App;
