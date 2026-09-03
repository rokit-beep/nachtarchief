import { useEffect, useRef, useState, type FormEvent } from "react";
import { BookOpen, Clock3, RotateCcw } from "lucide-react";
import { clockLabel, ROOMS } from "@/game/world";
import { ITEMS } from "@/game/world";
import { useGame } from "@/game/store";
import type { Line } from "@/game/types";

export function GameShell() {
  const screen = useGame((s) => s.screen);
  const boot = useGame((s) => s.boot);
  useEffect(() => {
    boot();
  }, [boot]);
  if (screen === "title") return <TitleScreen />;
  return <PlayScreen />;
}

function TitleScreen() {
  const has = useGame((s) => s.hasSave);
  const newGame = useGame((s) => s.newGame);
  const cont = useGame((s) => s.continueGame);
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-3xl flex-col justify-end px-5 pb-10 pt-16 sm:justify-center sm:pb-16">
      <p className="font-mono text-xs tracking-[0.28em] text-taupe uppercase">Stadsarchief · nachtdienst</p>
      <h1 className="mt-4 font-display text-5xl leading-[0.95] tracking-[-0.03em] text-ink text-balance sm:text-7xl">
        Nachtarchief
      </h1>
      <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-ink-soft/80">
        Een tekstavontuur. Typ wat je doet. Het huis luistert. Het boek ook.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={newGame}
          className="h-12 rounded-lg bg-ink px-6 text-sm font-medium tracking-wide text-paper transition-transform duration-150 ease-out hover:bg-ink-soft active:scale-[0.98]"
        >
          Nieuwe dienst
        </button>
        {has ? (
          <button
            type="button"
            onClick={cont}
            className="h-12 rounded-lg border border-rule bg-paper-2 px-6 text-sm font-medium text-ink transition-transform duration-150 ease-out hover:border-taupe active:scale-[0.98]"
          >
            Verder spelen
          </button>
        ) : null}
      </div>
      <p className="mt-8 font-mono text-xs text-taupe">Nederlands of Engels · autosave</p>
    </main>
  );
}

function PlayScreen() {
  const state = useGame((s) => s.state);
  const lines = useGame((s) => s.lines);
  const suggestions = useGame((s) => s.suggestions);
  const submit = useGame((s) => s.submit);
  const skipTyping = useGame((s) => s.skipTyping);
  const newGame = useGame((s) => s.newGame);
  const [value, setValue] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const room = ROOMS[state.room];
  const inv = state.inventory.filter((id) => state.itemLoc[id] === "inv");

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit(value);
    setValue("");
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-0">
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-rule bg-paper/90 px-4 py-3 backdrop-blur-sm">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-taupe">Nachtarchief</p>
            <h2 className="truncate font-display text-lg text-ink">{room.name}</h2>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-taupe tabular-nums">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3.5" strokeWidth={1.75} />
              {clockLabel(state.moves)}
            </span>
            <span>{state.moves} zetten</span>
            <button
              type="button"
              onClick={newGame}
              className="inline-flex size-11 items-center justify-center rounded-md border border-rule text-ink hover:bg-paper-2"
              aria-label="Opnieuw"
            >
              <RotateCcw className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        </header>

        <div
          ref={scroller}
          className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-8"
          onClick={() => {
            skipTyping();
            inputRef.current?.focus();
          }}
        >
          {lines.map((ln, i) => (
            <LogLine key={ln.id} line={ln} last={i === lines.length - 1} />
          ))}
        </div>

        <div className="border-t border-rule bg-paper px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => submit(s)}
                className="h-10 shrink-0 rounded-md border border-rule bg-paper-2 px-3 font-mono text-xs text-ink-soft hover:border-taupe hover:text-ink"
              >
                {s}
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit} className="flex items-center gap-2">
            <span className="font-mono text-sm text-seal" aria-hidden>
              ›
            </span>
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="wat doe je?"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="h-12 min-w-0 flex-1 rounded-lg border border-rule bg-paper-2 px-3 font-mono text-sm text-ink outline-none placeholder:text-taupe focus:border-taupe"
              aria-label="Commando"
            />
            <button
              type="submit"
              className="h-12 rounded-lg bg-ink px-4 font-mono text-xs tracking-wide text-paper active:scale-[0.98]"
            >
              Enter
            </button>
          </form>
        </div>
      </div>

      <aside className="hidden border-l border-rule bg-paper-2/50 p-5 lg:block">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-taupe">
          <BookOpen className="size-3.5" strokeWidth={1.75} />
          Bij je
        </p>
        <ul className="mt-4 space-y-2 text-sm leading-snug text-ink-soft">
          {inv.length === 0 ? (
            <li className="text-taupe">Niets.</li>
          ) : (
            inv.map((id) => (
              <li key={id} className="border-b border-rule/80 pb-2">
                {ITEMS[id].name}
              </li>
            ))
          )}
        </ul>
        {state.ended ? (
          <p className="mt-8 font-display text-sm italic text-seal">Gesloten.</p>
        ) : (
          <p className="mt-8 font-mono text-[10px] leading-relaxed text-taupe">
            Dageraad om 06:00. Het huis is niet oneindig geduldig.
          </p>
        )}
      </aside>
    </div>
  );
}

function LogLine({ line, last }: { line: Line; last: boolean }) {
  if (line.kind === "command") {
    return (
      <p className="font-mono text-sm text-taupe">
        <span className="text-seal">›</span> {line.text}
      </p>
    );
  }
  if (line.kind === "fail") {
    return <TypedText text={line.text} last={last} className="text-sm leading-relaxed text-seal" />;
  }
  if (line.kind === "system") {
    return (
      <TypedText
        text={line.text}
        last={last}
        className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-taupe"
      />
    );
  }
  if (line.kind === "end") {
    return (
      <TypedText
        text={line.text}
        last={last}
        className="whitespace-pre-wrap font-display text-base leading-relaxed text-ink italic"
      />
    );
  }
  return (
    <TypedText
      text={line.text}
      last={last}
      className="whitespace-pre-wrap font-display text-[1.05rem] leading-[1.65] text-ink-soft"
    />
  );
}

function TypedText({
  text,
  className,
  last,
}: {
  text: string;
  className: string;
  last: boolean;
}) {
  const skip = useGame((s) => s.skipType);
  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [n, setN] = useState(() => (last && !reduced ? 0 : text.length));

  useEffect(() => {
    if (!last || reduced) {
      setN(text.length);
      return;
    }
    setN(0);
    let i = 0;
    let raf = 0;
    let lastTs = 0;
    const step = (ts: number) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      i += dt * 86;
      setN(Math.min(text.length, Math.floor(i)));
      if (i < text.length) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, last, reduced, skip]);

  useEffect(() => {
    if (skip > 0) setN(text.length);
  }, [skip, text.length]);

  const done = n >= text.length;
  return (
    <p className={className}>
      {text.slice(0, n)}
      {last && !done ? <span className="type-caret" /> : null}
    </p>
  );
}
