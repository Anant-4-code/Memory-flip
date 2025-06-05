document.addEventListener('DOMContentLoaded', () => {
    const heroSubheadingElement = document.getElementById('hero-subheading');
    const textToType = "Ready to challenge your mind? Flip the cards, find the pairs, and unlock your memory's potential. Let the fun begin!";
    const typingSpeed = 50; // Milliseconds per character

    if (heroSubheadingElement) {
        let i = 0;
        heroSubheadingElement.innerHTML = ''; // Clear current content
        const cursorSpan = document.createElement('span');
        cursorSpan.classList.add('typing-cursor');
        
        // Temporarily append cursor to make the element take up space if it was empty
        // and to show cursor from the start.
        // Actual text will be prepended before the cursor.
        heroSubheadingElement.appendChild(cursorSpan);

        function typeWriter() {
            if (i < textToType.length) {
                // Insert text before the cursor
                heroSubheadingElement.insertBefore(document.createTextNode(textToType.charAt(i)), cursorSpan);
                i++;
                setTimeout(typeWriter, typingSpeed);
            } else {
                // Typing finished, remove cursor after a short delay or keep it blinking
                // For now, let's remove it after 2 seconds for a clean look.
                setTimeout(() => {
                    if (cursorSpan.parentNode) {
                        cursorSpan.parentNode.removeChild(cursorSpan);
                    }
                }, 2000);
            }
        }
        typeWriter();
    }
}); 