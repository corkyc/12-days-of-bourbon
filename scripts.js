// Bourbon Data (with images)
const bourbons = [
    {
        name: "Bourbon A",
        description: "A rich and smooth bourbon with caramel and oak flavors.",
        image: "https://raw.githubusercontent.com/corkyc/12-days-of-bourbon/main/images/4R_SB.jpg" // Placeholder image
    },
    {
        name: "Bourbon B",
        description: "A bold bourbon with hints of vanilla and spices.",
        image: "https://via.placeholder.com/300x500.png?text=Bourbon+B"
    },
    {
        name: "Bourbon C",
        description: "A complex bourbon with notes of dried fruit and nutmeg.",
        image: "https://via.placeholder.com/300x500.png?text=Bourbon+C"
    },
    {
        name: "Bourbon D",
        description: "A mellow bourbon with subtle hints of honey and cinnamon.",
        image: "https://via.placeholder.com/300x500.png?text=Bourbon+D"
    },
    {
        name: "Bourbon E",
        description: "A spicy bourbon with a touch of cherry and toasted oak.",
        image: "https://via.placeholder.com/300x500.png?text=Bourbon+E"
    },
    {
        name: "Bourbon F",
        description: "A deep bourbon with earthy flavors and a smooth finish.",
        image: "https://via.placeholder.com/300x500.png?text=Bourbon+F"
    },
    {
        name: "Bourbon G",
        description: "A balanced bourbon with vanilla, caramel, and a light smoky note.",
        image: "https://via.placeholder.com/300x500.png?text=Bourbon+G"
    },
    {
        name: "Bourbon H",
        description: "A luxurious bourbon with hints of chocolate and toasted nuts.",
        image: "https://via.placeholder.com/300x500.png?text=Bourbon+H"
    },
    {
        name: "Bourbon I",
        description: "A classic bourbon with bold flavors of rye and pepper.",
        image: "https://via.placeholder.com/300x500.png?text=Bourbon+I"
    },
    {
        name: "Bourbon J",
        description: "A sweet bourbon with hints of caramel, brown sugar, and butter.",
        image: "https://via.placeholder.com/300x500.png?text=Bourbon+J"
    },
    {
        name: "Bourbon K",
        description: "A refined bourbon with flavors of orange zest and toasted almonds.",
        image: "https://via.placeholder.com/300x500.png?text=Bourbon+K"
    },
    {
        name: "Bourbon L",
        description: "A smooth bourbon with hints of vanilla, caramel, and light spice.",
        image: "https://via.placeholder.com/300x500.png?text=Bourbon+L"
    }
];

// Open the modal and show bourbon details including the image
function openModal(day) {
    const bourbon = bourbons[day - 1]; // Get the bourbon for the selected day
    document.getElementById("bourbon-name").textContent = bourbon.name;
    document.getElementById("bourbon-description").textContent = bourbon.description;
    document.getElementById("bourbon-image").src = bourbon.image; // Set the image source
    document.getElementById("bourbon-modal").style.display = 'flex';
}

// Close the modal
function closeModal() {
    document.getElementById("bourbon-modal").style.display = 'none';
}

document.getElementById('hamburger').addEventListener('click', function() {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.toggle('active');
});

  // Select hamburger and nav menu
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');

  // Toggle 'open' class on hamburger click
  hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    document.body.classList.toggle('nav-active'); // Toggle the body padding
  });

// Add event listeners to each door
document.querySelectorAll('.door').forEach(door => {
    door.addEventListener('click', () => {
        const day = door.getAttribute('data-day');
        openModal(day);
    });
});






