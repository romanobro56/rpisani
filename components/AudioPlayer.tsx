"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/format";
import type { MediaView } from "@/lib/queries";
import { WaveformIcon } from "./WaveformIcon";

/** A play button and a scrub bar, with the cover art (or a waveform) as a square beside them. */
export function AudioPlayer({ m }: { m: MediaView }) {
  const audio = useRef<HTMLAudioElement>(null);
  const pendingSeek = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(m.durationSec ?? 0);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const onTime = () => setTime(el.currentTime);
    const onMeta = () => {
      if (Number.isFinite(el.duration)) setDuration(el.duration);
      if (pendingSeek.current !== null) {
        el.currentTime = pendingSeek.current;
        pendingSeek.current = null;
      }
    };
    const onPlay = () => {
      setPlaying(true);
      // One thing playing at a time across the page.
      document.querySelectorAll("audio, video").forEach((other) => {
        if (other !== el) (other as HTMLMediaElement).pause();
      });
    };
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      el.currentTime = 0;
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  const seek = (value: number) => {
    const el = audio.current;
    setTime(value);
    if (!el) return;
    if (el.readyState >= 1) el.currentTime = value;
    else {
      pendingSeek.current = value;
      el.load();
    }
  };

  const progress = duration ? Math.min(100, (time / duration) * 100) : 0;

  return (
    <div className="audio">
      <div className={`audio__art${m.thumb ? "" : " audio__art--empty"}`}>
        {m.thumb ? <img src={m.thumb} alt="" loading="lazy" decoding="async" /> : <WaveformIcon className="audio__wave" />}
      </div>
      <div className="audio__main">
        {m.alt && <div className="audio__title">{m.alt}</div>}
        <div className="audio__controls">
          <button type="button" className="audio__play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            <i className={`fas ${playing ? "fa-pause" : "fa-play"}`} aria-hidden="true"></i>
          </button>
          <input
            type="range"
            className="audio__seek"
            min={0}
            max={duration || 1}
            step={0.1}
            value={time}
            onChange={(e) => seek(Number(e.target.value))}
            style={{ "--progress": `${progress}%` } as React.CSSProperties}
            aria-label={m.alt ? `Seek ${m.alt}` : "Seek"}
            aria-valuetext={`${formatDuration(time)} of ${formatDuration(duration)}`}
          />
          <span className="audio__time">
            {formatDuration(Math.floor(time))} / {formatDuration(duration)}
          </span>
        </div>
      </div>
      <audio ref={audio} src={m.src} preload="metadata" />
    </div>
  );
}
