import test from "node:test";
import assert from "node:assert/strict";
import { appendDictation, createSpeechActivityDetector, describeVoiceError, peakOf, rmsOf } from "./voiceDictation.js";

test("dictation appends to existing composer text without duplicating overlap", () => {
  assert.equal(appendDictation("Please explain", "explain recursion"), "Please explain recursion");
  assert.equal(appendDictation("My typed thought", "a spoken follow up"), "My typed thought a spoken follow up");
  assert.equal(appendDictation("  Existing text  ", " "), "  Existing text");
});

test("voice activity detector stays still through calibrated low-level noise", () => {
  const detector = createSpeechActivityDetector();
  for (let frame = 0; frame < 100; frame += 1) {
    const result = detector.update(0.004 + (frame % 3) * 0.0004, 0.25, frame * 33);
    assert.equal(result.speaking, false);
    assert.equal(result.phase, 0);
  }
});

test("voice activity detector rejects sustained low-frequency fan-like sound", () => {
  const detector = createSpeechActivityDetector();
  for (let frame = 0; frame < 14; frame += 1) detector.update(0.004, 0.02, frame * 33);
  for (let frame = 14; frame < 100; frame += 1) {
    const result = detector.update(0.075, 0.008, frame * 33);
    assert.equal(result.speaking, false);
    assert.equal(result.phase, 0);
  }
});

test("voice activity detector follows speech and smoothly settles after it", () => {
  const detector = createSpeechActivityDetector();
  for (let frame = 0; frame < 12; frame += 1) detector.update(0.004, 0.2, frame * 33);
  let activity;
  for (let frame = 12; frame < 30; frame += 1) activity = detector.update(0.09, 0.68, frame * 33);
  assert.equal(activity.speaking, true);
  assert.ok(activity.energy > 0);
  assert.ok(activity.phase > 0);
  for (let frame = 30; frame < 60; frame += 1) activity = detector.update(0.004, 0.1, frame * 33);
  assert.equal(activity.speaking, false);
  assert.ok(activity.energy < 0.01);
  const settledPhase = activity.phase;
  for (let frame = 60; frame < 90; frame += 1) activity = detector.update(0.004, 0.1, frame * 33);
  assert.equal(activity.phase, settledPhase);
});

test("raw audio RMS, peak and provider error states are classified", () => {
  assert.equal(rmsOf([3, 4]), Math.sqrt(12.5));
  assert.equal(peakOf([-0.2, 0.7, 0.3]), 0.7);
  assert.match(describeVoiceError("not-allowed"), /permission was denied/i);
  assert.match(describeVoiceError("audio-capture"), /No microphone/i);
  assert.match(describeVoiceError("network"), /network connection/i);
});
