const sidebar = document.getElementById("sidebar");
const resizer = document.getElementById("resizer");

let isResizing = false;

resizer.addEventListener("mousedown", () => {
  isResizing = true;
  document.body.style.cursor = "col-resize";
});

document.addEventListener("mousemove", (e) => {
  if (!isResizing) return;

  const newWidth = e.clientX;

  if (newWidth >= 180 && newWidth <= 400) {
    sidebar.style.width = newWidth + "px";
  }
});

document.addEventListener("mouseup", () => {
  isResizing = false;
  document.body.style.cursor = "default";
});
