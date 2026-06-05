// ===================================
// Modal System
// ===================================
const Modal = {
    show(title, content, size = 'normal') {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        // Remove any existing size classes
        modalContent.classList.remove('large', 'normal');
        
        // Add size class
        if (size === 'large') {
            modalContent.classList.add('large');
        }
        
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modal.style.display = 'flex';
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    },
    
    hide() {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');
        modal.style.display = 'none';
        
        // Remove size classes
        modalContent.classList.remove('large', 'normal');
        
        document.body.style.overflow = '';
    }
};

console.log('Modal module loaded');

// Made with Bob
