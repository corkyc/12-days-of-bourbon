document.addEventListener("DOMContentLoaded", function () {
  const doors = document.querySelectorAll(".door");
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");
  const closeBtn = document.querySelector(".close");
  const DPR = window.devicePixelRatio || 1;

  closeBtn.addEventListener("click", () => {
    modal.setAttribute("aria-hidden", "true");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.setAttribute("aria-hidden", "true");
  });

  doors.forEach((door) => {
    const canvas = door.querySelector(".scratch-canvas");
    const overlay = door.querySelector(".scratch-overlay");
    const hidden = door.querySelector(".hidden-content");
    const ctx = canvas.getContext("2d");

    function setupCanvas() {
      const w = door.clientWidth;
      const h = door.clientHeight;

      canvas.style.width = w + "px";
      canvas.style.height = h + "px";

      canvas.width = w * DPR;
      canvas.height = h * DPR;

      ctx.scale(DPR, DPR);
      ctx.fillStyle = "#c0c0c0";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "destination-out";
    }

    setupCanvas();
    window.addEventListener("resize", setupCanvas);

    let scratching = false;
    let last = null;
    const brush = 22;

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left),
        y: (e.clientY - rect.top),
      };
    }

    function erase(x, y) {
      ctx.beginPath();
      ctx.arc(x, y, brush, 0, Math.PI * 2);
      ctx.fill();
    }

    function checkReveal() {
      const { width, height } = canvas;
      const pixels = ctx.getImageData(0, 0, width / DPR, height / DPR).data;
      let cleared = 0;
      for (let i = 3; i < pixels.length; i += 16) {
        if (pixels[i] === 0) cleared++;
      }
      const ratio = cleared / (pixels.length / 16);

      if (ratio > 0.4) {
        door.classList.add("revealed");
        scratching = false;
      }
    }

    canvas.addEventListener("pointerdown", (e) => {
      if (door.classList.contains("revealed")) return;
      scratching = true;
      last = getPos(e);
      erase(last.x, last.y);
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!scratching) return;
      const pos = getPos(e);

      const dx = pos.x - last.x;
      const dy = pos.y - last.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.floor(dist / 10));

      for (let i = 0; i <= steps; i++) {
        erase(
          last.x + (dx * i) / steps,
          last.y + (dy * i) / steps
        );
      }

      last = pos;
      checkReveal();
    });

    window.addEventListener("pointerup", () => {
      scratching = false;
    });

    // Open modal after revealed
    door.addEventListener("click", () => {
      if (door.classList.contains("revealed")) {
        modalBody.innerHTML = hidden.innerHTML;
        modal.setAttribute("aria-hidden", "false");
      }
    });
  });
});
