// Bourbon Data
const bourbons = [
    { name: "Bourbon A", description: "A rich and smooth bourbon with caramel and oak flavors." },
    { name: "Bourbon B", description: "A bold bourbon with hints of vanilla and spices." },
    { name: "Bourbon C", description: "A complex bourbon with notes of dried fruit and nutmeg." },
    { name: "Bourbon D", description: "A mellow bourbon with subtle hints of honey and cinnamon." },
    { name: "Bourbon E", description: "A spicy bourbon with a touch of cherry and toasted oak." },
    { name: "Bourbon F", description: "A deep bourbon with earthy flavors and a smooth finish." },
    { name: "Bourbon G", description: "A balanced bourbon with vanilla, caramel, and a light smoky note." },
    { name: "Bourbon H", description: "A luxurious bourbon with hints of chocolate and toasted nuts." },
    { name: "Bourbon I", description: "A classic bourbon with bold flavors of rye and pepper." },
    { name: "Bourbon J", description: "A sweet bourbon with hints of caramel, brown sugar, and butter." },
    { name: "Bourbon K", description: "A refined bourbon with flavors of orange zest and toasted almonds." },
    { name: "Bourbon L", description: "A smooth bourbon with hints of vanilla, caramel, and light spice." }
];

// Open the modal and show bourbon details
function openModal(day) {
    const bourbon = bourbons[day - 1]; // Get the bourbon for the selected day
    document.getElementById("bourbon-name").textContent = bourbon.name;
    document.getElementById("bourbon-description").textContent = bourbon.description;
    document.getElementById("bourbon-modal").style.display = 'flex';
}

// Close the modal
function closeModal() {
    document.getElementById("bourbon-modal").style.display = 'none';
}

// Add event listeners to each door
document.querySelectorAll('.door').forEach(door => {
    door.addEventListener('click', () => {
        const day = door.getAttribute('data-day');
        openModal(day);
    });
});
