const bourbonData = {
    1: { name: 'Bourbon A', description: 'A smooth, rich bourbon with hints of vanilla and caramel.', image: 'images/bourbon1.jpg' },
    2: { name: 'Bourbon B', description: 'A full-bodied bourbon with a smoky finish.', image: 'images/bourbon2.jpg' },
    3: { name: 'Bourbon C', description: 'A mellow bourbon with fruity and spicy notes.', image: 'images/bourbon3.jpg' },
    4: { name: 'Bourbon D', description: 'A bold bourbon with a peppery kick and oak undertones.', image: 'images/bourbon4.jpg' },
    5: { name: 'Bourbon E', description: 'A rich and creamy bourbon with chocolate notes.', image: 'images/bourbon5.jpg' },
    6: { name: 'Bourbon F', description: 'A spicy and sweet bourbon with a warm finish.', image: 'images/bourbon6.jpg' },
    7: { name: 'Bourbon G', description: 'A light, floral bourbon with a crisp finish.', image: 'images/bourbon7.jpg' },
    8: { name: 'Bourbon H', description: 'A well-rounded bourbon with hints of cinnamon and oak.', image: 'images/bourbon8.jpg' },
    9: { name: 'Bourbon I', description: 'A robust bourbon with smoky, caramelized flavors.', image: 'images/bourbon9.jpg' },
    10: { name: 'Bourbon J', description: 'A classic bourbon with a touch of sweetness and spice.', image: 'images/bourbon10.jpg' },
    11: { name: 'Bourbon K', description: 'A rich, complex bourbon with vanilla and nutmeg notes.', image: 'images/bourbon11.jpg' },
    12: { name: 'Bourbon L', description: 'A smooth, oaky bourbon with a hint of maple syrup.', image: 'images/bourbon12.jpg' }
};

function revealBourbon(day) {
    const door = document.getElementById(`day${day}`);
    const bourbon = bourbonData[day];
    
    // Change the door's background to the bourbon bottle image
    door.style.backgroundImage = `url(${bourbon.image})`;
    door.style.backgroundSize = 'cover';
    door.style.backgroundPosition = 'center';
    door.innerHTML = `
        <div class="bourbon-info">
            <h3>${bourbon.name}</h3>
            <p>${bourbon.description}</p>
        </div>
    `;
    door.classList.add('unlocked');
    door.classList.remove('locked');
}

// Reset Progress function (unchanged)
function resetProgress() {
    for (let i = 1; i <= 12; i++) {
        const door = document.getElementById(`day${i}`);
        door.classList.remove('unlocked');
        door.classList.add('locked');
        door.innerHTML = i;
        door.style.backgroundImage = 'url(https://www.transparenttextures.com/patterns/wood-pattern.png)'; // Default wood texture
    }
}
