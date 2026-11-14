const emptyWorkspace = () => ({ notes: [], decks: [], practice: [], planner: [], focus: [], resources: [] });

function storageOrDefault(storage) {
  if (storage !== undefined) return storage;
  try { return globalThis.localStorage; } catch { return null; }
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function safeText(value) {
  return typeof value === "string" ? value : "";
}

function isSafeWebUrl(value) {
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}

function sanitizeWorkspace(value) {
  return {
    notes: value.notes.filter((item) => isRecord(item) && typeof item.id === "string"
      && typeof item.title === "string" && typeof item.content === "string")
      .map((item) => ({ ...item, subject: safeText(item.subject), summary: safeText(item.summary) })),
    decks: value.decks.filter((item) => isRecord(item) && typeof item.id === "string"
      && typeof item.title === "string" && Array.isArray(item.cards))
      .map((deck) => ({ ...deck, cards: deck.cards.filter((card) => isRecord(card)
        && typeof card.id === "string" && typeof card.front === "string" && typeof card.back === "string")
        .map((card) => ({ ...card, known: card.known === true })) })),
    practice: value.practice.filter((item) => isRecord(item) && typeof item.id === "string"
      && typeof item.topic === "string" && typeof item.correct === "boolean"),
    planner: value.planner.filter((item) => isRecord(item) && typeof item.id === "string"
      && typeof item.title === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date)
      && Number.isFinite(item.minutes)).map((item) => ({ ...item, complete: item.complete === true })),
    focus: value.focus.filter((item) => isRecord(item) && typeof item.id === "string"
      && Number.isFinite(item.minutes) && typeof item.completedAt === "string"),
    resources: value.resources.filter((item) => isRecord(item) && typeof item.id === "string"
      && typeof item.title === "string" && typeof item.url === "string"
      && isSafeWebUrl(item.url))
      .map((item) => ({ ...item, bookmarked: item.bookmarked === true })),
  };
}

export function loadStudyWorkspace(studentId, storage) {
  if (!studentId) return emptyWorkspace();
  try {
    const raw = storageOrDefault(storage)?.getItem(`edumentor:${studentId}:study-tools`);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return emptyWorkspace();
    const defaults = emptyWorkspace();
    return sanitizeWorkspace(Object.fromEntries(Object.keys(defaults).map((key) => [key, Array.isArray(parsed[key]) ? parsed[key] : []])));
  } catch {
    return emptyWorkspace();
  }
}

export function saveStudyWorkspace(studentId, workspace, storage) {
  if (!studentId || !workspace || typeof workspace !== "object") return false;
  try {
    const target = storageOrDefault(storage);
    if (!target) return false;
    target.setItem(`edumentor:${studentId}:study-tools`, JSON.stringify(workspace));
    return true;
  } catch {
    return false;
  }
}

export function removeStudyWorkspace(studentId, storage) {
  if (!studentId) return false;
  try {
    const target = storageOrDefault(storage);
    if (!target) return false;
    target.removeItem(`edumentor:${studentId}:study-tools`);
    return target.getItem(`edumentor:${studentId}:study-tools`) === null;
  } catch {
    return false;
  }
}

export function createStudyId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
