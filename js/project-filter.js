// Filter functionality
function filterProjects(category, activeButton) {
    const cards = document.querySelectorAll('.project-card');
    const buttons = document.querySelectorAll('.filter-btn');

    // Update active button
    buttons.forEach(btn => btn.classList.remove('active'));
    const selected = activeButton || Array.from(buttons).find(button => button.dataset.category === category);
    if (selected) selected.classList.add('active');

    // Filter cards
    cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

// Sound effect placeholder (you can add actual sound if needed)
function playSound() {
    // Add sound effect here if desired
    console.log('Button clicked!');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    // Set initial state
    filterProjects('all');
});
