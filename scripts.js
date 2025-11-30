// scripts.js — working scratch logic + door visuals + snow generator
document.addEventListener("DOMContentLoaded", () => {
  const DPR = window.devicePixelRatio || 1;
  const cards = Array.from(document.querySelectorAll(".card"));
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");
  const modalClose = document.getElementById("modalClose");

  // --- FIXED MODAL: accepts a DOM node and clones it before inserting ---
  function openModal(node) {
    if (!modalBody) return;
    modalBody.innerHTML = "";

    // If the caller passed a string accidentally, convert to node then clone.
    if (typeof node === "string") {
      const temp = document.createElement("div");
      temp.innerHTML = node.trim();
      modalBody.appendChild(temp.cloneNode(true));
    } else if (node && node.cloneNode) {
      // Clone the real node so the original stays in the card.
      modalBody.appendChild(node.cloneNode(true));
    } else {
      // nothing to show
      modalBody.textContent = "";
    }

    if (modal) modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    if (modal) modal.setAttribute("aria-hidden", "true");
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  // Initialize each canvas properly (DPR-aware) and apply image backgrounds
  function initCanvas(card) {
    const canvas = card.querySelector(".scratch");
    const ctx = canvas.getContext("2d");

    // apply wood/bottle image if provided
    const imgSrc = card.dataset.img;
    if (imgSrc) {
      // Preload small thumbnail as background behind canvas using content image
      card.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.18)), url('${imgSrc}')`;
      card.style.backgroundSize = "cover";
      card.style.backgroundPosition = "center";
    }

    // CSS size
    const cssW = Math.max(1, Math.round(card.clientWidth));
    const cssH = Math.max(1, Math.round(card.clientHeight));

    // Set CSS & backing-store sizes
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.floor(cssW * DPR);
    canvas.height = Math.floor(cssH * DPR);

    // Scale drawing operations so 1 unit = 1 CSS pixel (ctx scaled for DPR)
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

  // Convert client coordinates -> CSS coords
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
        const contentNode = card.querySelector(".content");
        if (contentNode) openModal(contentNode); // PASS NODE, NOT innerHTML
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
        const contentNode = card.querySelector(".content");
        if (contentNode) openModal(contentNode); // PASS NODE, NOT innerHTML
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
      const contentNode = card.querySelector(".content");
      if (contentNode) openModal(contentNode); // PASS NODE, NOT innerHTML
    });
  });

  /* ========== Snow generator (lightweight) ========== */
  (function createSnow(num = 26) {
    const container = document.getElementById('snow-container');
    if (!container) return;
    for (let i = 0; i < num; i++) {
      const el = document.createElement('div');
      el.className = 'snowflake';
      el.textContent = '❄';
      // randomize size, left position, fall duration, sway
      const left = Math.random() * 100;
      const size = 8 + Math.random() * 18; // px
      const dur = 8 + Math.random() * 10; // seconds
      const sway = (Math.random() - 0.5) * 40; // px
      el.style.left = left + 'vw';
      el.style.fontSize = size + 'px';
      el.style.setProperty('--fall-duration', `${dur}s`);
      el.style.setProperty('--sway-duration', `${3 + Math.random() * 4}s`);
      el.style.setProperty('--sway', `${sway}px`);
      container.appendChild(el);
      // remove & respawn after animation ends to keep variety
      el.addEventListener('animationend', () => {
        // recycle: reset top and left
        el.style.left = (Math.random() * 100) + 'vw';
        el.style.fontSize = (8 + Math.random() * 18) + 'px';
        el.style.setProperty('--fall-duration', `${8 + Math.random() * 12}s`);
        el.style.setProperty('--sway-duration', `${3 + Math.random() * 4}s`);
        el.style.setProperty('--sway', `${(Math.random() - 0.5) * 50}px`);
      });
    }
  })();

}); // DOMContentLoaded end
