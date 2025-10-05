document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const uploadMessage = document.getElementById('uploadMessage');
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // --- UPDATED LOGIC for simple file inputs ---
    function setupFileInput(inputId, containerId, textId, defaultText) {
        const input = document.getElementById(inputId);
        const container = document.getElementById(containerId);
        const textDisplay = document.getElementById(textId);

        input.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                textDisplay.textContent = file.name;
                container.classList.add('file-chosen');
            } else {
                textDisplay.textContent = defaultText;
                container.classList.remove('file-chosen');
            }
        });
    }

    setupFileInput('coverImage', 'coverImageContainer', 'coverImageFileName', 'Click to upload a cover image');
    setupFileInput('bookPdf', 'bookPdfContainer', 'bookPdfFileName', 'Click to upload the book PDF');
    // --- END UPDATED LOGIC ---

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(uploadForm);
        const submitButton = uploadForm.querySelector('button');
        submitButton.disabled = true;
        submitButton.textContent = 'Uploading...';

        try {
            const res = await fetch('/books/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            const result = await res.json();
            uploadMessage.textContent = result.msg;
            uploadMessage.style.color = res.ok ? 'var(--success-color)' : 'var(--error-color)';
            
            if (res.ok) {
                uploadForm.reset();
                // Reset the custom file displays
                document.getElementById('coverImageContainer').classList.remove('file-chosen');
                document.getElementById('coverImageFileName').textContent = 'Click to upload a cover image';
                document.getElementById('bookPdfContainer').classList.remove('file-chosen');
                document.getElementById('bookPdfFileName').textContent = 'Click to upload the book PDF';
            }
        } catch (error)
        {
            uploadMessage.textContent = 'An error occurred. Please try again.';
            uploadMessage.style.color = 'var(--error-color)';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Upload Book';
        }
    });
});