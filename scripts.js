// scripts.js — robust scratch + reveal (Option B: reveal in-card, then click to open modal)
document.addEventListener("DOMContentLoaded", () => {
  const DPR = window.devicePixelRatio || 1;
  const cards = Array.from(document.querySelectorAll(".whiskey-card"));
  const modal = document.getElementById("whiskeyModal");
  const modalBody = document.getElementById("modal-body");
  const closeBtn = document.querySelector(".close-button");

  // Modal controls
  function openModal(html) {
    modalBody.innerHTML = html;
    modal.setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
  }
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  // Helper: set up each canvas sized for DPR and card size
  function setupCanvasForCard(card) {
    const canvas = card.querySelector(".scratch-canvas");
    const ctx = canvas.getContext("2d");
    // CSS size from layout
    const cssW = Math.max(1, Math.round(card.clientWidth));
    const cssH = Math.max(1, Math.round(card.clientHeight));

    // Set CSS dimensions (keeps layout stable)
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";

    // Set backing store size for high-DPI
    canvas.width = Math.floor(cssW * DPR);
    canvas.height = Math.floor(cssH * DPR);

    // Scale drawing to CSS pixels
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // Fill scratch overlay from JS (not CSS) so erase works reliably
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#bfbfbf";
    ctx.fillRect(0, 0, cssW, cssH);

    // set drawing mode to erase when user scratches
    ctx.globalCompositeOperation = "destination-out";

    // keep useful values on card dataset for later
    card._scratch = {
      canvas,
      ctx,
      cssW,
      cssH,
      totalPixels: cssW * cssH,
      clearedEstimate: 0,
      revealed: false
    };

    // ensure canvas is top layer above card but under overlay (CSS must provide z-index)
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.touchAction = "none"; // allow us to call preventDefault
  }

  // init all canvases
  cards.forEach(card => setupCanvasForCard(card));

  // Recompute on resize (debounced)
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cards.forEach(card => {
        // only reinit if not revealed yet
        if (!(card._scratch && card._scratch.revealed)) setupCanvasForCard(card);
      });
    }, 120);
  });

  // Utilities to get pointer position in CSS pixels (not backing store)
  function getLocalPos(canvas, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  // Draw helpers: erase circle and smooth stroke
  function eraseAt(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function revealCard(card) {
    const s = card._scratch;
    if (!s || s.revealed) return;
    s.revealed = true;

    // hide overlay & canvas and show hidden content
    const overlay = card.querySelector(".scratch-overlay");
    if (overlay) overlay.style.display = "none";
    if (s.canvas) s.canvas.style.display = "none";

    const hidden = card.querySelector(".hidden-modal-data");
    if (hidden) hidden.style.display = "block";

    card.classList.add("revealed");

    // clicking the revealed card opens the modal with inner html
    card.addEventListener("click", () => {
      if (card.classList.contains("revealed")) {
        openModal(hidden ? hidden.innerHTML : "<p>No content</p>");
      }
    });
  }

  // Percent check (fast sample)
  function checkPercent(card) {
    const s = card._scratch;
    if (!s || s.revealed) return;

    try {
      // sample the backing canvas at lower frequency for speed
      const ctx = s.ctx;
      const backingW = Math.floor(s.cssW * DPR);
      const backingH = Math.floor(s.cssH * DPR);
      const imageData = ctx.getImageData(0, 0, s.cssW, s.cssH); // CSS size works because ctx scaled
      const data = imageData.data;
      let clearCount = 0;
      let totalCount = 0;

      // sample every Nth alpha to speed up; choose stride so work is reasonable
      const stride = 4 * 8; // checks every 8th pixel
      for (let i = 3; i < data.length; i += stride) {
        totalCount++;
        if (data[i] === 0) clearCount++;
      }

      const ratio = clearCount / Math.max(1, totalCount);
      // if roughly 40% cleared -> reveal
      if (ratio > 0.40) revealCard(card);
    } catch (err) {
      // If readback fails (very unusual), optimistically reveal
      revealCard(card);
    }
  }

  // Main pointer handling using Pointer Events (unified)
  cards.forEach(card => {
    const s = card._scratch;
    if (!s) return;
    const canvas = s.canvas;
    const ctx = s.ctx;

    let drawing = false;
    let last = null;
    const brush = Math.max(16, Math.round(Math.max(s.cssW, s.cssH) * 0.05)); // proportional brush

    // pointerdown -> start drawing; preventDefault to stop page scroll on touch
    function onPointerDown(e) {
      if (s.revealed) return;
      drawing = true;
      last = getLocalPos(canvas, e.clientX, e.clientY);
      eraseAt(ctx, last.x, last.y, brush);
      // prevent page scroll while actively touching canvas
      if (e.pointerType === "touch") e.preventDefault();
    }

    function onPointerMove(e) {
      if (!drawing) return;
      const pos = getLocalPos(canvas, e.clientX, e.clientY);
      // linear interpolation between last and pos
      const dx = pos.x - last.x, dy = pos.y - last.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.floor(dist / (brush * 0.35)));
      for (let i = 0; i <= steps; i++) {
        const x = last.x + (dx * i) / steps;
        const y = last.y + (dy * i) / steps;
        eraseAt(ctx, x, y, brush);
      }
      last = pos;
      // do a lightweight percent check occasionally (throttled by time)
      // to be simple: check each move (fast enough with sampling)
      checkPercent(card);
      if (e.pointerType === "touch") e.preventDefault();
    }

    function onPointerUp(e) {
      if (!drawing) return;
      drawing = false;
      last = null;
      // final percent check
      checkPercent(card);
    }

    // Attach pointer events
    if (window.PointerEvent) {
      canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
      canvas.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", onPointerUp, { passive: false });
      window.addEventListener("pointercancel", onPointerUp, { passive: false });
    } else {
      // fallback to mouse/touch
      canvas.addEventListener("mousedown", (e) => { onPointerDown(e); }, { passive: false });
      window.addEventListener("mousemove", (e) => { onPointerMove(e); }, { passive: false });
      window.addEventListener("mouseup", onPointerUp, { passive: false });

      canvas.addEventListener("touchstart", (e) => {
        // emulate a pointer event
        const t = e.touches[0];
        onPointerDown({ clientX: t.clientX, clientY: t.clientY, pointerType: "touch", preventDefault: () => e.preventDefault() });
      }, { passive: false });

      canvas.addEventListener("touchmove", (e) => {
        const t = e.touches[0];
        onPointerMove({ clientX: t.clientX, clientY: t.clientY, pointerType: "touch", preventDefault: () => e.preventDefault() });
      }, { passive: false });

      canvas.addEventListener("touchend", onPointerUp, { passive: false });
    }

    // prevent scrolling only while active (extra protection)
    canvas.addEventListener("touchmove", (e) => {
      if (drawing) e.preventDefault();
    }, { passive: false });

    // If user taps overlay to enable scratch (optional UX) — not required
    // overlay.addEventListener('click', () => { overlay.style.display = 'none'; });

  }); // end cards.forEach

}); // end DOMContentLoaded
