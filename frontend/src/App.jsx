
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import api from "./api";
import { normalizeMentorMarkdown } from "./utils/mentorMarkdown.js";
import {
  COURSE_CATALOG,
  QUIZZES,
  calculateQuizScore,
  loadCourseProgress,
  loadQuizHistory,
  safeStorageGet,
  safeStorageRemove,
  safeStorageSet,
  saveCourseProgress,
  saveQuizResult,
} from "./utils/studentWorkspace.js";
import {
  LayoutDashboard, BookOpen, Brain, ClipboardList, BarChart3,
  Settings, Bell, Menu, GraduationCap, Clock, Target, Flame,
  CalendarDays, Award, LogOut, Plus, CheckCircle2, X,
} from "lucide-react";
import {
  ResponsiveContainer, XAxis, YAxis,
  Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My Courses", icon: BookOpen },
  { label: "Marks", icon: Award },
  { label: "Exams", icon: CalendarDays },
  { label: "AI Mentor", icon: Brain },
  { label: "Quizzes", icon: ClipboardList },
  { label: "Analytics", icon: BarChart3 },
];

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;
  const candidates = [
    typeof data?.error === "string" ? data.error : data?.error?.message,
    typeof data?.message === "string" ? data.message : data?.message?.message,
    typeof error?.message === "string" ? error.message : null,
  ];
  return candidates.find((value) => typeof value === "string" && value.trim()) || fallback;
}

function getLocalDateString() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

async function requestStudentData(studentId) {
  const [marksResponse, analyticsResponse, examsResponse] = await Promise.all([
    api.get(`/students/${studentId}/marks`),
    api.get(`/students/${studentId}/analytics`),
    api.get(`/students/${studentId}/exams`),
  ]);
  return {
    marks: Array.isArray(marksResponse.data) ? marksResponse.data : [],
    analytics: analyticsResponse.data,
    exams: Array.isArray(examsResponse.data) ? examsResponse.data : [],
    upcomingExams: Array.isArray(analyticsResponse.data?.upcomingExams)
      ? analyticsResponse.data.upcomingExams
      : [],
  };
}

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

const withoutMarkdownNode = (props) => {
  const { node, ...htmlProps } = props;
  void node;
  return htmlProps;
};

function App() {
  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [studentId, setStudentId] = useState(() => safeStorageGet("studentId"));
  const [studentName, setStudentName] = useState(() => safeStorageGet("studentName"));
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const [marks, setMarks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [loading, setLoading] = useState(() => Boolean(safeStorageGet("studentId")));
  const [error, setError] = useState("");

  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [mentorMessages, setMentorMessages] = useState([]);
  const [mentorHistoryError, setMentorHistoryError] = useState("");
  const [mentorError, setMentorError] = useState("");

  const [examSubject, setExamSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [exams, setExams] = useState([]);
  const [examMessage, setExamMessage] = useState("");
  const [examMessageType, setExamMessageType] = useState("success");
  const [savingExam, setSavingExam] = useState(false);
  const [deletingExamId, setDeletingExamId] = useState(null);
  const [markSubject, setMarkSubject] = useState("");
  const [markTopic, setMarkTopic] = useState("");
  const [markScore, setMarkScore] = useState("");
  const [markMaxScore, setMarkMaxScore] = useState("");
  const [markDate, setMarkDate] = useState("");
  const [markMessage, setMarkMessage] = useState("");
  const [markMessageType, setMarkMessageType] = useState("success");
  const [savingMark, setSavingMark] = useState(false);

  const [courseProgress, setCourseProgress] = useState(() => loadCourseProgress(safeStorageGet("studentId")));
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [courseStorageError, setCourseStorageError] = useState("");
  const [quizHistory, setQuizHistory] = useState(() => loadQuizHistory(safeStorageGet("studentId")));
  const [quizStorageError, setQuizStorageError] = useState("");
  const [quizIndex, setQuizIndex] = useState(null);
  const [quizQuestion, setQuizQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizFinished, setQuizFinished] = useState(false);

  const [settingsMessage, setSettingsMessage] = useState("");
  const today = getLocalDateString();

  const isRegistered = Boolean(studentId && studentName);

  const loadData = async () => {
    if (!studentId) return false;
    setLoading(true);
    setError("");
    try {
      const data = await requestStudentData(studentId);
      setMarks(data.marks);
      setAnalytics(data.analytics);
      setExams(data.exams);
      setUpcomingExams(data.upcomingExams);
    } catch (err) {
      setMarks([]);
      setAnalytics(null);
      setExams([]);
      setUpcomingExams([]);
      setError(getErrorMessage(err, "Unable to load student data. Please refresh."));
      return false;
    } finally {
      setLoading(false);
    }
    return true;
  };

  useEffect(() => {
    if (!isRegistered) return undefined;

    let current = true;
    requestStudentData(studentId)
      .then((data) => {
        if (!current) return;
        setMarks(data.marks);
        setAnalytics(data.analytics);
        setExams(data.exams);
        setUpcomingExams(data.upcomingExams);
        setError("");
      })
      .catch((err) => {
        if (!current) return;
        setMarks([]);
        setAnalytics(null);
        setExams([]);
        setUpcomingExams([]);
        setError(getErrorMessage(err, "Unable to load student data. Please refresh."));
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => { current = false; };
  }, [isRegistered, studentId]);

  useEffect(() => {
    if (!studentId) return undefined;
    let current = true;
    api.get(`/mentor/${studentId}/history`)
      .then(({ data }) => {
        if (!current) return;
        const ordered = Array.isArray(data) ? [...data].reverse() : [];
        setMentorMessages(ordered.map((message) => ({
          role: message.role,
          content: message.content,
        })));
        setMentorHistoryError("");
      })
      .catch(() => {
        if (current) setMentorHistoryError("Previous mentor messages could not be loaded.");
      });

    return () => { current = false; };
  }, [studentId]);

  const registerStudent = async (e) => {
    e.preventDefault();
    if (!registerName.trim()) {
      setRegisterError("Enter your name to create a profile.");
      return;
    }

    setRegistering(true);
    setRegisterError("");

    try {
      const response = await api.post("/students", {
        name: registerName.trim(),
        email: registerEmail.trim() || null,
      });

      const id = response.data.id;
      const name = typeof response.data.name === "string" && response.data.name.trim()
        ? response.data.name
        : registerName.trim();

      if (!id) throw new Error("Student ID was not returned.");

      safeStorageSet("studentId", String(id));
      safeStorageSet("studentName", name);
      setCourseProgress(loadCourseProgress(String(id)));
      setQuizHistory(loadQuizHistory(String(id)));
      setMentorMessages([]);

      setLoading(true);
      setStudentId(String(id));
      setStudentName(name);
    } catch (err) {
      setRegisterError(getErrorMessage(err, "Registration failed."));
    } finally {
      setRegistering(false);
    }
  };

  const askMentor = async () => {
    const submittedQuestion = question.trim();
    if (!submittedQuestion || !studentId) return;

    setAsking(true);
    setMentorError("");

    try {
      const response = await api.post(`/mentor/${studentId}/ask`, { question: submittedQuestion });
      const result = response.data?.answer;
      const mentorAnswer = typeof result === "string" ? result : JSON.stringify(result ?? response.data);
      setMentorMessages((messages) => [
        ...messages,
        { role: "student", content: submittedQuestion },
        { role: "mentor", content: mentorAnswer },
      ]);
      setQuestion("");
    } catch (err) {
      setMentorError(getErrorMessage(err, "Mentor is unavailable."));
    } finally {
      setAsking(false);
    }
  };

  const addExam = async (e) => {
    e.preventDefault();
    if (!studentId) return;
    if (!examSubject.trim() || !examDate) {
      setExamMessageType("error");
      setExamMessage("Enter an exam subject and date.");
      return;
    }

    setSavingExam(true);
    setExamMessage("");
    try {
      await api.post(`/students/${studentId}/exams`, {
        subject: examSubject.trim(),
        examDate,
      });
      setExamSubject("");
      setExamDate("");
      setExamMessageType("success");
      setExamMessage("Exam added successfully!");
      await loadData();
    } catch (err) {
      setExamMessageType("error");
      setExamMessage(getErrorMessage(err, "Could not save exam."));
    } finally {
      setSavingExam(false);
    }
  };

  const deleteExam = async (id) => {
    setExamMessage("");
    setDeletingExamId(id);
    try {
      await api.delete(`/students/${studentId}/exams/${id}`);
      setExamMessageType("success");
      setExamMessage("Exam deleted successfully.");
      await loadData();
    } catch (err) {
      setExamMessageType("error");
      setExamMessage(getErrorMessage(err, "Could not delete exam."));
    } finally {
      setDeletingExamId(null);
    }
  };

  const addMark = async (e) => {
    e.preventDefault();
    if (!markSubject.trim() || !markTopic.trim() || markScore === "" || markMaxScore === "") {
      setMarkMessageType("error");
      setMarkMessage("Enter a subject, topic, score, and maximum score.");
      return;
    }

    setSavingMark(true);
    setMarkMessage("");
    const score = Number(markScore);
    const maxScore = Number(markMaxScore);
    if (!Number.isFinite(score) || !Number.isFinite(maxScore) || score > maxScore) {
      setMarkMessageType("error");
      setMarkMessage("Score must be a valid number no greater than the maximum score.");
      setSavingMark(false);
      return;
    }
    try {
      await api.post(`/students/${studentId}/marks`, {
        subject: markSubject.trim(),
        topic: markTopic.trim(),
        score,
        maxScore,
        takenOn: markDate || null,
      });
      setMarkSubject("");
      setMarkTopic("");
      setMarkScore("");
      setMarkMaxScore("");
      setMarkDate("");
      setMarkMessageType("success");
      setMarkMessage("Mark added successfully.");
      await loadData();
    } catch (err) {
      setMarkMessageType("error");
      setMarkMessage(getErrorMessage(err, "Could not save mark."));
    } finally {
      setSavingMark(false);
    }
  };

  const startQuiz = (index) => {
    setQuizIndex(index);
    setQuizQuestion(0);
    setQuizAnswers({});
    setQuizFinished(false);
  };

  const submitQuiz = () => {
    const quiz = QUIZZES[quizIndex];
    const score = calculateQuizScore(quiz, quizAnswers);
    if (score === null) return;
    const result = {
      quizId: quiz.id,
      title: quiz.title,
      score,
      total: quiz.questions.length,
      completedAt: new Date().toISOString(),
    };
    setQuizHistory((history) => [...history, result]);
    setQuizStorageError(saveQuizResult(studentId, result)
      ? ""
      : "The result is visible for this session but could not be saved in this browser.");
    setQuizFinished(true);
  };

  const toggleCourseLesson = (courseId, lessonId) => {
    setCourseProgress((progress) => {
      const completed = progress[courseId] || [];
      const nextCompleted = completed.includes(lessonId)
        ? completed.filter((id) => id !== lessonId)
        : [...completed, lessonId];
      const next = { ...progress, [courseId]: nextCompleted };
      if (!saveCourseProgress(studentId, next)) {
        setCourseStorageError("Progress changed for this session but could not be saved in this browser.");
      } else {
        setCourseStorageError("");
      }
      return next;
    });
  };

  const averageCourseProgress = COURSE_CATALOG.length
    ? Math.round(COURSE_CATALOG.reduce((total, course) => (
        total + ((courseProgress[course.id]?.length || 0) / course.lessons.length) * 100
      ), 0) / COURSE_CATALOG.length)
    : 0;
  const latestQuizResult = quizHistory.at(-1);

  const statCards = [
    { title: "Marks Recorded", value: analytics?.marksCount ?? 0, icon: Award, color: "violet" },
    { title: "Subjects Tracked", value: analytics?.subjects?.length ?? 0, icon: BookOpen, color: "blue" },
    { title: "Average Score", value: analytics?.marksCount ? `${analytics.averageScore}%` : "—", icon: Target, color: "emerald" },
    { title: "Upcoming Exams", value: upcomingExams.length, icon: CalendarDays, color: "orange" },
  ];

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
                {loading ? "..." : error ? "—" : stat.value}
              </p>
              <p className="text-xs text-slate-400 mt-2">From your academic records</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <Card className="xl:col-span-2">
          <h3 className="font-bold text-slate-900">Average Score by Subject</h3>
          <p className="text-sm text-slate-400 mt-1 mb-5">Calculated from your recorded marks</p>
          {loading ? <p className="text-slate-500">Loading analytics...</p> : error ?
            <p className="text-red-600">Unable to load analytics. Please refresh.</p> :
            !analytics?.subjects?.length ? <p className="text-slate-500">Add marks to see subject analytics.</p> :
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.subjects.map(({ subject, average: score }) => ({ subject, score }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="subject" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} unit="%" axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => [`${value}%`, "Average score"]} />
                  <Bar dataKey="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>}
        </Card>

        <Card>
          <h3 className="font-bold text-slate-900">Upcoming Exams</h3>
          <p className="text-sm text-slate-400 mt-1 mb-4">From your saved exam schedule</p>
          {loading ? <p className="text-slate-500">Loading exams...</p> : error ?
            <p className="text-red-600">Unable to load exams.</p> : upcomingExams.length === 0 ?
              <p className="text-slate-500">No upcoming exams scheduled.</p> :
              <div className="space-y-3">
                {upcomingExams.slice(0, 5).map((exam) => (
                  <div key={exam.id} className="flex justify-between gap-3 border-b last:border-0 pb-3">
                    <span className="font-medium text-slate-700">{exam.subject}</span>
                    <time className="text-sm text-slate-500" dateTime={exam.examDate}>
                      {new Date(`${exam.examDate}T00:00:00`).toLocaleDateString()}
                    </time>
                  </div>
                ))}
              </div>}
          <button onClick={() => setActive("Exams")}
            className="mt-5 w-full border rounded-xl py-3 text-sm font-semibold hover:bg-slate-50">
            Manage exams
          </button>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div><h3 className="font-bold">Course progress</h3><p className="text-sm text-slate-500 mt-1">Based on topics you marked complete</p></div>
            <strong className="text-xl text-violet-700">{averageCourseProgress}%</strong>
          </div>
          <div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${averageCourseProgress}%` }} /></div>
          <button onClick={() => setActive("My Courses")} className="mt-4 text-violet-700 text-sm font-semibold">Continue a course →</button>
        </Card>
        <Card>
          <h3 className="font-bold">Quiz performance</h3>
          {latestQuizResult ? (
            <><p className="mt-2 text-slate-700">Latest: {latestQuizResult.title} — {latestQuizResult.score}/{latestQuizResult.total}</p>
              <p className="text-sm text-slate-500 mt-1">{quizHistory.length} completed attempt{quizHistory.length === 1 ? "" : "s"} saved in this browser</p></>
          ) : <p className="mt-2 text-slate-500">No quiz attempts yet.</p>}
          <button onClick={() => setActive("Quizzes")} className="mt-4 text-violet-700 text-sm font-semibold">Practice a quiz →</button>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Recent Marks</h3>
          <button onClick={() => setActive("Marks")} className="text-violet-600 text-sm font-semibold">View all →</button>
        </div>
        {loading ? <p className="text-slate-500">Loading marks...</p> : error ?
          <p className="text-red-600">Unable to load marks. Please refresh.</p> :
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
      <PageTitle title="My Courses" subtitle="Study the topics and track your progress on this browser." />
      {courseStorageError && <p role="alert" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{courseStorageError}</p>}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {COURSE_CATALOG.map((course) => {
          const completed = courseProgress[course.id] || [];
          const progress = Math.round((completed.length / course.lessons.length) * 100);
          const expanded = selectedCourseId === course.id;
          return (
          <Card key={course.name}>
            <div className={`w-14 h-14 ${course.color} rounded-xl text-white flex items-center justify-center font-bold text-lg`}>
              {course.code}
            </div>
            <h3 className="font-bold text-lg mt-5">{course.name}</h3>
            <p className="text-sm text-slate-500 mt-2">{course.lessons.length} guided topics</p>
            <div className="flex justify-between text-sm mt-5 mb-2">
              <span>Topics completed</span><strong>{progress}%</strong>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`${course.color} h-full`} style={{ width: `${progress}%` }} />
            </div>
            <button aria-expanded={expanded} onClick={() => setSelectedCourseId(expanded ? null : course.id)}
              className="mt-4 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-slate-50">
              {expanded ? "Hide topics" : "View topics"}
            </button>
            {expanded && <ul className="mt-4 space-y-3 border-t pt-4">
              {course.lessons.map((lesson) => (
                <li key={lesson.id} className="rounded-lg bg-slate-50 p-3">
                  <label className="flex cursor-pointer items-start gap-2 font-medium">
                    <input type="checkbox" checked={completed.includes(lesson.id)} onChange={() => toggleCourseLesson(course.id, lesson.id)} className="mt-1 accent-violet-600" />
                    <span>{lesson.title}</span>
                  </label>
                  <p className="ml-6 mt-1 text-sm text-slate-500">{lesson.description}</p>
                </li>
              ))}
            </ul>}
          </Card>
          );
        })}
      </div>
    </>
  );

  const renderMarks = () => (
    <>
      <PageTitle title="My Marks" subtitle="Your scores and academic performance." />
      <Card className="mb-6">
        <h3 className="font-bold mb-4">Add a Mark</h3>
        <form onSubmit={addMark} className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">
          <input value={markSubject} onChange={(e) => setMarkSubject(e.target.value)}
            placeholder="Subject" required maxLength={80}
            className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500" />
          <input value={markTopic} onChange={(e) => setMarkTopic(e.target.value)}
            placeholder="Topic" required maxLength={120}
            className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500" />
          <input type="number" value={markScore} onChange={(e) => setMarkScore(e.target.value)}
            placeholder="Score" required min="0" step="0.01"
            className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500" />
          <input type="number" value={markMaxScore} onChange={(e) => setMarkMaxScore(e.target.value)}
            placeholder="Maximum score" required min="0.01" step="0.01"
            className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500" />
          <input type="date" value={markDate} onChange={(e) => setMarkDate(e.target.value)}
            aria-label="Mark date"
            className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500" />
          <button disabled={savingMark}
            className="md:col-span-2 xl:col-span-5 bg-violet-600 disabled:opacity-50 text-white rounded-xl py-3 font-semibold flex justify-center items-center gap-2">
            <Plus size={18} /> {savingMark ? "Saving mark..." : "Add Mark"}
          </button>
        </form>
        {markMessage && <p aria-live="polite" className={`text-sm mt-3 ${markMessageType === "error" ? "text-red-600" : "text-emerald-700"}`}>{markMessage}</p>}
      </Card>
      <Card>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold">Marks History</h3>
          <span className="text-violet-700 bg-violet-50 px-3 py-1 rounded-lg text-sm">Average: {marks.length ? `${Math.round(marks.reduce((sum, mark) => sum + (Number(mark.maxScore) > 0 ? Number(mark.score) / Number(mark.maxScore) * 100 : 0), 0) / marks.length)}%` : "—"}</span>
        </div>
        {loading ? <p className="text-slate-500">Loading marks...</p> : error ? (
          <p role="alert" className="text-red-600">Unable to load marks. Please refresh and try again.</p>
        ) : marks.length === 0 ? (
          <p className="text-slate-500">No marks recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr><th className="p-3">Subject</th><th className="p-3">Topic</th><th className="p-3">Score</th><th className="p-3">Percentage</th><th className="p-3">Date</th></tr>
              </thead>
              <tbody>
                {marks.map((mark) => (
                  <tr key={mark.id} className="border-b">
                    <td className="p-3 font-medium">{mark.subject}</td>
                    <td className="p-3">{mark.topic}</td>
                    <td className="p-3">{mark.score}/{mark.maxScore}</td>
                    <td className="p-3 text-violet-700 font-semibold">
                      {Number(mark.maxScore) > 0 ? Math.round(Number(mark.score) / Number(mark.maxScore) * 100) : 0}%
                    </td>
                    <td className="p-3">{mark.takenOn ? new Date(`${mark.takenOn}T00:00:00`).toLocaleDateString() : "—"}</td>
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
            placeholder="Subject name" required maxLength={80} className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500" />
          <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)}
            required className="border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500" />
          <button disabled={savingExam} className="bg-violet-600 disabled:opacity-50 text-white rounded-xl py-3 font-semibold flex justify-center items-center gap-2">
            <Plus size={18} /> {savingExam ? "Saving exam..." : "Add Exam"}
          </button>
        </form>
        {examMessage && <p aria-live="polite" className={`text-sm mt-3 ${examMessageType === "error" ? "text-red-600" : "text-emerald-700"}`}>{examMessage}</p>}
      </Card>
      <Card>
        <h3 className="font-bold mb-4">Exam Schedule</h3>
        {loading ? <p className="text-slate-500">Loading exams...</p> : error ?
          <p className="text-red-600">Unable to load exams. Please refresh.</p> : exams.length === 0 ?
          <p className="text-slate-500">No exams added yet.</p> :
          exams.map((exam) => (
            <div key={exam.id} className="flex justify-between items-center border-b py-4">
              <div>
                <strong>{exam.subject}</strong>
                <p className="text-sm text-slate-500 mt-1">{exam.examDate ? new Date(`${exam.examDate}T00:00:00`).toLocaleDateString() : "Date unavailable"}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${exam.examDate >= today ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                  {exam.examDate >= today ? "Upcoming" : "Past"}
                </span>
              </div>
              <button disabled={deletingExamId === exam.id} onClick={() => deleteExam(exam.id)} aria-label={`Delete ${exam.subject} exam`}
                className="text-red-500 disabled:opacity-50 p-2"><X size={18} /></button>
            </div>
          ))}
        {exams.length > 0 && <p className="text-xs text-slate-400 mt-4">Exam schedule is saved to your account.</p>}
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
        {mentorHistoryError && <p role="status" className="mt-4 text-sm text-amber-700">{mentorHistoryError}</p>}
        {mentorError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{mentorError}</p>}
        <div className="mt-6 space-y-4">
          {mentorMessages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`rounded-xl p-5 ${message.role === "student" ? "bg-white border border-slate-200" : "bg-violet-50"}`}>
            <h3 className="font-bold mb-2">{message.role === "student" ? "You" : "Mentor Response"}</h3>
            {message.role === "student" ? <p className="whitespace-pre-wrap">{message.content}</p> : <div className="mentor-markdown text-slate-700 leading-7">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: (props) => <h1 {...withoutMarkdownNode(props)} className="text-2xl font-bold mt-4 mb-2 first:mt-0" />,
                h2: (props) => <h2 {...withoutMarkdownNode(props)} className="text-xl font-bold mt-4 mb-2 first:mt-0" />,
                h3: (props) => <h3 {...withoutMarkdownNode(props)} className="text-lg font-semibold mt-3 mb-1" />,
                p: (props) => <p {...withoutMarkdownNode(props)} className="mb-3 last:mb-0" />,
                ul: (props) => <ul {...withoutMarkdownNode(props)} className="list-disc pl-6 mb-3 space-y-1" />,
                ol: (props) => <ol {...withoutMarkdownNode(props)} className="list-decimal pl-6 mb-3 space-y-1" />,
                li: (props) => <li {...withoutMarkdownNode(props)} className="pl-1" />,
                blockquote: (props) => <blockquote {...withoutMarkdownNode(props)} className="border-l-4 border-violet-300 pl-4 my-3 text-slate-600" />,
                a: (props) => <a {...withoutMarkdownNode(props)} className="text-violet-700 underline underline-offset-2" />,
                table: (props) => <div className="overflow-x-auto my-4"><table {...withoutMarkdownNode(props)} className="w-full border-collapse text-left" /></div>,
                th: (props) => <th {...withoutMarkdownNode(props)} className="border border-violet-200 bg-violet-100 px-3 py-2 font-semibold" />,
                td: (props) => <td {...withoutMarkdownNode(props)} className="border border-violet-200 px-3 py-2" />,
                pre: (props) => <pre {...withoutMarkdownNode(props)} className="overflow-x-auto rounded-lg bg-slate-900 text-slate-100 p-4 my-4 text-sm" />,
                code: (props) => {
                  const { className, children, ...htmlProps } = withoutMarkdownNode(props);
                  return (
                    <code
                      {...htmlProps}
                      className={className || "rounded bg-violet-100 px-1 py-0.5 font-mono text-sm"}
                    >{children}</code>
                  );
                },
                hr: (props) => <hr {...withoutMarkdownNode(props)} className="border-violet-200 my-4" />,
              }}
            >
              {normalizeMentorMarkdown(message.content)}
            </ReactMarkdown>
            </div>}
          </div>
          ))}
        </div>
      </Card>
    </>
  );

  const renderQuizzes = () => (
    <>
      <PageTitle title="Quizzes" subtitle="Answer each question, review explanations, and track your attempts in this browser." />
      {quizStorageError && <p role="alert" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{quizStorageError}</p>}
      {quizIndex === null ? (
        <>
          <div className="grid md:grid-cols-2 gap-5">
            {QUIZZES.map((quiz, index) => {
              const attempts = quizHistory.filter((result) => result.quizId === quiz.id);
              const latest = attempts.at(-1);
              return (
                <Card key={quiz.id}>
                  <div className="bg-violet-50 text-violet-600 w-12 h-12 rounded-xl flex items-center justify-center"><ClipboardList /></div>
                  <h3 className="font-bold text-lg mt-4">{quiz.title}</h3>
                  <p className="text-slate-500 text-sm mt-2">{quiz.questions.length} questions · {quiz.subject}</p>
                  <p className="text-sm text-slate-600 mt-3">{latest ? `Latest score: ${latest.score}/${latest.total} · ${attempts.length} attempt${attempts.length === 1 ? "" : "s"}` : "No attempts yet"}</p>
                  <button onClick={() => startQuiz(index)} className="mt-5 bg-violet-600 text-white px-5 py-3 rounded-xl font-semibold">Start Quiz</button>
                </Card>
              );
            })}
          </div>
          {quizHistory.length > 0 && <Card className="mt-6">
            <h3 className="font-bold mb-3">Recent quiz history</h3>
            <ul className="divide-y">
              {[...quizHistory].reverse().slice(0, 10).map((result, index) => (
                <li key={`${result.quizId}-${result.completedAt}-${index}`} className="flex justify-between gap-3 py-3 text-sm">
                  <span>{result.title}</span><strong>{result.score}/{result.total}</strong>
                </li>
              ))}
            </ul>
          </Card>}
        </>
      ) : (
        <Card>
          {quizFinished ? (
            <>
              <div className="text-center py-6">
                <CheckCircle2 size={50} className="text-emerald-500 mx-auto" />
                <h2 className="text-2xl font-bold mt-4">Quiz Completed!</h2>
                <p className="text-slate-500 mt-2">Your score: {calculateQuizScore(QUIZZES[quizIndex], quizAnswers)}/{QUIZZES[quizIndex].questions.length}</p>
              </div>
              <div className="space-y-4">
                {QUIZZES[quizIndex].questions.map((item, index) => {
                  const correct = quizAnswers[index] === item.answer;
                  return <div key={item.q} className="rounded-xl border p-4">
                    <h3 className="font-semibold">{index + 1}. {item.q}</h3>
                    <p className={`mt-2 text-sm ${correct ? "text-emerald-700" : "text-red-700"}`}>
                      Your answer: {item.options[quizAnswers[index]]} {correct ? "(correct)" : `· Correct answer: ${item.options[item.answer]}`}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{item.explanation}</p>
                  </div>;
                })}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => startQuiz(quizIndex)} className="rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white">Retry quiz</button>
                <button onClick={() => setQuizIndex(null)} className="rounded-xl border px-5 py-3 font-semibold">Back to Quizzes</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-violet-600 mb-3">Question {quizQuestion + 1} of {QUIZZES[quizIndex].questions.length} · {Object.keys(quizAnswers).length} answered</p>
              <h2 className="font-bold text-xl mb-6">{QUIZZES[quizIndex].questions[quizQuestion].q}</h2>
              <div className="grid gap-3">
                {QUIZZES[quizIndex].questions[quizQuestion].options.map((option, index) => (
                  <button key={option} type="button" aria-pressed={quizAnswers[quizQuestion] === index}
                    onClick={() => setQuizAnswers((answers) => ({ ...answers, [quizQuestion]: index }))}
                    className={`text-left border rounded-xl p-4 hover:bg-violet-50 hover:border-violet-400 transition ${quizAnswers[quizQuestion] === index ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200" : ""}`}>
                    {String.fromCharCode(65 + index)}. {option}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap justify-between gap-3">
                <button type="button" disabled={quizQuestion === 0} onClick={() => setQuizQuestion((current) => current - 1)} className="rounded-xl border px-5 py-3 font-semibold disabled:opacity-40">Previous</button>
                {quizQuestion < QUIZZES[quizIndex].questions.length - 1 ? (
                  <button type="button" disabled={!Number.isInteger(quizAnswers[quizQuestion])} onClick={() => setQuizQuestion((current) => current + 1)} className="rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white disabled:opacity-40">Next</button>
                ) : (
                  <button type="button" disabled={calculateQuizScore(QUIZZES[quizIndex], quizAnswers) === null} onClick={submitQuiz} className="rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white disabled:opacity-40">Submit quiz</button>
                )}
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
      {loading ? <Card><p className="text-slate-500">Loading analytics...</p></Card> : error ? (
        <Card><p role="alert" className="text-red-600">Unable to load analytics. Please refresh and try again.</p></Card>
      ) : !analytics ? <Card><p className="text-slate-500">Analytics are not available yet.</p></Card> : (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <Card><p className="text-slate-500 text-sm">Average Score</p><h2 className="text-3xl font-bold mt-3">{analytics.marksCount ? `${analytics.averageScore}%` : "—"}</h2></Card>
            <Card><p className="text-slate-500 text-sm">Marks Recorded</p><h2 className="text-3xl font-bold mt-3">{analytics.marksCount}</h2></Card>
            <Card><p className="text-slate-500 text-sm">Subjects</p><h2 className="text-3xl font-bold mt-3">{analytics.subjects?.length || 0}</h2></Card>
          </div>
          <Card>
            <h3 className="font-bold mb-5">Average score by subject</h3>
            {!analytics.subjects?.length ? <p className="text-slate-500">No marks recorded yet. Add marks to see your subject analytics.</p> : (
              <div className="h-72 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.subjects} margin={{ bottom: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" interval={0} angle={-15} textAnchor="end" height={55} />
                    <YAxis domain={[0, 100]} unit="%" />
                    <Tooltip formatter={(value) => [`${value}%`, "Average score"]} />
                    <Bar dataKey="average" name="Average score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
          {analytics.subjects?.length > 0 && <Card className="mt-6">
            <h3 className="font-bold mb-3">Insights from your marks</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {analytics.subjects.map((subject) => (
                <li key={subject.subject} className="flex flex-wrap justify-between gap-2 border-b pb-2 last:border-0">
                  <span><strong>{subject.subject}</strong>: average {subject.average}% · weakest topic {subject.weakestTopic || "not available"}</span>
                  <span>{subject.trend > 0 ? `Up ${subject.trend}%` : subject.trend < 0 ? `Down ${Math.abs(subject.trend)}%` : "Trend not established"}</span>
                </li>
              ))}
            </ul>
          </Card>}
          {analytics.upcomingExams?.length > 0 && <Card className="mt-6">
            <h3 className="font-bold mb-3">Upcoming exams</h3>
            <ul className="space-y-2">{analytics.upcomingExams.map((exam) => <li key={exam.id} className="flex justify-between gap-3 text-sm"><span>{exam.subject}</span><time dateTime={exam.examDate}>{new Date(`${exam.examDate}T00:00:00`).toLocaleDateString()}</time></li>)}</ul>
          </Card>}
        </>
      )}
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
        <button onClick={async () => { setSettingsMessage(await loadData() ? "Data refreshed." : "Data could not be refreshed."); }}
          className="border rounded-xl px-5 py-3 font-semibold hover:bg-slate-50">Refresh Data</button>
        {settingsMessage && <p className="text-sm text-emerald-600 mt-3">{settingsMessage}</p>}
        <div className="border-t mt-6 pt-6">
          <button onClick={() => {
            safeStorageRemove("studentId");
            safeStorageRemove("studentName");
            setCourseProgress({});
            setQuizHistory([]);
            setMentorMessages([]);
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
              placeholder="Your full name" required maxLength={120} className="w-full border rounded-xl px-4 py-3"/>
            <input value={registerEmail} onChange={e => setRegisterEmail(e.target.value)}
              type="email" maxLength={200} placeholder="Email (optional)" className="w-full border rounded-xl px-4 py-3"/>
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
          <button onClick={() => { setActive("Settings"); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-500 hover:bg-slate-50"><Settings size={19}/> Settings</button>
          <div className="mt-5 p-4 rounded-2xl bg-violet-50">
            <div className="flex items-center gap-2 text-violet-700 font-semibold text-sm"><Flame size={18}/> Keep learning!</div>
            <p className="text-xs text-slate-500 mt-2">Consistency is the key to success.</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="h-20 bg-white border-b px-5 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={sidebarOpen}>
              <Menu size={21}/>
            </button>
            <div><p className="text-xs text-slate-400">Workspace / {active}</p><h2 className="font-bold text-lg">{active}</h2></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="p-2 rounded-xl hover:bg-slate-100" title="Refresh" aria-label="Refresh student data"><Clock size={19}/></button>
            <Bell size={20} aria-hidden="true" />
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
