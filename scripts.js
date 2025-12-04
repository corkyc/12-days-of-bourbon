/*
  Note: This script includes Back-to-Top logic,
  Persistent Confirmation logic, and the main Scratch-Off game functionality.
*/
document.addEventListener("DOMContentLoaded", () => {
  const DPR = window.devicePixelRatio || 1;
  const cards = Array.from(document.querySelectorAll(".card"));
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");
  const modalClose = document.getElementById("modalClose");
  const resetBtn = document.getElementById('resetProgressBtn');
  const backToTopBtn = document.getElementById('backToTopBtn'); // NEW

  // Confirmation Modal Elements
  const confirmModal = document.getElementById('confirmModal');
  const confirmTitle = document.getElementById('confirmTitle');
  const confirmMessage = document.getElementById('confirmMessage');
  const confirmYes = document.getElementById('confirmYes');
  const confirmNo = document.getElementById('confirmNo');

  // --- LOCAL STORAGE STATE & MANAGEMENT (PERSISTENCE) ---
  const STORAGE_KEY = 'scratchedDays';
  const LS_KEY_SEMI_SPOILER = 'semiSpoiler'; 
  const LS_KEY_MAJOR_SPOILER = 'majorSpoiler'; 

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

  // Removed saveSpoilerConfirmation function

  // Removed checkSpoilerConfirmation function

  function resetProgress() {
    try {
      // Clears door progress AND spoiler warnings
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LS_KEY_SEMI_SPOILER);
      localStorage.removeItem(LS_KEY_MAJOR_SPOILER);
      console.log("All local storage cleared. Reloading page.");
      window.location.reload();
    } catch (e) {
      console.error("Error clearing progress from localStorage", e);
    }
  }

  loadProgress();
  if (resetBtn) {
    resetBtn.addEventListener('click', resetProgress);
  }

  // --- NAVIGATION / MENU LOGIC ---
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuClose = document.getElementById('menuClose');
  const menuLinks = document.querySelectorAll('.mobile-menu a');

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

  // --- CONFIRMATION MODAL LOGIC ---
  let confirmedLinkHref = null;
  let confirmedLinkSpoilerKey = null;

  function openConfirmModal(title, message, href, spoilerKey) {
    if (!confirmModal) return;

    confirmedLinkHref = href;
    confirmedLinkSpoilerKey = spoilerKey;

    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmModal.setAttribute("aria-hidden", "false");

    if (mobileMenu) {
        mobileMenu.classList.remove('open');
        mobileMenu.setAttribute('aria-hidden', 'true');
    }
  }

  function closeConfirmModal() {
    if (confirmModal) {
        confirmModal.setAttribute("aria-hidden", "true");
        confirmedLinkHref = null; 
        confirmedLinkSpoilerKey = null;
    }
  }

  // Set up listeners for the confirmation buttons
  if (confirmNo) confirmNo.addEventListener('click', closeConfirmModal);
  if (confirmYes) confirmYes.addEventListener('click', () => {
      if (confirmedLinkHref) {
          // Removed: saveSpoilerConfirmation logic
          // 2. Navigate
          window.location.href = confirmedLinkHref;
      }
      closeConfirmModal();
  });

  // Intercept menu clicks
  menuLinks.forEach(link => {
      link.addEventListener('click', (e) => {
          const requiresConfirm = link.dataset.requiresConfirm === 'true';
          const spoilerKey = link.dataset.spoilerKey;

          if (requiresConfirm) {
              e.preventDefault();

              // Removed: checkSpoilerConfirmation logic

              // Force modal to show every time if requiresConfirm is true
              const title = link.dataset.confirmTitle || "Confirm Navigation";
              const message = link.dataset.confirmMessage || "Are you sure you want to visit this page?";
              openConfirmModal(title, message, link.href, spoilerKey);
          }
      });
  });
  
  // FIX: Allow clicking outside confirmation modal to close
  if (confirmModal) {
    confirmModal.addEventListener("click", (e) => {
      if (e.target === confirmModal) {
        closeConfirmModal();
      }
    });
  }

  // --- MAIN MODAL LOGIC (Bottle Details) ---

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
  
  // FIX: Allow clicking outside bottle detail modal to close
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // --- CANVAS / SCRATCH LOGIC ---

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

  function initCanvas(card) {
    const canvas = card.querySelector(".scratch");
    if (!canvas) return;

    try {
      const ctx = canvas.getContext("2d");
      const day = card.dataset.day;

      const imgSrc = card.dataset.img;
      if (imgSrc) {
        card.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.18)), url('${imgSrc}')`;
        card.style.backgroundSize = "cover";
        card.style.backgroundPosition = "center";
      }

      const cssW = Math.max(1, Math.round(card.clientWidth));
      const cssH = Math.max(1, Math.round(card.clientHeight));

      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      canvas.width = Math.floor(cssW * DPR);
      canvas.height = Math.floor(cssH * DPR);

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#d8d8d8";
      ctx.fillRect(0, 0, cssW, cssH);

      ctx.globalCompositeOperation = "destination-out";

      card._scratch = {
        canvas,
        ctx,
        cssW,
        cssH,
        brush: Math.max(25, Math.round(Math.max(cssW, cssH) * 0.10)),
        revealed: false
      };

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
  }

  function setupClickableCardLogic(card) {
    const detailLink = card.querySelector('.btn');
    if (detailLink) {
      detailLink.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  }

  cards.forEach(card => {
    const canvas = card.querySelector(".scratch");

    if (canvas) {
      const scratchState = initCanvas(card);
      setupScratchLogic(card, scratchState);
    } else if (card.classList.contains('revealed')) {
      setupClickableCardLogic(card);
    }
    
    // Attach the modal click handler ONCE to the card element itself, 
    card.addEventListener("click", (e) => {
        if (e.target.closest('a') !== null) return; 

        if (card.classList.contains("revealed")) {
            const contentNode = card.querySelector(".content");
            if (contentNode) openModal(contentNode);
        }
    });
  });

  let rt = null;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      cards.forEach(card => {
        if (card.querySelector('.scratch') && card._scratch && !card._scratch.revealed) {
          const canvas = card.querySelector(".scratch");
          const cardEl = card.closest('.card');
          const scratchState = card._scratch;

          const cssW = Math.max(1, Math.round(cardEl.clientWidth));
          const cssH = Math.max(1, Math.round(cardEl.clientHeight));

          canvas.style.width = cssW + "px";
          canvas.style.height = cssH + "px";
          canvas.width = Math.floor(cssW * DPR);
          canvas.height = Math.floor(cssH * DPR);

          scratchState.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
          scratchState.ctx.globalCompositeOperation = "source-over";
          scratchState.ctx.fillStyle = "#d8d8d8";
          scratchState.ctx.fillRect(0, 0, cssW, cssH);
          scratchState.ctx.globalCompositeOperation = "destination-out";
        }
      });
    }, 120);
  });

  // --- BACK TO TOP LOGIC ---
  if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      window.addEventListener('scroll', () => {
          if (window.scrollY > 300) { // Show button after scrolling 300px
              backToTopBtn.classList.add('visible');
          } else {
              backToTopBtn.classList.remove('visible');
          }
      });
  }
  
  // --- TEMPORARY SNOW GENERATOR ---
  (function createSnow(num = 75, initialDurationSeconds = 5) {
    const container = document.getElementById('snow-container');
    if (!container) return;
    
    let activeFlakes = 0;
    const SNOW_COLORS = ['#FFFFFF', '#F0F8FF', '#CCFFFF', '#99FFFF', '#B0E0E6']; 
    const SNOW_CHARS = ['❄', '❅', '❆', '✶', '✷', '✵']; 

    function handleFlakeEnd(event) {
        if (event.animationName === 'fall-fixed') {
            event.target.removeEventListener('animationend', handleFlakeEnd);
            event.target.remove();
            activeFlakes--;
            
            if (flakesGenerated >= totalFlakesToGenerate && activeFlakes <= 0) {
                removeContainer();
            }
        }
    }

    function removeContainer() {
        container.innerHTML = '';
        container.remove();
        console.log(`Snowfall effect complete and container removed.`);
    }

    let generationInterval;
    let flakesGenerated = 0;
    const totalFlakesToGenerate = num; 
    const intervalTime = (initialDurationSeconds * 1000) / totalFlakesToGenerate; 

    function generateFlake() {
      if (flakesGenerated >= totalFlakesToGenerate) {
          clearInterval(generationInterval);
          console.