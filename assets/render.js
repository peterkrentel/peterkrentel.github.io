/* Fetches this page's source markdown from ../content/<doc>.md, renders it
   with marked, and turns ```mermaid fences into live Mermaid diagrams.
   The markdown file is the single source of truth — nothing here duplicates
   its content, only how it's displayed. */

(async function () {
  const doc = document.body.dataset.doc;
  const target = document.getElementById("content");
  if (!doc || !target) return;

  try {
    const res = await fetch(`../content/${doc}.md`);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const md = await res.text();

    const renderer = new marked.Renderer();
    renderer.code = (code, lang) => {
      if (lang === "mermaid") return `<div class="mermaid">${code}</div>`;
      return `<pre><code>${escapeHtml(code)}</code></pre>`;
    };

    target.innerHTML = marked.parse(md, { renderer });

    // strip the H1 — the page's own titleblock already shows the project name
    const firstH1 = target.querySelector("h1");
    if (firstH1) firstH1.remove();

    if (window.mermaid) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          background: "transparent",
          primaryColor: "transparent",
          primaryBorderColor: getVar("--rule"),
          primaryTextColor: getVar("--ink"),
          lineColor: getVar("--muted"),
          fontFamily: getVar("--font-mono"),
        },
      });
      await mermaid.run({ querySelector: ".mermaid" });
    }
  } catch (err) {
    target.innerHTML = `<p style="color:var(--muted)">Couldn't load this project's content (${escapeHtml(String(err.message || err))}).</p>`;
  }
})();

function getVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
