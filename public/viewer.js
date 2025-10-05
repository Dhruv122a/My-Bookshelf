// public/viewer.js
document.addEventListener('DOMContentLoaded', () => {
    const viewer = document.getElementById('pdf-viewer');
    const titleElement = document.getElementById('book-title');
    const downloadBtn = document.getElementById('viewer-download-btn');
    
    const params = new URLSearchParams(window.location.search);
    const file = params.get('file');
    const title = params.get('title');

    if (file) {
        viewer.src = file;
        downloadBtn.href = file; // Set the download link for the button
    } else {
        document.body.innerHTML = '<p style="text-align: center; margin-top: 50px;">Error: Book file not found.</p>';
    }

    if (title) {
        const decodedTitle = decodeURIComponent(title);
        titleElement.textContent = decodedTitle;
        document.title = decodedTitle;
        downloadBtn.download = `${decodedTitle}.pdf`; // Suggest a filename for the download
    }
});