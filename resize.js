const sidebar = document.getElementById("sidebar");
const resizer = document.getElementById("resizer");

const MIN_WIDTH = 300;
const MAX_WIDTH = 350;

let isResizing = false;

resizer.addEventListener("mousedown", (e) => {
  isResizing = true;
  document.body.style.cursor = "col-resize";
  e.preventDefault(); // prevent text selection
});

document.addEventListener("mousemove", (e) => {
  if (!isResizing) return;

  const newWidth = e.clientX;
  if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
    sidebar.style.width = `${newWidth}px`;
  }
});

document.addEventListener("mouseup", () => {
  isResizing = false;
  document.body.style.cursor = "default";
});
