/* Three template upload boxes \u2014 each links to a starter template */

const TEMPLATES = [
  { id: "tpl1", name: "Template 1", link: "#" },
  { id: "tpl2", name: "Template 2", link: "#" },
  { id: "tpl3", name: "Template 3", link: "#" }
];

function Templates() {
  return (
    <div className="tpl-grid">
      {TEMPLATES.map((t, i) => (
        <article key={t.id} className="tpl-card">
          <div className="tpl-image">
            <image-slot
              id={t.id}
              placeholder="Drop a thumbnail"
              shape="rect"
            ></image-slot>
            <span className="tpl-image-num">{String(i + 1).padStart(2, "0")}</span>
          </div>
          <div className="tpl-meta">
            <span className="tpl-num">Template</span>
            <h3>{t.name}</h3>
            <a className="tpl-cta" href={t.link}>
              Open template <span aria-hidden="true">{"\u2192"}</span>
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}

window.Templates = Templates;
