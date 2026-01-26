const sidebarNav = document.getElementById("sidebar-nav");
const content = document.querySelector(".content");

// --- List of Markdown files ---
const docs = [
  "docs/Overview.md",
  "docs/LICENSE",
  "docs/ALU-1001.md",
  "docs/Parameter-design.md",
  "docs/Counter-1001.md",
  "docs/File-Register-1001.md",
  "docs/File-Register-1002.md",
  "docs/Descriptor-Framework.md",
  "docs/Neural-Network-Pruning.md",
];

// Object to store preloaded content
const docsContent = {};

// --- Custom Marked configuration ---
if (typeof marked !== 'undefined') {
  const renderer = {
    code(token) {
      const code = token.text || token;
      const lang = token.lang || "text";

      return `<div class="code-block">
        <div class="code-toolbar">
          <span class="code-lang">${lang}</span>
          <button class="copy-btn" data-code="${encodeURIComponent(code)}">Copy</button>
        </div>
        <pre><code>${code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
      </div>`;
    }
  };

  marked.use({ renderer, breaks: true });
}

// --- Preload all docs ---
async function preloadDocs() {
  for (const file of docs) {
    try {
      let md = await fetch(file).then(res => res.text());
      md = md.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
      docsContent[file] = md.replace(/\s+$/g, "");
    } catch (err) {
      console.error(`Failed to preload ${file}:`, err);
      docsContent[file] = `# Error\nFailed to load ${file}`;
    }
  }
}

// --- Load a document into the main content ---
function loadDoc(file, linkEl, updateHash = true) {
  const md = docsContent[file];
  if (!md) return;

  try {
    content.innerHTML = marked.parse(md);
  } catch (err) {
    console.warn("Markdown parse failed, showing raw text", err);
    content.innerHTML =
      "<pre>" + md.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</pre>";
  }

  // Copy buttons
  content.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const code = decodeURIComponent(btn.dataset.code);
      navigator.clipboard.writeText(code);
      btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = "Copy"), 1200);
    });
  });

  // Sidebar selection
  sidebarNav.querySelectorAll(".sidebar-item").forEach(i => i.classList.remove("selected"));
  if (linkEl) linkEl.classList.add("selected");

  // Update URL hash
  if (updateHash) {
    const name = file.split("/").pop().replace(".md", "").replace(/\s+/g, "-");
    window.location.hash = name;
  }
}

// --- Build the sidebar dynamically ---
function buildSidebar() {
  docs.forEach(file => {
    const md = docsContent[file] || "";
    const match = md.match(/^#\s+(.+)/m);
    const title = match ? match[1] : file.split("/").pop().replace(".md", "");

    const a = document.createElement("a");
    a.href = "#";
    a.className = "sidebar-item";
    a.textContent = title;

    a.addEventListener("click", e => {
      e.preventDefault();
      loadDoc(file, a);
    });

    sidebarNav.appendChild(a);
  });
}

// --- Load doc from hash ---
function loadFromHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return false;

  for (const file of docs) {
    const name = file.split("/").pop().replace(".md", "").replace(/\s+/g, "-");
    if (name === hash) {
      const linkEl = Array.from(sidebarNav.children).find(a => a.textContent.replace(/\s+/g, "-") === hash);
      loadDoc(file, linkEl, false);
      return true;
    }
  }
  return false;
}

// --- Sidebar toggle with SVG animation ---
document.addEventListener("DOMContentLoaded", () => {
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");
  const icon = document.getElementById("sidebar-icon"); // <svg> element
  let sidebarVisible = true; // sidebar starts open

  sidebarToggle.addEventListener("click", () => {
    sidebarVisible = !sidebarVisible;
    sidebar.classList.toggle("hidden", !sidebarVisible);

    const [line1, line2, line3] = icon.querySelectorAll("line");

    if (sidebarVisible) {
      // Sidebar OPEN → show X
      line1.setAttribute("x1", "6"); line1.setAttribute("y1", "6");
      line1.setAttribute("x2", "18"); line1.setAttribute("y2", "18");

      line2.style.display = "none"; // hide middle line

      line3.setAttribute("x1", "6"); line3.setAttribute("y1", "18");
      line3.setAttribute("x2", "18"); line3.setAttribute("y2", "6");
    } else {
      // Sidebar CLOSED → show hamburger
      line1.setAttribute("x1", "3"); line1.setAttribute("y1", "6");
      line1.setAttribute("x2", "21"); line1.setAttribute("y2", "6");

      line2.style.display = "block"; // show middle line
      line2.setAttribute("x1", "3"); line2.setAttribute("y1", "12");
      line2.setAttribute("x2", "21"); line2.setAttribute("y2", "12");

      line3.setAttribute("x1", "3"); line3.setAttribute("y1", "18");
      line3.setAttribute("x2", "21"); line3.setAttribute("y2", "18");
    }
  });
});

// --- Initialize ---
(async function init() {
  await preloadDocs();
  buildSidebar();

  // Try loading from hash first
  if (!loadFromHash()) {
    const firstItem = sidebarNav.querySelector(".sidebar-item");
    if (firstItem) firstItem.click();
  }
})();

// --- Sidebar search ---
const searchInput = document.getElementById("sidebar-search");

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    sidebarNav.querySelectorAll(".sidebar-item").forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(query) ? "" : "none";
    });
  });
}
