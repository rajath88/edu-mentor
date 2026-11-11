export const COURSE_CATALOG = [
  {
    id: "data-structures",
    name: "Data Structures",
    code: "DS",
    color: "bg-violet-500",
    lessons: [
      { id: "arrays", title: "Arrays and strings", description: "Review indexing, traversal, and common array operations." },
      { id: "lists", title: "Linked lists", description: "Compare singly and doubly linked lists and their trade-offs." },
      { id: "stacks-queues", title: "Stacks and queues", description: "Practice LIFO and FIFO operations and their applications." },
      { id: "trees", title: "Trees and traversal", description: "Explore binary trees, search trees, and traversal orders." },
    ],
  },
  {
    id: "java-programming",
    name: "Java Programming",
    code: "JP",
    color: "bg-blue-500",
    lessons: [
      { id: "syntax", title: "Java syntax and types", description: "Work with variables, primitive types, expressions, and control flow." },
      { id: "classes", title: "Classes and objects", description: "Model data with classes, constructors, fields, and methods." },
      { id: "inheritance", title: "Inheritance and interfaces", description: "Use interfaces and inheritance to express reusable contracts." },
      { id: "collections", title: "Collections and generics", description: "Choose typed collections and use iterators safely." },
    ],
  },
  {
    id: "machine-learning",
    name: "Machine Learning",
    code: "ML",
    color: "bg-emerald-500",
    lessons: [
      { id: "workflow", title: "ML workflow", description: "Frame a problem, split data, train, and evaluate a model." },
      { id: "regression", title: "Regression", description: "Understand linear regression, loss, and model assumptions." },
      { id: "classification", title: "Classification", description: "Compare classifiers and interpret precision and recall." },
      { id: "validation", title: "Validation and overfitting", description: "Use validation data and regularization to assess generalization." },
    ],
  },
  {
    id: "cyber-security",
    name: "Cyber Security",
    code: "CS",
    color: "bg-orange-500",
    lessons: [
      { id: "security-basics", title: "Security fundamentals", description: "Apply confidentiality, integrity, and availability principles." },
      { id: "cryptography", title: "Cryptography basics", description: "Distinguish hashing, encryption, and digital signatures." },
      { id: "web-security", title: "Web application security", description: "Recognize common input handling and access control risks." },
      { id: "network-security", title: "Network security", description: "Review network boundaries, TLS, and secure service exposure." },
    ],
  },
];

export const QUIZZES = [
  {
    id: "java-fundamentals",
    title: "Java Fundamentals",
    subject: "Java",
    questions: [
      { q: "Which keyword declares a class in Java?", options: ["function", "class", "struct", "define"], answer: 1, explanation: "The `class` keyword declares a Java class." },
      { q: "Which method is the standard Java application entry point?", options: ["start()", "run()", "main()", "init()"], answer: 2, explanation: "The JVM starts a standard application by invoking `public static void main(String[] args)`." },
      { q: "Which primitive type stores true or false?", options: ["int", "String", "boolean", "char"], answer: 2, explanation: "`boolean` represents one of the two logical values: true or false." },
      { q: "Which collection prevents duplicate elements?", options: ["ArrayList", "HashSet", "LinkedList", "ArrayDeque"], answer: 1, explanation: "A `Set`, such as `HashSet`, stores unique elements." },
      { q: "What does `final` on a local variable prevent?", options: ["Reading it", "Reassignment", "Method calls", "Object creation"], answer: 1, explanation: "A final local variable can be assigned once and cannot be reassigned." },
    ],
  },
  {
    id: "data-structures",
    title: "Data Structures",
    subject: "Data Structures",
    questions: [
      { q: "Which structure follows FIFO order?", options: ["Stack", "Queue", "Tree", "Graph"], answer: 1, explanation: "A queue removes elements in the order they were added: first in, first out." },
      { q: "Which structure follows LIFO order?", options: ["Queue", "Array", "Stack", "Linked list"], answer: 2, explanation: "A stack removes the most recently added element first." },
      { q: "Which is a linear data structure?", options: ["Graph", "Tree", "Array", "Heap"], answer: 2, explanation: "Array elements are arranged in a linear indexed sequence." },
      { q: "What is the average lookup complexity of a hash table?", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], answer: 0, explanation: "With a good hash distribution, lookup is O(1) on average, though worst-case can be O(n)." },
      { q: "Which traversal visits a binary search tree in sorted order?", options: ["Preorder", "Inorder", "Postorder", "Level order"], answer: 1, explanation: "Inorder traversal visits left subtree, node, then right subtree, producing sorted keys in a BST." },
    ],
  },
];

export function calculateQuizScore(quiz, answers) {
  if (!quiz || !answers || quiz.questions.some((_, index) => !Number.isInteger(answers[index]))) {
    return null;
  }
  return quiz.questions.reduce((total, item, index) => (
    total + (answers[index] === item.answer ? 1 : 0)
  ), 0);
}

const safeRead = (key, storage) => {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

function getStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function loadCourseProgress(studentId, storage = getStorage()) {
  const saved = safeRead(`edumentor:${studentId}:course-progress`, storage);
  const emptyProgress = Object.fromEntries(COURSE_CATALOG.map(({ id }) => [id, []]));
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return emptyProgress;

  return Object.fromEntries(COURSE_CATALOG.map((course) => {
    const validIds = new Set(course.lessons.map((lesson) => lesson.id));
    const completed = Array.isArray(saved[course.id])
      ? saved[course.id].filter((id) => validIds.has(id))
      : [];
    return [course.id, [...new Set(completed)]];
  }));
}

export function saveCourseProgress(studentId, progress, storage = getStorage()) {
  try {
    storage?.setItem(`edumentor:${studentId}:course-progress`, JSON.stringify(progress));
    return Boolean(storage);
  } catch {
    return false;
  }
}

export function loadQuizHistory(studentId, storage = getStorage()) {
  const saved = safeRead(`edumentor:${studentId}:quiz-history`, storage);
  return Array.isArray(saved) ? saved.filter((result) => (
    result && typeof result.quizId === "string"
    && Number.isFinite(result.score) && Number.isFinite(result.total)
    && typeof result.completedAt === "string"
  )) : [];
}

export function saveQuizResult(studentId, result, storage = getStorage()) {
  try {
    const history = loadQuizHistory(studentId, storage);
    storage?.setItem(
      `edumentor:${studentId}:quiz-history`,
      JSON.stringify([...history, result].slice(-50)),
    );
    return Boolean(storage);
  } catch {
    return false;
  }
}

export function safeStorageGet(key, storage = getStorage()) {
  try {
    return storage?.getItem(key) || "";
  } catch {
    return "";
  }
}

export function safeStorageSet(key, value, storage = getStorage()) {
  try {
    storage?.setItem(key, value);
    return Boolean(storage);
  } catch {
    return false;
  }
}

export function safeStorageRemove(key, storage = getStorage()) {
  try {
    storage?.removeItem(key);
  } catch {
    // Storage may be unavailable in private browsing or restricted contexts.
  }
}
