
import { useEffect, useState } from "react";
import api from "./api";
import {
  LayoutDashboard, BookOpen, Brain, ClipboardList, BarChart3,
  Settings, Bell, Menu, GraduationCap, Clock, Target, Flame,
  CalendarDays, Award, LogOut, Plus, CheckCircle2, X,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";

const courseData = [
  { name: "Data Structures", progress: 75, color: "bg-violet-500", code: "DS" },
  { name: "Java Programming", progress: 60, color: "bg-blue-500", code: "JP" },
  { name: "Machine Learning", progress: 45, color: "bg-emerald-500", code: "ML" },
  { name: "Cyber Security", progress: 30, color: "bg-orange-500", code: "CS" },
];

const quizData = [
  {
    title: "Java Fundamentals",
    subject: "Java",
    questions: [
      { q: "Which keyword creates a class in Java?", options: ["function", "class", "struct", "define"], answer: 1 },
      { q: "Which method starts a Java program?", options: ["start()", "run()", "main()", "init()"], answer: 2 },
      { q: "Which type stores true or false?", options: ["int", "String", "boolean", "char"], answer: 2 },
    ],
  },
  {
    title: "Data Structures",
    subject: "DS",
    questions: [
      { q: "Which structure follows FIFO?", options: ["Stack", "Queue", "Tree", "Graph"], answer: 1 },
      { q: "Which structure follows LIFO?", options: ["Queue", "Array", "Stack", "Linked List"], answer: 2 },
      { q: "Which is a linear data structure?", options: ["Graph", "Tree", "Array", "Heap"], answer: 2 },
    ],
  },
];

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My Courses", icon: BookOpen },
  { label: "Marks", icon: Award },
  { label: "Exams", icon: CalendarDays },
  { label: "AI Mentor", icon: Brain },
  { label: "Quizzes", icon: ClipboardList },
  { label: "Analytics", icon: BarChart3 },
];

function App() {
  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [studentId, setStudentId] = useState(localStorage.getItem("studentId") || "");
  const [studentName, setStudentName] = useState(localStorage.getItem("studentName") || "");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const [marks, setMarks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);

  const [examSubject, setExamSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [exams, setExams] = useState(
    JSON.parse(localStorage.getItem("eduExams") || "[]")
  );
  const [examMessage, setExamMessage] = useState("");

  const [quizIndex, setQuizIndex] = useState(null);
  const [quizQuestion, setQuizQuestion] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const [settingsMessage, setSettingsMessage] = useState("");

  const isRegistered = Boolean(studentId && studentName);

  const loadData = async () => {
    if (!studentId) return;

    setLoading(true);
    setError("");

    try {
      const [marksResponse, analyticsResponse] = await Promise.allSettled([
        api.get(`/students/${studentId}/marks`),
        api.get(`/students/${studentId}/analytics`),
      ]);

      if (marksResponse.status === "fulfilled") {
        setMarks(Array.isArray(marksResponse.value.data) ? marksResponse.value.data : []);
      } else {
        setError("Unable to load marks. Please refresh.");
      }

      if (analyticsResponse.status === "fulfilled") {
        setAnalytics(analyticsResponse.value.data);
      }
    } catch {
      setError("Unable to load student data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isRegistered) loadData();
  }, [studentId]);

  const registerStudent = async (e) => {
    e.preventDefault();
    if (!registerName.trim()) return;

    setRegistering(true);
    setRegisterError("");

    try {
      const response = await api.post("/students", {
        name: registerName.trim(),
        email: registerEmail.trim() || null,
      });

      const id = response.data.id;
      const name = response.data.name || registerName.trim();

      if (!id) throw new Error("Student ID was not returned.");

      localStorage.setItem("studentId", String(id));
      localStorage.setItem("studentName", name);

      setStudentId(String(id));
      setStudentName(name);
    } catch (err) {
      setRegisterError(
  err.response?.data?.error?.message ||
  err.response?.data?.message ||
  err.message ||
  "Registration failed."
);
    } finally {
      setRegistering(false);
    }
  };

  const askMentor = async () => {
    if (!question.trim() || !studentId) return;

    setAsking(true);
    setAnswer("");

    try {
      const response = await api.post(`/mentor/${studentId}/ask`, { question });
      setAnswer(response.data.answer || JSON.stringify(response.data));
    } catch (err) {
      setAnswer(err.response?.data?.error || err.message || "Mentor is unavailable.");
    } finally {
      setAsking(false);
    }
  };

  const addExam = async (e) => {
    e.preventDefault();
    if (!examSubject.trim() || !examDate) return;

    try {
      await api.post(`/students/${studentId}/exams`, {
        subject: examSubject.trim(),
        examDate,
      });

      const newExam = {
        id: Date.now(),
        subject: examSubject.trim(),
        examDate,
      };

      const updated = [...exams, newExam].sort(
        (a, b) => new Date(a.examDate) - new Date(b.examDate)
      );

      setExams(updated);
      localStorage.setItem("eduExams", JSON.stringify(updated));
      setExamSubject("");
      setExamDate("");
      setExamMessage("Exam added successfully!");
    } catch (err) {
      setExamMessage(err.response?.data?.error || "Could not save exam.");
    }
  };

  const deleteExam = (id) => {
    const updated = exams.filter((exam) => exam.id !== id);
    setExams(updated);
    localStorage.setItem("eduExams", JSON.stringify(updated));
  };

  const startQuiz = (index) => {
    setQuizIndex(index);
    setQuizQuestion(0);
    setQuizScore(0);
    setQuizFinished(false);
  };

  const answerQuiz = (option) => {
    const quiz = quizData[quizIndex];
    const correct = option === quiz.questions[quizQuestion].answer;
    const nextScore = quizScore + (correct ? 1 : 0);

    setQuizScore(nextScore);

    if (quizQuestion + 1 === quiz.questions.length) {
      setQuizFinished(true);
    } else {
      setQuizQuestion(quizQuestion + 1);
    }
  };

  const average = marks.length
    ? Math.round(
        marks.reduce((sum, m) => {
          const score = Number(m.score);
          const max = Number(m.maxScore);
          return sum + (max > 0 ? (score / max) * 100 : 0);
        }, 0) / marks.length
      )
    : 0;

  const statCards = [
    { title: "Courses Enrolled", value: "04", icon: BookOpen, color: "violet" },
    { title: "Study Hours", value: "24.5h", icon: Clock, color: "blue" },
    { title: "Average Score", value: `${average}%`, icon: Target, color: "emerald" },
    { title: "Learning Streak", value: "7 Days", icon: Flame, color: "orange" },
  ];

  const Card = ({ children, className = "" }) => (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 md:p-6 ${className}`}>
      {children}
    </div>
  );

  const PageTitle = ({ title, subtitle }) => (
    <div className="mb-7">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{title}</h1>
      <p className="text-slate-500 mt-2">{subtitle}</p>
    </div>
  );

  const renderDashboard = () => (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Welcome back, {studentName}!
          </h1>
          <p className="text-slate-500 mt-2">Your learning progress at a glance.</p>
        </div>
        <button onClick={() => setActive("My Courses")}
          className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-xl font-semibold">
          Explore courses →
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colors = {
            violet: "bg-violet-50 text-violet-600",
            blue: "bg-blue-50 text-blue-600",
            emerald: "bg-emerald-50 text-emerald-600",
            orange: "bg-orange-50 text-orange-600",
          };
          return (
            <Card key={stat.title}>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">{stat.title}</span>
                <div className={`p-2 rounded-xl ${colors[stat.color]}`}><Icon size={19} /></div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-4">
                {stat.title === "Average Score" && loading ? "..." : stat.value}
              </p>
              <p className="text-xs text-slate-400 mt-2">Learning overview</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <Card className="xl:col-span-2">
          <h3 className="font-bold text-slate-900">Study Activity</h3>
          <p className="text-sm text-slate-400 mt-1 mb-5">Weekly study hours (sample data)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { day: "Mon", hours: 2 }, { day: "Tue", hours: 3.5 },
                { day: "Wed", hours: 2.8 }, { day: "Thu", hours: 4 },
                { day: "Fri", hours: 3.2 }, { day: "Sat", hours: 5 },
                { day: "Sun", hours: 4.2 },
              ]}>
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
                <Area dataKey="hours" stroke="#8b5cf6" strokeWidth={3} fill="url(#studyGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-slate-900">Course Progress</h3>
          <p className="text-sm text-slate-400 mt-1 mb-6">Completion overview</p>
          <div className="space-y-5">
            {courseData.slice(0, 3).map((course) => (
              <div key={course.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span>{course.name}</span><span>{course.progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`${course.color} h-full`} style={{ width: `${course.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setActive("Analytics")}
            className="mt-7 w-full border rounded-xl py-3 text-sm font-semibold hover:bg-slate-50">
            View analytics
          </button>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Recent Marks</h3>
          <button onClick={() => setActive("Marks")} className="text-violet-600 text-sm font-semibold">View all →</button>
        </div>
        {loading ? <p className="text-slate-500">Loading marks...</p> :
          marks.length === 0 ? <p className="text-slate-500">No marks available yet.</p> :
          marks.slice(0, 5).map((mark) => (
            <div key={mark.id} className="flex justify-between border-b last:border-0 py-3">
              <span>{mark.subject} – {mark.topic}</span>
              <strong>{mark.score}/{mark.maxScore}</strong>
            </div>
          ))}
      </Card>

      <div className="mt-6 rounded-2xl p-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
        <h3 className="text-xl font-bold">Need help with a topic?</h3>
        <p className="text-violet-100 mt-2">Your AI study companion is ready.</p>
        <button onClick={() => setActive("AI Mentor")} className="mt-4 bg-white text-violet-700 px-5 py-3 rounded-xl font-semibold">
          Ask AI Mentor →
        </button>
      </div>
    </>
  );

  const renderCourses = () => (
    <>
      <PageTitle title="My Courses" subtitle="Explore your learning subjects and track progress." />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {courseData.map((course) => (
          <Card key={course.name}>
            <div className={`w-14 h-14 ${course.color} rounded-xl text-white flex items-center justify-center font-bold text-lg`}>
              {course.code}
            </div>
            <h3 className="font-bold text-lg mt-5">{course.name}</h3>
            <p className="text-sm text-slate-500 mt-2">Learning progress</p>
            <div className="flex justify-between text-sm mt-5 mb-2">
              <span>Completed</span><strong>{course.progress}%</strong>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`${course.color} h-full`} style={{ width: `${course.progress}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-4">Demo course progress</p>
          </Card>
        ))}
      </div>
    </>
  );

  const renderMarks = () => (
    <>
      <PageTitle title="My Marks" subtitle="Your scores and academic performance." />
      <Card>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold">Marks History</h3>
          <span className="text-violet-700 bg-violet-50 px-3 py-1 rounded-lg text-sm">Average: {average}%</span>
        </div>
        {loading ? <p>Loading marks...</p> : marks.length === 0 ? (
          <p className="text-slate-500">No marks recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr><th className="p-3">Subject</th><th className="p-3">Topic</th><th className="p-3">Score</th><th className="p-3">Percentage</th></tr>
              </thead>
              <tbody>
                {marks.map((mark) => (
                  <tr key={mark.id} className="border-b">
                    <td className="p-3 font-medium">{mark.subject}</td>
                    <td className="p-3">{mark.topic}</td>
                    <td className="p-3">{mark.score}/{mark.maxScore}</td>
                    <td className="p-3 text-violet-700 font-semibold">
                      {mark.maxScore > 0 ? Math.round(mark.score / mark.maxScore * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );

  const renderExams = () => (
    <>
      <PageTitle title="Exams" subtitle="Add and manage your upcoming exams." />
      <Card className="mb-6">
        <h3 className="font-bold mb-4">Add an Exam</h3>
        <form onSubmit={addExam} className="grid md:grid-cols-3 gap-3">
          <input value={examSubject} onChange={(e) => setExamSubject(e.target.value)}
            placeholder="Subject name" required className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500" />
          <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)}
            required className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500" />
          <button className="bg-violet-600 text-white rounded-xl py-3 font-semibold flex justify-center items-center gap-2">
            <Plus size={18} /> Add Exam
          </button>
        </form>
        {examMessage && <p className="text-sm mt-3 text-violet-600">{examMessage}</p>}
      </Card>
      <Card>
        <h3 className="font-bold mb-4">Exam Schedule</h3>
        {exams.length === 0 ? <p className="text-slate-500">No exams added yet.</p> :
          exams.map((exam) => (
            <div key={exam.id} className="flex justify-between items-center border-b py-4">
              <div><strong>{exam.subject}</strong><p className="text-sm text-slate-500 mt-1">{exam.examDate}</p></div>
              <button onClick={() => deleteExam(exam.id)} className="text-red-500 p-2"><X size={18} /></button>
            </div>
          ))}
        <p className="text-xs text-slate-400 mt-4">Exam schedule is saved in this browser.</p>
      </Card>
    </>
  );

  const renderMentor = () => (
    <>
      <PageTitle title="AI Study Mentor" subtitle="Ask questions and get help learning." />
      <Card>
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about your studies..."
          className="w-full border rounded-xl p-4 min-h-36 outline-none focus:ring-2 focus:ring-violet-500" />
        <button onClick={askMentor} disabled={asking || !question.trim()}
          className="mt-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold">
          {asking ? "Thinking..." : "Ask AI"}
        </button>
        {answer && <div className="mt-6 bg-violet-50 p-5 rounded-xl">
          <h3 className="font-bold mb-2">Mentor Response</h3>
          <p className="whitespace-pre-wrap leading-7">{answer}</p>
        </div>}
      </Card>
    </>
  );

  const renderQuizzes = () => (
    <>
      <PageTitle title="Quizzes" subtitle="Practice your knowledge with quick quizzes." />
      {quizIndex === null ? (
        <div className="grid md:grid-cols-2 gap-5">
          {quizData.map((quiz, index) => (
            <Card key={quiz.title}>
              <div className="bg-violet-50 text-violet-600 w-12 h-12 rounded-xl flex items-center justify-center"><ClipboardList /></div>
              <h3 className="font-bold text-lg mt-4">{quiz.title}</h3>
              <p className="text-slate-500 text-sm mt-2">{quiz.questions.length} questions · {quiz.subject}</p>
              <button onClick={() => startQuiz(index)} className="mt-5 bg-violet-600 text-white px-5 py-3 rounded-xl font-semibold">Start Quiz</button>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          {quizFinished ? (
            <div className="text-center py-8">
              <CheckCircle2 size={50} className="text-emerald-500 mx-auto" />
              <h2 className="text-2xl font-bold mt-4">Quiz Completed!</h2>
              <p className="text-slate-500 mt-2">Your score: {quizScore}/{quizData[quizIndex].questions.length}</p>
              <button onClick={() => setQuizIndex(null)} className="mt-6 bg-violet-600 text-white px-5 py-3 rounded-xl">Back to Quizzes</button>
            </div>
          ) : (
            <>
              <p className="text-sm text-violet-600 mb-3">Question {quizQuestion + 1} of {quizData[quizIndex].questions.length}</p>
              <h2 className="font-bold text-xl mb-6">{quizData[quizIndex].questions[quizQuestion].q}</h2>
              <div className="grid gap-3">
                {quizData[quizIndex].questions[quizQuestion].options.map((option, index) => (
                  <button key={option} onClick={() => answerQuiz(index)}
                    className="text-left border rounded-xl p-4 hover:bg-violet-50 hover:border-violet-400 transition">
                    {String.fromCharCode(65 + index)}. {option}
                  </button>
                ))}
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );

  const renderAnalytics = () => (
    <>
      <PageTitle title="Analytics" subtitle="Understand your academic performance." />
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card><p className="text-slate-500 text-sm">Average Score</p><h2 className="text-3xl font-bold mt-3">{average}%</h2></Card>
        <Card><p className="text-slate-500 text-sm">Marks Recorded</p><h2 className="text-3xl font-bold mt-3">{marks.length}</h2></Card>
        <Card><p className="text-slate-500 text-sm">Subjects</p><h2 className="text-3xl font-bold mt-3">{new Set(marks.map(m => m.subject)).size}</h2></Card>
      </div>
      <Card>
        <h3 className="font-bold mb-5">Score by Subject</h3>
        {marks.length === 0 ? <p className="text-slate-500">Add marks to see your performance chart.</p> : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marks.map(m => ({ subject: m.subject, score: m.maxScore > 0 ? Math.round(m.score / m.maxScore * 100) : 0 }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
      {analytics && <Card className="mt-6"><h3 className="font-bold mb-3">Backend Analytics</h3><pre className="text-xs whitespace-pre-wrap overflow-auto">{JSON.stringify(analytics, null, 2)}</pre></Card>}
    </>
  );

  const renderSettings = () => (
    <>
      <PageTitle title="Settings" subtitle="Manage your EduMentor profile." />
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xl font-bold">{studentName[0]?.toUpperCase()}</div>
          <div><h3 className="font-bold text-lg">{studentName}</h3><p className="text-sm text-slate-500">Student ID: {studentId}</p></div>
        </div>
        <button onClick={() => { loadData(); setSettingsMessage("Data refreshed."); }}
          className="border rounded-xl px-5 py-3 font-semibold hover:bg-slate-50">Refresh Data</button>
        {settingsMessage && <p className="text-sm text-emerald-600 mt-3">{settingsMessage}</p>}
        <div className="border-t mt-6 pt-6">
          <button onClick={() => {
            localStorage.removeItem("studentId");
            localStorage.removeItem("studentName");
            setStudentId("");
            setStudentName("");
          }} className="text-red-600 font-semibold flex items-center gap-2"><LogOut size={18}/> Sign out</button>
        </div>
      </Card>
    </>
  );

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
        <div className="bg-white border rounded-2xl p-8 w-full max-w-md shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-violet-600 p-2 rounded-xl text-white"><GraduationCap size={25}/></div>
            <div><h1 className="text-xl font-bold">EduMentor</h1><p className="text-xs text-slate-400">Learn smarter</p></div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome, Student!</h2>
          <p className="text-slate-500 mb-6">Create your student profile to get started.</p>
          <form onSubmit={registerStudent} className="space-y-4">
            <input value={registerName} onChange={e => setRegisterName(e.target.value)}
              placeholder="Your full name" required className="w-full border rounded-xl px-4 py-3"/>
            <input value={registerEmail} onChange={e => setRegisterEmail(e.target.value)}
              type="email" placeholder="Email (optional)" className="w-full border rounded-xl px-4 py-3"/>
            {registerError && <p className="text-red-600 text-sm">{registerError}</p>}
            <button disabled={registering} className="w-full bg-violet-600 text-white rounded-xl py-3 font-semibold disabled:opacity-50">
              {registering ? "Creating profile..." : "Create Profile"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      <aside className={`fixed md:static z-40 inset-y-0 left-0 w-64 bg-white border-r p-5 flex flex-col transition-transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-violet-600 p-2 rounded-xl text-white"><GraduationCap size={25}/></div>
          <div><h1 className="text-xl font-bold text-slate-900">EduMentor</h1><p className="text-xs text-slate-400">Learn smarter</p></div>
        </div>
        <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Workspace</p>
        <nav className="space-y-1">
          {menuItems.map(({label, icon: Icon}) => (
            <button key={label} onClick={() => {setActive(label);setSidebarOpen(false);}}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                active === label ? "bg-violet-50 text-violet-700" : "text-slate-500 hover:bg-slate-50"
              }`}>
              <Icon size={19}/>{label}
              {label === "AI Mentor" && <span className="ml-auto text-xs bg-violet-100 px-2 py-0.5 rounded-full">AI</span>}
            </button>
          ))}
        </nav>
        <div className="mt-auto">
          <button onClick={() => setActive("Settings")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-500 hover:bg-slate-50"><Settings size={19}/> Settings</button>
          <div className="mt-5 p-4 rounded-2xl bg-violet-50">
            <div className="flex items-center gap-2 text-violet-700 font-semibold text-sm"><Flame size={18}/> Keep learning!</div>
            <p className="text-xs text-slate-500 mt-2">Consistency is the key to success.</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="h-20 bg-white border-b px-5 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={21}/></button>
            <div><p className="text-xs text-slate-400">Workspace / {active}</p><h2 className="font-bold text-lg">{active}</h2></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="p-2 rounded-xl hover:bg-slate-100" title="Refresh"><Clock size={19}/></button>
            <Bell size={20}/>
            <div className="w-10 h-10 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center font-bold">{studentName[0]?.toUpperCase()}</div>
          </div>
        </header>

        <div className="p-5 md:p-8 max-w-7xl mx-auto">
          {error && <div className="mb-5 bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>}
          {active === "Dashboard" && renderDashboard()}
          {active === "My Courses" && renderCourses()}
          {active === "Marks" && renderMarks()}
          {active === "Exams" && renderExams()}
          {active === "AI Mentor" && renderMentor()}
          {active === "Quizzes" && renderQuizzes()}
          {active === "Analytics" && renderAnalytics()}
          {active === "Settings" && renderSettings()}
        </div>
      </main>
    </div>
  );
}

export default App;
