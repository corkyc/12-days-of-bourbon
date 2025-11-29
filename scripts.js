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
      const number = door.querySelector('.door_number');
      if (number) {
        if (number.style.display === 'none') {
          number.style.display = 'block';   // show it
        } else {
          number.style.display = 'none';    // hide it
        }
      }
    });
  });
});