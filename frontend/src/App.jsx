import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import "./CinematicWorkspace.css";
import "./components/NeuralCore3D.css";
import Card from "./components/GlassCard.jsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import api from "./api";
import { normalizeMentorMarkdown } from "./utils/mentorMarkdown.js";
import { COURSE_DETAILS, COURSE_LESSONS } from "./utils/courseCurriculum.js";
import { AVATAR_CATALOG } from "./utils/avatarCatalog.js";
import { VoiceControls } from "./components/VoiceAssistant.jsx";
import { useVoiceAssistant } from "./hooks/useVoiceAssistant.js";
import { appendDictation } from "./utils/voiceDictation.js";
import StudyModules from "./components/StudyModules.jsx";
import { removeStudyWorkspace } from "./utils/studyWorkspace.js";
import {
  COURSE_CATALOG,
  QUIZZES,
  calculateQuizScore,
  getCourseProgressPercent,
  loadCourseProgress,
  loadQuizHistory,
  loadStudentAvatar,
  safeStorageGet,
  safeStorageRemove,
  safeStorageSet,
  shouldClearStudentSessionFromStorageEvent,
  saveCourseProgress,
  saveQuizResult,
  saveStudentAvatar,
  resetStudentAvatar,
  toggleCourseLessonProgress,
} from "./utils/studentWorkspace.js";
import {
  LayoutDashboard, Layers, ClipboardList, BarChart3,
  Settings, Bell, Menu, Clock, Target, Flame,
  CalendarDays, Award, LogOut, Plus, CheckCircle2, X, Send, Sparkles,
  ChevronLeft, ChevronRight, CircleCheck,
  Orbit, Zap, ArrowUpRight, Crown, Save, RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer, XAxis, YAxis,
  Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";

const NeuralCore3D = lazy(() => import("./components/NeuralCore3D.jsx"));

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My Courses", icon: Layers },
  { label: "Marks", icon: Award },
  { label: "Exams", icon: CalendarDays },
  { label: "AI Mentor", icon: Orbit },
  { label: "Quizzes", icon: ClipboardList },
  { label: "Analytics", icon: BarChart3 },
  { label: "AI Notes", icon: ClipboardList },
  { label: "Smart Flashcards", icon: Layers },
  { label: "Practice Arena", icon: Target },
  { label: "Study Planner", icon: CalendarDays },
  { label: "Focus Mode", icon: Clock },
  { label: "Resource Vault", icon: Award },
];

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;
  const candidates = [
    typeof data?.error === "string" ? data.error : data?.error?.message,
    typeof data?.message === "string" ? data.message : data?.message?.message,
    typeof data?.detail === "string" ? data.detail : null,
    typeof error?.message === "string" ? error.message : null,
  ];
  return candidates.find((value) => typeof value === "string" && value.trim()) || fallback;
}

function getBackendHealthUrl() {
  const apiBaseUrl = api.defaults.baseURL || window.location.origin;
  const configuredApiUrl = new URL(apiBaseUrl, window.location.origin);
  return new URL("/actuator/health", configuredApiUrl.origin).toString();
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

class NeuralCoreBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const NeuralCoreFallback = ({ className = "" }) => (
  <div className={`neural-core-fallback ${className}`} aria-hidden="true">
    <span className="neural-fallback-ring neural-fallback-ring-one" />
    <span className="neural-fallback-ring neural-fallback-ring-two" />
    <span className="neural-fallback-shell"><i /></span>
  </div>
);

const PageTitle = ({ title, subtitle }) => (
  <div className="app-page-title mb-7">
    <div>
      <span className="page-title-kicker">EDUMENTOR / ACADEMIC WORKSPACE</span>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{title}</h1>
      <p className="text-slate-500 mt-2">{subtitle}</p>
    </div>
    <span className="page-title-index" aria-hidden="true">EDU<span> / </span>{({ "My Courses": "01", "My Marks": "02", Exams: "03", Quizzes: "05", Analytics: "06", Settings: "07" })[title] || "00"}</span>
  </div>
);

const withoutMarkdownNode = (props) => {
  const { node, ...htmlProps } = props;
  void node;
  return htmlProps;
};

function AvatarFace({ avatar, name, className = "" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "S";
  return (
    <span className={`avatar-face ${className}`} aria-hidden="true">
      {avatar && !imageFailed
        ? <img src={avatar.image} alt="" onError={() => setImageFailed(true)} />
        : <span>{initials}</span>}
    </span>
  );
}

function App() {
  const [active, setActive] = useState("Dashboard");
  const [backendHealth, setBackendHealth] = useState("connecting");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [studentId, setStudentId] = useState(() => safeStorageGet("studentId"));
  const [studentName, setStudentName] = useState(() => safeStorageGet("studentName"));
  const [studentEmail, setStudentEmail] = useState(() => safeStorageGet("studentEmail"));
  const [profileLoading, setProfileLoading] = useState(() => Boolean(safeStorageGet("studentId")));
  const [profileLoadError, setProfileLoadError] = useState("");
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
  const mentorEndRef = useRef(null);

  useEffect(() => {
    if (active !== "Dashboard" || !studentId || !studentName) return undefined;

    let disposed = false;
    let requestPending = false;
    const controller = new AbortController();

    const checkBackendHealth = async () => {
      if (disposed || requestPending) return;
      requestPending = true;
      try {
        const { data } = await api.get(getBackendHealthUrl(), {
          signal: controller.signal,
          timeout: 5000,
        });
        if (!disposed) setBackendHealth(data?.status === "UP" ? "online" : "offline");
      } catch {
        if (!disposed) setBackendHealth("offline");
      } finally {
        requestPending = false;
      }
    };

    void checkBackendHealth();
    const intervalId = window.setInterval(checkBackendHealth, 30_000);
    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      controller.abort();
    };
  }, [active, studentId, studentName]);

  useEffect(() => {
    if (active === "AI Mentor") mentorEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [active, mentorMessages, asking]);

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
  const [markSearch, setMarkSearch] = useState("");
  const [markSubjectFilter, setMarkSubjectFilter] = useState("all");
  const [markMessage, setMarkMessage] = useState("");
  const [markMessageType, setMarkMessageType] = useState("success");
  const [savingMark, setSavingMark] = useState(false);

  const [courseProgress, setCourseProgress] = useState(() => loadCourseProgress(safeStorageGet("studentId")));
  const [avatarId, setAvatarId] = useState(() => loadStudentAvatar(safeStorageGet("studentId")));
  const [avatarDraftId, setAvatarDraftId] = useState(() => loadStudentAvatar(safeStorageGet("studentId")));
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [practicePrefill, setPracticePrefill] = useState("");
  const [courseStorageError, setCourseStorageError] = useState("");
  const [quizHistory, setQuizHistory] = useState(() => loadQuizHistory(safeStorageGet("studentId")));
  const [quizStorageError, setQuizStorageError] = useState("");
  const [quizIndex, setQuizIndex] = useState(null);
  const [quizQuestion, setQuizQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [progression, setProgression] = useState(null);
  const [progressionError, setProgressionError] = useState("");
  const [missionBusy, setMissionBusy] = useState(false);

  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [profileDialog, setProfileDialog] = useState(null);
  const [profileDraft, setProfileDraft] = useState({ name: "", email: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const profileRequestRef = useRef(0);
  const profileLoadedForRef = useRef("");
  const today = getLocalDateString();

  useEffect(() => {
    if (!profileDialog) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !savingProfile && !deletingAccount) setProfileDialog(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [profileDialog, savingProfile, deletingAccount]);

  const isRegistered = Boolean(studentId && studentName);

  const clearStudentSession = useCallback(() => {
    profileRequestRef.current += 1;
    profileLoadedForRef.current = "";
    safeStorageRemove("studentId");
    safeStorageRemove("studentName");
    safeStorageRemove("studentEmail");
    setStudentId("");
    setStudentName("");
    setStudentEmail("");
    setProfileLoading(false);
    setProfileLoadError("");
    setCourseProgress({});
    setQuizHistory([]);
    setProgression(null);
    setProgressionError("");
    setAvatarId(null);
    setAvatarDraftId(null);
    setMentorMessages([]);
    setMarks([]);
    setExams([]);
    setAnalytics(null);
    setUpcomingExams([]);
    setActive("Dashboard");
    setSidebarOpen(false);
    setProfileDialog(null);
    setSettingsMessage("");
    setSettingsError("");
    setMentorError("");
    setMentorHistoryError("");
    setQuestion("");
    setRegisterName("");
    setRegisterEmail("");
    setRegisterError("");
    setDeleteConfirmation("");
  }, []);

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

  useEffect(() => {
    if (!studentId) return undefined;
    let current = true;
    api.get(`/students/${studentId}/progression`)
      .then(({ data }) => {
        if (current) {
          setProgression(data);
          setProgressionError("");
        }
      })
      .catch((err) => {
        if (current) {
          setProgression(null);
          setProgressionError(getErrorMessage(err, "Student progression could not be loaded."));
        }
      });
    return () => { current = false; };
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return undefined;
    if (profileLoadedForRef.current === String(studentId)) return undefined;
    let current = true;
    const requestId = ++profileRequestRef.current;
    setProfileLoading(true);
    setProfileLoadError("");
    api.get(`/students/${studentId}`)
      .then(({ data }) => {
        if (!current || requestId !== profileRequestRef.current) return;
        if (String(data?.id) !== String(studentId) || typeof data?.name !== "string" || !data.name.trim()) {
          setProfileLoadError("The server returned an incomplete student profile. Your saved identity was not changed.");
          return;
        }
        setStudentName(data.name);
        safeStorageSet("studentName", data.name);
        const email = typeof data?.email === "string" ? data.email : "";
        setStudentEmail(email);
        safeStorageSet("studentEmail", email);
        profileLoadedForRef.current = String(studentId);
      })
      .catch((err) => {
        if (!current || requestId !== profileRequestRef.current) return;
        if (err?.response?.status === 404) {
          clearStudentSession();
          setRegisterError("The saved student profile no longer exists. Create a new profile to continue.");
          return;
        }
        setProfileLoadError(getErrorMessage(err, "Profile details could not be loaded from the server."));
      })
      .finally(() => {
        if (current && requestId === profileRequestRef.current) setProfileLoading(false);
      });
    return () => { current = false; };
  }, [studentId, clearStudentSession]);

  useEffect(() => {
    const synchronizeStudentIdentity = (event) => {
      if (event.key === `edumentor:${studentId}:avatar`) {
        const savedAvatar = loadStudentAvatar(studentId);
        setAvatarId(savedAvatar);
        setAvatarDraftId(savedAvatar);
        return;
      }
      if (event.key && !["studentId", "studentName", "studentEmail"].includes(event.key)) return;
      const nextId = safeStorageGet("studentId");
      const nextName = safeStorageGet("studentName");
      const nextEmail = safeStorageGet("studentEmail");
      if (!nextId || !nextName) {
        // Identity keys are written separately. Ignore incomplete snapshots so
        // another tab cannot clear a session while registration is persisting.
        if (shouldClearStudentSessionFromStorageEvent(event, nextId, nextName)) clearStudentSession();
        return;
      }
      if (nextId !== String(studentId)) {
        profileRequestRef.current += 1;
        profileLoadedForRef.current = "";
        setCourseProgress(loadCourseProgress(nextId));
        setQuizHistory(loadQuizHistory(nextId));
        const nextAvatar = loadStudentAvatar(nextId);
        setAvatarId(nextAvatar);
        setAvatarDraftId(nextAvatar);
        setMentorMessages([]);
        setBackendHealth("connecting");
        setProgression(null);
        setProgressionError("");
        setProfileLoading(true);
        setActive("Dashboard");
      }
      setStudentId(nextId);
      setStudentName(nextName);
      setStudentEmail(nextEmail);
    };
    window.addEventListener("storage", synchronizeStudentIdentity);
    return () => window.removeEventListener("storage", synchronizeStudentIdentity);
  }, [studentId, clearStudentSession]);

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

      profileRequestRef.current += 1;
      profileLoadedForRef.current = String(id);
      safeStorageSet("studentName", name);
      const email = typeof response.data.email === "string" ? response.data.email : "";
      safeStorageSet("studentEmail", email);
      // Write the ID last: other tabs treat it as the identity commit marker.
      safeStorageSet("studentId", String(id));
      setCourseProgress(loadCourseProgress(String(id)));
      setQuizHistory(loadQuizHistory(String(id)));
      const savedAvatar = loadStudentAvatar(String(id));
      setAvatarId(savedAvatar);
      setAvatarDraftId(savedAvatar);
      setMentorMessages([]);
      setProgression(null);
      setProgressionError("");

      setLoading(true);
      setStudentId(String(id));
      setStudentName(name);
      setStudentEmail(email);
      setProfileLoading(false);
      setProfileLoadError("");
      setSettingsMessage("");
      setSettingsError("");
    } catch (err) {
      setRegisterError(getErrorMessage(err, "Registration failed."));
    } finally {
      setRegistering(false);
    }
  };

  const askMentor = async (inputQuestion = question) => {
    const submittedQuestion = inputQuestion.trim();
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
      return mentorAnswer;
    } catch (err) {
      setQuestion(submittedQuestion);
      setMentorError(getErrorMessage(err, "Mentor is unavailable."));
      return null;
    } finally {
      setAsking(false);
    }
  };

  const voice = useVoiceAssistant((dictatedText) => {
    setQuestion((current) => appendDictation(current, dictatedText));
  });
  const voiceStatus = voice.status;
  const voiceIsRecording = voice.isRecording;
  const cancelVoice = voice.cancel;
  const dismissVoice = voice.dismiss;
  const setLatestVoiceResponse = voice.setLatestResponse;
  useEffect(() => {
    if (active !== "AI Mentor" && voiceIsRecording) cancelVoice();
    else if (active !== "AI Mentor" && (voiceStatus === "ready" || voiceStatus === "error")) dismissVoice();
  }, [active, voiceStatus, voiceIsRecording, cancelVoice, dismissVoice]);

  useEffect(() => {
    const latestAnswer = [...mentorMessages].reverse().find((message) => message.role === "mentor")?.content || "";
    setLatestVoiceResponse(latestAnswer);
  }, [mentorMessages, setLatestVoiceResponse]);

  const startVoiceFromDashboard = () => {
    setActive("AI Mentor");
    void voice.start();
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

  const submitQuiz = async () => {
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
    try {
      const { data } = await api.post(`/students/${studentId}/progression/quizzes`, {
        quizId: quiz.id,
        answers: quiz.questions.map((_, index) => quizAnswers[index]),
      });
      setProgression(data.progression);
      setProgressionError(data.xpAwarded > 0
        ? `Verified quiz completion: +${data.xpAwarded} XP.`
        : "Quiz rewards for this activity were already claimed.");
    } catch (err) {
      setProgressionError(getErrorMessage(err, "Quiz result saved locally; server progression could not be updated."));
    }
  };

  const toggleCourseLesson = (courseId, lessonId) => {
    const wasComplete = (courseProgress[courseId] || []).includes(lessonId);
    const next = toggleCourseLessonProgress(courseProgress, courseId, lessonId);
    setCourseProgress(next);
    if (!saveCourseProgress(studentId, next)) {
      setCourseStorageError("Progress changed for this session but could not be saved in this browser.");
    } else {
      setCourseStorageError("");
    }
    if (!wasComplete && studentId) {
      api.post(`/students/${studentId}/progression/lessons`, { courseId, lessonId })
        .then(({ data }) => {
          setProgression(data.progression);
          setProgressionError(data.xpAwarded > 0
            ? `Verified lesson completion: +${data.xpAwarded} XP.`
            : "XP rewards for this lesson were already claimed.");
        })
        .catch((err) => setProgressionError(getErrorMessage(err, "Lesson progress saved locally; server XP could not be updated.")));
    }
  };

  const completeDailyMission = async () => {
    if (!studentId || missionBusy) return;
    setMissionBusy(true);
    try {
      const { data } = await api.post(`/students/${studentId}/progression/daily-mission`);
      setProgression(data.progression);
      setProgressionError(data.xpAwarded > 0
        ? `Daily mission complete: +${data.xpAwarded} XP.`
        : "Today's mission reward was already claimed.");
    } catch (err) {
      setProgressionError(getErrorMessage(err, "The daily mission could not be verified."));
    } finally {
      setMissionBusy(false);
    }
  };

  const openCourse = (course) => {
    const completed = courseProgress[course.id] || [];
    const firstUnfinished = course.lessons.find((lesson) => !completed.includes(lesson.id));
    setSelectedCourseId(course.id);
    setSelectedLessonId((firstUnfinished || course.lessons[0])?.id || null);
    setCourseStorageError("");
  };

  const averageCourseProgress = COURSE_CATALOG.length
    ? Math.round(COURSE_CATALOG.reduce((total, course) => (
        total + ((courseProgress[course.id]?.length || 0) / course.lessons.length) * 100
      ), 0) / COURSE_CATALOG.length)
    : 0;
  const latestQuizResult = quizHistory.at(-1);

  const statCards = [
    { title: "Learning Paths", value: COURSE_CATALOG.length, icon: Layers, color: "violet" },
    { title: "Average Marks", value: analytics?.marksCount ? `${analytics.averageScore}%` : "—", icon: Target, color: "emerald" },
    { title: "Quizzes Completed", value: quizHistory.length, icon: ClipboardList, color: "blue" },
    { title: "Upcoming Exams", value: upcomingExams.length, icon: CalendarDays, color: "orange" },
  ];

  const renderDashboard = () => (
    <section className="page-layout page-dashboard">
      <div className="command-hero">
        <div className="command-copy">
          <span className="system-kicker"><span className="system-kicker-dot"/> EDU-AI / ACADEMIC INTELLIGENCE</span>
          <p className="command-greeting">WELCOME BACK, {studentName.toUpperCase()}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Academic <em>Intelligence</em> System</h1>
          <p className="command-tagline">Your Intelligence. Your Future.</p>
          <button onClick={() => setActive("My Courses")} className="command-action-button">Explore Courses <ArrowUpRight size={16}/></button>
          <div className="command-meta"><span><span className="command-meta-dot"/> PERSONAL ACADEMIC SPACE</span><span>EDUMENTOR / LEARNING SYSTEM</span></div>
        </div>
        <div className="dashboard-hero-side">
          <div className="dashboard-core-stage">
            <NeuralCoreBoundary fallback={<NeuralCoreFallback className="neural-core-hero" />}>
              <Suspense fallback={<NeuralCoreFallback className="neural-core-hero" />}>
                <NeuralCore3D className="neural-core-hero" state="idle" />
              </Suspense>
            </NeuralCoreBoundary>
            <div className="core-readout"><span className={`system-kicker dashboard-health-status is-${backendHealth}`} role="status" aria-live="polite"><span className="system-kicker-dot"/> {backendHealth === "online" ? "EDU-AI // INTELLIGENCE ONLINE" : backendHealth === "offline" ? "EDU-AI // CONNECTION OFFLINE" : "EDU-AI // CONNECTING"}</span><strong>Academic Intelligence System</strong><small>Your Intelligence. Your Future.</small></div>
          </div>
        </div>
      </div>

      <div className="dashboard-metrics grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colors = {
            violet: "bg-violet-50 text-violet-600",
            blue: "bg-blue-50 text-blue-600",
            emerald: "bg-emerald-50 text-emerald-600",
            orange: "bg-orange-50 text-orange-600",
          };
          return (
            <Card key={stat.title} className="metric-card">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">{stat.title}</span>
                <div className={`p-2 rounded-xl ${colors[stat.color]}`}><Icon size={19} /></div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-4" aria-label={`${stat.title}: ${loading ? "loading" : error ? "unavailable" : stat.value}`}>
                {loading ? "..." : error ? "—" : stat.value}
              </p>
              <p className="text-xs text-slate-400 mt-2">{loading ? "Syncing records" : error ? "Data unavailable" : "Verified academic record"}</p>
            </Card>
          );
        })}
      </div>

      <div className="dashboard-action-panels">
        <Card className="dashboard-voice-card">
          <div className="dashboard-voice-copy">
            <span className="page-overline">EDU-AI / HANDS-FREE LEARNING</span>
            <h3>Voice assistant</h3>
            <p>{voice.supported ? "Dictate naturally, review your words, then send them when ready." : "Voice recognition is unavailable here. Text chat remains ready in AI Mentor."}</p>
          </div>
          <VoiceControls voice={voice} compact onStart={startVoiceFromDashboard} />
        </Card>
        <Card className="evolution-card">
          <div className="evolution-heading"><div><span className="page-overline">STUDENT EVOLUTION</span><h3>{progression ? progression.rank : "Progression"}</h3></div>
            {progression && <span className="evolution-level">LVL {progression.level}</span>}
          </div>
          {!progression ? <p className={progressionError ? "evolution-error" : "evolution-muted"}>{progressionError ? "Verified progression is unavailable." : "Syncing server-verified XP…"}</p> : <>
            <div className="evolution-stats"><strong>{progression.totalXp.toLocaleString()} <small>XP</small></strong><span>{progression.dailyStreak} day streak</span></div>
            <div className="evolution-progress" role="progressbar" aria-valuemin="0" aria-valuemax={progression.xpRequiredForLevel} aria-valuenow={progression.xpInLevel} aria-label={`${progression.xpToNextLevel} XP to next level`}><i style={{ width: `${progression.xpInLevel / progression.xpRequiredForLevel * 100}%` }}/></div>
            <p className="evolution-muted">{progression.xpToNextLevel} XP to level {progression.level + 1}</p>
            <div className="evolution-mission"><span>{progression.dailyMissionCompleted ? "DAILY MISSION COMPLETE" : "DAILY MISSION / +30 XP"}</span>
              <button type="button" onClick={completeDailyMission} disabled={missionBusy || progression.dailyMissionCompleted || !progression.dailyMissionAvailable}>
                {missionBusy ? "Verifying…" : progression.dailyMissionCompleted ? "Completed" : progression.dailyMissionAvailable ? "Claim mission" : "Complete a lesson or quiz first"}
              </button>
            </div>
            <div className="evolution-badges" aria-label="Unlocked achievements">{progression.achievements.length ? progression.achievements.map((badge) => <span key={badge}>{badge}</span>) : <small>Complete a lesson or quiz to unlock your first badge.</small>}</div>
            {progression.recentEvents.length > 0 && <ul className="evolution-recent" aria-label="Recent achievement history">{progression.recentEvents.slice(0, 3).map((event, index) => <li key={`${event.type}-${event.resourceId}-${index}`}><span>{event.type.replaceAll("_", " ")}</span><strong>+{event.xp} XP</strong></li>)}</ul>}
          </>}
          {progressionError && progression && <p role="status" className="evolution-message">{progressionError}</p>}
        </Card>
      </div>

      <div className="dashboard-visuals grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <Card className="xl:col-span-2">
          <div className="visual-heading"><div><span className="page-overline">PERFORMANCE SIGNAL</span><h3 className="font-bold text-slate-900">Subject performance</h3><p className="text-sm text-slate-400 mt-1">Average score from recorded marks</p></div><span className="visual-unit">PERCENT</span></div>
          {loading ? <p className="text-slate-500">Loading analytics...</p> : error ?
            <p className="text-red-600">Unable to load analytics. Please refresh.</p> :
            !analytics?.subjects?.length ? <div className="chart-empty"><span className="chart-empty-mark"><BarChart3 size={20}/></span><p>Add marks to reveal your subject performance.</p><button onClick={() => setActive("Marks")}>Record a mark <ArrowUpRight size={14}/></button></div> :
            analytics.subjects.length === 1 ? (() => {
              const subject = analytics.subjects[0];
              const score = Math.max(0, Math.min(100, Number(subject.average) || 0));
              return <div className="single-performance">
                <div className="single-score-ring" style={{ "--score-angle": `${score * 3.6}deg` }} role="img" aria-label={`${subject.subject}: ${subject.average}% average`}>
                  <div><strong>{subject.average}%</strong><span>AVERAGE</span></div>
                </div>
                <div className="single-performance-copy"><span className="page-overline">RECORDED SUBJECT</span><h4>{subject.subject}</h4><p>One subject is recorded so far. Add marks in other subjects to build a comparison.</p><div className="single-performance-trend">{subject.trend > 0 ? `Trending up ${subject.trend}%` : subject.trend < 0 ? `Trending down ${Math.abs(subject.trend)}%` : "Trend not established"}</div></div>
              </div>;
            })() :
              <div className={`dashboard-chart ${analytics.subjects.length <= 3 ? "is-compact" : ""} ${analytics.subjects.length > 4 ? "is-dense" : ""}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.subjects.map(({ subject, average: score }) => ({ subject, score }))} margin={{ top: 8, right: 8, bottom: analytics.subjects.length > 4 ? 16 : 0, left: -12 }}>
                  <defs><linearGradient id="academicScoreGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fae7a7"/><stop offset="55%" stopColor="#e8c142"/><stop offset="100%" stopColor="#b39328"/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="rgba(220, 198, 125, .13)" />
                  <XAxis dataKey="subject" angle={analytics.subjects.length > 4 ? -18 : 0} textAnchor={analytics.subjects.length > 4 ? "end" : "middle"} height={analytics.subjects.length > 4 ? 50 : 30} interval={0} axisLine={false} tickLine={false} tick={{ fill: "#bcb291", fontSize: 10 }} />
                  <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} unit="%" axisLine={false} tickLine={false} tick={{ fill: "#bcb291", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#2b2510", border: "1px solid rgba(239, 206, 96, .3)", borderRadius: 12, color: "#fef9e8" }} formatter={(value) => [`${value}%`, "Average score"]} />
                  <Bar dataKey="score" fill="url(#academicScoreGradient)" radius={[7, 7, 0, 0]} maxBarSize={56} />
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
              <div className="exam-timeline">
                {upcomingExams.slice(0, 5).map((exam) => (
                  <div key={exam.id} className="exam-timeline-item">
                    <i aria-hidden="true"/><div><span className="exam-timeline-label">UPCOMING</span><strong>{exam.subject}</strong></div>
                    <time dateTime={exam.examDate}>
                      <small>{new Date(`${exam.examDate}T00:00:00`).toLocaleDateString(undefined, { month: "short" })}</small>
                      {new Date(`${exam.examDate}T00:00:00`).getDate()}
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
            <div><h3 className="font-bold">Learning Progress</h3><p className="text-sm text-slate-500 mt-1">From lessons you marked complete</p></div>
            <span className="visual-unit">{averageCourseProgress}% OVERALL</span>
          </div>
          <div className="learning-progress-layout">
            <div className="learning-progress-ring" style={{ "--progress-angle": `${averageCourseProgress * 3.6}deg` }}><div><strong>{averageCourseProgress}%</strong><small>OVERALL</small></div></div>
            <ul className="learning-progress-list">{COURSE_CATALOG.slice(0, 3).map((course) => {
              const progress = getCourseProgressPercent(course, courseProgress[course.id] || []);
              return <li key={course.id}><div><strong>{course.name}</strong><span>{progress}%</span></div><i><b style={{ width: `${progress}%` }} /></i></li>;
            })}</ul>
          </div>
          <button onClick={() => setActive("My Courses")} className="learning-progress-link">Continue a course <ArrowUpRight size={14}/></button>
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

      <div className="intelligence-cta mt-6 rounded-2xl p-6 text-white">
        <div><span className="system-kicker">EDU-AI / GUIDED LEARNING</span><h3 className="text-xl font-bold mt-2">Turn a question into momentum.</h3><p className="text-violet-100 mt-2">Your academic intelligence system is ready when you are.</p></div>
        <button onClick={() => setActive("AI Mentor")} className="command-action-button">Open EDU-AI <ArrowUpRight size={16}/></button>
      </div>
    </section>
  );

  const renderCourses = () => {
    const selectedCourse = COURSE_CATALOG.find(({ id }) => id === selectedCourseId);
    if (selectedCourse) {
      const courseIndex = COURSE_CATALOG.indexOf(selectedCourse);
      const completed = courseProgress[selectedCourse.id] || [];
      const courseProgressPercent = getCourseProgressPercent(selectedCourse, completed);
      const lessonIndex = Math.max(0, selectedCourse.lessons.findIndex(({ id }) => id === selectedLessonId));
      const lesson = selectedCourse.lessons[lessonIndex];
      const lessonContent = COURSE_LESSONS[selectedCourse.id]?.[lesson.id];
      const details = COURSE_DETAILS[selectedCourse.id];

      const selectLesson = (index) => {
        const nextLesson = selectedCourse.lessons[index];
        if (nextLesson) setSelectedLessonId(nextLesson.id);
      };

      return (
        <section className="page-layout page-courses page-course-study">
          <div className="course-return-row">
            <button type="button" onClick={() => setSelectedCourseId(null)} className="course-back-button">
              <ChevronLeft size={16} /> All courses
            </button>
            <span>COURSE {String(courseIndex + 1).padStart(2, "0")} / {String(COURSE_CATALOG.length).padStart(2, "0")}</span>
          </div>

          {courseStorageError && <p role="alert" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{courseStorageError}</p>}

          <header className="course-overview-panel">
            <div className="course-overview-copy">
              <span className="page-overline">EDUMENTOR LEARNING PATH</span>
              <div className="course-overview-title-row">
                <span className="course-code-mark">{selectedCourse.code}</span>
                <div><h1>{selectedCourse.name}</h1><p>{details?.overview}</p></div>
              </div>
              <ul className="course-outcomes">
                {details?.outcomes.map((outcome) => <li key={outcome}><CheckCircle2 size={14} />{outcome}</li>)}
              </ul>
            </div>
            <div className="course-progress-summary" aria-label={`${courseProgressPercent}% course progress`}>
              <span>COURSE PROGRESS</span><strong>{courseProgressPercent}%</strong>
              <div className="course-progress-track"><i style={{ width: `${courseProgressPercent}%` }} /></div>
              <small>{completed.length} of {selectedCourse.lessons.length} lessons complete</small>
            </div>
          </header>

          <div className="course-study-layout">
            <aside className="course-curriculum-panel">
              <div className="course-curriculum-heading"><span className="page-overline">CURRICULUM</span><strong>{selectedCourse.lessons.length} lessons</strong></div>
              <nav className="course-curriculum-list" aria-label={`${selectedCourse.name} curriculum`}>
                {selectedCourse.lessons.map((item, index) => {
                  const isComplete = completed.includes(item.id);
                  const isCurrent = item.id === lesson.id;
                  return (
                    <button key={item.id} type="button" aria-current={isCurrent ? "step" : undefined}
                      onClick={() => selectLesson(index)} className={`course-curriculum-item ${isCurrent ? "is-current" : ""}`}>
                      <span className={`course-lesson-number ${isComplete ? "is-complete" : ""}`}>
                        {isComplete ? <CircleCheck size={17} /> : String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="course-lesson-label"><strong>{item.title}</strong><small>{item.description}</small></span>
                    </button>
                  );
                })}
              </nav>
              <label className="course-curriculum-mobile">
                <span>Jump to lesson</span>
                <select value={lesson.id} onChange={(event) => setSelectedLessonId(event.target.value)}>
                  {selectedCourse.lessons.map((item, index) => <option key={item.id} value={item.id}>{String(index + 1).padStart(2, "0")} · {item.title}</option>)}
                </select>
              </label>
            </aside>

            <article className="course-lesson-panel" aria-labelledby="course-lesson-title">
              <div className="course-lesson-meta"><span>LESSON {String(lessonIndex + 1).padStart(2, "0")}</span><span>{selectedCourse.code} / LEARNING MODULE</span></div>
              <h2 id="course-lesson-title">{lesson.title}</h2>
              <p className="course-lesson-intro">{lesson.description}</p>
              {(lesson.difficulty || details?.level) && <div className="course-level-meta"><span>{details?.category || "ACADEMIC LEARNING PATH"}</span><span>{lesson.difficulty || details?.level}</span></div>}
              {lessonContent?.objectives?.length > 0 && <section className="course-objectives">
                <h3>Learning objectives</h3>
                <ul>{lessonContent.objectives.map((objective) => <li key={objective}><CheckCircle2 size={14} />{objective}</li>)}</ul>
              </section>}
              {lessonContent?.sections.map((section) => (
                <section key={section.heading} className="course-lesson-section">
                  <h3>{section.heading}</h3><p>{section.body}</p>
                </section>
              ))}
              {lessonContent?.example && (
                <section className="course-example">
                  <div className="course-example-heading"><strong>WORKED EXAMPLE</strong><span>{lessonContent.example.language}</span></div>
                  <pre><code>{lessonContent.example.code}</code></pre>
                  <p>{lessonContent.example.explanation}</p>
                </section>
              )}
              <section className="course-takeaways">
                <h3>Key takeaways</h3>
                <ul>{lessonContent?.takeaways.map((takeaway) => <li key={takeaway}><CheckCircle2 size={15} />{takeaway}</li>)}</ul>
              </section>
              <button type="button" className="course-practice-link" onClick={() => { setPracticePrefill(lesson.practiceTopic || `${selectedCourse.name}: ${lesson.title}`); setActive("Practice Arena"); }}>
                <Target size={15}/> Practice this topic with EDU-AI
              </button>

              <div className="course-lesson-actions">
                <button type="button" className="course-step-button" disabled={lessonIndex === 0} onClick={() => selectLesson(lessonIndex - 1)}>
                  <ChevronLeft size={16} /><span>Previous lesson</span>
                </button>
                <button type="button" aria-pressed={completed.includes(lesson.id)}
                  className={`course-complete-button ${completed.includes(lesson.id) ? "is-complete" : ""}`}
                  onClick={() => toggleCourseLesson(selectedCourse.id, lesson.id)}>
                  <CheckCircle2 size={16} />{completed.includes(lesson.id) ? "Mark incomplete" : "Mark complete"}
                </button>
                <button type="button" className="course-step-button course-next-button" disabled={lessonIndex === selectedCourse.lessons.length - 1}
                  onClick={() => selectLesson(lessonIndex + 1)}>
                  <span>Next lesson</span><ChevronRight size={16} />
                </button>
              </div>
            </article>
          </div>
        </section>
      );
    }

    return (
      <section className="page-layout page-courses">
        <PageTitle title="My Courses" subtitle="Choose a learning path and continue from where you left off." />
        {courseStorageError && <p role="alert" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{courseStorageError}</p>}
        <div className="course-catalog-grid grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {COURSE_CATALOG.map((course, index) => {
            const completed = courseProgress[course.id] || [];
            const progress = getCourseProgressPercent(course, completed);
            const nextLesson = course.lessons.find((lesson) => !completed.includes(lesson.id));
            return (
              <Card key={course.id} className="course-card">
                <span className="course-card-index">PATH / {String(index + 1).padStart(2, "0")}</span>
                <div className={`w-14 h-14 ${course.color} rounded-xl text-white flex items-center justify-center font-bold text-lg`}>
                  {course.code}
                </div>
                <h3 className="font-bold text-lg mt-5">{course.name}</h3>
                {(course.category || course.level) && <div className="course-card-tags"><span>{course.category}</span><span>{course.level}</span></div>}
                <p className="text-sm text-slate-500 mt-2">{course.lessons.length} guided lessons</p>
                <div className="flex justify-between text-sm mt-5 mb-2">
                  <span>{completed.length} of {course.lessons.length} complete</span><strong>{progress}%</strong>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-label={`${course.name} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                  <div className={`${course.color} h-full`} style={{ width: `${progress}%` }} />
                </div>
                <button onClick={() => openCourse(course)} className="mt-4 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-slate-50">
                  {progress === 100 ? "Review course" : completed.length ? `Continue: ${nextLesson?.title}` : "Start learning"}
                  <ArrowUpRight size={14} />
                </button>
              </Card>
            );
          })}
        </div>
      </section>
    );
  };

  const renderMarks = () => {
    const normalizedSearch = markSearch.trim().toLocaleLowerCase();
    const filteredMarks = marks.filter((mark) => (
      (markSubjectFilter === "all" || mark.subject === markSubjectFilter)
      && (!normalizedSearch || `${mark.subject} ${mark.topic}`.toLocaleLowerCase().includes(normalizedSearch))
    ));
    const recordedSubjects = [...new Set(marks.map((mark) => mark.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b));

    return <section className="page-layout page-marks">
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
      {analytics?.subjects?.length > 0 && <Card className="marks-chart-card mb-6">
        <div className="visual-heading"><div><span className="page-overline">RECORDED PERFORMANCE</span><h3>Subject comparison</h3><p className="text-sm text-slate-400 mt-1">Calculated from your saved marks</p></div><span className="visual-unit">PERCENT</span></div>
        <div className="marks-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.subjects} margin={{ top: 8, right: 12, bottom: analytics.subjects.length > 4 ? 24 : 6, left: -8 }}>
              <defs><linearGradient id="marksScoreGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fae7a7"/><stop offset="100%" stopColor="#b39328"/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="rgba(220, 198, 125, .13)" />
              <XAxis dataKey="subject" interval={0} angle={analytics.subjects.length > 4 ? -18 : 0} textAnchor={analytics.subjects.length > 4 ? "end" : "middle"} height={analytics.subjects.length > 4 ? 50 : 30} axisLine={false} tickLine={false} tick={{ fill: "#bcb291", fontSize: 10 }} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} unit="%" axisLine={false} tickLine={false} tick={{ fill: "#bcb291", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#2b2510", border: "1px solid rgba(239, 206, 96, .3)", borderRadius: 12, color: "#fef9e8" }} formatter={(value) => [`${value}%`, "Average score"]} />
              <Bar dataKey="average" name="Average score" fill="url(#marksScoreGradient)" radius={[7, 7, 0, 0]} maxBarSize={52} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>}
      <Card>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold">Marks History</h3>
          <span className="text-violet-700 bg-violet-50 px-3 py-1 rounded-lg text-sm">Average: {marks.length ? `${Math.round(marks.reduce((sum, mark) => sum + (Number(mark.maxScore) > 0 ? Number(mark.score) / Number(mark.maxScore) * 100 : 0), 0) / marks.length)}%` : "—"}</span>
        </div>
        <div className="marks-filters">
          <label><span>Search marks</span><input type="search" value={markSearch} onChange={(event) => setMarkSearch(event.target.value)} placeholder="Search subject or topic" /></label>
          <label><span>Subject</span><select value={markSubjectFilter} onChange={(event) => setMarkSubjectFilter(event.target.value)}><option value="all">All subjects</option>{recordedSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}</select></label>
        </div>
        {loading ? <p className="text-slate-500">Loading marks...</p> : error ? (
          <p role="alert" className="text-red-600">Unable to load marks. Please refresh and try again.</p>
        ) : marks.length === 0 ? (
          <p className="text-slate-500">No marks recorded yet.</p>
        ) : filteredMarks.length === 0 ? (
          <div className="chart-empty marks-empty"><p>No saved marks match these filters.</p><button type="button" onClick={() => { setMarkSearch(""); setMarkSubjectFilter("all"); }}>Clear filters</button></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr><th className="p-3">Subject</th><th className="p-3">Topic</th><th className="p-3">Score</th><th className="p-3">Percentage</th><th className="p-3">Date</th></tr>
              </thead>
              <tbody>
                {filteredMarks.map((mark) => (
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
    </section>;
  };

  const renderExams = () => (
    <section className="page-layout page-exams">
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
          <div className="exam-schedule-list">{exams.map((exam) => (
            <div key={exam.id} className="exam-schedule-item flex justify-between items-center border-b py-4">
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
          ))}</div>}
        {exams.length > 0 && <p className="text-xs text-slate-400 mt-4">Exam schedule is saved to your account.</p>}
      </Card>
    </section>
  );

  const renderMentor = () => {
    const sendQuestion = async () => askMentor();
    return (
      <section className="eduverse" aria-label="EDU-AI Mentor">
        <div className="eduverse-stars" aria-hidden="true" />
        <header className="eduverse-head">
          <div className="eduverse-brand"><span className="eduverse-brand-icon"><Orbit size={18}/></span><span>EDU-AI</span><i>ACADEMIC INTELLIGENCE SYSTEM</i></div>
          <div className="eduverse-status"><span className="eduverse-live-dot"/> EDU-AI // INTELLIGENCE ONLINE</div>
        </header>
        <div className="eduverse-layout">
          <aside className="eduverse-rail">
            <NeuralCoreBoundary fallback={<NeuralCoreFallback className="neural-core-mentor mentor-core" />}>
              <Suspense fallback={<NeuralCoreFallback className="neural-core-mentor mentor-core" />}>
                <NeuralCore3D className={`neural-core-mentor mentor-core ${asking ? "is-thinking" : mentorMessages.length ? "is-answering" : "is-idle"}`}
                  state={asking ? "thinking" : mentorMessages.length ? "answering" : "idle"}
                  role="img" aria-label={asking ? "Mentor is thinking" : "Mentor is ready"} />
              </Suspense>
            </NeuralCoreBoundary>
            <div className="eduverse-rail-copy"><span className="eduverse-eyebrow">YOUR ACADEMIC INTELLIGENCE</span><h2>Meet your<br/><em>Intelligence Core.</em></h2><p>Your Intelligence. Your Future.</p></div>
            <div className="eduverse-rail-card"><span className="eduverse-eyebrow">SESSION MODE</span><strong><span className="eduverse-live-dot"/> {asking ? "Thinking through it" : "Ready to explore"}</strong><small>Grounded in your learning context</small></div>
            <div className="eduverse-rail-foot"><Sparkles size={14}/> BUILT FOR CURIOSITY</div>
          </aside>
          <div className="eduverse-workspace">
          <div className="eduverse-chat-top"><div><span className="eduverse-eyebrow">PRIVATE LEARNING SESSION</span><h1>EDU-AI <span>✳</span></h1></div><div className="eduverse-chat-tools"><div className="eduverse-context"><span className="eduverse-context-icon"><Zap size={15}/></span><span>CONTEXT AWARE<small>Academic insights enabled</small></span></div><VoiceControls voice={voice} compact /></div></div>
            {mentorHistoryError && <p role="status" className="eduverse-notice">{mentorHistoryError}</p>}
            <div className={`eduverse-transcript ${mentorMessages.length ? "has-messages" : "is-empty"}`} aria-live="polite">
              {!mentorMessages.length ? <div className="eduverse-welcome">
                <div className="eduverse-welcome-mark"><Sparkles size={17}/></div><span className="eduverse-eyebrow">A NEW PERSPECTIVE STARTS HERE</span>
                <h2>What would you like<br/>to <em>understand?</em></h2><p>Ask a question, untangle a tricky concept, or turn curiosity into clarity.</p>
                <div className="eduverse-prompts">
                  {["Explain a tough concept simply", "Help me build a study plan", "Quiz me on something I'm learning"].map((prompt, index) => <button key={prompt} type="button" onClick={() => setQuestion(prompt)}><span>0{index + 1}</span>{prompt}<ArrowUpRight size={15}/></button>)}
                </div>
              </div> : <div className="eduverse-messages">
                {mentorMessages.map((message, index) => (
                  <article key={`${message.role}-${index}`} className={`eduverse-message ${message.role === "student" ? "from-student" : "from-mentor"}`}>
                    {message.role === "student" ? <><div className="eduverse-message-meta"><span>YOU</span><time>YOUR QUESTION</time></div><div className="eduverse-user-bubble">{message.content}</div></> : <><div className="eduverse-message-meta"><span className="eduverse-avatar"><Sparkles size={13}/></span><span>EDU-AI</span><time>MENTOR RESPONSE</time></div><div className="eduverse-answer mentor-markdown">
            <div className="mentor-markdown text-slate-700 leading-7">
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
            </div></div></>}
                  </article>
                ))}
                {asking && <div className="eduverse-thinking-row"><div className="eduverse-avatar"><Sparkles size={13}/></div><div><span>CONNECTING THE IDEAS</span><div className="eduverse-thinking-dots"><i/><i/><i/></div></div></div>}
                <div ref={mentorEndRef}/>
              </div>}
            </div>
            {mentorError && <p role="alert" className="eduverse-error">{mentorError}</p>}
            <form className="eduverse-composer" onSubmit={(event) => { event.preventDefault(); sendQuestion(); }}>
              <label htmlFor="eduverse-question">YOUR QUESTION</label>
              <div className="eduverse-input-wrap"><textarea id="eduverse-question" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendQuestion(); } }} placeholder="Explore an idea, ask for guidance, or think out loud…" rows={2} aria-describedby="eduverse-hint"/><button type="submit" disabled={asking || !question.trim()} aria-label={asking ? "Mentor is thinking" : "Send question"}><Send size={17}/></button></div>
              <div className="eduverse-composer-foot"><span id="eduverse-hint">↵ Send <span>·</span> ⇧↵ New line</span><span>THOUGHTFUL QUESTIONS, BETTER LEARNING</span></div>
            </form>
          </div>
        </div>
      </section>
    );
  };

  const renderQuizzes = () => (
    <section className="page-layout page-quizzes">
      <PageTitle title="Quizzes" subtitle="Answer each question, review explanations, and track your attempts in this browser." />
      {quizStorageError && <p role="alert" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{quizStorageError}</p>}
      {quizIndex === null ? (
        <>
          <div className="grid md:grid-cols-2 gap-5">
            {QUIZZES.map((quiz, index) => {
              const attempts = quizHistory.filter((result) => result.quizId === quiz.id);
              const latest = attempts.at(-1);
              return (
                <Card key={quiz.id} className="quiz-card">
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
    </section>
  );

  const renderAnalytics = () => (
    <section className="page-layout page-analytics">
      <PageTitle title="Analytics" subtitle="Understand your academic performance." />
      {loading ? <Card><p className="text-slate-500">Loading analytics...</p></Card> : error ? (
        <Card><p role="alert" className="text-red-600">Unable to load analytics. Please refresh and try again.</p></Card>
      ) : !analytics ? <Card><p className="text-slate-500">Analytics are not available yet.</p></Card> : (
        <>
          <div className="analytics-overview grid sm:grid-cols-3 gap-4 mb-6">
            <Card><span className="page-overline">OVERALL SIGNAL</span><p className="text-slate-500 text-sm">Average Score</p><h2 className="text-3xl font-bold mt-3">{analytics.marksCount ? `${analytics.averageScore}%` : "—"}</h2></Card>
            <Card><span className="page-overline">RECORDED DATA</span><p className="text-slate-500 text-sm">Marks Recorded</p><h2 className="text-3xl font-bold mt-3">{analytics.marksCount}</h2></Card>
            <Card><span className="page-overline">SUBJECT COVERAGE</span><p className="text-slate-500 text-sm">Subjects</p><h2 className="text-3xl font-bold mt-3">{analytics.subjects?.length || 0}</h2></Card>
          </div>
          <Card>
            <h3 className="font-bold mb-5">Average score by subject</h3>
            {!analytics.subjects?.length ? <p className="text-slate-500">No marks recorded yet. Add marks to see your subject analytics.</p> : (
              <div className="h-72 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.subjects} margin={{ top: 8, right: 12, bottom: 12, left: -8 }}>
                    <defs><linearGradient id="analyticsScoreGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fae7a7"/><stop offset="100%" stopColor="#b39328"/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="rgba(220, 198, 125, .13)" />
                    <XAxis dataKey="subject" interval={0} angle={analytics.subjects.length > 4 ? -15 : 0} textAnchor={analytics.subjects.length > 4 ? "end" : "middle"} height={analytics.subjects.length > 4 ? 55 : 34} axisLine={false} tickLine={false} tick={{ fill: "#bcb291", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} unit="%" axisLine={false} tickLine={false} tick={{ fill: "#bcb291", fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "#2b2510", border: "1px solid rgba(239, 206, 96, .3)", borderRadius: 12, color: "#fef9e8" }} formatter={(value) => [`${value}%`, "Average score"]} />
                    <Bar dataKey="average" name="Average score" fill="url(#analyticsScoreGradient)" radius={[7, 7, 0, 0]} maxBarSize={56} />
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
    </section>
  );

  const renderSettings = () => (
    <section className="page-layout page-settings">
      <PageTitle title="Profile & Account" subtitle="Manage your EduMentor identity and account access." />
      <Card className="account-profile-card">
        <div className="account-profile-heading">
          <AvatarFace key={avatarId || "default"} avatar={AVATAR_CATALOG.find(({ id }) => id === avatarId)} name={studentName} className="account-avatar" />
          <div><span className="page-overline">STUDENT PROFILE</span><h2>{studentName || "Student"}</h2><p>Your registered account details.</p></div>
        </div>
        {profileLoading && <p className="account-feedback" role="status">Loading registered profile…</p>}
        {profileLoadError && <p className="account-feedback is-error" role="alert">{profileLoadError}</p>}
        {settingsError && <p className="account-feedback is-error" role="alert">{settingsError}</p>}
        {settingsMessage && <p className="account-feedback is-success" role="status">{settingsMessage}</p>}
        <dl className="account-details">
          <div><dt>Full Name</dt><dd>{studentName || "Not available"}</dd></div>
          <div><dt>Email</dt><dd>{studentEmail || "Not provided"}</dd></div>
          <div><dt>Student ID</dt><dd className="account-student-id">{studentId}</dd></div>
        </dl>
        <p className="account-auth-note">Account ownership is not authenticated in this application yet. Profiles are identified by a locally stored student ID; do not use this as secure access to sensitive student data.</p>
        <div className="account-actions">
          <button type="button" className="account-primary-button" disabled={profileLoading} onClick={() => {
            setSettingsMessage("");
            setSettingsError("");
            setProfileDraft({ name: studentName, email: studentEmail });
            setProfileDialog("edit");
          }}>Edit Profile</button>
          <button type="button" className="account-secondary-button" onClick={clearStudentSession}><LogOut size={16}/> Sign Out</button>
        </div>
        <div className="account-danger-zone">
          <div><strong>Delete Account</strong><p>Permanently remove this profile and its saved marks, exams, and Mentor history.</p></div>
          <button type="button" className="account-delete-button" onClick={() => {
            setDeleteConfirmation("");
            setSettingsMessage("");
            setSettingsError("");
            setProfileDialog("delete");
          }}>Delete Account</button>
        </div>
      </Card>
      <Card className="avatar-customizer-card">
        <div className="avatar-customizer-heading">
          <span className="page-overline">PROFILE CUSTOMIZATION</span>
          <div className="avatar-customizer-title"><span><Crown size={20}/></span><div><h2>Choose Your Pirate Identity</h2><p>Every scholar has a pirate spirit.</p></div></div>
        </div>
        <div className="avatar-preview-panel">
          <AvatarFace key={avatarDraftId || "preview-default"} avatar={AVATAR_CATALOG.find(({ id }) => id === avatarDraftId)} name={studentName} className="avatar-preview-face" />
          <div className="avatar-preview-copy"><span>PROFILE PREVIEW</span><strong>{AVATAR_CATALOG.find(({ id }) => id === avatarDraftId)?.name || studentName}</strong><small>{AVATAR_CATALOG.find(({ id }) => id === avatarDraftId)?.subtitle || "EduMentor student"}</small></div>
          <div className="avatar-preview-actions">
            <button type="button" className="account-primary-button" onClick={() => {
              if (saveStudentAvatar(studentId, avatarDraftId)) {
                setAvatarId(avatarDraftId);
                setSettingsError("");
                setSettingsMessage("Avatar saved to this student profile.");
              } else {
                setSettingsMessage("");
                setSettingsError("Avatar could not be saved in this browser. Check local storage access and try again.");
              }
            }} disabled={!avatarDraftId}><Save size={15}/> Save Avatar</button>
            <button type="button" className="account-secondary-button" onClick={() => {
              if (resetStudentAvatar(studentId)) {
                setAvatarId(null);
                setAvatarDraftId(null);
                setSettingsError("");
                setSettingsMessage("Avatar reset to your initials.");
              } else {
                setSettingsMessage("");
                setSettingsError("Avatar could not be reset in this browser. Check local storage access and try again.");
              }
            }}><RotateCcw size={15}/> Reset to Default</button>
          </div>
        </div>
        {["Boys", "Girls"].map((collection) => <section className="avatar-collection" key={collection} aria-labelledby={`avatar-collection-${collection.toLowerCase()}`}>
          <h3 id={`avatar-collection-${collection.toLowerCase()}`}>{collection}</h3>
          <div className="avatar-selection-grid">
            {AVATAR_CATALOG.filter((avatar) => avatar.collection === collection).map((avatar) => (
              <button key={avatar.id} type="button" className={`avatar-choice ${avatarDraftId === avatar.id ? "is-selected" : ""}`}
                aria-pressed={avatarDraftId === avatar.id} aria-label={`Choose ${avatar.name}, ${avatar.subtitle}, ${collection}`}
                onClick={() => { setAvatarDraftId(avatar.id); setSettingsMessage(""); setSettingsError(""); }}>
                <span className="avatar-choice-image"><AvatarFace key={avatar.id} avatar={avatar} name={studentName}/>{avatarDraftId === avatar.id && <span className="avatar-selected-mark"><CheckCircle2 size={18}/></span>}</span>
                <strong>{avatar.name}</strong><small>{avatar.subtitle}</small>
              </button>
            ))}
          </div>
        </section>)}
      </Card>
      {profileDialog && <div className="account-dialog-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget && !savingProfile && !deletingAccount) setProfileDialog(null);
      }}>
        <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title" aria-describedby="account-dialog-description">
          {profileDialog === "edit" ? <form onSubmit={async (event) => {
            event.preventDefault();
            setSavingProfile(true);
            setSettingsError("");
            setSettingsMessage("");
            const normalizedName = profileDraft.name.trim();
            if (!normalizedName) {
              setSettingsError("Full name is required.");
              setSavingProfile(false);
              return;
            }
            try {
              const { data } = await api.put(`/students/${studentId}`, {
                name: normalizedName,
                email: profileDraft.email.trim() || null,
              });
              const name = data.name;
              const email = typeof data.email === "string" ? data.email : "";
              setStudentName(name);
              setStudentEmail(email);
              safeStorageSet("studentName", name);
              safeStorageSet("studentEmail", email);
              profileLoadedForRef.current = String(studentId);
              setProfileLoadError("");
              setSettingsMessage("Profile updated successfully.");
              setProfileDialog(null);
            } catch (err) {
              setSettingsError(getErrorMessage(err, "Profile could not be updated. Please try again."));
            } finally {
              setSavingProfile(false);
            }
          }}>
            <span className="page-overline">ACCOUNT DETAILS</span>
            <h2 id="account-dialog-title">Edit Profile</h2>
            <p id="account-dialog-description">Update the name and email registered to this student profile.</p>
            <label>Full Name<input autoFocus required maxLength={120} value={profileDraft.name} onChange={(event) => setProfileDraft((draft) => ({ ...draft, name: event.target.value }))} /></label>
            <label>Email<input type="email" maxLength={200} value={profileDraft.email} onChange={(event) => setProfileDraft((draft) => ({ ...draft, email: event.target.value }))} /></label>
            <div className="account-dialog-actions"><button type="button" className="account-secondary-button" disabled={savingProfile} onClick={() => setProfileDialog(null)}>Cancel</button><button type="submit" className="account-primary-button" disabled={savingProfile}>{savingProfile ? "Saving…" : "Save Changes"}</button></div>
          </form> : <div>
            <span className="account-delete-icon" aria-hidden="true"><X size={18}/></span>
            <span className="page-overline">PERMANENT ACTION</span>
            <h2 id="account-dialog-title">Delete this account?</h2>
            <p id="account-dialog-description">This permanently deletes <strong>{studentName}</strong> and the associated marks, exams, and AI Mentor history. This action cannot be undone.</p>
            {settingsError && <p className="account-feedback is-error" role="alert">{settingsError}</p>}
            <label className="account-confirm-label">Type <strong>DELETE</strong> to confirm<input autoFocus autoComplete="off" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} /></label>
            <div className="account-dialog-actions"><button type="button" className="account-secondary-button" disabled={deletingAccount} onClick={() => setProfileDialog(null)}>Cancel</button><button type="button" className="account-delete-button" disabled={deletingAccount || deleteConfirmation !== "DELETE"} onClick={async () => {
              setDeletingAccount(true);
              setSettingsError("");
              try {
                await api.delete(`/students/${studentId}`);
                safeStorageRemove(`edumentor:${studentId}:course-progress`);
                safeStorageRemove(`edumentor:${studentId}:quiz-history`);
                removeStudyWorkspace(studentId);
                resetStudentAvatar(studentId);
                clearStudentSession();
              } catch (err) {
                setSettingsError(getErrorMessage(err, "Account deletion failed. Your profile data has not been cleared."));
              } finally {
                setDeletingAccount(false);
              }
            }}>{deletingAccount ? "Deleting…" : "Permanently Delete"}</button></div>
          </div>}
        </section>
      </div>}
    </section>
  );

  if (!isRegistered) {
    return (
      <div className="app-auth min-h-screen flex items-center justify-center p-5">
        <div className="app-auth-card bg-white border rounded-2xl p-8 w-full max-w-md shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="brand-mark"><Orbit size={24}/></div>
            <div><h1 className="text-xl font-bold">EduMentor</h1><p className="text-xs text-slate-400">Academic Intelligence System</p></div>
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
    <div className="app-shell min-h-screen text-slate-800 flex">
      {sidebarOpen && <button type="button" className="sidebar-scrim" aria-label="Close navigation menu" onClick={() => setSidebarOpen(false)} />}
      <aside className={`app-sidebar fixed md:static z-40 inset-y-0 left-0 w-64 bg-white border-r p-5 flex flex-col transition-transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="flex items-center gap-3 mb-10">
          <div className="brand-mark"><Orbit size={24}/></div>
          <div><h1 className="text-xl font-bold text-slate-900">EduMentor</h1><p className="text-xs text-slate-400">Academic Intelligence System</p></div>
        </div>
        <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Workspace</p>
        <nav className="space-y-1">
          {menuItems.map(({label, icon: Icon}) => (
            <button key={label} aria-label={label} title={label} onClick={() => { if (label === "Dashboard") setBackendHealth("connecting"); setActive(label); setSidebarOpen(false); }}
              className={`app-nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                active === label ? "bg-violet-50 text-violet-700" : "text-slate-500 hover:bg-slate-50"
              }`}>
              <Icon size={19}/>{label}
              {label === "AI Mentor" && <span className="ml-auto text-xs bg-violet-100 px-2 py-0.5 rounded-full">AI</span>}
            </button>
          ))}
        </nav>
        <div className="mt-auto">
          <button aria-label="Settings" title="Settings" onClick={() => { setActive("Settings"); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-500 hover:bg-slate-50"><Settings size={19}/> Settings</button>
          <div className="mt-5 p-4 rounded-2xl bg-violet-50">
            <div className="flex items-center gap-2 text-violet-700 font-semibold text-sm"><Flame size={18}/> Keep learning!</div>
            <p className="text-xs text-slate-500 mt-2">Consistency is the key to success.</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="app-topbar h-20 bg-white border-b px-5 md:px-8 flex items-center justify-between">
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
            <AvatarFace key={avatarId || "header-default"} avatar={AVATAR_CATALOG.find(({ id }) => id === avatarId)} name={studentName} className="header-avatar-face" />
          </div>
        </header>

        <div className="app-content p-5 md:p-8 max-w-7xl mx-auto">
          {error && <div className="mb-5 bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>}
          {active === "Dashboard" && renderDashboard()}
          {active === "My Courses" && renderCourses()}
          {active === "Marks" && renderMarks()}
          {active === "Exams" && renderExams()}
          {active === "AI Mentor" && renderMentor()}
          {active === "Quizzes" && renderQuizzes()}
          {active === "Analytics" && renderAnalytics()}
          {["AI Notes", "Smart Flashcards", "Practice Arena", "Study Planner", "Focus Mode", "Resource Vault"].includes(active) && <StudyModules
            key={studentId}
            module={active}
            studentId={studentId}
            initialTopic={practicePrefill}
            exams={exams}
            askMentor={askMentor}
            progression={progression}
            onClaimMission={completeDailyMission}
          />}
          {active === "Settings" && renderSettings()}
        </div>
      </main>
    </div>
  );
}

export default App;
