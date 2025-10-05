document.addEventListener('DOMContentLoaded', () => {
    // Note: Corrected getQuerySelector to querySelector for standard usage.
    const bookListDiv = document.querySelector('.book-list');
    const token = localStorage.getItem('token');

    if (!token) {
        // Redirect to login if no token is found
        window.location.href = 'login.html';
        return;
    }

    fetch('http://localhost:3000/orders/mybooks', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => {
        if (!res.ok) {
            throw new Error('Authentication error');
        }
        return res.json();
    })
    .then(books => {
        renderMyBooks(books);
    })
    .catch(error => {
        console.error('Error fetching purchased books:', error);
        window.location.href = 'login.html';
    });

   // public/my-books.js

function renderMyBooks(books) {
    const bookListDiv = document.getElementById('my-books-list');
    if (!bookListDiv) return;

    if (!books || books.length === 0) {
        bookListDiv.innerHTML = "<p class='info-message'>You haven't purchased any books yet. <a href='index.html'>Go explore the store!</a></p>";
        return;
    }

    let bookListHTML = "";
    books.forEach(book => {
        bookListHTML += `
            <div class="purchased-book-card">
                <img src="${book.imageUrl}" alt="Cover of ${book.title}" class="purchased-book-cover">
                <div class="purchased-book-details">
                    <h3 class="purchased-book-title">${book.title}</h3>
                    <p class="purchased-book-author">by ${book.author}</p>
                    
                    <div class="book-actions">
                        <a href="viewer.html?file=${book.pdfUrl}" class="button-link read-btn" target="_blank">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                            <span>Read</span>
                        </a>
                        <a href="${book.pdfUrl}" download class="download-btn">
                            <svg class="download-icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            <span>Download</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
    });
    
    bookListDiv.innerHTML = bookListHTML;
}
});