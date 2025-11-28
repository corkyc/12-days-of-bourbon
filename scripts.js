// Array of Bourbon bottles (You can replace these descriptions with your actual bourbons)
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

// Function to open the bourbon details
function openBourbonDetails(day) {
    const bourbon = bourbons[day - 1];
    document.getElementById("bourbon-title").innerText = bourbon.name;
    document.getElementById("bourbon-description").innerText = bourbon.description;
    document.getElementById("bourbon-details").style.display = 'flex';
}

// Close the bourbon details modal
function closeBourbonDetails() {
    document.getElementById("bourbon-details").style.display = 'none';
}

// Add event listeners for each door
document.querySelectorAll('.door').forEach(door => {
    door.addEventListener('click', () => {
        const day = door.getAttribute('data-day');
        door.classList.add('unlocked');
        openBourbonDetails(day);
    });
});
