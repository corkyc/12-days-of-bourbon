// services.js — robust scratch + reveal + modal (Option B: reveal in-card then click to open modal)
document.addEventListener("DOMContentLoaded", () => {
  const DPR = window.devicePixelRatio || 1;
  const cards = Array.from(document.querySelectorAll(".whiskey-card"));
  const modal = document.getElementById("whiskeyModal");
  const modalBody = document.getElementById("modal-body");
  const closeBtn = document.querySelector(".close-button");

  // Modal handlers
  function openModal(html) {
    modalBody.innerHTML = html;
    modal.setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
  }
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  // Initialize canvas for each card with proper DPR backing store
  function initCanvas(card) {
    const canvas = card.querySelector(".scratch-canvas");
    const overlay = card.querySelector(".scratch-overlay");

    // CSS size
    const cssW = Math.max(1, Math.round(card.clientWidth));
    const cssH = Math.max(1, Math.round(card.clientHeight));

    // set CSS size so layout stays stable
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";

    // set backing store size for high DPI
    canvas.width = Math.floor(cssW * DPR);
    canvas.height = Math.floor(cssH * DPR);

    const ctx = canvas.getContext("2d");
    // Draw the scratch overlay entirely via JS (backing coords)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#cfcfcf";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // prepare for erasing with destination-out
    ctx.globalCompositeOperation = "destination-out";

    // store helper data on element
    card._scratch = {
      canvas,
      ctx,
      cssW,
      cssH,
      brush: Math.max(14, Math.round(Math.max(cssW, cssH) * 0.06)),
      revealed: false
    };
  }

  // Initialize all
  cards.forEach(initCanvas);

  // Re-init on resize (debounced)
  let rTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(rTimer);
    rTimer = setTimeout(() => {
      cards.forEach(card => { if (!card._scratch.revealed) initCanvas(card); });
    }, 120);
  });

  // Helpers
  function getLocalPos(canvas, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    // convert to backing store coords
    const x = (clientX - rect.left) * DPR;
    const y = (clientY - rect.top) * DPR;
    return { x, y };
  }

  function eraseAt(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function sampleReveal(card) {
    // fast sampling of alpha channel to determine reveal ratio
    const s = card._scratch;
    if (!s || s.revealed) return false;
    try {
      const ctx = s.ctx;
      // read the whole backing store (could be big on very large cards)
      const w = canvasWidthBacking(s);
      const h = canvasHeightBacking(s);
      // We will sample at lower rate to improve speed.
      const image = ctx.getImageData(0, 0, w, h).data;
      let clear = 0, total = 0;

      // stride over alpha bytes; stride length tuned for speed
      const stride = 4 * 8; // sample ~every 8th pixel
      for (let i = 3; i < image.length; i += stride) {
        total++;
        if (image[i] === 0) clear++;
      }
      const ratio = clear / Math.max(1, total);
      return ratio > 0.40;
    } catch (err) {
      // if getImageData fails (rare), return false
      return false;
    }
  }

  function canvasWidthBacking(s) { return s.canvas.width; }
  function canvasHeightBacking(s) { return s.canvas.height; }

  // Main pointer logic — unified pointer events with fallback
  cards.forEach(card => {
    const overlay = card.querySelector(".scratch-overlay");
    const hidden = card.querySelector(".hidden-modal-data");
    let drawing = false;
    let lastPos = null;

    const s = card._scratch;
    if (!s) return;
    const canvas = s.canvas;
    const ctx = s.ctx;
    const brushBacking = s.brush * DPR;

    // If overlay is clicked/tapped, hide it and start a scratch at that point.
    function overlayStart(e) {
      // hide overlay (so subsequent pointer events hit canvas)
      overlay.style.display = "none";

      // If this was a pointer event include coords, start a scratch
      const ev = (e.changedTouches ? e.changedTouches[0] : e);
      const pos = getLocalPos(canvas, ev.clientX, ev.clientY);
      drawing = true;
      lastPos = pos;
      eraseAt(ctx, pos.x, pos.y, brushBacking);
      // prevent scroll on touch
      if (e.pointerType === "touch" || e.type === "touchstart") e.preventDefault();
    }

    // Start scratch from canvas directly (if overlay hidden).
    function pointerDown(e) {
      if (s.revealed) return;
      // If overlay still visible, remove it (we also accept pointer down directly on canvas)
      if (overlay && overlay.style.display !== "none") overlay.style.display = "none";

      drawing = true;
      const ev = (e.changedTouches ? e.changedTouches[0] : e);
      lastPos = getLocalPos(canvas, ev.clientX, ev.clientY);
      eraseAt(ctx, lastPos.x, lastPos.y, brushBacking);
      if (e.pointerType === "touch" || e.type === "touchstart") e.preventDefault();
    }

    function pointerMove(e) {
      if (!drawing || s.revealed) return;
      const ev = (e.changedTouches ? e.changedTouches[0] : e);
      const pos = getLocalPos(canvas, ev.clientX, ev.clientY);
      // interpolate between lastPos and pos for continuous stroke
      const dx = pos.x - lastPos.x;
      const dy = pos.y - lastPos.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.floor(dist / (brushBacking * 0.35)));
      for (let i = 0; i <= steps; i++) {
        const x = lastPos.x + (dx * i) / steps;
        const y = lastPos.y + (dy * i) / steps;
        eraseAt(ctx, x, y, brushBacking);
      }
      lastPos = pos;
      // quick reveal check occasionally
      if (sampleReveal(card)) {
        // reveal
        s.revealed = true;
        card.classList.add("revealed");
        // show hidden content (already via CSS) and stop listening for drawing.
      }
      if (e.pointerType === "touch" || e.type === "touchmove") e.preventDefault();
    }

    function pointerUp(e) {
      if (!drawing) return;
      drawing = false;
      lastPos = null;
      if (!s.revealed && sampleReveal(card)) {
        s.revealed = true;
        card.classList.add("revealed");
      }
    }

    // Click on revealed card opens modal with that card's hidden content
    card.addEventListener("click", (e) => {
      // only open modal if card is revealed and click target is not an active overlay
      if (!card.classList.contains("revealed")) return;
      if (!hidden) return;
      openModal(hidden.innerHTML);
    });

    // Attach events (Pointer Events with fallback)
    if (window.PointerEvent) {
      // overlay gets pointerdown to allow "tap to activate scratch"
      overlay.addEventListener("pointerdown", overlayStart, { passive: false });
      canvas.addEventListener("pointerdown", pointerDown, { passive: false });
      canvas.addEventListener("pointermove", pointerMove, { passive: false });
      window.addEventListener("pointerup", pointerUp, { passive: false });
      window.addEventListener("pointercancel", pointerUp, { passive: false });
    } else {
      // fallback for older browsers using touch and mouse
      overlay.addEventListener("touchstart", overlayStart, { passive: false });
      canvas.addEventListener("touchstart", pointerDown, { passive: false });
      canvas.addEventListener("touchmove", pointerMove, { passive: false });
      window.addEventListener("touchend", pointerUp, { passive: false });

      canvas.addEventListener("mousedown", pointerDown);
      window.addEventListener("mousemove", pointerMove);
      window.addEventListener("mouseup", pointerUp);
    }

    // Prevent page scroll only while actively drawing on the canvas
    canvas.addEventListener("touchmove", (ev) => {
      if (drawing) ev.preventDefault();
    }, { passive: false });
  });

});
