import { useCallback, useEffect, useRef, useState } from "react";
import { createSpeechActivityDetector, describeVoiceError, peakOf, rmsOf } from "../utils/voiceDictation.js";

const blankSignal = { speaking: false, energy: 0, phase: 0, waveform: Array(48).fill(0), spectrum: Array(24).fill(0) };
const RECORDING_STATES = new Set(["activating", "listening", "speech-detected", "transcribing", "finalizing"]);
const blankDiagnostics = {
  deviceLabel: "Not opened", deviceId: "Unavailable", trackEnabled: false, trackMuted: false,
  trackReadyState: "unavailable", audioContextState: "not created", sourceConnected: false,
  analyserConnected: false, captureActive: false, rawRms: 0, rawPeak: 0, noiseFloor: 0,
  threshold: 0, speechDetected: false, recognitionSupported: false, recognitionState: "not started",
  recognitionError: "", recognitionEvents: [],
};

function audioErrorMessage(error) {
  if (error?.name === "NotAllowedError" || error?.name === "SecurityError") return describeVoiceError("not-allowed");
  if (error?.name === "NotFoundError" || error?.name === "OverconstrainedError") return describeVoiceError("NotFoundError");
  if (error?.name === "NotReadableError" || error?.name === "AbortError") return describeVoiceError("NotReadableError");
  if (!navigator.mediaDevices?.getUserMedia) return "This browser cannot capture microphone audio. Try a current browser on HTTPS or localhost.";
  return "The microphone could not be started. Check browser permissions and audio input settings, then try again.";
}

function combineParts(parts) {
  return parts.map((part) => part.trim()).filter(Boolean).reduce((text, part) => {
    if (!text) return part;
    const left = text.toLocaleLowerCase();
    const right = part.toLocaleLowerCase();
    if (left.endsWith(right)) return text;
    const leftWords = left.split(/\s+/);
    const rightWords = right.split(/\s+/);
    for (let overlap = Math.min(leftWords.length, rightWords.length); overlap > 0; overlap -= 1) {
      if (leftWords.slice(-overlap).join(" ") === rightWords.slice(0, overlap).join(" ")) {
        return `${text} ${part.split(/\s+/).slice(overlap).join(" ")}`.trim();
      }
    }
    return `${text} ${part}`;
  }, "");
}

export function useVoiceAssistant(onTranscript) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [signal, setSignal] = useState(blankSignal);
  const [hasLatestResponse, setHasLatestResponse] = useState(false);
  const [diagnostics, setDiagnostics] = useState(blankDiagnostics);
  const [inputDevices, setInputDevices] = useState([]);
  const [selectedInputDeviceId, setSelectedInputDeviceId] = useState("");
  const supported = typeof window !== "undefined"
    && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const callbackRef = useRef(onTranscript);
  const statusRef = useRef(status);
  const mutedRef = useRef(muted);
  const latestAnswerRef = useRef("");
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const contextRef = useRef(null);
  const sourceRef = useRef(null);
  const analyserRef = useRef(null);
  const contextStateHandlerRef = useRef(null);
  const trackListenersRef = useRef([]);
  const frameRef = useRef(0);
  const restartTimerRef = useRef(0);
  const finalizeTimerRef = useRef(0);
  const activeRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const cancelledRef = useRef(false);
  const terminalErrorRef = useRef(false);
  const finalizedRef = useRef(false);
  const sessionVersionRef = useRef(0);
  const finalPartsRef = useRef([]);
  const sessionResultsRef = useRef(new Map());
  const interimRef = useRef("");
  const startTimeRef = useRef(0);
  const detectorRef = useRef(createSpeechActivityDetector());
  const firstFrameRef = useRef(0);
  const speechErrorRef = useRef("");
  const speakingRef = useRef(false);
  const audioOnlyRef = useRef(false);
  const lastDiagnosticUpdateRef = useRef(0);

  const updateStatus = useCallback((next) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const updateDiagnostics = useCallback((patch) => {
    setDiagnostics((current) => ({ ...current, ...patch }));
  }, []);

  const recordRecognitionEvent = useCallback((event) => {
    const time = new Date().toLocaleTimeString();
    setDiagnostics((current) => ({
      ...current,
      recognitionEvents: [...current.recognitionEvents, `${time} · ${event}`].slice(-8),
    }));
  }, []);

  const cleanupMedia = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    trackListenersRef.current.forEach(({ track, handlers }) => {
      Object.entries(handlers).forEach(([eventName, handler]) => track.removeEventListener(eventName, handler));
    });
    trackListenersRef.current = [];
    const stream = streamRef.current;
    const audioTrack = stream?.getAudioTracks()[0];
    stream?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    const context = contextRef.current;
    contextRef.current = null;
    if (context && contextStateHandlerRef.current) context.removeEventListener("statechange", contextStateHandlerRef.current);
    contextStateHandlerRef.current = null;
    if (context && context.state !== "closed") void context.close();
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      ["onaudiostart", "onsoundstart", "onspeechstart", "onspeechend", "onsoundend", "onaudioend", "onstart", "onresult", "onerror", "onend"].forEach((key) => { recognition[key] = null; });
      try { recognition.abort(); } catch { /* Already ended. */ }
    }
    updateDiagnostics({
      captureActive: false,
      trackEnabled: audioTrack?.enabled ?? false,
      trackMuted: audioTrack?.muted ?? false,
      trackReadyState: audioTrack?.readyState ?? "unavailable",
      audioContextState: context ? "closing" : "closed",
      sourceConnected: false,
      analyserConnected: false,
    });
    setSignal(blankSignal);
  }, [updateDiagnostics]);

  const clearTimers = useCallback(() => {
    window.clearTimeout(restartTimerRef.current);
    window.clearTimeout(finalizeTimerRef.current);
    restartTimerRef.current = 0;
    finalizeTimerRef.current = 0;
  }, []);

  const clearTranscriptBuffers = useCallback(() => {
    finalPartsRef.current = [];
    sessionResultsRef.current = new Map();
    interimRef.current = "";
    setTranscript("");
  }, []);

  const updateTranscriptPreview = useCallback(() => {
    const committed = combineParts([
      ...finalPartsRef.current,
      ...[...sessionResultsRef.current.entries()]
        .sort(([left], [right]) => left - right)
        .map(([, result]) => result.text),
    ]);
    setTranscript(combineParts([committed, interimRef.current]));
  }, []);

  const finishSession = useCallback((includeInterim = true, errorMessage = "") => {
    if (finalizedRef.current || cancelledRef.current) return;
    finalizedRef.current = true;
    activeRef.current = false;
    clearTimers();
    const sessionText = [...sessionResultsRef.current.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, result]) => result.text);
    const currentText = combineParts([
      ...finalPartsRef.current,
      ...sessionText,
      ...(includeInterim && interimRef.current ? [interimRef.current] : []),
    ]);
    interimRef.current = "";
    cleanupMedia();
    setElapsed(0);
    if (errorMessage) {
      setError(errorMessage);
      updateStatus("error");
      if (currentText) callbackRef.current?.(currentText);
      return;
    }
    if (!currentText) {
      setError("No speech was recognized. Speak clearly, or use the text composer.");
      updateStatus("error");
      return;
    }
    setError("");
    setTranscript(currentText);
    callbackRef.current?.(currentText);
    updateStatus("ready");
  }, [clearTimers, cleanupMedia, updateStatus]);

  const processRecognitionResults = useCallback((event) => {
    const results = event.results || [];
    for (let index = event.resultIndex || 0; index < results.length; index += 1) {
      const result = results[index];
      const text = result?.[0]?.transcript?.trim();
      if (text) sessionResultsRef.current.set(index, { text, final: result.isFinal });
    }
    interimRef.current = [...sessionResultsRef.current.entries()]
      .sort(([left], [right]) => left - right)
      .filter(([, result]) => !result.final)
      .map(([, result]) => result.text)
      .join(" ");
    updateTranscriptPreview();
    if (interimRef.current && !speakingRef.current) updateStatus("transcribing");
  }, [updateStatus, updateTranscriptPreview]);

  const createRecognition = useCallback((version) => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return null;
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onaudiostart = () => { updateDiagnostics({ recognitionState: "browser audio capture started" }); recordRecognitionEvent("onaudiostart"); };
    recognition.onsoundstart = () => recordRecognitionEvent("onsoundstart");
    recognition.onspeechstart = () => recordRecognitionEvent("onspeechstart");
    recognition.onspeechend = () => recordRecognitionEvent("onspeechend");
    recognition.onsoundend = () => recordRecognitionEvent("onsoundend");
    recognition.onaudioend = () => recordRecognitionEvent("onaudioend");
    recognition.onstart = () => {
      if (version !== sessionVersionRef.current || !activeRef.current) return;
      updateDiagnostics({ recognitionState: "listening", recognitionError: "" });
      recordRecognitionEvent("onstart");
      if (!stopRequestedRef.current) updateStatus("listening");
    };
    recognition.onresult = (event) => {
      if (version !== sessionVersionRef.current || cancelledRef.current) return;
      processRecognitionResults(event);
      const latest = event.results?.[event.results.length - 1]?.[0]?.transcript?.trim();
      if (latest) {
        updateDiagnostics({ recognitionState: event.results[event.results.length - 1].isFinal ? "final result received" : "interim result received" });
        recordRecognitionEvent(`${event.results[event.results.length - 1].isFinal ? "final" : "interim"} result received`);
      }
    };
    recognition.onerror = (event) => {
      if (version !== sessionVersionRef.current || cancelledRef.current) return;
      if (event.error === "no-speech") {
        updateDiagnostics({ recognitionState: "waiting after no-speech event" });
        recordRecognitionEvent("onerror: no-speech (kept recording)");
        return;
      }
      if (event.error === "language-not-supported" && !speechErrorRef.current) {
        speechErrorRef.current = "language-fallback";
        recognition.lang = "en-US";
        return;
      }
      terminalErrorRef.current = true;
      const code = event.error === "audio-capture" ? "audio-capture" : event.error;
      speechErrorRef.current = code;
      updateDiagnostics({ recognitionState: "error", recognitionError: code });
      recordRecognitionEvent(`onerror: ${code}`);
      finishSession(true, describeVoiceError(code));
    };
    recognition.onend = () => {
      if (version !== sessionVersionRef.current || cancelledRef.current || finalizedRef.current) return;
      updateDiagnostics({ recognitionState: stopRequestedRef.current ? "ended after stop" : "restarting after end" });
      recordRecognitionEvent("onend");
      const sessionText = [...sessionResultsRef.current.entries()]
        .sort(([left], [right]) => left - right)
        .map(([, result]) => result.text);
      const committed = combineParts(sessionText);
      if (committed) finalPartsRef.current.push(committed);
      sessionResultsRef.current = new Map();
      const pending = interimRef.current;
      interimRef.current = "";
      if (stopRequestedRef.current) {
        if (pending) finalPartsRef.current.push(pending);
        finishSession(false, "");
        return;
      }
      if (!activeRef.current || terminalErrorRef.current) {
        finishSession(true, terminalErrorRef.current ? describeVoiceError(speechErrorRef.current) : "");
        return;
      }
      if (pending) finalPartsRef.current.push(pending);
      updateTranscriptPreview();
      restartTimerRef.current = window.setTimeout(() => {
        if (!activeRef.current || stopRequestedRef.current || version !== sessionVersionRef.current) return;
        try {
          recognition.start();
          if (statusRef.current !== "speech-detected") updateStatus(interimRef.current ? "transcribing" : "listening");
        } catch (error) {
          if (error?.name === "InvalidStateError") {
            restartTimerRef.current = window.setTimeout(() => {
              if (!activeRef.current || version !== sessionVersionRef.current) return;
              try { recognition.start(); } catch (retryError) { finishSession(true, describeVoiceError(retryError?.name)); }
            }, 300);
          } else finishSession(true, describeVoiceError(error?.name));
        }
      }, 350);
    };
    return recognition;
  }, [finishSession, processRecognitionResults, recordRecognitionEvent, updateDiagnostics, updateStatus, updateTranscriptPreview]);

  const startAudioAnalysis = useCallback(async (stream, version) => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Audio visualization is unavailable in this browser.");
    const context = new AudioContextClass();
    contextRef.current = context;
    updateDiagnostics({ audioContextState: context.state });
    const contextStateHandler = () => {
      if (contextRef.current === context) updateDiagnostics({ audioContextState: context.state });
    };
    contextStateHandlerRef.current = contextStateHandler;
    context.addEventListener("statechange", contextStateHandler);
    await context.resume();
    updateDiagnostics({ audioContextState: context.state });
    if (version !== sessionVersionRef.current || cancelledRef.current) {
      if (contextRef.current === context) contextRef.current = null;
      if (context.state !== "closed") void context.close();
      return;
    }
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.68;
    source.connect(analyser);
    sourceRef.current = source;
    analyserRef.current = analyser;
    updateDiagnostics({
      audioContextState: context.state,
      sourceConnected: source.numberOfOutputs > 0 && analyser.numberOfInputs > 0,
      analyserConnected: true,
    });
    const timeSamples = new Float32Array(analyser.fftSize);
    const frequencySamples = new Uint8Array(analyser.frequencyBinCount);
    const tick = (now) => {
      if (version !== sessionVersionRef.current || !activeRef.current || !analyserRef.current) return;
      analyser.getFloatTimeDomainData(timeSamples);
      analyser.getByteFrequencyData(frequencySamples);
      const rms = rmsOf(timeSamples);
      let weighted = 0;
      let total = 0;
      for (let index = 2; index < frequencySamples.length; index += 1) {
        const value = frequencySamples[index] / 255;
        weighted += index * value;
        total += value;
      }
      const centroid = total ? weighted / total / frequencySamples.length : 0;
      const activity = detectorRef.current.update(rms, centroid, now);
      if (now - lastDiagnosticUpdateRef.current >= 120) {
        lastDiagnosticUpdateRef.current = now;
        const track = streamRef.current?.getAudioTracks()[0];
        updateDiagnostics({
          captureActive: Boolean(track && track.readyState === "live"),
          trackEnabled: Boolean(track?.enabled),
          trackMuted: Boolean(track?.muted),
          trackReadyState: track?.readyState || "unavailable",
          audioContextState: contextRef.current?.state || "closed",
          rawRms: rms,
          rawPeak: peakOf(timeSamples),
          noiseFloor: activity.noiseFloor,
          threshold: activity.threshold,
          speechDetected: activity.speaking,
        });
      }
      const waveform = Array.from({ length: 48 }, (_, index) => {
        const sample = timeSamples[Math.floor(index * timeSamples.length / 48)] || 0;
        return activity.speaking ? Math.max(-1, Math.min(1, sample * 8)) : 0;
      });
      const spectrum = Array.from({ length: 24 }, (_, index) => {
        const start = Math.floor(index * frequencySamples.length / 24);
        const end = Math.max(start + 1, Math.floor((index + 1) * frequencySamples.length / 24));
        let sum = 0;
        for (let point = start; point < end; point += 1) sum += frequencySamples[point];
        return activity.speaking ? sum / (end - start) / 255 : 0;
      });
      setSignal({ speaking: activity.speaking, energy: activity.energy, phase: activity.phase, waveform, spectrum });

      if (activity.speaking) {
        speakingRef.current = true;
        if (statusRef.current !== "speech-detected") updateStatus("speech-detected");
      } else if (statusRef.current === "speech-detected") {
        speakingRef.current = false;
        updateStatus(interimRef.current ? "transcribing" : "listening");
      } else {
        speakingRef.current = false;
      }
      if (!firstFrameRef.current || now - firstFrameRef.current >= 1000) {
        firstFrameRef.current = now;
        setElapsed(Math.max(0, Math.floor((now - startTimeRef.current) / 1000)));
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [updateDiagnostics, updateStatus]);

  const start = useCallback(async ({ audioOnly = false } = {}) => {
    if (activeRef.current || RECORDING_STATES.has(statusRef.current)) return false;
    if (!audioOnly && !supported) {
      setError("Speech recognition is not supported by this browser. Your text composer is still available.");
      updateStatus("error");
      return false;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone capture requires HTTPS or localhost in a current browser. Your text composer is unchanged.");
      updateStatus("error");
      return false;
    }

    const version = sessionVersionRef.current + 1;
    sessionVersionRef.current = version;
    activeRef.current = true;
    audioOnlyRef.current = audioOnly;
    stopRequestedRef.current = false;
    cancelledRef.current = false;
    terminalErrorRef.current = false;
    finalizedRef.current = false;
    speechErrorRef.current = "";
    clearTimers();
    clearTranscriptBuffers();
    detectorRef.current.reset();
    speakingRef.current = false;
    lastDiagnosticUpdateRef.current = 0;
    setDiagnostics({
      ...blankDiagnostics,
      recognitionSupported: supported,
      recognitionState: audioOnly ? "not started (microphone-only test)" : "starting",
    });
    setElapsed(0);
    setError("");
    startTimeRef.current = performance.now();
    firstFrameRef.current = 0;
    updateStatus("activating");

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          ...(selectedInputDeviceId ? { deviceId: { exact: selectedInputDeviceId } } : {}),
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (version !== sessionVersionRef.current || cancelledRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }
      streamRef.current = stream;
      const audioTrack = stream.getAudioTracks()[0];
      const trackSettings = audioTrack?.getSettings?.() || {};
      const audioInputs = (await navigator.mediaDevices.enumerateDevices().catch(() => []))
        .filter((device) => device.kind === "audioinput")
        .map((device) => ({ deviceId: device.deviceId, label: device.label || "Microphone" }));
      if (version !== sessionVersionRef.current || cancelledRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }
      setInputDevices(audioInputs);
      if (!selectedInputDeviceId && trackSettings.deviceId) setSelectedInputDeviceId(trackSettings.deviceId);
      updateDiagnostics({
        deviceLabel: audioTrack?.label || "Browser-selected microphone (label unavailable)",
        deviceId: trackSettings.deviceId || "Not exposed by browser",
        trackEnabled: Boolean(audioTrack?.enabled),
        trackMuted: Boolean(audioTrack?.muted),
        trackReadyState: audioTrack?.readyState || "unavailable",
        captureActive: Boolean(audioTrack && audioTrack.readyState === "live"),
      });
      stream.getAudioTracks().forEach((track) => {
        const handlers = {
          ended: () => {
          updateDiagnostics({ captureActive: false, trackReadyState: track.readyState });
          if (version === sessionVersionRef.current && activeRef.current) {
            terminalErrorRef.current = true;
            finishSession(true, "The microphone disconnected. Any recognized words were added to your composer.");
          }
          },
          mute: () => updateDiagnostics({ trackMuted: true }),
          unmute: () => updateDiagnostics({ trackMuted: false }),
        };
        Object.entries(handlers).forEach(([eventName, handler]) => track.addEventListener(eventName, handler));
        trackListenersRef.current.push({ track, handlers });
      });
      await startAudioAnalysis(stream, version);
      if (version !== sessionVersionRef.current || cancelledRef.current) return false;
      if (audioOnly) {
        updateDiagnostics({ recognitionState: "not started (microphone-only test)" });
        recordRecognitionEvent("SpeechRecognition intentionally skipped for capture test");
        updateStatus("listening");
        return true;
      }
      const recognition = createRecognition(version);
      if (!recognition) throw new Error("Speech recognition is not supported by this browser.");
      recognitionRef.current = recognition;
      recognition.start();
      recordRecognitionEvent(`start() requested (${recognition.lang})`);
      return true;
    } catch (startError) {
      if (version !== sessionVersionRef.current || cancelledRef.current) {
        stream?.getTracks().forEach((track) => track.stop());
        return false;
      }
      activeRef.current = false;
      cleanupMedia();
      const message = startError?.name === "NotAllowedError" || startError?.name === "NotFoundError" || startError?.name === "NotReadableError"
        ? audioErrorMessage(startError)
        : startError?.message || audioErrorMessage(startError);
      setError(message);
      updateDiagnostics({ recognitionState: "startup failed", recognitionError: startError?.name || startError?.message || "unknown error" });
      recordRecognitionEvent(`startup error: ${startError?.name || startError?.message || "unknown error"}`);
      updateStatus("error");
      return false;
    }
  }, [clearTimers, clearTranscriptBuffers, cleanupMedia, createRecognition, finishSession, recordRecognitionEvent, selectedInputDeviceId, startAudioAnalysis, supported, updateDiagnostics, updateStatus]);

  const startMicrophoneTest = useCallback(() => start({ audioOnly: true }), [start]);

  const stop = useCallback(() => {
    if (!activeRef.current || stopRequestedRef.current) return;
    stopRequestedRef.current = true;
    updateStatus("finalizing");
    window.clearTimeout(restartTimerRef.current);
    restartTimerRef.current = 0;
    const recognition = recognitionRef.current;
    if (audioOnlyRef.current) {
      activeRef.current = false;
      finalizedRef.current = true;
      clearTimers();
      cleanupMedia();
      setElapsed(0);
      setError("");
      updateStatus("idle");
      return;
    }
    if (!recognition) {
      finishSession(true, "");
      return;
    }
    try { recognition.stop(); } catch { finishSession(true, ""); return; }
    finalizeTimerRef.current = window.setTimeout(() => {
      if (!activeRef.current || finalizedRef.current) return;
      try { recognition.abort(); } catch { /* The browser already ended the session. */ }
      finishSession(true, "");
    }, 2800);
  }, [clearTimers, cleanupMedia, finishSession, updateStatus]);

  const cancel = useCallback(() => {
    sessionVersionRef.current += 1;
    cancelledRef.current = true;
    activeRef.current = false;
    stopRequestedRef.current = false;
    clearTimers();
    try { recognitionRef.current?.abort(); } catch { /* Already stopped. */ }
    recognitionRef.current = null;
    cleanupMedia();
    clearTranscriptBuffers();
    setElapsed(0);
    setError("");
    finalizedRef.current = true;
    updateStatus("idle");
  }, [clearTimers, cleanupMedia, clearTranscriptBuffers, updateStatus]);

  const dismiss = useCallback(() => {
    if (activeRef.current) cancel();
    else {
      setError("");
      setTranscript("");
      updateStatus("idle");
    }
  }, [cancel, updateStatus]);

  const setLatestResponse = useCallback((answer) => {
    latestAnswerRef.current = typeof answer === "string" ? answer : "";
    setHasLatestResponse(Boolean(latestAnswerRef.current));
  }, []);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) window.speechSynthesis?.cancel();
  }, []);

  const replay = useCallback(() => {
    if (!latestAnswerRef.current || mutedRef.current || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(latestAnswerRef.current));
  }, []);

  useEffect(() => { callbackRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => () => {
    sessionVersionRef.current += 1;
    activeRef.current = false;
    clearTimers();
    try { recognitionRef.current?.abort(); } catch { /* Already stopped. */ }
    recognitionRef.current = null;
    cleanupMedia();
    window.speechSynthesis?.cancel();
  }, [clearTimers, cleanupMedia]);

  return {
    status,
    error,
    muted,
    transcript,
    elapsed,
    signal,
    diagnostics,
    inputDevices,
    selectedInputDeviceId,
    setSelectedInputDeviceId,
    supported,
    isRecording: RECORDING_STATES.has(status),
    start,
    startMicrophoneTest,
    stop,
    cancel,
    dismiss,
    setLatestResponse,
    hasLatestResponse,
    toggleMute,
    replay,
  };
}
