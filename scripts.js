// Get the hamburger menu and the nav links
const hamburger = document.getElementById('hamburger');
const navMenu = document.querySelector('.nav-links');

// Toggle the active class to show/hide the navigation menu
hamburger.addEventListener('click', () => {
  navMenu.classList.toggle('active');
});

// Handle door clicks to show the content behind each door
const doors = document.querySelectorAll('.door');

doors.forEach(door => {
  door.addEventListener('click', () => {
    door.classList.toggle('open'); // Toggle the door content visibility
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('.door').forEach(door => {
    door.addEventListener('click', () => {
      // toggle a class on the door which CSS uses to hide/show the number
      door.classList.toggle('number-hidden');
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('.scratch-canvas').forEach(canvas => {
    const ctx = canvas.getContext('2d');
    const door = canvas.parentElement;

    // Size canvas to match the door
    canvas.width = door.offsetWidth;
    canvas.height = door.offsetHeight;

    // Fill with scratch-off covering color or image
    ctx.fillStyle = "#AFAFAF";  // scratch-off color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let scratching = false;

    const scratch = (x, y) => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
    };

    canvas.addEventListener("touchstart", e => {
      scratching = true;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      scratch(touch.clientX - rect.left, touch.clientY - rect.top);
    });

    canvas.addEventListener("touchmove", e => {
      if (!scratching) return;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      scratch(touch.clientX - rect.left, touch.clientY - rect.top);
    });

    canvas.addEventListener("touchend", () => scratching = false);
  });
});