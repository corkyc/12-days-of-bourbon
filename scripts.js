// scripts.js
document.addEventListener('DOMContentLoaded', () => {
  // Hamburger toggle (mobile)
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.querySelector('.nav-links');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => navMenu.classList.toggle('active'));
  }

  // Modal
  const modal = document.getElementById('whiskeyModal');
  const modalBody = document.getElementById('modal-body');
  const closeBtn = document.querySelector('.close-button');
  function showModal(html) {
    modalBody.innerHTML = html;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }
  function hideModal() {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }
  if (closeBtn) closeBtn.addEventListener('click', hideModal);
  window.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });

  // Utility: get device pixel ratio
  const DPR = window.devicePixelRatio || 1;

  // Create scratch behavior for each door
  const doors = document.querySelectorAll('.door');

  doors.forEach((door) => {
    const canvas = door.querySelector('.scratch-canvas');
    const numberEl = door.querySelector('.door_number');
    const hiddenContent = door.querySelector('.door-hidden-content');

    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let isDrawing = false;
    let lastPoint = null;
    let pointerActive = false; // used to prevent click-opening modal while interacting

    // brush size proportional to door size
    function brushRadius() {
      // radius ~ 6% of max dimension, but min 12, max 60
      const r = Math.max(12, Math.min(60, Math.round(Math.max(door.offsetWidth, door.offsetHeight) * 0.06)));
      return r;
    }

    // initialize or resize canvas to cover door and handle high-DPI
    function setupCanvas() {
      const w = door.offsetWidth;
      const h = door.offsetHeight;
      // Set CSS size
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      // Set actual bitmap size for high-DPI
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      // scale drawing operations
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      // fill overlay (silver/foil)
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#C0C0C0';
      ctx.fillRect(0, 0, w, h);

      // (optional) add a subtle texture/gradient to look nicer
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, 'rgba(192,192,192,0.95)');
      g.addColorStop(1, 'rgba(160,160,160,0.95)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // reset composite mode
      ctx.globalCompositeOperation = 'destination-out';
    }

    // convert client coords to canvas-local coords
    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      if (e.touches && e.touches.length) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return { x: (clientX - rect.left), y: (clientY - rect.top) };
    }

    // draw a circle (erase) at point
    function eraseAt(pt) {
      if (!pt) return;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, brushRadius(), 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
    }

    // smooth stroke between points
    function strokeTo(pt) {
      if (!lastPoint) {
        eraseAt(pt);
        lastPoint = pt;
        return;
      }
      const distX = pt.x - lastPoint.x;
      const distY = pt.y - lastPoint.y;
      const dist = Math.hypot(distX, distY);
      const steps = Math.max(1, Math.floor(dist / (brushRadius() * 0.25)));
      for (let i = 0; i <= steps; i++) {
        const x = lastPoint.x + (distX * (i / steps));
        const y = lastPoint.y + (distY * (i / steps));
        eraseAt({ x, y });
      }
      lastPoint = pt;
    }

    // percent scratched check
    function checkPercentScratched() {
      try {
        const w = canvas.width;
        const h = canvas.height;
        // sample at reduced resolution to speed up (sample every 4th pixel)
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        let total = 0, clear = 0;
        // iterate alpha bytes only
        for (let i = 3; i < data.length; i += 4 * 4) { // skip a few pixels to speed up
          total++;
          if (data[i] === 0) clear++;
        }
        const percent = clear / total;
        // reveal when more than 45% scratched
        if (percent > 0.45) {
          reveal();
        }
      } catch (err) {
        // CORS or other canvas issues shouldn't block UX — reveal conservatively
        console.warn('Could not compute scratch percent:', err);
      }
    }

    function reveal() {
      // hide overlay and number, mark revealed
      door.classList.add('revealed');
      canvas.style.display = 'none';
      if (numberEl) numberEl.style.display = 'none';
      // set aria attributes
      if (hiddenContent) hiddenContent.setAttribute('aria-hidden', 'false');
      door.setAttribute('aria-pressed', 'true');
    }

    // pointer handlers (use Pointer Events when supported)
    function onPointerDown(e) {
      // only left button or touch/pen
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointerActive = true;
      isDrawing = true;
      lastPoint = null;
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
      const p = getPos(e);
      strokeTo(p);
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!isDrawing) return;
      const p = getPos(e);
      strokeTo(p);
      e.preventDefault();
    }

    function onPointerUp(e) {
      if (!pointerActive) return;
      isDrawing = false;
      lastPoint = null;
      pointerActive = false;
      // small timeout to allow finishing strokes
      setTimeout(checkPercentScratched, 150);
    }

    // For older browsers, fall back to mouse and touch
    function addEventListeners() {
      if (window.PointerEvent) {
        canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
        canvas.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp, { passive: false });
      } else {
        canvas.addEventListener('mousedown', (e) => { onPointerDown(e); }, { passive: false });
        window.addEventListener('mousemove', (e) => { onPointerMove(e); }, { passive: false });
        window.addEventListener('mouseup', (e) => { onPointerUp(e); }, { passive: false });

        canvas.addEventListener('touchstart', (e) => { onPointerDown(e); }, { passive: false });
        canvas.addEventListener('touchmove', (e) => { onPointerMove(e); }, { passive: false });
        window.addEventListener('touchend', (e) => { onPointerUp(e); }, { passive: false });
      }

      // Prevent scrolling/zooming while interacting on canvas
      ['touchstart','touchmove'].forEach(ev => {
        canvas.addEventListener(ev, (e) => {
          if (pointerActive) e.preventDefault();
        }, { passive: false });
      });
    }

    // Clicking a door opens modal only if revealed
    door.addEventListener('click', (e) => {
      // prevent click while actively scratching
      if (pointerActive) return;
      if (!door.classList.contains('revealed')) return;
      if (hiddenContent) {
        showModal(hiddenContent.innerHTML);
      }
    });

    // Keyboard activation (Enter or Space) — open modal if revealed
    door.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && door.classList.contains('revealed')) {
        e.preventDefault();
        if (hiddenContent) showModal(hiddenContent.innerHTML);
      }
    });

    // Initialize canvas now
    setupCanvas();
    addEventListeners();

    // Re-init on resize so canvas matches element size
    let resizeTimer = -1;
    window.addEventListener('resize', () => {
      // Debounce resizing
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // if already revealed, nothing to do
        if (!door.classList.contains('revealed')) {
          setupCanvas();
        }
      }, 120);
    });

  }); // end doors.forEach
});
