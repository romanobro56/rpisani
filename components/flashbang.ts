// Client half of the joke in lib/prank.ts: one white flash and a bang with a fading ring.
// Deliberately tame: a single flash (never a strobe), skipped for reduced-motion users, and capped volume.

const DONE_KEY = "flashbanged";

/** An AudioContext has to be created during a click or submit, or browsers keep it silent. */
export function unlockAudio(): AudioContext | null {
  try {
    const ctx = new AudioContext();
    void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Plays once per browser. Returns whether it ran. */
export function flashbang(ctx: AudioContext | null): boolean {
  try {
    if (localStorage.getItem(DONE_KEY)) return false;
    localStorage.setItem(DONE_KEY, "1");
  } catch {}

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const flash = document.createElement("div");
    flash.setAttribute("aria-hidden", "true");
    flash.style.cssText = "position:fixed;inset:0;background:#fff;z-index:2147483647;pointer-events:none";
    document.body.append(flash);
    flash
      .animate([{ opacity: 1 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }], { duration: 3000, easing: "ease-out" })
      .finished.finally(() => flash.remove());
  }

  if (ctx) {
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);

    // The bang: a short burst of noise.
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const bang = ctx.createGain();
    bang.gain.setValueAtTime(0.9, now);
    bang.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    noise.connect(bang).connect(master);
    noise.start(now);

    // The ring: a quiet high tone that fades out.
    const ring = ctx.createOscillator();
    ring.frequency.value = 3200;
    const ringGain = ctx.createGain();
    ringGain.gain.setValueAtTime(0.0001, now);
    ringGain.gain.exponentialRampToValueAtTime(0.12, now + 0.15);
    ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
    ring.connect(ringGain).connect(master);
    ring.start(now);
    ring.stop(now + 3.6);
    ring.onended = () => void ctx.close();
  }
  return true;
}
