import assert from "node:assert/strict";
import test from "node:test";
import {
  COURSE_CATALOG,
  QUIZZES,
  calculateQuizScore,
  getCourseProgressPercent,
  loadCourseProgress,
  loadQuizHistory,
  loadStudentAvatar,
  safeStorageGet,
  shouldClearStudentSessionFromStorageEvent,
  saveCourseProgress,
  saveQuizResult,
  saveStudentAvatar,
  resetStudentAvatar,
  toggleCourseLessonProgress,
} from "./studentWorkspace.js";
import { COURSE_DETAILS, COURSE_LESSONS } from "./courseCurriculum.js";
import { loadStudyWorkspace, saveStudyWorkspace } from "./studyWorkspace.js";
import { EXPANDED_COURSES } from "./expandedCatalog.js";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("cross-tab identity sync ignores incomplete writes and honors explicit sign-out", () => {
  assert.equal(shouldClearStudentSessionFromStorageEvent({ key: "studentId", newValue: "42" }, "42", ""), false);
  assert.equal(shouldClearStudentSessionFromStorageEvent({ key: "studentName", newValue: "Learner" }, "", "Learner"), false);
  assert.equal(shouldClearStudentSessionFromStorageEvent({ key: "studentId", newValue: null }, "", ""), true);
  assert.equal(shouldClearStudentSessionFromStorageEvent({ key: null, newValue: null }, "", ""), true);
  assert.equal(shouldClearStudentSessionFromStorageEvent({ key: "studentEmail", newValue: null }, "", ""), false);
});

test("course progress is student-scoped, validated, and persists completed lessons", () => {
  const storage = createStorage({
    "edumentor:student-a:course-progress": JSON.stringify({
      "data-structures": ["arrays", "not-a-real-lesson", "arrays"],
    }),
  });

  assert.deepEqual(loadCourseProgress("student-a", storage), {
    ...Object.fromEntries(COURSE_CATALOG.filter(({ id }) => id !== "data-structures").map(({ id }) => [id, []])),
    "data-structures": ["arrays"],
  });
  assert.deepEqual(loadCourseProgress("student-b", storage)["data-structures"], []);
  assert.equal(saveCourseProgress("student-a", { "data-structures": ["arrays", "trees"] }, storage), true);
  assert.deepEqual(loadCourseProgress("student-a", storage)["data-structures"], ["arrays", "trees"]);
});

test("course progress can be toggled safely and reports the correct completion percentage", () => {
  const initial = Object.fromEntries(COURSE_CATALOG.map(({ id }) => [id, []]));
  const oneLesson = toggleCourseLessonProgress(initial, "data-structures", "arrays");
  assert.deepEqual(oneLesson["data-structures"], ["arrays"]);
  assert.equal(getCourseProgressPercent(COURSE_CATALOG[0], oneLesson["data-structures"]), 25);

  const undone = toggleCourseLessonProgress(oneLesson, "data-structures", "arrays");
  assert.deepEqual(undone["data-structures"], []);
  assert.equal(getCourseProgressPercent(COURSE_CATALOG[0], undone["data-structures"]), 0);
  assert.equal(toggleCourseLessonProgress(initial, "data-structures", "missing-lesson"), initial);
});

test("every course lesson has complete teaching content and course outcomes", () => {
  for (const course of COURSE_CATALOG) {
    assert.equal(course.lessons.length, course.id === "cloud-computing" ? 10 : 4, `${course.name} lesson count`);
    assert.equal(COURSE_DETAILS[course.id]?.outcomes.length, 3);
    for (const lesson of course.lessons) {
      const content = COURSE_LESSONS[course.id]?.[lesson.id];
      assert.ok(content, `${course.name}: ${lesson.title} is missing content`);
      assert.ok(content.sections.length >= 2);
      assert.ok(content.example?.code);
      assert.ok(content.takeaways.length >= 3);
      if (course.id === "cloud-computing") assert.ok(content.objectives.length >= 2);
    }
  }
});

test("expanded catalog covers the requested categories without duplicate course IDs", () => {
  assert.equal(EXPANDED_COURSES.length, 35);
  assert.equal(COURSE_CATALOG.length, 40);
  assert.equal(new Set(COURSE_CATALOG.map(({ id }) => id)).size, COURSE_CATALOG.length);
  const categories = new Set(EXPANDED_COURSES.map(({ category }) => category));
  for (const category of ["Computer Science", "Software Engineering", "Artificial Intelligence", "Cloud and DevOps", "Cybersecurity", "Career Preparation"]) {
    assert.ok(categories.has(category), `${category} has courses`);
  }
  for (const course of EXPANDED_COURSES) {
    assert.equal(course.lessons.length, 4);
    assert.ok(course.level);
    for (const lesson of course.lessons) {
      const content = COURSE_LESSONS[course.id][lesson.id];
      assert.ok(content.sections[0].body.length > 80);
      assert.ok(content.example.code.length > 25);
      assert.ok(content.practiceTopic);
      assert.equal(content.takeaways.length, 3);
    }
  }
});

test("the six added quizzes have ten unique, valid multiple-choice questions each", () => {
  const addedQuizIds = new Set([
    "cloud-computing-fundamentals", "cloud-architecture-security", "database-management-systems",
    "operating-systems", "computer-networks", "docker-containerization",
  ]);
  const addedQuizzes = QUIZZES.filter(({ id }) => addedQuizIds.has(id));
  assert.equal(addedQuizzes.length, 6);
  for (const quiz of addedQuizzes) {
    assert.equal(quiz.questions.length, 10, `${quiz.title} question count`);
    assert.equal(new Set(quiz.questions.map(({ q }) => q.toLowerCase())).size, 10, `${quiz.title} unique prompts`);
    for (const question of quiz.questions) {
      assert.equal(question.options.length, 4);
      assert.equal(new Set(question.options).size, 4);
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4);
      assert.ok(question.explanation.length > 20);
    }
  }
});

test("corrupt or unavailable local storage returns safe defaults", () => {
  const broken = { getItem: () => "not-json", setItem: () => { throw new Error("blocked"); } };
  assert.deepEqual(loadCourseProgress("student", broken), Object.fromEntries(COURSE_CATALOG.map(({ id }) => [id, []])));
  assert.deepEqual(loadQuizHistory("student", broken), []);
  assert.equal(safeStorageGet("studentId", { getItem: () => { throw new Error("blocked"); } }), "");
  assert.equal(saveCourseProgress("student", {}, broken), false);
});

test("quiz scoring requires every answer and counts only correct choices", () => {
  const quiz = QUIZZES[0];
  assert.equal(calculateQuizScore(quiz, { 0: quiz.questions[0].answer }), null);
  const answers = Object.fromEntries(quiz.questions.map((question, index) => [index, question.answer]));
  answers[0] = (answers[0] + 1) % quiz.questions[0].options.length;
  assert.equal(calculateQuizScore(quiz, answers), quiz.questions.length - 1);
});

test("quiz results persist and invalid history entries are ignored", () => {
  const storage = createStorage({
    "edumentor:student:quiz-history": JSON.stringify([{ quizId: "invalid" }, {
      quizId: "java-fundamentals", title: "Java Fundamentals", score: 4, total: 5,
      completedAt: "2026-11-12T00:00:00.000Z",
    }]),
  });
  assert.equal(loadQuizHistory("student", storage).length, 1);
  assert.equal(saveQuizResult("student", {
    quizId: "data-structures", title: "Data Structures", score: 3, total: 5,
    completedAt: "2026-11-12T01:00:00.000Z",
  }, storage), true);
  assert.equal(loadQuizHistory("student", storage).length, 2);
});

test("avatar selection persists per student and reset restores initials", () => {
  const storage = createStorage();
  assert.equal(loadStudentAvatar("student-a", storage), null);
  assert.equal(saveStudentAvatar("student-a", "boa-hancock", storage), true);
  assert.equal(loadStudentAvatar("student-a", storage), "boa-hancock");
  assert.equal(loadStudentAvatar("student-b", storage), null);
  assert.equal(resetStudentAvatar("student-a", storage), true);
  assert.equal(loadStudentAvatar("student-a", storage), null);
  assert.equal(saveStudentAvatar("student-a", "not-a-supplied-avatar", storage), false);
});

test("avatar persistence reports unavailable browser storage", () => {
  const unavailable = {
    getItem: () => { throw new Error("blocked"); },
    setItem: () => { throw new Error("blocked"); },
    removeItem: () => { throw new Error("blocked"); },
  };
  assert.equal(loadStudentAvatar("student", unavailable), null);
  assert.equal(saveStudentAvatar("student", "luffy", unavailable), false);
  assert.equal(resetStudentAvatar("student", unavailable), false);
});

test("study tools persist independently for each student and reject broken data safely", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const workspace = { notes: [{ id: "n1", title: "Cloud notes", content: "Virtual machines isolate operating systems.", subject: "Cloud", summary: "" }], decks: [], practice: [], planner: [], focus: [], resources: [] };
  assert.equal(saveStudyWorkspace("student-a", workspace, storage), true);
  assert.deepEqual(loadStudyWorkspace("student-a", storage), workspace);
  assert.deepEqual(loadStudyWorkspace("student-b", storage).notes, []);
  values.set("edumentor:student-a:study-tools", "{invalid");
  assert.deepEqual(loadStudyWorkspace("student-a", storage).notes, []);
  values.set("edumentor:student-a:study-tools", JSON.stringify({ notes: [null, { id: "n2", title: "Incomplete" }], resources: [{ id: "r1", title: "unsafe", url: "javascript:alert(1)" }] }));
  const sanitized = loadStudyWorkspace("student-a", storage);
  assert.deepEqual(sanitized.notes, []);
  assert.deepEqual(sanitized.resources, []);
});
