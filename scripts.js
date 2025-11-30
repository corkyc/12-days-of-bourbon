document.addEventListener("DOMContentLoaded", () => {
  const DPR = window.devicePixelRatio || 1;
  const cards = Array.from(document.querySelectorAll(".card"));
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");
  const modalClose = document.getElementById("modalClose");
  const resetBtn = document.getElementById('resetProgressBtn');

  // --- LOCAL STORAGE STATE & MANAGEMENT ---
  const STORAGE_KEY = 'scratchedDays';
  let scratchedDays = {};

  function loadProgress() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      scratchedDays = stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error("Error loading progress from localStorage", e);
      scratchedDays = {};
    }
  }

  function saveProgress(day) {
    if (!day) return;
    scratchedDays[day] = true;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scratchedDays));
    } catch (e) {
      console.error("Error saving progress to localStorage", e);
    }
  }

  function resetProgress() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log("Local storage progress cleared. Reloading page.");
      window.location.reload();
    } catch (e) {
      console.error("Error clearing progress from localStorage", e);
    }
  }

  loadProgress();
  if (resetBtn) {
    resetBtn.addEventListener('click', resetProgress);
  }

  // --- MENU LOGIC ---
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuClose = document.getElementById('menuClose');

  if (hamburgerBtn && mobileMenu && menuClose) {
    hamburgerBtn.addEventListener('click', () => {
      mobileMenu.classList.add('open');
      mobileMenu.setAttribute('aria-hidden', 'false');
    });

    menuClose.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      mobileMenu.setAttribute('aria-hidden', 'true');
    });

    document.addEventListener('click', (e) => {
      if (mobileMenu.classList.contains('open') &&
        !mobileMenu.contains(e.target) &&
        e.target !== hamburgerBtn &&
        !hamburgerBtn.contains(e.target)) {
        mobileMenu.classList.remove('open');
        mobileMenu.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // --- MODAL LOGIC ---
  function openModal(node) {
    if (!modalBody) return;
    modalBody.innerHTML = "";
    if (node && node.cloneNode) {
      const clone = node.cloneNode(true);
      const plate = clone.querySelector('.number-plate');
      if (plate) {
        plate.remove();
      }
      modalBody.appendChild(clone);
    }
    if (modal) modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    if (modal) modal.setAttribute("aria-hidden", "true");
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modal) modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // --- CANVAS UTILITIES ---
  function localPos(canvas, clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function checkRevealed(card) {
    const s = card._scratch;
    if (!s || s.revealed) return;
    try {
      const imageData = s.ctx.getImageData(0, 0, s.cssW, s.cssH);
      const data = imageData.data;
      let clear = 0;
      const len = data.length;
      const step = 4 * 40;
      let total = 0;
      for (let i = 3; i < len; i += step) {
        total++;
        if (data[i] === 0) clear++;
      }
      if ((clear / total) > 0.4) {
        s.revealed = true;
        card.classList.add("revealed");
        saveProgress(card.dataset.day);
        const contentNode = card.querySelector(".content");
        if (contentNode) openModal(contentNode);
      }
    } catch (err) {
      console.error("Error during checkRevealed:", err);
    }
  }

  /**
   * Initializes the scratch canvas size, drawing context, and state.
   */
  function initCanvas(card) {
    const canvas = card.querySelector(".scratch");
    if (!canvas) return;

    try {
      const ctx = canvas.getContext("2d");
      const day = card.dataset.day;

      // Apply background image style
      const imgSrc = card.dataset.img;
      if (imgSrc) {
        card.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.18)), url('${imgSrc}')`;
        card.style.backgroundSize = "cover";
        card.style.backgroundPosition = "center";
      }

      // Set size properties
      const cssW = Math.max(1, Math.round(card.clientWidth));
      const cssH = Math.max(1, Math.round(card.clientHeight));

      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      canvas.width = Math.floor(cssW * DPR);
      canvas.height = Math.floor(cssH * DPR);

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      // Draw initial scratch cover
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#d8d8d8";
      ctx.fillRect(0, 0, cssW, cssH);

      // Set composite operation for erasing
      ctx.globalCompositeOperation = "destination-out";

      // Store scratch state
      card._scratch = {
        canvas,
        ctx,
        cssW,
        cssH,
        brush: Math.max(25, Math.round(Math.max(cssW, cssH) * 0.10)),
        revealed: false
      };

      // Apply saved progress
      if (scratchedDays[day]) {
        card.classList.add("revealed");
        card._scratch.revealed = true;
        canvas.style.display = 'none';
      }
      return card._scratch;

    } catch (e) {
      console.error("Failed to initialize canvas for card:", day, e);
      return null;
    }
  }

  // --- CARD INTERACTION LOGIC (Applies only to index.html cards with canvas) ---
  function setupScratchLogic(card, s) {
    if (!s) return;

    const { canvas } = s;
    let drawing = false;
    let last = null;
    let moveCounter = 0;

    function eraseAt(x, y) {
      s.ctx.beginPath();
      s.ctx.arc(x, y, s.brush, 0, Math.PI * 2);
      s.ctx.fill();
    }

    function onDown(x, y) {
      if (s.revealed) return;
      drawing = true;
      last = { x, y };
    }

    function onMove(x, y) {
      if (!drawing || s.revealed) return;

      const dist = Math.hypot(x - last.x, y - last.y);
      const steps = Math.ceil(dist / (s.brush * 0.25));
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        eraseAt(last.x + (x - last.x) * t, last.y + (y - last.y) * t);
      }
      last = { x, y };

      moveCounter++;
      if (moveCounter % 20 === 0) {
        checkRevealed(card);
      }
    }

    function onUp() {
      if (drawing) {
        drawing = false;
        last = null;
        checkRevealed(card);
      }
    }

    // Pointer Events
    canvas.addEventListener("pointerdown", e => {
      if (e.pointerType === "mouse") e.preventDefault();
      const p = localPos(canvas, e.clientX, e.clientY);
      onDown(p.x, p.y);
    });

    canvas.addEventListener("pointermove", e => {
      if (drawing && e.cancelable) {
        if (e.pointerType === "mouse" || e.pointerType === "touch") {
          e.preventDefault();
          const p = localPos(canvas, e.clientX, e.clientY);
          onMove(p.x, p.y);
        }
      }
    });

    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    // Click listener for modal on scratched cards
    card.addEventListener("click", (e) => {
      if (e.target.closest('a') !== null) return;

      if (card.classList.contains("revealed")) {
        const contentNode = card.querySelector(".content");
        if (contentNode) openModal(contentNode);
      }
    });
  }

  // --- CARD INTERACTION LOGIC (Applies to all-bottles*.html revealed cards) ---
  function setupClickableCardLogic(card) {
    // Only set up for cards that are meant to be purely clickable (i.e., not the scratch card page)
    card.addEventListener("click", (e) => {
      // Prevent modal opening if user clicks the actual 'Buy' link
      if (e.target.closest('a') !== null) return;

      const contentNode = card.querySelector(".content");
      if (contentNode) openModal(contentNode);
    });

    // Stop button click propagation
    const detailLink = card.querySelector('.btn');
    if (detailLink) {
      detailLink.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  }

  // --- MAIN INITIALIZATION LOOP ---
  cards.forEach(card => {
    const canvas = card.querySelector(".scratch");

    if (canvas) {
      // Index page (Scratchable Cards)
      const scratchState = initCanvas(card);
      setupScratchLogic(card, scratchState);
    } else if (card.classList.contains('revealed')) {
      // All Bottles pages (Pre-revealed, clickable cards)
      setupClickableCardLogic(card);
    }
  });

  // --- RESIZE HANDLER (Re-initializes canvas properties without drawing) ---
  let rt = null;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      cards.forEach(card => {
        if (card.querySelector('.scratch') && card._scratch && !card._scratch.revealed) {
          const canvas = card.querySelector(".scratch");
          const cardEl = card.closest('.card');

          const cssW = Math.max(1, Math.round(cardEl.clientWidth));
          const cssH = Math.max(1, Math.round(cardEl.clientHeight));

          canvas.style.width = cssW + "px";
          canvas.style.height = cssH + "px";
          canvas.width = Math.floor(cssW * DPR);
          canvas.height = Math.floor(cssH * DPR);

          // Re-apply DPR transform
          card._scratch.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
          // Redraw cover if needed (in a production environment, you'd save the scratch path, but here we just reset the context)
          card._scratch.ctx.globalCompositeOperation = "source-over";
          card._scratch.ctx.fillStyle = "#d8d8d8";
          card._scratch.ctx.fillRect(0, 0, cssW, cssH);
          card._scratch.ctx.globalCompositeOperation = "destination-out";
        }
      });
    }, 120);
  });
  
  // --- SNOW GENERATOR ---
  (function createSnow(num = 30) {
    const container = document.getElementById('snow-container');
    if (!container) return;
    for (let i = 0; i < num; i++) {
      const el = document.createElement('div');
      el.className = 'snowflake';
      el.textContent = '❄';
      const left = Math.random() * 100;
      const size = 10 + Math.random() * 15;
      const dur = 8 + Math.random() * 10;
      const sway = (Math.random() - 0.5) * 40; // px
      
      el.style.left = left + 'vw';
      el.style.fontSize = size + 'px';
      el.style.setProperty('--fall-duration', `${dur}s`);
      el.style.setProperty('--sway-duration', `${3 + Math.random() * 4}s`);
      el.style.setProperty('--sway', `${sway}px`);
      
      container.appendChild(el);
      
      // Recycle/Respawn snowflakes
      el.addEventListener('animationend', () => {
        el.style.left = (Math.random() * 100) + 'vw';
        el.style.fontSize = (10 + Math.random() * 15) + 'px';
        el.style.setProperty('--fall-duration', `${8 + Math.random() * 12}s`);
        el.style.setProperty('--sway-duration', `${3 + Math.random() * 4}s`);
        el.style.setProperty('--sway', `${(Math.random() - 0.5) * 50}px`);
      });
    }
  })();

});