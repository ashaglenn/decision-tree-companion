/* Pedagogy section: the feedback loop, mapped to the actual activity */
const { useState: useStateP } = React;

const LOOP_STEPS = [
  {
    n: "01",
    label: "Decision",
    title: "Student makes a choice",
    body: "Every branch is a real commitment. The student doesn't see the answer key \u2014 they pick the path that makes sense from where they're standing. Two options, one decision.",
    tone: "ink"
  },
  {
    n: "02",
    label: "Feedback",
    title: "Activity explains the answer",
    body: "Correct path: a short \u201cwhy\u201d reinforces the reasoning. Wrong path: a specific, non-punitive explanation of what makes that choice not fit \u2014 the misconception gets named, not punished.",
    tone: "rust"
  },
  {
    n: "03",
    label: "Reflection",
    title: "Follow-up question \u2014 only when wrong",
    body: "If the student picked the wrong answer, they don't just read the explanation. They answer a second reflection question that tests whether they actually understand the distinction. Getting that one right is the proof.",
    tone: "rust"
  },
  {
    n: "04",
    label: "Return",
    title: "Back to the original question",
    body: "Once the reflection is answered correctly, the student returns to the original question with new understanding and answers it correctly. The loop closes with a victory, not a defeat.",
    tone: "ink"
  },
  {
    n: "05",
    label: "Advance",
    title: "Forward to the next decision",
    body: "Only after the original question is answered correctly does the next branch open. The loop is the unit of learning, not the question. Every wrong turn becomes a learning moment; nobody leaves with a knowledge gap.",
    tone: "ink"
  }
];

function PedagogyLoop() {
  const [active, setActive] = useStateP(0);

  return (
    <div className="ped-shell">
      <div className="ped-rail">
        {LOOP_STEPS.map((s, i) => (
          <button
            key={i}
            className={`ped-rail-item ${active === i ? "is-active" : ""}`}
            onClick={() => setActive(i)}
          >
            <span className={`ped-rail-num ped-tone--${s.tone}`}>{s.n}</span>
            <span className="ped-rail-label">{s.label}</span>
            <span className="ped-rail-line" />
          </button>
        ))}
      </div>

      <div className="ped-card">
        <div className="ped-card-head">
          <span className={`ped-card-num ped-tone--${LOOP_STEPS[active].tone}`}>{LOOP_STEPS[active].n}</span>
          <span className="ped-card-label">{LOOP_STEPS[active].label}</span>
        </div>
        <h3 className="ped-card-title">{LOOP_STEPS[active].title}</h3>
        <p className="ped-card-body">{LOOP_STEPS[active].body}</p>

        <div className="ped-card-foot">
          <span className="ped-foot-kicker">Loop position</span>
          <div className="ped-dots">
            {LOOP_STEPS.map((_, i) => (
              <span key={i} className={`ped-dot ${i === active ? "is-active" : ""} ${i < active ? "is-done" : ""}`} />
            ))}
          </div>
          <button
            className="dt-pill dt-pill--solid"
            onClick={() => setActive((active + 1) % LOOP_STEPS.length)}
          >
            {(active === LOOP_STEPS.length - 1 ? "Restart the loop" : "Next step") + " \u2192"}
          </button>
        </div>
      </div>

      <aside className="ped-pull">
        <p className="ped-pull-quote">
          “Failure stops being the end of a question and becomes the beginning of one.”
        </p>
        <ul className="ped-pull-list">
          <li><span>What students build</span><strong>Problem-solving</strong></li>
          <li><span>What students practice</span><strong>Critical thinking</strong></li>
          <li><span>What students leave with</span><strong>A correct answer to every question</strong></li>
        </ul>
      </aside>
    </div>
  );
}

window.PedagogyLoop = PedagogyLoop;
