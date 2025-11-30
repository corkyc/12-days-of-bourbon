document.addEventListener("DOMContentLoaded", () => {
  const DPR = window.devicePixelRatio || 1;
  const cards = Array.from(document.querySelectorAll(".card"));
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");
  const modalClose = document.getElementById("modalClose");

  // --- MODAL LOGIC ---
  function openModal(node) {
    if (!modalBody) return;
    modalBody.innerHTML = "";

    if (node && node.cloneNode) {
      const clone = node.cloneNode(true);
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

  // --- CANVAS INIT ---
  function initCanvas(card) {
    const canvas = card.querySelector(".scratch");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Apply "cover" image
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

    // Draw scratch coating
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#d8d8d8"; 
    ctx.fillRect(0, 0, cssW, cssH);

    // Switch to erase mode
    ctx.globalCompositeOperation = "destination-out";

    card._scratch = {
      canvas,
      ctx,
      cssW,
      cssH,
      brush: Math.max(20, Math.round(Math.max(cssW, cssH) * 0.08)),
      revealed: false
    };
  }

  // Init all
  cards.forEach(initCanvas);

  // Resize handler
  let rt = null;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      cards.forEach(card => { 
        if (!card._scratch.revealed) initCanvas(card); 
      });
    }, 120);
  });

  // Helper for coordinates
  function localPos(canvas, clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { 
      x: clientX - r.left, 
      y: clientY - r.top 
    };
  }

  // Check revealed percentage
  function isRevealed(card) {
    const s = card._scratch;
    if (!s || s.revealed) return true;
    try {
      const imageData = s.ctx.getImageData(0, 0, s.cssW, s.cssH);
      const data = imageData.data;
      let clear = 0;
      const len = data.length;
      const step = 4 * 32; 
      let total = 0;
      for (let i = 3; i < len; i += step) {
        total++;
        if (data[i] === 0) clear++;
      }
      return (clear / total) > 0.4;
    } catch (err) {
      return true;
    }
  }

  // --- DRAWING LOGIC (Fixed for Scrolling) ---
  cards.forEach(card => {
    const s = card._scratch;
    if (!s) return;
    const { canvas, ctx } = s;
    let drawing = false;
    let last = null;

    function eraseAt(x, y) {
      ctx.beginPath();
      ctx.arc(x, y, s.brush, 0, Math.PI * 2);
      ctx.fill();
    }

    function onDown(x, y) {
      if (s.revealed) return;
      drawing = true;
      last = { x, y };
      // NOTE: We do NOT erase here immediately. 
      // This prevents a dot from appearing if the user just taps to scroll.
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
      
      if (isRevealed(card)) {
        s.revealed = true;
        card.classList.add("revealed");
        const contentNode = card.querySelector(".content");
        if (contentNode) openModal(contentNode);
      }
    }

    function onUp() {
      drawing = false;
      last = null;
    }

    // --- POINTER EVENTS ---
    
    canvas.addEventListener("pointerdown", e => {
      // 1. Allow Touch scrolling to happen naturally (don't preventDefault).
      // 2. Only preventDefault for mouse so we don't drag the image.
      if (e.pointerType === "mouse") {
        e.preventDefault();
      }
      
      const p = localPos(canvas, e.clientX, e.clientY);
      onDown(p.x, p.y);
    });

    canvas.addEventListener("pointermove", e => {
      // If we are drawing, check if we need to prevent native behavior.
      // e.cancelable will be false if the browser has already decided this is a scroll.
      if (drawing && e.cancelable) {
        // If it's a mouse, or if we've moved sideways enough for the browser
        // to agree it's NOT a scroll (due to touch-action: pan-y), we scratch.
        if (e.pointerType === "mouse" || (e.pointerType === "touch")) {
           e.preventDefault(); 
           const p = localPos(canvas, e.clientX, e.clientY);
           onMove(p.x, p.y);
        }
      }
    });

    canvas.addEventListener("pointerup", onUp);
    
    // pointercancel fires if the browser decides "This is a scroll, cancel the JS logic"
    canvas.addEventListener("pointercancel", onUp);

    // Click handler for already revealed cards
    card.addEventListener("click", () => {
      if (card.classList.contains("revealed")) {
        const contentNode = card.querySelector(".content");
        if (contentNode) openModal(contentNode);
      }
    });
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
      el.style.left = left + 'vw';
      el.style.fontSize = size + 'px';
      el.style.setProperty('--fall-duration', `${dur}s`);
      el.style.setProperty('--sway-duration', `${3 + Math.random() * 4}s`);
      container.appendChild(el);
      
      el.addEventListener('animationend', () => {
        el.style.left = (Math.random() * 100) + 'vw';
        el.style.setProperty('--fall-duration', `${8 + Math.random() * 12}s`);
      });
    }
  })();
});
