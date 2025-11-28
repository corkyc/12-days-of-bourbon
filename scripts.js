// Initialize progress
function initializeProgress() {
    if (!localStorage.getItem('bourbonProgress')) {
        // If no progress stored, set default to "0" (no days unlocked)
        localStorage.setItem('bourbonProgress', JSON.stringify(Array(12).fill(false)));
    }
    updateDoors();
}

// Update door states based on progress
function updateDoors() {
    let progress = JSON.parse(localStorage.getItem('bourbonProgress'));

    for (let i = 0; i < 12; i++) {
        let door = document.getElementById(`day${i + 1}`);
        if (progress[i]) {
            door.classList.remove('locked');
            door.classList.add('unlocked');
        } else {
            door.classList.remove('unlocked');
            door.classList.add('locked');
        }
    }
}

// Reveal Bourbon Bottle for the current day
function revealBourbon(day) {
    let progress = JSON.parse(localStorage.getItem('bourbonProgress'));

    if (!progress[day - 1]) {
        // Mark this day as unlocked
        progress[day - 1] = true;
        localStorage.setItem('bourbonProgress', JSON.stringify(progress));
        updateDoors(); // Update door appearance
    }

    // Optionally: display modal with bourbon details or redirect to details
    alert(`You unlocked Day ${day}: Bourbon Details Here!`);
}

// Reset progress
function resetProgress() {
    if (confirm("Are you sure you want to reset your progress?")) {
        localStorage.setItem('bourbonProgress', JSON.stringify(Array(12).fill(false)));
        updateDoors(); // Reset the door states
    }
}

// Run initialization
window.onload = initializeProgress;
