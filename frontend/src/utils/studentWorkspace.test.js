import assert from "node:assert/strict";
import test from "node:test";
import {
  COURSE_CATALOG,
  QUIZZES,
  calculateQuizScore,
  loadCourseProgress,
  loadQuizHistory,
  safeStorageGet,
  saveCourseProgress,
  saveQuizResult,
} from "./studentWorkspace.js";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

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
