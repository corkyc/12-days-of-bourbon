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
      // Clone the content node so the original stays in the grid
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
    if (!canvas) return; // Guard clause
    const ctx = canvas.getContext("2d");

    // Apply the "cover" image (e.g. wood barrel) to the card background
    const imgSrc = card.dataset.img;
    if (imgSrc) {
      // We set this inline. Note: CSS !important on .revealed overrides this.
      card.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.18)), url('${imgSrc}')`;
      card.style.backgroundSize = "cover";
      card.style.backgroundPosition = "center";
    }

    // CSS size
    const cssW = Math.max(1, Math.round(card.clientWidth));
    const cssH = Math.max(1, Math.round(card.clientHeight));

    // Canvas size (DPR adjusted)
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.floor(cssW * DPR);
    canvas.height = Math.floor(cssH * DPR);

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // Draw scratch coating (grey/silver)
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#d8d8d8"; 
    // You could also draw an image here for the scratch surface if desired
    ctx.fillRect(0, 0, cssW, cssH);

    // Switch to erase mode
    ctx.globalCompositeOperation = "destination-out";

    // Store state
    card._scratch = {
      canvas,
      ctx,
      cssW,
      cssH,
      brush: Math.max(20, Math.round(Math.max(cssW, cssH) * 0.08)), // Slightly larger brush
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

  // Check how much is scratched
  function isRevealed(card) {
    const s = card._scratch;
    if (!s || s.revealed) return true;
    try {
      // Sample pixels
      const imageData = s.ctx.getImageData(0, 0, s.cssW, s.cssH);
      const data = imageData.data;
      let clear = 0;
      // We only need to check alpha channel (every 4th byte)
      // Step by 32 to speed up loop (approx sampling)
      const len = data.length;
      const step = 4 * 32; 
      let total = 0;
      for (let i = 3; i < len; i += step) {
        total++;
        if (data[i] === 0) clear++;
      }
      return (clear / total) > 0.4; // 40% cleared triggers reveal
    } catch (err) {
      return true; // Fallback
    }
  }

  // --- DRAWING LOGIC ---
  cards.forEach(card => {
    const s = card._scratch;
    if (!s) return;
    const { canvas, ctx } = s;
    let drawing = false;
    let last = null;

// ... inside the cards.forEach loop ...

    // --- DRAWING LOGIC (Updated for Mobile Scrolling) ---
    
    function eraseAt(x, y) {
      ctx.beginPath();
      ctx.arc(x, y, s.brush, 0, Math.PI * 2);
      ctx.fill();
    }

    function onDown(x, y) {
      if (s.revealed) return;
      drawing = true;
      last = { x, y };
      eraseAt(x, y);
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
      
      // Check reveal status
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

    // Pointer Events
    canvas.addEventListener("pointerdown", e => {
      // FIX: Do NOT preventDefault here for touch. 
      // This allows the browser to start a scroll if the user moves vertically.
      // We only preventDefault for mouse so it doesn't drag the image.
      if (e.pointerType === "mouse") {
        e.preventDefault();
      }
      
      const p = localPos(canvas, e.clientX, e.clientY);
      onDown(p.x, p.y);
      
      // FIX: Do not setPointerCapture immediately. 
      // Let the browser claim the pointer if it decides this is a scroll.
    });

    canvas.addEventListener("pointermove", e => {
      // If the user is drawing (and the browser hasn't taken over for scrolling),
      // we prevent default to stop text selection or native zooming.
      if (drawing && e.cancelable) {
        e.preventDefault();
      }
      const p = localPos(canvas, e.clientX, e.clientY);
      onMove(p.x, p.y);
    });

    // Cleanup events
    canvas.addEventListener("pointerup", onUp);
    
    // This fires if the browser decides "This is actually a scroll, stop the JS."
    canvas.addEventListener("pointercancel", onUp); 

    // Click handler for already revealed cards
    card.addEventListener("click", () => {
      if (card.classList.contains("revealed")) {
        const contentNode = card.querySelector(".content");
        if (contentNode) openModal(contentNode);
      }
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
