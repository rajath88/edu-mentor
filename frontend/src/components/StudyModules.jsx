import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bookmark, Check, ChevronLeft, ChevronRight, Clock3, FileText, Plus, Sparkles, Trash2, WandSparkles } from "lucide-react";
import Card from "./GlassCard.jsx";
import { COURSE_CATALOG, QUIZZES } from "../utils/studentWorkspace.js";
import { createStudyId, loadStudyWorkspace, saveStudyWorkspace } from "../utils/studyWorkspace.js";

const MODULE_COPY = {
  "AI Notes": ["AI NOTES / KNOWLEDGE BASE", "Capture concepts, then ask EDU-AI to summarize your own study material."],
  "Smart Flashcards": ["SMART FLASHCARDS / ACTIVE RECALL", "Generate a revision deck from a topic or one of your saved notes."],
  "Practice Arena": ["PRACTICE ARENA / ADAPTIVE REVIEW", "Create a topic and difficulty-specific question with an explanation."],
  "Study Planner": ["STUDY PLANNER / REVISION SYSTEM", "Plan focused sessions around your actual saved exam schedule."],
  "Focus Mode": ["FOCUS MODE / STUDY SESSION", "Run a quiet Pomodoro session and record completed focus time."],
  "Resource Vault": ["RESOURCE VAULT / REFERENCE LIBRARY", "Save, organize, bookmark and retrieve your learning links."],
};

function parseModelJson(answer) {
  if (typeof answer !== "string") throw new Error("EDU-AI did not return a usable response.");
  const clean = answer.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  return JSON.parse(clean);
}

function Field({ label, ...props }) {
  return <label className="study-field"><span>{label}</span><input {...props}/></label>;
}

function EmptyStudyState({ children }) { return <p className="study-empty">{children}</p>; }

export default function StudyModules({ module, studentId, exams, askMentor, progression, onClaimMission, initialTopic = "" }) {
  const [workspace, setWorkspace] = useState(() => loadStudyWorkspace(studentId));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const workspaceRef = useRef(workspace);
  const saveWorkspace = useCallback((next) => {
    workspaceRef.current = next;
    setWorkspace(next);
    const saved = saveStudyWorkspace(studentId, next);
    setMessage(saved ? "Changes saved in this student workspace." : "Changes are visible for this session but browser storage is unavailable.");
  }, [studentId]);
  const [noteQuery, setNoteQuery] = useState("");
  const [noteDraft, setNoteDraft] = useState({ id: "", title: "", subject: "", content: "" });
  const [noteSummaryId, setNoteSummaryId] = useState("");
  const [flashTopic, setFlashTopic] = useState("");
  const [flashSourceId, setFlashSourceId] = useState("");
  const [activeDeckId, setActiveDeckId] = useState("");
  const [activeCard, setActiveCard] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [practiceTopic, setPracticeTopic] = useState(initialTopic || COURSE_CATALOG[0]?.name || "");
  const [practiceDifficulty, setPracticeDifficulty] = useState("Intermediate");
  const [practiceQuestion, setPracticeQuestion] = useState(null);
  const [practiceChoice, setPracticeChoice] = useState(null);
  const [practiceSubmitted, setPracticeSubmitted] = useState(false);
  const [taskDraft, setTaskDraft] = useState({ title: "", date: "", minutes: "30" });
  const [resourceDraft, setResourceDraft] = useState({ title: "", url: "", subject: "", topic: "" });
  const [resourceQuery, setResourceQuery] = useState("");
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const focusSecondsRef = useRef(25 * 60);

  const tellError = (text) => { setError(text); setMessage(""); };
  const clearNotice = () => { setError(""); setMessage(""); };

  const saveNote = (event) => {
    event.preventDefault();
    clearNotice();
    if (!noteDraft.title.trim() || !noteDraft.content.trim()) return tellError("Add a title and note content before saving.");
    const note = { ...noteDraft, id: noteDraft.id || createStudyId(), title: noteDraft.title.trim(), subject: noteDraft.subject.trim(), content: noteDraft.content.trim(), updatedAt: new Date().toISOString() };
    const notes = noteDraft.id ? workspace.notes.map((item) => item.id === note.id ? note : item) : [note, ...workspace.notes];
    saveWorkspace({ ...workspace, notes });
    setNoteDraft({ id: "", title: "", subject: "", content: "" });
  };

  const summarizeNote = async (note) => {
    setBusy(true); clearNotice(); setNoteSummaryId(note.id);
    try {
      const answer = await askMentor(`Summarize these student study notes accurately. Use the headings “Summary” and “Key takeaways”. Only use information present in the notes; if a point is unclear, say so.\n\nSubject: ${note.subject || "Unspecified"}\nTitle: ${note.title}\n\n${note.content}`);
      if (!answer) throw new Error("EDU-AI could not summarize this note. Check the Mentor status and try again.");
      const notes = workspaceRef.current.notes.map((item) => item.id === note.id ? { ...item, summary: answer } : item);
      saveWorkspace({ ...workspaceRef.current, notes });
    } catch (requestError) { tellError(requestError.message || "The summary could not be generated."); }
    finally { setBusy(false); setNoteSummaryId(""); }
  };

  const generateDeck = async (event) => {
    event.preventDefault();
    const source = flashSourceId ? workspace.notes.find((note) => note.id === flashSourceId) : null;
    const topic = flashTopic.trim() || source?.title;
    if (!topic) return tellError("Enter a topic or choose one of your saved notes.");
    setBusy(true); clearNotice();
    try {
      const answer = await askMentor(`Create 6 concise study flashcards for “${topic}”. ${source ? `Use only these source notes:\n${source.content}` : "Use accurate foundational knowledge."} Return only a JSON array of objects with string properties front and back. Do not include markdown fences or any extra text.`);
      const cards = parseModelJson(answer);
      if (!Array.isArray(cards) || cards.length < 3 || cards.length > 10 || cards.some((card) => typeof card.front !== "string" || typeof card.back !== "string" || !card.front.trim() || !card.back.trim())) {
        throw new Error("EDU-AI returned flashcards in an unexpected format. Try a narrower topic.");
      }
      const deck = { id: createStudyId(), title: topic, cards: cards.map((card) => ({ id: createStudyId(), front: card.front.trim(), back: card.back.trim(), known: false })), createdAt: new Date().toISOString() };
      saveWorkspace({ ...workspaceRef.current, decks: [deck, ...workspaceRef.current.decks] });
      setActiveDeckId(deck.id); setActiveCard(0); setCardFlipped(false);
    } catch (requestError) { tellError(requestError.message || "Flashcards could not be generated."); }
    finally { setBusy(false); }
  };

  const updateCurrentCard = (known) => {
    const deck = workspaceRef.current.decks.find((item) => item.id === activeDeckId);
    if (!deck?.cards[activeCard]) return;
    const cards = deck.cards.map((card, index) => index === activeCard ? { ...card, known } : card);
    const decks = workspaceRef.current.decks.map((item) => item.id === deck.id ? { ...item, cards } : item);
    saveWorkspace({ ...workspaceRef.current, decks });
    setCardFlipped(false);
    setActiveCard((index) => Math.min(index + 1, cards.length - 1));
  };

  const generatePractice = async () => {
    if (!practiceTopic.trim()) return tellError("Choose a practice topic first.");
    setBusy(true); clearNotice(); setPracticeQuestion(null); setPracticeChoice(null); setPracticeSubmitted(false);
    try {
      const answer = await askMentor(`Create one ${practiceDifficulty.toLowerCase()} multiple-choice practice question about “${practiceTopic.trim()}”. Return only JSON with string properties question and explanation, an options array of exactly four distinct strings, and integer answerIndex from 0 to 3. Ensure there is exactly one correct answer. No markdown or extra text.`);
      const result = parseModelJson(answer);
      if (typeof result.question !== "string" || typeof result.explanation !== "string" || !Array.isArray(result.options) || result.options.length !== 4 || new Set(result.options).size !== 4 || !Number.isInteger(result.answerIndex) || result.answerIndex < 0 || result.answerIndex > 3) {
        throw new Error("EDU-AI returned a question in an unexpected format. Try another topic.");
      }
      setPracticeQuestion(result);
    } catch (requestError) { tellError(requestError.message || "A practice question could not be generated."); }
    finally { setBusy(false); }
  };

  const submitPractice = () => {
    if (practiceChoice === null || !practiceQuestion) return;
    const correct = practiceChoice === practiceQuestion.answerIndex;
    const attempt = { id: createStudyId(), topic: practiceTopic, difficulty: practiceDifficulty, correct, at: new Date().toISOString() };
    saveWorkspace({ ...workspaceRef.current, practice: [attempt, ...workspaceRef.current.practice].slice(0, 100) });
    setPracticeSubmitted(true);
  };

  const addTask = (event) => {
    event.preventDefault();
    clearNotice();
    if (!taskDraft.title.trim() || !taskDraft.date || !Number(taskDraft.minutes)) return tellError("Enter a task, date and study duration.");
    const task = { id: createStudyId(), title: taskDraft.title.trim(), date: taskDraft.date, minutes: Math.max(5, Math.min(240, Number(taskDraft.minutes))), complete: false };
    saveWorkspace({ ...workspaceRef.current, planner: [task, ...workspaceRef.current.planner] });
    setTaskDraft({ title: "", date: "", minutes: "30" });
  };

  const createExamPlan = () => {
    const upcoming = exams.filter((exam) => exam.examDate && exam.examDate >= new Date().toISOString().slice(0, 10));
    if (!upcoming.length) return tellError("Add an upcoming exam before generating a revision plan.");
    const existing = new Set(workspaceRef.current.planner.map((task) => task.id));
    const generated = upcoming.flatMap((exam) => {
      const examDay = new Date(`${exam.examDate}T12:00:00`);
      return [7, 3, 1].map((offset, index) => {
        const date = new Date(examDay); date.setDate(date.getDate() - offset);
        if (date < new Date(new Date().toDateString())) return null;
        return { id: `exam-${exam.id}-${offset}`, title: `${["Review core concepts", "Practice exam questions", "Final recall session"][index]} · ${exam.subject}`, date: date.toISOString().slice(0, 10), minutes: [45, 40, 25][index], complete: false, sourceExamId: exam.id };
      }).filter(Boolean);
    }).filter((task) => !existing.has(task.id));
    if (!generated.length) return tellError("Revision sessions for these exam dates already exist or are too close to schedule.");
    saveWorkspace({ ...workspaceRef.current, planner: [...generated, ...workspaceRef.current.planner] });
    setMessage(`${generated.length} revision sessions added from your saved exam dates.`); setError("");
  };

  const toggleTask = (taskId) => saveWorkspace({ ...workspaceRef.current, planner: workspaceRef.current.planner.map((task) => task.id === taskId ? { ...task, complete: !task.complete } : task) });
  const deleteTask = (taskId) => saveWorkspace({ ...workspaceRef.current, planner: workspaceRef.current.planner.filter((task) => task.id !== taskId) });

  const completeFocus = useCallback(() => {
    setFocusRunning(false);
    setFocusSeconds(0);
    const session = { id: createStudyId(), minutes: focusMinutes, completedAt: new Date().toISOString() };
    const current = workspaceRef.current;
    const next = { ...current, focus: [session, ...current.focus].slice(0, 60) };
    workspaceRef.current = next; setWorkspace(next);
    const saved = saveStudyWorkspace(studentId, next);
    setMessage(saved
      ? `Focus session complete. ${focusMinutes} minutes recorded.`
      : "Focus session complete, but browser storage is unavailable; this record will not persist.");
  }, [focusMinutes, studentId]);
  const completeFocusRef = useRef(completeFocus);
  useEffect(() => { completeFocusRef.current = completeFocus; }, [completeFocus]);
  useEffect(() => {
    if (!focusRunning) return undefined;
    const timer = window.setInterval(() => {
      const next = focusSecondsRef.current - 1;
      focusSecondsRef.current = next;
      setFocusSeconds(next);
      if (next <= 0) completeFocusRef.current();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [focusRunning]);

  const setFocusDuration = (minutes) => {
    const safeMinutes = Math.max(5, Math.min(120, Number(minutes)));
    setFocusMinutes(safeMinutes); focusSecondsRef.current = safeMinutes * 60; setFocusSeconds(safeMinutes * 60);
  };
  const resetFocus = () => { setFocusRunning(false); focusSecondsRef.current = focusMinutes * 60; setFocusSeconds(focusMinutes * 60); };

  const saveResource = (event) => {
    event.preventDefault();
    clearNotice();
    if (!resourceDraft.title.trim() || !resourceDraft.subject.trim() || !resourceDraft.url.trim()) return tellError("Enter a resource title, subject and URL.");
    let safeUrl;
    try { safeUrl = new URL(resourceDraft.url); } catch { return tellError("Enter a valid web address beginning with http:// or https://."); }
    if (!["http:", "https:"].includes(safeUrl.protocol)) return tellError("Only HTTP and HTTPS resource links are allowed.");
    const resource = { ...resourceDraft, id: createStudyId(), title: resourceDraft.title.trim(), subject: resourceDraft.subject.trim(), topic: resourceDraft.topic.trim(), url: safeUrl.toString(), bookmarked: false };
    saveWorkspace({ ...workspaceRef.current, resources: [resource, ...workspaceRef.current.resources] });
    setResourceDraft({ title: "", url: "", subject: "", topic: "" });
  };

  const activeDeck = workspace.decks.find((deck) => deck.id === activeDeckId) || workspace.decks[0];
  const currentCard = activeDeck?.cards[activeCard];
  const copy = MODULE_COPY[module];

  return <section className={`page-layout page-study-module page-${module.toLowerCase().replaceAll(" ", "-")}`}>
    <header className="study-module-heading"><div><span className="page-overline">{copy[0]}</span><h1>{module}</h1><p>{copy[1]}</p></div><span className="study-module-index">EDU / TOOLS</span></header>
    {message && <p role="status" className="study-notice">{message}</p>}
    {error && <p role="alert" className="study-error">{error}</p>}

    {module === "AI Notes" && <div className="study-module-grid ai-notes-grid">
      <Card className="study-form-card"><h2>{noteDraft.id ? "Edit note" : "New study note"}</h2><form onSubmit={saveNote}>
        <Field label="NOTE TITLE" value={noteDraft.title} onChange={(event) => setNoteDraft({ ...noteDraft, title: event.target.value })} maxLength={120} required placeholder="e.g. Virtual memory" />
        <Field label="SUBJECT" value={noteDraft.subject} onChange={(event) => setNoteDraft({ ...noteDraft, subject: event.target.value })} maxLength={80} placeholder="e.g. Operating systems" />
        <label className="study-field"><span>YOUR NOTES</span><textarea value={noteDraft.content} onChange={(event) => setNoteDraft({ ...noteDraft, content: event.target.value })} maxLength={12000} required rows={8} placeholder="Capture concepts, examples and questions…" /></label>
        <div className="study-actions"><button className="study-primary-button" type="submit"><Check size={15}/>{noteDraft.id ? "Update note" : "Save note"}</button>{noteDraft.id && <button type="button" className="study-secondary-button" onClick={() => setNoteDraft({ id: "", title: "", subject: "", content: "" })}>Cancel edit</button>}</div>
      </form></Card>
      <div className="study-list-column"><label className="study-search"><span>SEARCH YOUR NOTES</span><input value={noteQuery} onChange={(event) => setNoteQuery(event.target.value)} placeholder="Search title, subject or content" /></label>
        {workspace.notes.filter((note) => `${note.title} ${note.subject} ${note.content}`.toLowerCase().includes(noteQuery.toLowerCase())).map((note) => <Card key={note.id} className="study-item-card"><div className="study-item-heading"><div><span>{note.subject || "UNFILED"}</span><h3>{note.title}</h3></div><div className="study-item-actions"><button aria-label={`Edit ${note.title}`} onClick={() => setNoteDraft({ id: note.id, title: note.title, subject: note.subject, content: note.content })}><FileText size={15}/></button><button aria-label={`Delete ${note.title}`} onClick={() => saveWorkspace({ ...workspaceRef.current, notes: workspaceRef.current.notes.filter((item) => item.id !== note.id) })}><Trash2 size={15}/></button></div></div>
          <p className="study-note-preview">{note.content}</p><button className="study-text-action" disabled={busy} onClick={() => summarizeNote(note)}><Sparkles size={14}/>{noteSummaryId === note.id ? "Summarizing…" : note.summary ? "Regenerate AI summary" : "Generate AI summary"}</button>
          {note.summary && <div className="study-ai-summary"><span>EDU-AI SUMMARY</span><ReactMarkdown remarkPlugins={[remarkGfm]}>{note.summary}</ReactMarkdown></div>}</Card>)}
        {!workspace.notes.length && <EmptyStudyState>Create your first note to start building a searchable study library.</EmptyStudyState>}
      </div>
    </div>}

    {module === "Smart Flashcards" && <div className="study-flashcards-layout"><Card className="study-form-card"><h2>Build a revision deck</h2><form onSubmit={generateDeck}>
      <Field label="TOPIC" value={flashTopic} onChange={(event) => setFlashTopic(event.target.value)} maxLength={120} placeholder="e.g. Java interfaces" />
      <label className="study-field"><span>OR USE A SAVED NOTE</span><select value={flashSourceId} onChange={(event) => setFlashSourceId(event.target.value)}><option value="">No source note</option>{workspace.notes.map((note) => <option key={note.id} value={note.id}>{note.title}</option>)}</select></label>
      <button className="study-primary-button" type="submit" disabled={busy}><WandSparkles size={15}/>{busy ? "Generating with EDU-AI…" : "Generate flashcards"}</button>
    </form><p className="study-helper">Cards are generated through your existing Mentor conversation and stored in this student’s browser workspace.</p></Card>
      <Card className="flashcard-study-card"><div className="study-card-header"><div><span className="page-overline">ACTIVE RECALL</span><h2>{activeDeck?.title || "Your flashcards"}</h2></div>{activeDeck && <select aria-label="Choose flashcard deck" value={activeDeck.id} onChange={(event) => { setActiveDeckId(event.target.value); setActiveCard(0); setCardFlipped(false); }}>{workspace.decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.title}</option>)}</select>}</div>
        {currentCard ? <><button type="button" className={`flashcard-face ${cardFlipped ? "is-flipped" : ""}`} onClick={() => setCardFlipped((value) => !value)} aria-label={cardFlipped ? "Show the flashcard question" : "Reveal the flashcard answer"}><span>{cardFlipped ? "ANSWER" : "QUESTION"}</span><strong>{cardFlipped ? currentCard.back : currentCard.front}</strong><small>Click to flip</small></button><div className="flashcard-controls"><button onClick={() => setActiveCard((index) => (index + activeDeck.cards.length - 1) % activeDeck.cards.length)} aria-label="Previous card"><ChevronLeft size={17}/></button><span>{activeCard + 1} / {activeDeck.cards.length} · {activeDeck.cards.filter((card) => card.known).length} known</span><button onClick={() => setActiveCard((index) => (index + 1) % activeDeck.cards.length)} aria-label="Next card"><ChevronRight size={17}/></button></div><div className="study-actions"><button className="study-secondary-button" onClick={() => updateCurrentCard(false)}>Review again</button><button className="study-primary-button" onClick={() => updateCurrentCard(true)}>I know this</button></div></> : <EmptyStudyState>Generate a deck to begin your first active-recall session.</EmptyStudyState>}
      </Card></div>}

    {module === "Practice Arena" && <Card className="practice-arena-card"><div className="practice-controls"><Field label="TOPIC" value={practiceTopic} onChange={(event) => setPracticeTopic(event.target.value)} list="practice-topics" maxLength={100} placeholder="Choose a subject or topic"/><datalist id="practice-topics">{COURSE_CATALOG.map((course) => <option key={course.id} value={course.name}/>)}{QUIZZES.map((quiz) => <option key={quiz.id} value={quiz.subject}/>)}</datalist>
      <label className="study-field"><span>DIFFICULTY</span><select value={practiceDifficulty} onChange={(event) => setPracticeDifficulty(event.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><button className="study-primary-button" onClick={generatePractice} disabled={busy}><WandSparkles size={15}/>{busy ? "Preparing…" : "Generate question"}</button></div>
      <div className="practice-performance"><span>{workspace.practice.length} answered</span><strong>{workspace.practice.filter((attempt) => attempt.correct).length} correct</strong></div>
      {practiceQuestion ? <div className="practice-question"><span className="page-overline">{practiceDifficulty.toUpperCase()} / {practiceTopic}</span><h2>{practiceQuestion.question}</h2><div className="practice-options">{practiceQuestion.options.map((option, index) => <button key={option} type="button" disabled={practiceSubmitted} aria-pressed={practiceChoice === index} className={`${practiceChoice === index ? "is-selected" : ""} ${practiceSubmitted && index === practiceQuestion.answerIndex ? "is-correct" : ""}`} onClick={() => setPracticeChoice(index)}>{String.fromCharCode(65 + index)}<span>{option}</span></button>)}</div>
        {!practiceSubmitted ? <button className="study-primary-button" onClick={submitPractice} disabled={practiceChoice === null}>Check answer</button> : <div className={`practice-explanation ${practiceChoice === practiceQuestion.answerIndex ? "is-correct" : "is-incorrect"}`}><strong>{practiceChoice === practiceQuestion.answerIndex ? "Correct" : "Not quite"}</strong><p>{practiceQuestion.explanation}</p></div>}</div> : <EmptyStudyState>Generate a question to start a focused practice round. Each attempt and result is recorded in this student’s workspace.</EmptyStudyState>}
    </Card>}

    {module === "Study Planner" && <div className="planner-layout"><Card className="study-form-card"><div className="study-card-header"><div><span className="page-overline">EXAM REVISION</span><h2>Your upcoming exams</h2></div><button className="study-secondary-button" onClick={createExamPlan}>Generate plan</button></div>
      {exams.length ? <ul className="planner-exams">{exams.map((exam) => <li key={exam.id}><strong>{exam.subject}</strong><time>{exam.examDate}</time></li>)}</ul> : <EmptyStudyState>No saved exams are available. Add an exam to generate a date-based revision plan.</EmptyStudyState>}
      <form onSubmit={addTask}><Field label="STUDY TASK" value={taskDraft.title} onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })} maxLength={140} placeholder="Review a topic or practice problems"/><div className="planner-form-row"><Field label="DATE" type="date" value={taskDraft.date} onChange={(event) => setTaskDraft({ ...taskDraft, date: event.target.value })} required/><Field label="MINUTES" type="number" min="5" max="240" value={taskDraft.minutes} onChange={(event) => setTaskDraft({ ...taskDraft, minutes: event.target.value })}/></div><button className="study-primary-button" type="submit"><Plus size={15}/>Add study session</button></form>
      {progression && <div className="planner-mission"><div><span>DAILY LEARNING MISSION</span><p>{progression.dailyMissionCompleted ? "Verified mission complete for today." : progression.dailyMissionAvailable ? "A lesson or quiz is ready to claim." : "Finish a lesson or quiz today to unlock the verified mission."}</p></div><button disabled={!progression.dailyMissionAvailable || progression.dailyMissionCompleted} onClick={onClaimMission}>{progression.dailyMissionCompleted ? "Complete" : "Claim +30 XP"}</button></div>}
    </Card><Card className="planner-task-card"><div className="study-card-header"><div><span className="page-overline">PERSONAL STUDY QUEUE</span><h2>{workspace.planner.length} planned sessions</h2></div></div>
      {workspace.planner.length ? <ul className="planner-task-list">{[...workspace.planner].sort((a,b) => a.date.localeCompare(b.date)).map((task) => <li key={task.id} className={task.complete ? "is-complete" : ""}><label><input type="checkbox" checked={task.complete} onChange={() => toggleTask(task.id)}/><span><strong>{task.title}</strong><small>{task.date} · {task.minutes} min</small></span></label><button aria-label={`Delete ${task.title}`} onClick={() => deleteTask(task.id)}><Trash2 size={15}/></button></li>)}</ul> : <EmptyStudyState>Your revision sessions will appear here.</EmptyStudyState>}
    </Card></div>}

    {module === "Focus Mode" && <div className="focus-layout"><Card className="focus-timer-card"><span className="page-overline">DEEP WORK / FOCUS CYCLE</span><label className="focus-duration"><span>SESSION LENGTH</span><select value={focusMinutes} disabled={focusRunning} onChange={(event) => setFocusDuration(event.target.value)}>{[15, 25, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label>
      <div className="focus-clock" role="timer" aria-live="off">{String(Math.floor(focusSeconds / 60)).padStart(2, "0")}:{String(focusSeconds % 60).padStart(2, "0")}</div><p>{focusRunning ? "Stay with one task. Your session is in progress." : "Choose a duration, then begin when you are ready."}</p>
      <div className="study-actions"><button className="study-primary-button" onClick={() => { if (focusSeconds <= 0) setFocusDuration(focusMinutes); focusSecondsRef.current = focusSeconds || focusMinutes * 60; setFocusRunning((running) => !running); }}>{focusRunning ? "Pause session" : focusSeconds === 0 ? "Start again" : "Start focus"}</button><button className="study-secondary-button" onClick={resetFocus}>Reset</button></div>
    </Card><Card><div className="study-card-header"><div><span className="page-overline">RECORDED PRACTICE</span><h2>{workspace.focus.length} completed sessions</h2></div><Clock3 size={18}/></div>
      {workspace.focus.length ? <ul className="focus-session-list">{workspace.focus.slice(0, 8).map((session) => <li key={session.id}><span>{new Date(session.completedAt).toLocaleString()}</span><strong>{session.minutes} min</strong></li>)}</ul> : <EmptyStudyState>Completed sessions are recorded here on this device.</EmptyStudyState>}
    </Card></div>}

    {module === "Resource Vault" && <div className="resource-vault-grid"><Card className="study-form-card"><h2>Save a resource</h2><form onSubmit={saveResource}>
      <Field label="RESOURCE TITLE" value={resourceDraft.title} onChange={(event) => setResourceDraft({ ...resourceDraft, title: event.target.value })} maxLength={120} placeholder="Official documentation or article"/>
      <Field label="WEB ADDRESS" type="url" value={resourceDraft.url} onChange={(event) => setResourceDraft({ ...resourceDraft, url: event.target.value })} placeholder="https://…"/>
      <div className="planner-form-row"><Field label="SUBJECT" value={resourceDraft.subject} onChange={(event) => setResourceDraft({ ...resourceDraft, subject: event.target.value })} maxLength={80} placeholder="Computer Science"/><Field label="TOPIC" value={resourceDraft.topic} onChange={(event) => setResourceDraft({ ...resourceDraft, topic: event.target.value })} maxLength={80} placeholder="Networking"/></div>
      <button className="study-primary-button" type="submit"><Bookmark size={15}/>Save to vault</button>
    </form></Card><div className="study-list-column"><label className="study-search"><span>FIND A RESOURCE</span><input value={resourceQuery} onChange={(event) => setResourceQuery(event.target.value)} placeholder="Search by title, subject or topic"/></label>
      {workspace.resources.filter((item) => `${item.title} ${item.subject} ${item.topic}`.toLowerCase().includes(resourceQuery.toLowerCase())).map((item) => <Card className="resource-item-card" key={item.id}><div><span>{item.subject}{item.topic ? ` / ${item.topic}` : ""}</span><h3>{item.title}</h3><a href={item.url} target="_blank" rel="noreferrer">{item.url}</a></div><div className="study-item-actions"><button aria-label={item.bookmarked ? "Remove bookmark" : "Bookmark resource"} aria-pressed={item.bookmarked} onClick={() => saveWorkspace({ ...workspaceRef.current, resources: workspaceRef.current.resources.map((resource) => resource.id === item.id ? { ...resource, bookmarked: !resource.bookmarked } : resource) })}><Bookmark size={15} fill={item.bookmarked ? "currentColor" : "none"}/></button><button aria-label={`Delete ${item.title}`} onClick={() => saveWorkspace({ ...workspaceRef.current, resources: workspaceRef.current.resources.filter((resource) => resource.id !== item.id) })}><Trash2 size={15}/></button></div></Card>)}
      {!workspace.resources.length && <EmptyStudyState>Save a useful link to create your personal reference shelf.</EmptyStudyState>}
    </div></div>}
  </section>;
}
