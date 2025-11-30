document.addEventListener("DOMContentLoaded", () => {
  const doors = document.querySelectorAll(".door");
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modalBody");
  const closeModal = document.getElementById("closeModal");

  closeModal.addEventListener("click", () => modal.style.display = "none");

  doors.forEach(door => {
    const canvas = door.querySelector(".scratch-canvas");
    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
      canvas.width = door.clientWidth;
      canvas.height = door.clientHeight;
      ctx.fillStyle = "#bfbfbf";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let scratching = false;

    const start = (e) => {
      scratching = true;
      scratch(e);
    };

    const end = () => {
      scratching = false;
      checkReveal();
    };

    const scratch = (e) => {
      if (!scratching) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fill();
    };

    const checkReveal = () => {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let total = data.length / 4;
      let cleared = 0;

      for (let i = 3; i < data.length; i += 4) {
        if (data[i] === 0) cleared++;
      }

      if (cleared / total > 0.45) reveal(door, canvas);
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", scratch);
    document.addEventListener("mouseup", end);

    canvas.addEventListener("touchstart", start);
    canvas.addEventListener("touchmove", scratch);
    document.addEventListener("touchend", end);
  });

  function reveal(door, canvas) {
    canvas.style.display = "none"; // Remove scratch layer
    const hidden = door.querySelector(".hidden-data");

    modalBody.innerHTML = hidden.innerHTML;
    modal.style.display = "flex";
  }
});
