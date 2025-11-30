document.addEventListener("DOMContentLoaded", () => {
  const doors = document.querySelectorAll(".door");

  doors.forEach(door => {
    // Load wood background
    const bg = door.getAttribute("data-bg");
    if (bg) {
      door.style.backgroundImage = `url('${bg}')`;
    }

    const canvas = door.querySelector("canvas.scratch");
    const ctx = canvas.getContext("2d");

    // Set canvas size
    function resizeCanvas() {
      canvas.width = door.clientWidth;
      canvas.height = door.clientHeight;
      ctx.fillStyle = "#aaa";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let scratching = false;

    function scratch(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    canvas.addEventListener("mousedown", () => scratching = true);
    canvas.addEventListener("mouseup", () => scratching = false);
    canvas.addEventListener("mouseleave", () => scratching = false);

    canvas.addEventListener("mousemove", e => scratching && scratch(e));

    canvas.addEventListener("touchstart", e => {
      scratching = true;
      scratch(e);
    });

    canvas.addEventListener("touchend", () => scratching = false);
    canvas.addEventListener("touchmove", e => {
      e.preventDefault();
      scratching && scratch(e);
    });

    // Reveal modal after 60% scratched
    canvas.addEventListener("mouseup", () => checkReveal());
    canvas.addEventListener("touchend", () => checkReveal());

    function checkReveal() {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let cleared = 0;

      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] === 0) cleared++;
      }

      const percent = cleared / (pixels.length / 4);

      if (percent > 0.6) {
        canvas.style.pointerEvents = "none";
        const modal = document.getElementById(door.dataset.modalId);
        modal.style.display = "flex";
      }
    }
  });

  // Modal closing
  document.querySelectorAll(".close").forEach(closeBtn => {
    closeBtn.addEventListener("click", () => {
      closeBtn.parentElement.parentElement.style.display = "none";
    });
  });
});
