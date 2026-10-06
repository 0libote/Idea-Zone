(() => {
  const root = document.documentElement,
    pages = [
      ...document.querySelectorAll("article > section.document-section"),
    ],
    links = [...document.querySelectorAll("nav a")],
    appearance = document.querySelector("#appearance");
  const palettes = ["neutral", "warm", "sage", "midnight"],
    fonts = ["default", "sans", "serif", "mono"];
  const key = "idea-zone:" + document.title + ":" + root.dataset.style;
  const embedded = location.href.startsWith("about:srcdoc");
  function setChoice(kind, value) {
    if (!(kind === "palette" ? palettes : fonts).includes(value)) return;
    root.dataset[kind] = value;
    document
      .querySelectorAll("[data-" + kind + "-choice]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(b.dataset[kind + "Choice"] === value),
        ),
      );
    if (kind === "palette") {
      document.querySelector('meta[name="color-scheme"]').content =
        value === "midnight" ? "dark" : "light";
      document.querySelector("#view-colour").textContent = {
        neutral: "Light",
        warm: "Paper",
        sage: "Sage",
        midnight: "Dark",
      }[value];
    }
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          palette: root.dataset.palette,
          font: root.dataset.font,
        }),
      );
    } catch {}
  }
  const initial = { palette: root.dataset.palette, font: root.dataset.font };
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && !embedded) {
      initial.palette = saved.palette;
      initial.font = saved.font;
    }
  } catch {}
  setChoice("palette", initial.palette);
  setChoice("font", initial.font);
  document
    .querySelectorAll("[data-palette-choice]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        setChoice("palette", b.dataset.paletteChoice),
      ),
    );
  document
    .querySelectorAll("[data-font-choice]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        setChoice("font", b.dataset.fontChoice),
      ),
    );
  document.addEventListener("click", (e) => {
    if (appearance && !appearance.contains(e.target)) appearance.open = false;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && appearance.open) {
      appearance.open = false;
      appearance.querySelector("summary").focus();
    }
  });
  function show(hash = location.hash) {
    const target = document.getElementById(hash.slice(1));
    const found =
      pages.find((p) => "#" + p.id === hash) ||
      (target && pages.find((p) => p.contains(target)));
    pages.forEach((p) => (p.hidden = !!found && p !== found));
    links.forEach((a) => {
      if (found && a.getAttribute("href") === "#" + found.id)
        a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }
  addEventListener("hashchange", () => show());
  links.forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const hash = a.getAttribute("href");
      show(hash);
      if (!embedded) location.hash = hash;
    }),
  );
  document.querySelectorAll('article a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const hash = a.getAttribute("href"),
        target = document.getElementById(hash.slice(1));
      if (target) {
        e.preventDefault();
        show(hash);
        target.scrollIntoView({ block: "center" });
        if (!embedded) history.pushState(null, "", hash);
      }
    }),
  );
  document.querySelector("#all").addEventListener("click", (e) => {
    e.preventDefault();
    if (!embedded)
      history.replaceState(null, "", location.pathname + location.search);
    show("");
  });
  document.querySelector("#print").addEventListener("click", () => {
    appearance.open = false;
    print();
  });
  document.querySelector("#save").addEventListener("click", () => {
    appearance.open = false;
    const clone = document.documentElement.cloneNode(true);
    clone.querySelector("#appearance").removeAttribute("open");
    const html = "<!doctype html>\n" + clone.outerHTML;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" })),
      a = document.createElement("a");
    a.href = url;
    a.download =
      (document.title
        .toLowerCase()
        .replaceAll(/[^\p{L}\p{N}]+/gu, "-")
        .replaceAll(/^-|-$/g, "") || "document") + ".html";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  });
  show();
})();
