export function appendDictation(existingText, dictatedText) {
  const existing = typeof existingText === "string" ? existingText.trimEnd() : "";
  const dictated = typeof dictatedText === "string" ? dictatedText.trim() : "";
  if (!dictated) return existing;
  if (!existing) return dictated;

  const existingWords = existing.toLocaleLowerCase().split(/\s+/);
  const dictatedWords = dictated.split(/\s+/);
  const maxOverlap = Math.min(existingWords.length, dictatedWords.length);
  for (let size = maxOverlap; size > 0; size -= 1) {
    const left = existingWords.slice(-size).join(" ");
    const right = dictatedWords.slice(0, size).join(" ").toLocaleLowerCase();
    if (left === right) {
      return `${existing} ${dictatedWords.slice(size).join(" ")}`.trim();
    }
  }
  return `${existing}${/[\s\n]$/.test(existing) ? "" : " "}${dictated}`;
}

export function createSpeechActivityDetector() {
  let calibration = [];
  let noiseFloor = 0.003;
  let calibrated = false;
  let aboveSince = null;
  let lastAbove = 0;
  let speaking = false;
  let energy = 0;
  let phase = 0;
  let lastUpdate = 0;

  return {
    update(rms, spectralCentroid, now) {
      const level = Number.isFinite(rms) ? Math.max(0, rms) : 0;
      if (!calibrated) {
        calibration.push(Math.min(level, 0.012));
        if (calibration.length >= 8) {
          const ordered = [...calibration].sort((a, b) => a - b);
          noiseFloor = ordered[Math.floor(ordered.length * 0.4)] || 0.003;
          calibrated = true;
        }
      }

      const threshold = Math.max(0.012, noiseFloor * 2.5 + 0.006);
      const centroid = Math.max(0, Number(spectralCentroid) || 0);
      const candidate = calibrated && level >= threshold && centroid >= 0.025;
      if (candidate) {
        aboveSince ??= now;
        lastAbove = now;
        if (!speaking && now - aboveSince >= 90) speaking = true;
      } else {
        aboveSince = null;
        if (!speaking) noiseFloor += (Math.min(level, threshold) - noiseFloor) * 0.025;
      }

      if (speaking && now - lastAbove > 320) speaking = false;
      const targetEnergy = speaking ? Math.max(0, Math.min(1, (level - threshold) / Math.max(0.04, 0.18 - threshold))) : 0;
      const elapsed = lastUpdate ? Math.min(0.1, Math.max(0, (now - lastUpdate) / 1000)) : 1 / 30;
      lastUpdate = now;
      const easing = targetEnergy > energy ? Math.min(1, elapsed * 16) : Math.min(1, elapsed * 6);
      energy += (targetEnergy - energy) * easing;
      if (speaking) {
        phase += elapsed * (1.2 + Math.min(1, centroid) * 4.5) * Math.max(0.15, energy);
      }

      return { speaking, energy: Math.max(0, Math.min(1, energy)), phase, threshold, noiseFloor };
    },
    reset() {
      calibration = [];
      noiseFloor = 0.003;
      calibrated = false;
      aboveSince = null;
      lastAbove = 0;
      speaking = false;
      energy = 0;
      phase = 0;
      lastUpdate = 0;
    },
  };
}

export function rmsOf(samples) {
  if (!samples?.length) return 0;
  let sum = 0;
  for (const sample of samples) sum += sample * sample;
  return Math.sqrt(sum / samples.length);
}

export function peakOf(samples) {
  if (!samples?.length) return 0;
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  return peak;
}

export function describeVoiceError(code) {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone or speech recognition permission was denied. Allow access in browser site settings, then try again.";
    case "audio-capture":
    case "NotFoundError":
      return "No microphone is available. Connect or enable an audio input, then try again.";
    case "NotReadableError":
      return "The microphone is busy or unavailable to this tab. Close other recording apps and try again.";
    case "network":
      return "The browser speech service lost its network connection. Your typed text is unchanged.";
    case "language-not-supported":
      return "This browser speech service does not support Indian English on this device.";
    default:
      return "Voice dictation stopped unexpectedly. Your typed text is unchanged.";
  }
}
