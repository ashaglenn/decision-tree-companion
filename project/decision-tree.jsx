/* Marvel Trivia escape-room decision tree
 *
 * Structure
 *   Board (initial) -> Checkpoint 1 (3 questions) -> Board (clue 1)
 *   -> Checkpoint 2 -> Board (clue 2) -> Checkpoint 3 -> Board (clue 3)
 *   -> Final Challenge (keyboard puzzle) -> Won
 *
 * Each question has 2 choices.
 *   Correct -> show WHY, advance.
 *   Wrong   -> show WHY-WRONG, go to reflection question (2 choices).
 *     Reflection correct -> "back to original question".
 *     Reflection wrong   -> show WHY, retry reflection.
 *
 * Final challenge: pre-fills 3 clue letters (one earned per checkpoint).
 * User clicks on-screen keyboard to fill remaining letters left-to-right.
 * Wrong letter -> "incorrect" overlay with "back to the board" button.
 */

const { useState, useEffect, useRef, useMemo } = React;

// ─── Data ────────────────────────────────────────────────────────────────────

const FINAL_PROMPT = "What is Black Widow's real name?";
const FINAL_ANSWER = "NATASHA"; // 7 chars

const CHECKPOINTS = [
  {
    name: "Marvel 101",
    blurb: "Origins, identities, the basics of the canon.",
    clueLetter: "N",
    cluePosition: 0,
    clueDescription: "first letter",
    questions: [
      {
        prompt: "Who is Tony Stark's superhero alter ego?",
        correct: { label: "Iron Man", why: "Tony Stark builds the Iron Man armor himself \u2014 first in a cave from a box of scraps, then refined as Stark Industries' signature suit." },
        wrong: {
          label: "War Machine",
          why: "War Machine is the alter ego of James \u201cRhodey\u201d Rhodes \u2014 not Tony.",
          reflection: {
            prompt: "Who actually pilots the War Machine armor?",
            correct: { label: "James \u201cRhodey\u201d Rhodes", why: "Rhodey is the pilot. Tony built the suit and handed it off; the person inside the armor defines the alter ego." },
            wrong:   { label: "Tony Stark", why: "Tony designed the War Machine suit, but he doesn't wear it \u2014 he stays in his own armor. The builder and the pilot aren't always the same person." }
          }
        }
      },
      {
        prompt: "What is the source of Captain America's enhanced abilities?",
        correct: { label: "Super-Soldier Serum", why: "Dr. Erskine's serum, administered during WWII's Project Rebirth, amplifies Steve Rogers' existing qualities \u2014 a deliberate, supervised transformation." },
        wrong: {
          label: "Gamma radiation",
          why: "Gamma radiation is a different Avenger's origin. Steve Rogers' transformation is biochemical, controlled, and intentional.",
          reflection: {
            prompt: "Whose powers come from gamma radiation exposure?",
            correct: { label: "Bruce Banner (Hulk)", why: "Banner was caught in a gamma bomb experiment gone wrong \u2014 the opposite of Cap's controlled procedure." },
            wrong:   { label: "Steve Rogers", why: "Rogers received Erskine's super-soldier serum in a planned procedure. Gamma radiation isn't part of his story \u2014 that's Banner." }
          }
        }
      },
      {
        prompt: "What is the name of Wakanda's signature metal?",
        correct: { label: "Vibranium", why: "Vibranium is the meteoric metal that absorbs kinetic energy \u2014 the foundation of Wakanda's economy, Cap's shield, and the Black Panther suit." },
        wrong: {
          label: "Adamantium",
          why: "Adamantium is a Marvel metal, but it belongs to a different storyline \u2014 the X-Men. It isn't mined in Wakanda.",
          reflection: {
            prompt: "Which character is adamantium most associated with?",
            correct: { label: "Wolverine", why: "Adamantium is bonded to Wolverine's skeleton and claws \u2014 the Weapon X experiment." },
            wrong:   { label: "Black Panther", why: "Black Panther's suit is woven from vibranium. Both metals are nearly indestructible but they live in different corners of Marvel canon." }
          }
        }
      }
    ]
  },
  {
    name: "The Infinity Saga",
    blurb: "Stones, snaps, and the cosmic ladder.",
    clueLetter: "T",
    cluePosition: 2,
    clueDescription: "third letter",
    questions: [
      {
        prompt: "Which Infinity Stone controls time?",
        correct: { label: "The Time Stone (green)", why: "Set in the Eye of Agamotto, the Time Stone lets Doctor Strange rewind, accelerate, and loop time \u2014 the basis of the Dormammu bargain." },
        wrong: {
          label: "The Space Stone (blue)",
          why: "The Space Stone bends distance, not duration. It's hidden inside the Tesseract.",
          reflection: {
            prompt: "What does the Space Stone actually do?",
            correct: { label: "Opens portals across distance", why: "The Space Stone lets the user move instantly between two points \u2014 think Loki's portals over New York." },
            wrong:   { label: "Rewinds or accelerates time", why: "That's the Time Stone. Physics bundles space-time together, but Marvel splits them into two distinct powers." }
          }
        }
      },
      {
        prompt: "Who snaps away half of all life with the Infinity Gauntlet?",
        correct: { label: "Thanos", why: "At the end of Infinity War, Thanos collects all six stones and executes the snap \u2014 the climactic act of the saga." },
        wrong: {
          label: "Hela",
          why: "Hela is a major villain, but she belongs to Thor: Ragnarok and never wields the Infinity Gauntlet.",
          reflection: {
            prompt: "What is Hela the goddess of?",
            correct: { label: "Death", why: "Hela is Asgard's firstborn and goddess of death \u2014 her power is over endings, not over cosmic balance." },
            wrong:   { label: "The universe at large", why: "Hela is bound to Asgard and Odin's bloodline. Thanos is the cosmic threat; Hela is a planetary one." }
          }
        }
      },
      {
        prompt: "Who sacrifices themselves with the final snap to defeat Thanos?",
        correct: { label: "Tony Stark / Iron Man", why: "Tony seizes the stones from Thanos and snaps with the words \u201cI am Iron Man\u201d \u2014 a fatal act that closes his arc." },
        wrong: {
          label: "Captain America",
          why: "Cap survives Endgame and lives out a long life. He doesn't make the sacrificial snap.",
          reflection: {
            prompt: "How does Captain America's story actually end in Endgame?",
            correct: { label: "He returns the stones and lives out a full life", why: "Steve goes back in time to return each stone, then chooses to stay and live out his life with Peggy Carter." },
            wrong:   { label: "He dies destroying the gauntlet", why: "That's a fan theory, not what happens. Cap's ending is quiet and chosen \u2014 not sacrificial." }
          }
        }
      }
    ]
  },
  {
    name: "Heroes, Gear & Hideouts",
    blurb: "The objects and places that anchor the universe.",
    clueLetter: "H",
    cluePosition: 5,
    clueDescription: "second-to-last letter",
    questions: [
      {
        prompt: "What is the name of Thor's original hammer?",
        correct: { label: "Mjolnir", why: "Mjolnir is the Asgardian hammer forged in the heart of a dying star \u2014 only the worthy can lift it." },
        wrong: {
          label: "Stormbreaker",
          why: "Stormbreaker is a Marvel weapon, but it's not Thor's original. Mjolnir came first.",
          reflection: {
            prompt: "When does Thor start using Stormbreaker?",
            correct: { label: "After Mjolnir is destroyed by Hela", why: "Hela shatters Mjolnir in Ragnarok. Thor forges Stormbreaker on Nidavellir in Infinity War as a replacement." },
            wrong:   { label: "From the very beginning, in Thor (2011)", why: "Thor wields Mjolnir for most of his arc. Stormbreaker only enters the story after Mjolnir is gone." }
          }
        }
      },
      {
        prompt: "Who is the (self-appointed) leader of the Guardians of the Galaxy?",
        correct: { label: "Star-Lord (Peter Quill)", why: "Peter Quill names himself Star-Lord and assumes command of the Guardians \u2014 a leadership the rest of the team only partially endorses." },
        wrong: {
          label: "Rocket",
          why: "Rocket is a core Guardian and often the operational brain of the group, but Quill is the named leader.",
          reflection: {
            prompt: "What kind of character is Rocket?",
            correct: { label: "A genetically modified raccoon", why: "Rocket is a small mammal engineered into a sentient, cybernetically enhanced fighter \u2014 not the team's nominal leader." },
            wrong:   { label: "An exiled prince of Xandar", why: "Rocket has no royal lineage. His backstory is one of experimentation, not aristocracy." }
          }
        }
      },
      {
        prompt: "What's the name of Doctor Strange's home base in New York?",
        correct: { label: "Sanctum Sanctorum", why: "The Sanctum Sanctorum at 177A Bleecker Street is one of three sanctums that protect Earth from mystical threats." },
        wrong: {
          label: "Avengers Tower",
          why: "Avengers Tower is a different building, owned by someone else entirely.",
          reflection: {
            prompt: "Who owns Avengers Tower?",
            correct: { label: "Tony Stark", why: "Avengers Tower is Stark Tower rebranded \u2014 it belongs to Tony, not to Strange." },
            wrong:   { label: "Doctor Strange", why: "Strange has the Sanctum, not the Tower. Different building, different magic system, different owner." }
          }
        }
      }
    ]
  }
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildPrefilled(cluesEarned) {
  const out = {};
  cluesEarned.forEach((cpIdx) => {
    const cp = CHECKPOINTS[cpIdx];
    out[cp.cluePosition] = cp.clueLetter;
  });
  return out;
}

function nextEmptyIndex(answer, filled) {
  for (let i = 0; i < answer.length; i++) {
    if (answer[i] === " ") continue;
    if (!filled[i]) return i;
  }
  return -1; // all filled
}

// ─── Shared bits ─────────────────────────────────────────────────────────────

function Choice({ label, kind = "idle", onClick, marker }) {
  return (
    <button className={`dt-choice dt-choice--${kind}`} onClick={onClick} disabled={kind !== "idle"}>
      <span className="dt-choice-marker" aria-hidden="true">{marker || ""}</span>
      <span className="dt-choice-label">{label}</span>
    </button>
  );
}

function ChoicePair({ choices, locked, pickedKey, onPick }) {
  return (
    <div className="dt-choices">
      {choices.map((c) => {
        let kind = "idle";
        let marker = "";
        if (locked) {
          if (c.key === pickedKey) {
            kind = c.correct ? "picked-correct" : "picked-wrong";
            marker = c.correct ? "\u2713" : "\u2715";
          } else if (c.correct) {
            kind = "reveal-correct"; marker = "\u2713";
          } else {
            kind = "dimmed";
          }
        }
        return <Choice key={c.key} label={c.label} kind={kind} marker={marker} onClick={() => onPick(c)} />;
      })}
    </div>
  );
}

function FeedbackBlock({ tone, label, body, children }) {
  return (
    <div className={`dt-feedback dt-feedback--${tone}`}>
      <div className="dt-feedback-head">
        <span className="dt-feedback-tag">{label}</span>
        <span className="dt-feedback-rule" />
      </div>
      <p className="dt-feedback-why">
        <span className="dt-feedback-label">Why</span>
        {body}
      </p>
      <div className="dt-feedback-foot">{children}</div>
    </div>
  );
}

// ─── Question runner ─────────────────────────────────────────────────────────

function QuestionRunner({ cpIdx, qIdx, qNumber, qTotal, onQuestionComplete, onBackToBoard }) {
  const q = CHECKPOINTS[cpIdx].questions[qIdx];
  // phase: ask | ans-correct | ans-wrong | reflect | ref-correct | ref-wrong
  const [phase, setPhase] = useState("ask");
  const [pickedKey, setPickedKey] = useState(null);

  // stable random ordering per question render
  const orderRef = useRef(null);
  if (!orderRef.current) {
    orderRef.current = {
      main: Math.random() > 0.5 ? ["correct", "wrong"] : ["wrong", "correct"],
      refl: Math.random() > 0.5 ? ["correct", "wrong"] : ["wrong", "correct"]
    };
  }
  const order = orderRef.current;

  const mainChoices = order.main.map((k) => ({ key: k, label: q[k].label, correct: k === "correct" }));
  const refChoices = order.refl.map((k) => ({
    key: k,
    label: q.wrong.reflection[k].label,
    correct: k === "correct"
  }));

  const showingReflection = phase === "reflect" || phase === "ref-correct" || phase === "ref-wrong";

  return (
    <>
      <div className="dt-shell-head">
        <span className="dt-chip dt-chip--cp">Checkpoint {cpIdx + 1}</span>
        <span className="dt-context">
          Question {qNumber} of {qTotal}{showingReflection ? " \u00b7 Reflection" : ""}
        </span>
        <button className="dt-back-board" onClick={onBackToBoard} title="Return to the checkpoint board">
          <span aria-hidden="true">{"\u2190"}</span> Back to board
        </button>
      </div>

      {!showingReflection && (
        <>
          <div className="dt-question">
            <span className="dt-eyebrow">Question</span>
            <h3>{q.prompt}</h3>
          </div>
          <ChoicePair
            choices={mainChoices}
            locked={phase !== "ask"}
            pickedKey={pickedKey}
            onPick={(c) => { setPickedKey(c.key); setPhase(c.correct ? "ans-correct" : "ans-wrong"); }}
          />
          {phase === "ans-correct" && (
            <FeedbackBlock tone="correct" label="Correct" body={q.correct.why}>
              <button className="dt-pill dt-pill--solid" onClick={onQuestionComplete}>
                {qNumber === qTotal ? "Complete checkpoint \u2192" : "Next question \u2192"}
              </button>
            </FeedbackBlock>
          )}
          {phase === "ans-wrong" && (
            <FeedbackBlock tone="wrong" label="Not quite" body={q.wrong.why}>
              <button className="dt-pill dt-pill--solid" onClick={() => { setPickedKey(null); setPhase("reflect"); }}>
                Continue to a reflection question →
              </button>
            </FeedbackBlock>
          )}
        </>
      )}

      {showingReflection && (
        <>
          <div className="dt-question dt-question--reflection">
            <span className="dt-eyebrow">Reflection question</span>
            <h3>{q.wrong.reflection.prompt}</h3>
            <p className="dt-reflection-hint">
              Answer this to make sure you understand the distinction — then we'll return to the original question.
            </p>
          </div>
          <ChoicePair
            choices={refChoices}
            locked={phase !== "reflect"}
            pickedKey={pickedKey}
            onPick={(c) => { setPickedKey(c.key); setPhase(c.correct ? "ref-correct" : "ref-wrong"); }}
          />
          {phase === "ref-correct" && (
            <FeedbackBlock tone="correct" label="Got it" body={q.wrong.reflection.correct.why}>
              <button className="dt-pill dt-pill--solid" onClick={() => { setPickedKey(null); setPhase("ask"); }}>
                Great — back to the original question →
              </button>
            </FeedbackBlock>
          )}
          {phase === "ref-wrong" && (
            <FeedbackBlock tone="wrong" label="Not quite" body={q.wrong.reflection.wrong.why}>
              <button className="dt-pill dt-pill--solid" onClick={() => { setPickedKey(null); setPhase("reflect"); }}>
                Try the reflection again →
              </button>
            </FeedbackBlock>
          )}
        </>
      )}
    </>
  );
}

// ─── Checkpoint Board ────────────────────────────────────────────────────────

function CheckpointBoard({ cpIdx, cluesEarned, onEnter }) {
  // cpIdx is the *next* checkpoint to enter (0..3). 3 = final challenge.
  const isFinal = cpIdx === 3;

  return (
    <div className="dt-board">
      <header className="dt-board-head">
        <span className="dt-eyebrow">Escape room board</span>
        <h3>
          {isFinal
            ? "All three clues collected. The final challenge awaits."
            : cpIdx === 0
              ? "Three checkpoints. Three clues. One final challenge."
              : `Checkpoint ${cpIdx} cleared. Clue earned.`}
        </h3>
        <p className="dt-board-lede">
          {isFinal
            ? "Use the three letters you've collected to crack the final answer on the keyboard."
            : "Each checkpoint is three quick questions. Wrong answers route you through a reflection \u2014 you can't lose, only learn. Complete a checkpoint to earn a letter clue."}
        </p>
      </header>

      <div className="dt-board-grid">
        {CHECKPOINTS.map((cp, i) => {
          const status = i < cpIdx ? "done" : i === cpIdx ? "current" : "locked";
          return (
            <article key={i} className={`dt-cp dt-cp--${status}`}>
              <div className="dt-cp-top">
                <span className="dt-cp-num">0{i + 1}</span>
                <span className="dt-cp-status">
                  {status === "done" && "Complete"}
                  {status === "current" && "Up next"}
                  {status === "locked" && "Locked"}
                </span>
              </div>
              <h4 className="dt-cp-name">{cp.name}</h4>
              <p className="dt-cp-blurb">{cp.blurb}</p>
              <div className="dt-cp-clue">
                <span className="dt-cp-clue-label">Clue</span>
                <span className={`dt-cp-clue-letter ${status === "done" ? "is-earned" : ""}`}>
                  {status === "done" ? cp.clueLetter : "?"}
                </span>
              </div>
            </article>
          );
        })}

        {/* Final challenge tile */}
        <article className={`dt-cp dt-cp--final dt-cp--${isFinal ? "current" : "locked"}`}>
          <div className="dt-cp-top">
            <span className="dt-cp-num">04</span>
            <span className="dt-cp-status">{isFinal ? "Up next" : "Locked"}</span>
          </div>
          <h4 className="dt-cp-name">Final Challenge</h4>
          <p className="dt-cp-blurb">Use your three clue letters to crack the secret identity on the keyboard.</p>
          <div className="dt-cp-clue">
            <span className="dt-cp-clue-label">Clues collected</span>
            <span className="dt-cp-clue-counter">{cluesEarned.length} / 3</span>
          </div>
        </article>
      </div>

      <div className="dt-board-foot">
        <button className="dt-pill dt-pill--solid dt-pill--lg" onClick={onEnter}>
          {cpIdx === 0 && "Begin Checkpoint 1 \u2192"}
          {cpIdx === 1 && "Enter Checkpoint 2 \u2192"}
          {cpIdx === 2 && "Enter Checkpoint 3 \u2192"}
          {isFinal   && "Enter the Final Challenge \u2192"}
        </button>
      </div>
    </div>
  );
}

// ─── Final Challenge ─────────────────────────────────────────────────────────

const KEYBOARD_ROWS = [
  "QWERTYUIOP".split(""),
  "ASDFGHJKL".split(""),
  "ZXCVBNM".split("")
];

function FinalChallenge({ prefilled, onWin }) {
  const [userFilled, setUserFilled] = useState({}); // {idx: letter}
  const [wrongAttempt, setWrongAttempt] = useState(null); // {letter, idx}
  const [justFilled, setJustFilled] = useState(null); // for flash animation

  const combined = { ...prefilled, ...userFilled };
  const nextIdx = nextEmptyIndex(FINAL_ANSWER, combined);

  useEffect(() => {
    if (nextIdx === -1) {
      // small delay so the final letter visibly drops in before win screen
      const t = setTimeout(onWin, 650);
      return () => clearTimeout(t);
    }
  }, [nextIdx, onWin]);

  const onKey = (letter) => {
    if (wrongAttempt) return; // overlay open
    if (nextIdx === -1) return;
    const target = FINAL_ANSWER[nextIdx];
    if (letter === target) {
      setUserFilled((prev) => ({ ...prev, [nextIdx]: letter }));
      setJustFilled(nextIdx);
      setTimeout(() => setJustFilled(null), 400);
    } else {
      setWrongAttempt({ letter, idx: nextIdx });
    }
  };

  // physical keyboard support
  useEffect(() => {
    const onKeyDown = (e) => {
      if (wrongAttempt) return;
      const k = e.key.toUpperCase();
      if (/^[A-Z]$/.test(k)) onKey(k);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [wrongAttempt, nextIdx]);

  // build the slot rows (split by space into words so we get a gap)
  const words = FINAL_ANSWER.split(" ");
  let runningIdx = 0;
  const wordSlots = words.map((word) => {
    const slots = word.split("").map((ch) => {
      const i = runningIdx++;
      const letter = combined[i];
      const isPrefilled = prefilled[i] !== undefined;
      const isCurrent = i === nextIdx;
      const isJust = justFilled === i;
      return { i, letter, isPrefilled, isCurrent, isJust };
    });
    runningIdx++; // account for the space
    return slots;
  });

  return (
    <div className="dt-final">
      <header className="dt-final-head">
        <span className="dt-eyebrow">Final Challenge</span>
        <h3>{FINAL_PROMPT}</h3>
        <p className="dt-final-hint">
          Three letters are filled in from your collected clues. Click the keyboard to fill the rest, left to right.
        </p>
      </header>

      <div className="dt-slots">
        {wordSlots.map((slots, w) => (
          <div key={w} className="dt-slot-word">
            {slots.map((s) => (
              <div
                key={s.i}
                className={`dt-slot ${s.letter ? "is-filled" : ""} ${s.isPrefilled ? "is-prefilled" : ""} ${s.isCurrent ? "is-current" : ""} ${s.isJust ? "just-filled" : ""}`}
              >
                <span className="dt-slot-letter">{s.letter || ""}</span>
                {s.isPrefilled && <span className="dt-slot-tag">clue</span>}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="dt-keyboard">
        {KEYBOARD_ROWS.map((row, r) => (
          <div key={r} className="dt-keyrow">
            {row.map((letter) => (
              <button
                key={letter}
                className="dt-key"
                onClick={() => onKey(letter)}
                disabled={!!wrongAttempt || nextIdx === -1}
              >
                {letter}
              </button>
            ))}
          </div>
        ))}
      </div>

      {wrongAttempt && (
        <div className="dt-overlay">
          <div className="dt-overlay-card">
            <span className="dt-eyebrow" style={{ color: "var(--rust)" }}>Incorrect</span>
            <h4>That letter doesn't fit here.</h4>
            <p>
              You picked <strong className="dt-overlay-letter">{wrongAttempt.letter}</strong> for the next blank
              — but the right letter is hiding somewhere else on the keyboard. Head back to the board and try again.
            </p>
            <button className="dt-pill dt-pill--solid" onClick={() => setWrongAttempt(null)}>
              Back to the board →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Won screen ──────────────────────────────────────────────────────────────

function WonScreen({ onRestart }) {
  return (
    <div className="dt-won">
      <span className="dt-eyebrow">You escaped</span>
      <h3>Congratulations — you've completed the task.</h3>
      <p className="dt-won-answer">
        <span>The answer was</span>
        <strong>{FINAL_ANSWER}</strong>
      </p>
      <p className="dt-won-body">
        Three checkpoints, three clue letters, one final word. Every wrong turn along the way was a chance to reflect and correct — the activity loops you forward, never out.
      </p>
      <button className="dt-pill dt-pill--solid dt-pill--lg" onClick={onRestart}>
        Try the entire activity again →
      </button>
    </div>
  );
}

// ─── Top-level state machine ────────────────────────────────────────────────

function DecisionTree() {
  // mode: "board" | "checkpoint" | "final" | "won"
  const [mode, setMode] = useState("board");
  const [cpIdx, setCpIdx] = useState(0);       // current/next checkpoint index
  const [qIdx, setQIdx] = useState(0);          // question index within checkpoint
  const [cluesEarned, setCluesEarned] = useState([]); // array of cp indices completed

  const prefilled = useMemo(() => buildPrefilled(cluesEarned), [cluesEarned]);

  const enterFromBoard = () => {
    if (cpIdx < 3) {
      setMode("checkpoint");
      setQIdx(0);
    } else {
      setMode("final");
    }
  };

  const onQuestionComplete = () => {
    const total = CHECKPOINTS[cpIdx].questions.length;
    if (qIdx + 1 < total) {
      setQIdx(qIdx + 1);
    } else {
      // checkpoint done — earn clue, return to board
      setCluesEarned((prev) => [...prev, cpIdx]);
      setCpIdx(cpIdx + 1);
      setMode("board");
    }
  };

  const restart = () => {
    setMode("board");
    setCpIdx(0);
    setQIdx(0);
    setCluesEarned([]);
  };

  return (
    <div className="dt-shell">
      {mode === "board" && (
        <CheckpointBoard cpIdx={cpIdx} cluesEarned={cluesEarned} onEnter={enterFromBoard} />
      )}
      {mode === "checkpoint" && (
        <QuestionRunner
          key={`${cpIdx}-${qIdx}`} // remount to reset internal state per question
          cpIdx={cpIdx}
          qIdx={qIdx}
          qNumber={qIdx + 1}
          qTotal={CHECKPOINTS[cpIdx].questions.length}
          onQuestionComplete={onQuestionComplete}
          onBackToBoard={() => setMode("board")}
        />
      )}
      {mode === "final" && (
        <FinalChallenge prefilled={prefilled} onWin={() => setMode("won")} />
      )}
      {mode === "won" && (
        <WonScreen onRestart={restart} />
      )}
    </div>
  );
}

window.DecisionTree = DecisionTree;
