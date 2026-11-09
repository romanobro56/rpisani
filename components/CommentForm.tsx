"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addComment, type CommentFormState } from "@/app/actions/comments";
import { flashbang, unlockAudio } from "./flashbang";

const NAME_KEY = "comment-name";

export function CommentForm({ type, id }: { type: "feed" | "blog"; id: string }) {
  const [state, action, pending] = useActionState<CommentFormState, FormData>(addComment, { ok: false });
  const [renderedAt] = useState(() => Date.now());
  const [name, setName] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const [pranked, setPranked] = useState(false);

  useEffect(() => {
    try {
      setName(localStorage.getItem(NAME_KEY) ?? "");
    } catch {}
  }, []);

  useEffect(() => {
    if (state.ok && bodyRef.current) bodyRef.current.value = "";
    const audio = audioRef.current;
    audioRef.current = null;
    if (state.prank && flashbang(audio)) setPranked(true);
    else void audio?.close();
  }, [state]);

  return (
    <form
      className="comment-form"
      onSubmit={() => {
        audioRef.current = unlockAudio();
      }}
      action={(fd) => {
        try {
          localStorage.setItem(NAME_KEY, String(fd.get("name") ?? ""));
        } catch {}
        return action(fd);
      }}
    >
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="renderedAt" value={renderedAt} />
      <div className="comment-form__trap" aria-hidden="true">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="comment-form__label" htmlFor={`comment-name-${id}`}>
        Name
      </label>
      <input
        id={`comment-name-${id}`}
        name="name"
        required
        maxLength={60}
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
      />
      <label className="comment-form__label" htmlFor={`comment-body-${id}`}>
        Comment
      </label>
      <textarea id={`comment-body-${id}`} name="body" required maxLength={2000} rows={4} ref={bodyRef} />
      <div className="comment-form__actions">
        <button type="submit" className="comment-form__submit" disabled={pending}>
          {pending ? "Posting…" : "Post comment"}
        </button>
        <span className="comment-form__status" role="status">
          {state.error ? <span className="comment-form__error">{state.error}</span> : state.ok ? (pranked ? "Flashbang out. Your comment is up." : "Thanks, your comment is up.") : ""}
        </span>
      </div>
    </form>
  );
}
