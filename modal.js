function openModal() {
    document.getElementById('iconGuideModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('iconGuideModal').style.display = 'none';
}

// Optional: Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('iconGuideModal');
    if (event.target === modal) {
        closeModal();
    }
};