// scripts.js — robust scratch + reveal + modal (no "tap to scratch")
document.addEventListener("DOMContentLoaded", () => {
  const DPR = window.devicePixelRatio || 1;
  const cards = Array.from(document.querySelectorAll(".card"));
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");
  const modalClose = document.getElementById("modalClose");

  // Modal handlers
  function openModal(html) {
    modalBody.innerHTML = html;
    modal.setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
  }
  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  // Initialize each canvas properly (DPR-aware)
  function initCanvas(card) {
    const canvas = card.querySelector(".scratch");
    const ctx = canvas.getContext("2d");

    // CSS size
    const cssW = Math.max(1, Math.round(card.clientWidth));
    const cssH = Math.max(1, Math.round(card.clientHeight));

    // Set CSS & backing-store sizes
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.floor(cssW * DPR);
    canvas.height = Math.floor(cssH * DPR);

    // Scale drawing operations so 1 unit = 1 CSS pixel
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // Draw scratch coating via JS (so CSS background doesn't interfere)
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#cfcfcf";
    ctx.fillRect(0, 0, cssW, cssH);

    // Switch to erase mode for user drawing
    ctx.globalCompositeOperation = "destination-out";

    // store helpers
    card._scratch = {
      canvas,
      ctx,
      cssW,
      cssH,
      brush: Math.max(14, Math.round(Math.max(cssW, cssH) * 0.06)),
      revealed: false
    };
  }

  // Setup all
  cards.forEach(initCanvas);

  // Reinit on resize for cards not yet revealed (debounced)
  let rt = null;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      cards.forEach(card => { if (!card._scratch.revealed) initCanvas(card); });
    }, 120);
  });

  // Convert client coordinates -> backing-store coords
  function localPos(canvas, clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const x = (clientX - r.left);
    const y = (clientY - r.top);
    return { x: x, y: y };
  }

  // Fast alpha sampling to detect reveal
  function isRevealed(card) {
    const s = card._scratch;
    if (!s || s.revealed) return true;
    try {
      const ctx = s.ctx;
      // read CSS-sized image (ctx scaled), so use cssW/cssH
      const image = ctx.getImageData(0, 0, s.cssW, s.cssH).data;
      let clear = 0, total = 0;
      const stride = 4 * 8; // sample every 8th pixel
      for (let i = 3; i < image.length; i += stride) {
        total++;
        if (image[i] === 0) clear++;
      }
      const ratio = clear / Math.max(1, total);
      return ratio > 0.45;
    } catch (err) {
      // if CORS or read failure, fallback to true to avoid blocking
      return true;
    }
  }

  // Main pointer logic (pointer events preferred)
  cards.forEach(card => {
    const s = card._scratch;
    if (!s) return;
    const canvas = s.canvas;
    const ctx = s.ctx;
    const brush = s.brush;

    let drawing = false;
    let last = null;

    function eraseAt(x, y) {
      ctx.beginPath();
      ctx.arc(x, y, brush, 0, Math.PI * 2);
      ctx.fill();
    }

    function pointerDown(e) {
      if (s.revealed) return;
      drawing = true;
      last = localPos(canvas, e.clientX, e.clientY);
      eraseAt(last.x, last.y);
      if (e.pointerType === "touch") e.preventDefault();
    }

    function pointerMove(e) {
      if (!drawing || s.revealed) return;
      const pos = localPos(canvas, e.clientX, e.clientY);
      const dx = pos.x - last.x;
      const dy = pos.y - last.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.floor(dist / (brush * 0.35)));
      for (let i = 0; i <= steps; i++) {
        const x = last.x + (dx * i) / steps;
        const y = last.y + (dy * i) / steps;
        eraseAt(x, y);
      }
      last = pos;
      if (isRevealed(card)) {
        s.revealed = true;
        card.classList.add("revealed");
        // after reveal, open the modal automatically
        // populate modal with card content
        const content = card.querySelector(".content");
        if (content) openModal(content.innerHTML);
      }
      if (e.pointerType === "touch") e.preventDefault();
    }

    function pointerUp() {
      if (!drawing) return;
      drawing = false;
      last = null;
      if (!s.revealed && isRevealed(card)) {
        s.revealed = true;
        card.classList.add("revealed");
        const content = card.querySelector(".content");
        if (content) openModal(content.innerHTML);
      }
    }

    if (window.PointerEvent) {
      canvas.addEventListener("pointerdown", pointerDown, { passive: false });
      canvas.addEventListener("pointermove", pointerMove, { passive: false });
      window.addEventListener("pointerup", pointerUp, { passive: false });
      window.addEventListener("pointercancel", pointerUp, { passive: false });
    } else {
      // fallback to touch/mouse
      canvas.addEventListener("touchstart", (e) => {
        const t = e.touches[0];
        pointerDown({ clientX: t.clientX, clientY: t.clientY, pointerType: "touch", preventDefault: () => e.preventDefault() });
      }, { passive: false });

      canvas.addEventListener("touchmove", (e) => {
        const t = e.touches[0];
        pointerMove({ clientX: t.clientX, clientY: t.clientY, pointerType: "touch", preventDefault: () => e.preventDefault() });
      }, { passive: false });

      window.addEventListener("touchend", pointerUp, { passive: false });

      canvas.addEventListener("mousedown", (e) => pointerDown(e));
      window.addEventListener("mousemove", (e) => pointerMove(e));
      window.addEventListener("mouseup", pointerUp);
    }

    // prevent page scroll while actively drawing on the canvas
    canvas.addEventListener("touchmove", (ev) => {
      if (drawing) ev.preventDefault();
    }, { passive: false });

    // Clicking revealed card also opens modal
    card.addEventListener("click", () => {
      if (!card.classList.contains("revealed")) return;
      const content = card.querySelector(".content");
      if (content) openModal(content.innerHTML);
    });
  });

}); // DOMContentLoaded end
