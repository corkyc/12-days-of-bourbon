document.addEventListener('DOMContentLoaded', () => {
  /* ------------------------------
      MOBILE NAVIGATION
  ------------------------------ */
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.querySelector('.nav-links');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }

  /* ------------------------------
      MODAL LOGIC
  ------------------------------ */
  const modal = document.getElementById('whiskeyModal');
  const modalBody = document.getElementById('modal-body');
  const closeBtn = document.querySelector('.close-button');

  function showModal(html) {
    modalBody.innerHTML = html;
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
  }

  function hideModal() {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
  }

  if (closeBtn) closeBtn.addEventListener("click", hideModal);
  window.addEventListener("click", e => {
    if (e.target === modal) hideModal();
  });

  /* ------------------------------
      SCRATCH CARD SYSTEM
  ------------------------------ */
  const DPR = window.devicePixelRatio || 1;
  const doors = document.querySelectorAll('.door');

  doors.forEach(door => {

    const canvas = door.querySelector('.scratch-canvas');
    const numberEl = door.querySelector('.door_number');
    const hiddenContent = door.querySelector('.door-hidden-content');

    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let isDrawing = false;
    let lastPoint = null;
    let pointerActive = false;  // TRUE only when scratching
    let startedScratching = false;

    /* ------------------------------
        BRUSH SIZE
    ------------------------------ */
    function brushRadius() {
      return Math.max(
        14,
        Math.min(60, Math.round(Math.max(door.offsetWidth, door.offsetHeight) * 0.06))
      );
    }

    /* ------------------------------
        SETUP CANVAS SIZE
    ------------------------------ */
    function setupCanvas() {
      const w = door.offsetWidth;
      const h = door.offsetHeight;

      canvas.style.width = w + "px";
      canvas.style.height = h + "px";

      canvas.width = w * DPR;
      canvas.height = h * DPR;

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      // Silver overlay
      ctx.globalCompositeOperation = "source-over";
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#d6d6d6");
      g.addColorStop(1, "#a8a8a8");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "destination-out";
    }

    /* ------------------------------
        GET TOUCH/MOUSE POSITION
    ------------------------------ */
    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    /* ------------------------------
        ERASE LOGIC
    ------------------------------ */
    function erasePoint(pt) {
      if (!pt) return;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, brushRadius(), 0, Math.PI * 2);
      ctx.fill();
    }

    function eraseTo(pt) {
      if (!lastPoint) {
        erasePoint(pt);
        lastPoint = pt;
        return;
      }
      const dx = pt.x - lastPoint.x;
      const dy = pt.y - lastPoint.y;
      const dist = Math.hypot(dx, dy);

      const steps = Math.max(1, Math.floor(dist / (brushRadius() * 0.3)));

      for (let i = 0; i <= steps; i++) {
        erasePoint({
          x: lastPoint.x + (dx * i) / steps,
          y: lastPoint.y + (dy * i) / steps
        });
      }

      lastPoint = pt;
    }

    /* ------------------------------
        SCRATCH PERCENT CHECK
    ------------------------------ */
    function checkPercentScratched() {
      try {
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let clear = 0;
        let total = 0;

        for (let i = 3; i < pixels.length; i += 16) { // Sample every 4th pixel
          total++;
          if (pixels[i] === 0) clear++;
        }

        if (clear / total > 0.45) reveal();
      } catch (_) {
        reveal();
      }
    }

    /* ------------------------------
        REVEAL CONTENT
    ------------------------------ */
    function reveal() {
      door.classList.add("revealed");
      canvas.style.display = "none";
      numberEl.style.display = "none";
      hiddenContent.setAttribute("aria-hidden", "false");
    }

    /* ------------------------------
        POINTER HANDLERS
    ------------------------------ */

    function onStart(e) {
      pointerActive = true;
      isDrawing = true;
      lastPoint = null;
      startedScratching = true;

      const p = getPos(e);
      eraseTo(p);

      e.preventDefault();   // prevents ONLY the touch that begins scratching
    }

    function onMove(e) {
      if (!isDrawing) return;

      const p = getPos(e);
      eraseTo(p);

      e.preventDefault();
    }

    function onEnd() {
      if (!pointerActive) return;

      isDrawing = false;
      pointerActive = false;
      lastPoint = null;

      setTimeout(checkPercentScratched, 120);
    }

    /* -------------------------------------
        Add Event Listeners
    ------------------------------------- */
    if (window.PointerEvent) {
      canvas.addEventListener('pointerdown', onStart, { passive: false });
      canvas.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onEnd, { passive: false });
    } else {
      // fallback
      canvas.addEventListener('mousedown', onStart, { passive: false });
      window.addEventListener('mousemove', onMove, { passive: false });
      window.addEventListener('mouseup', onEnd, { passive: false });

      canvas.addEventListener('touchstart', onStart, { passive: false });
      canvas.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onEnd, { passive: false });
    }

    /* Allow scrolling when not scratching */
    canvas.addEventListener('touchmove', (e) => {
      if (pointerActive) {
        e.preventDefault();
      }
    }, { passive: false });

    /* ------------------------------
        CLICK TO OPEN MODAL
    ------------------------------ */
    door.addEventListener("click", () => {
      if (!door.classList.contains("revealed")) return;
      if (pointerActive || startedScratching) return;

      showModal(hiddenContent.innerHTML);
    });

    /* ------------------------------
        INITIALIZE CANVAS
    ------------------------------ */
    setupCanvas();

    /* ------------------------------
        HANDLE RESIZING
    ------------------------------ */
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!door.classList.contains("revealed")) {
          setupCanvas();
        }
      }, 150);
    });

  }); // end forEach door
});
