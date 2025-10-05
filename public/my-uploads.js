document.addEventListener('DOMContentLoaded', () => {
    const bookListDiv = document.getElementById('my-uploads-list');
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Fetch and display the user's uploaded books
    async function fetchMyUploads() {
        const res = await fetch('/books/my-uploads', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const books = await res.json();
        renderMyUploads(books);
    }

    function renderMyUploads(books) {
        if (!books || books.length === 0) {
            bookListDiv.innerHTML = "<p>You haven't uploaded any books yet.</p>";
            return;
        }

        bookListDiv.innerHTML = books.map(book => `
            <div class="book-card" id="book-card-${book._id}">
                <img src="${book.imageUrl}" alt="Cover of ${book.title}" class="book-cover">
                <div class="book-info">
                    <h3>${book.title}</h3>
                    <p class="author">by ${book.author}</p>
                    <button class="delete-btn" data-id="${book._id}">Delete Book</button>
                </div>
            </div>
        `).join('');
    }

    // Handle delete button clicks
    bookListDiv.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const bookId = e.target.dataset.id;
            
            if (confirm(`Are you sure you want to delete this book? This action cannot be undone.`)) {
                const res = await fetch(`/books/${bookId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    document.getElementById(`book-card-${bookId}`).remove();
                } else {
                    alert('Failed to delete book. Please try again.');
                }
            }
        }
    });

    fetchMyUploads();
});