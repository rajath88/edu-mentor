import { useEffect, useRef } from "react";
import { Activity, Check, Mic, RotateCcw, Square, Volume2, VolumeX, X } from "lucide-react";

const ACTIVE_STATES = new Set(["activating", "listening", "speech-detected", "transcribing", "finalizing"]);
const STATUS_LABELS = {
  idle: "IDLE",
  activating: "ACTIVATING MICROPHONE",
  listening: "LISTENING",
  "speech-detected": "SPEECH DETECTED",
  transcribing: "TRANSCRIBING",
  finalizing: "FINALIZING",
  ready: "TRANSCRIPTION READY",
  error: "ERROR",
};

function formatDuration(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function VoiceHologram({ signal }) {
  const canvasRef = useRef(null);
  const signalRef = useRef(signal);
  const drawRef = useRef(null);

  useEffect(() => {
    signalRef.current = signal;
    drawRef.current?.();
  }, [signal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d");
    if (!context) return undefined;

    const draw = () => {
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const currentSignal = signalRef.current;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(bounds.width * ratio);
      canvas.height = Math.round(bounds.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, bounds.width, bounds.height);

      const cx = bounds.width / 2;
      const cy = bounds.height / 2;
      const radius = Math.min(bounds.width, bounds.height) * 0.2;
      const energy = currentSignal.speaking ? currentSignal.energy : 0;
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const phase = currentSignal.speaking && !reducedMotion ? currentSignal.phase : 0;
      const spectrum = currentSignal.spectrum || [];

      context.save();
      context.translate(cx, cy);
      context.strokeStyle = `rgba(240, 190, 72, ${0.12 + energy * 0.3})`;
      context.lineWidth = 1;
      [1.55, 1.85, 2.2].forEach((scale, index) => {
        context.save();
        context.rotate((index === 1 ? -0.42 : 0.35) + phase * (index === 2 ? 0.025 : 0.04));
        context.beginPath();
        context.ellipse(0, 0, radius * scale * (1 + energy * 0.045), radius * (index === 1 ? 0.43 : 0.28) * (1 + energy * 0.08), 0, 0, Math.PI * 2);
        context.stroke();
        context.restore();
      });

      const glow = context.createRadialGradient(0, 0, radius * 0.12, 0, 0, radius * (1.35 + energy * 0.3));
      glow.addColorStop(0, `rgba(255, 236, 164, ${0.76 + energy * 0.2})`);
      glow.addColorStop(0.35, `rgba(229, 174, 47, ${0.38 + energy * 0.2})`);
      glow.addColorStop(1, "rgba(161, 100, 10, 0)");
      context.fillStyle = glow;
      context.beginPath();
      context.arc(0, 0, radius * (1.4 + energy * 0.15), 0, Math.PI * 2);
      context.fill();

      const sphere = context.createRadialGradient(-radius * 0.3, -radius * 0.38, 1, 0, 0, radius);
      sphere.addColorStop(0, "#fff9dc");
      sphere.addColorStop(0.2, "#f6df9b");
      sphere.addColorStop(0.58, "#c58b20");
      sphere.addColorStop(1, "#38230c");
      context.fillStyle = sphere;
      context.beginPath();
      context.arc(0, 0, radius, 0, Math.PI * 2);
      context.fill();

      // Fixed constellation points stay still in silence; audio bins only displace them during voice activity.
      for (let index = 0; index < 18; index += 1) {
        const angle = index * 2.399963229728653;
        const bin = spectrum[index % Math.max(1, spectrum.length)] || 0;
        const orbit = radius * (1.52 + (index % 4) * 0.16 + (currentSignal.speaking ? bin * 0.25 : 0));
        const x = Math.cos(angle + phase * 0.04) * orbit;
        const y = Math.sin(angle + phase * 0.04) * orbit * 0.62;
        context.fillStyle = `rgba(255, ${210 + Math.round(bin * 45)}, ${110 + Math.round(bin * 80)}, ${0.34 + (currentSignal.speaking ? bin * 0.62 : 0)})`;
        context.beginPath();
        context.arc(x, y, 1 + (currentSignal.speaking ? bin * 2 : 0), 0, Math.PI * 2);
        context.fill();
      }

      context.restore();

      const waveform = currentSignal.speaking ? currentSignal.waveform || [] : [];
      const centerY = bounds.height - 20;
      context.strokeStyle = `rgba(255, 213, 111, ${currentSignal.speaking ? 0.86 : 0.24})`;
      context.lineWidth = 1.4;
      context.beginPath();
      if (waveform.length) {
        waveform.forEach((value, index) => {
          const x = 18 + (bounds.width - 36) * index / Math.max(1, waveform.length - 1);
          const y = centerY - value * 11;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
      } else {
        context.moveTo(18, centerY);
        context.lineTo(bounds.width - 18, centerY);
      }
      context.stroke();
    };

    drawRef.current = draw;
    draw();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(draw);
    observer?.observe(canvas);
    window.addEventListener("resize", draw);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", draw);
      drawRef.current = null;
    };
  }, []);

  return <canvas ref={canvasRef} className="voice-hologram-canvas" role="img" aria-label={signal.speaking ? "Hologram reacting to microphone audio" : "Stationary golden EDU-AI hologram"} />;
}

export function VoiceControls({ voice, compact = false, onStart }) {
  const isActive = ACTIVE_STATES.has(voice.status);
  const open = isActive || voice.status === "ready" || voice.status === "error";
  const cancelRecording = voice.cancel;
  const dismissDialog = voice.dismiss;
  const start = () => { if (onStart) void onStart(); else void voice.start(); };
  const cancel = () => cancelRecording();
  const close = () => dismissDialog();

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (isActive) cancelRecording();
      else dismissDialog();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isActive, cancelRecording, dismissDialog]);

  return (
    <div className={`voice-controls${compact ? " is-compact" : ""}`}>
      <button type="button" className="voice-mic-button" onClick={start} disabled={isActive} aria-label="Start voice dictation" title="Dictate into the message composer">
        <Mic size={16} />
      </button>
      <button type="button" className="voice-icon-button" onClick={() => void voice.startMicrophoneTest()} disabled={isActive} aria-label="Test microphone capture without speech recognition" title="Microphone capture test (does not run speech recognition)"><Activity size={15} /></button>
      <span className={`voice-state${voice.status === "error" ? " is-error" : ""}`} role="status">{STATUS_LABELS[voice.status] || "IDLE"}</span>
      <button type="button" className="voice-icon-button" onClick={voice.toggleMute} aria-label={voice.muted ? "Enable speech playback" : "Mute speech playback"} title={voice.muted ? "Enable speech playback" : "Mute speech playback"}>
        {voice.muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>
      <button type="button" className="voice-icon-button" onClick={voice.replay} disabled={!voice.hasLatestResponse || voice.muted} aria-label="Replay latest Mentor response" title="Replay latest Mentor response"><RotateCcw size={14} /></button>

      {open && <div className="voice-overlay" role="presentation">
        <section className="voice-recorder-panel" role="dialog" aria-modal="true" aria-labelledby="voice-dialog-title">
          <header className="voice-dialog-header">
            <div><span className="voice-overline">EDU-AI / VOICE INPUT</span><h2 id="voice-dialog-title">Holographic dictation</h2></div>
            <time className="voice-duration" aria-label={`Recording duration ${formatDuration(voice.elapsed)}`}>{formatDuration(voice.elapsed)}</time>
          </header>
          <VoiceHologram signal={voice.signal} />
          <p className={`voice-dialog-state${voice.status === "error" ? " is-error" : ""}`} aria-live="polite">{STATUS_LABELS[voice.status] || "IDLE"}</p>
          <p className="voice-dialog-hint">Speak naturally. Your words will be added to the composer when you stop.</p>
          <div className="voice-transcript-preview" aria-live="polite" aria-label="Live transcription">{voice.transcript || (voice.status === "error" ? "" : "Your recognized words will appear here…")}</div>
          {voice.error && <p className="voice-error" role="alert">{voice.error}</p>}
          <details className="voice-debug-panel" open>
            <summary>Microphone diagnostics</summary>
            <p className="voice-debug-note">Direct capture values. Microphone-only test bypasses browser speech recognition.</p>
            {voice.inputDevices.length > 0 && <label className="voice-device-picker">
              <span>Use this microphone on the next test or dictation</span>
              <select value={voice.selectedInputDeviceId} onChange={(event) => voice.setSelectedInputDeviceId(event.target.value)}>
                <option value="">System default</option>
                {voice.inputDevices.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.label}</option>)}
              </select>
            </label>}
            {!voice.diagnostics.recognitionState.includes("microphone-only") && <p className="voice-debug-note">Browser SpeechRecognition chooses its own input through Chrome; the selected device above controls the measured Web Audio stream.</p>}
            <dl className="voice-debug-grid">
              <div><dt>Selected input</dt><dd title={voice.diagnostics.deviceLabel}>{voice.diagnostics.deviceLabel}</dd></div>
              <div><dt>Device ID</dt><dd title={voice.diagnostics.deviceId}>{voice.diagnostics.deviceId}</dd></div>
              <div><dt>Track</dt><dd>{voice.diagnostics.trackEnabled ? "enabled" : "disabled"} · {voice.diagnostics.trackMuted ? "muted" : "unmuted"} · {voice.diagnostics.trackReadyState}</dd></div>
              <div><dt>Capture</dt><dd>{voice.diagnostics.captureActive ? "active" : "inactive"}</dd></div>
              <div><dt>AudioContext</dt><dd>{voice.diagnostics.audioContextState}</dd></div>
              <div><dt>Audio graph</dt><dd>{voice.diagnostics.sourceConnected && voice.diagnostics.analyserConnected ? "MediaStreamSource → Analyser connected" : "not connected"}</dd></div>
              <div><dt>Raw RMS / peak</dt><dd>{voice.diagnostics.rawRms.toFixed(5)} / {voice.diagnostics.rawPeak.toFixed(5)}</dd></div>
              <div><dt>VAD / floor / threshold</dt><dd>{voice.diagnostics.speechDetected ? "speech" : "quiet"} · {voice.diagnostics.noiseFloor.toFixed(5)} / {voice.diagnostics.threshold.toFixed(5)}</dd></div>
              <div><dt>SpeechRecognition</dt><dd>{voice.diagnostics.recognitionSupported ? voice.diagnostics.recognitionState : "unsupported"}</dd></div>
              {voice.diagnostics.recognitionError && <div><dt>Recognition error</dt><dd>{voice.diagnostics.recognitionError}</dd></div>}
            </dl>
            <ol className="voice-debug-events" aria-label="Recent recognition events">
              {voice.diagnostics.recognitionEvents.map((event, index) => <li key={`${index}-${event}`}>{event}</li>)}
            </ol>
          </details>
          <footer className="voice-dialog-actions">
            {isActive ? <>
              <button type="button" className="voice-cancel-button" onClick={cancel}><X size={15} /> Cancel</button>
              <button type="button" className="voice-stop-button" onClick={voice.stop} disabled={voice.status === "activating" || voice.status === "finalizing"}><Square size={14} /> {voice.status === "finalizing" ? "Finalizing…" : "Stop & use text"}</button>
            </> : voice.status === "ready" ? <button type="button" className="voice-stop-button" onClick={close}><Check size={15} /> Done editing in composer</button> : <>
              <button type="button" className="voice-cancel-button" onClick={close}><X size={15} /> Close</button>
              <button type="button" className="voice-stop-button" onClick={start}><RotateCcw size={14} /> Try again</button>
            </>}
          </footer>
        </section>
      </div>}
    </div>
  );
}
