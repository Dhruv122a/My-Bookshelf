// public/script.js
const backendUrl = "http://localhost:3000";

// Global variable to store original book data
let allBooksData = [];

// Currency Conversion Data
const exchangeRates = {
    INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095, JPY: 1.90, AUD: 0.018, CAD: 0.016,
    CHF: 0.011, CNY: 0.087, HKD: 0.094, NZD: 0.020, SGD: 0.016, KRW: 16.63, SEK: 0.13,
    NOK: 0.13, MXN: 0.24, BRL: 0.067, ZAR: 0.22, AED: 0.044
};
const currencySymbols = {
    INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$',
    CHF: 'Fr', CNY: '¥', HKD: 'HK$', NZD: 'NZ$', SGD: 'S$', KRW: '₩', SEK: 'kr',
    NOK: 'kr', MXN: '$', BRL: 'R$', ZAR: 'R', AED: 'د.إ'
};

document.addEventListener('DOMContentLoaded', () => {
    // Setup navigation and theme
    updateNav();
    initializeTheme();

    // --- Search and Filter elements ---
    const searchBar = document.getElementById('search-bar');
    const authorFilter = document.getElementById('author-filter');
    const currencySelector = document.getElementById('currency');

    // --- Event listeners for controls ---
    if (searchBar) searchBar.addEventListener('input', filterAndRenderBooks);
    if (authorFilter) authorFilter.addEventListener('change', filterAndRenderBooks);

    if (currencySelector) {
        const savedCurrency = localStorage.getItem('currency') || 'INR';
        currencySelector.value = savedCurrency;
        currencySelector.addEventListener('change', (event) => {
            localStorage.setItem('currency', event.target.value);
            filterAndRenderBooks(); // Re-render with new currency
        });
    }

    // General event listeners
    const registerForm = document.getElementById("registerForm");
    if (registerForm) registerForm.addEventListener("submit", handleRegister);

    const loginForm = document.getElementById("loginForm");
    if (loginForm) loginForm.addEventListener("submit", handleLogin);

    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) themeToggle.addEventListener("click", handleThemeToggle);

    // === Hamburger Menu Toggle Logic ===
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navRight = document.querySelector('.nav-right');
    if (hamburgerBtn && navRight) {
        hamburgerBtn.addEventListener('click', () => {
            navRight.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
    }

    // ▼▼▼ NEW CODE BLOCK ▼▼▼
    // Close the profile dropdown if the user clicks outside of it
    window.addEventListener('click', function(event) {
        const profileDropdown = document.getElementById('profile-dropdown-content');
        if (profileDropdown && profileDropdown.classList.contains('show')) {
            if (!event.target.closest('.profile-container')) {
                profileDropdown.classList.remove('show');
            }
        }
    });
    // ▲▲▲ END OF NEW CODE ▲▲▲

    // Initial fetch of books
    const bookListDiv = document.getElementById("book-list");
    if (bookListDiv) fetchBooks();

    // Typing Effect Logic
    if (document.getElementById('hero-subtitle')) {
        // This requires the Typed.js library to be included in your HTML
        // <script src="https://unpkg.com/typed.js@2.0.16/dist/typed.umd.js"></script>
        var options = {
            strings: [
                'Discover your next great read.', 'Explore thrilling adventures.',
                'Find timeless classics.', 'Learn something new every day.'
            ],
            typeSpeed: 60, backSpeed: 30, backDelay: 2000,
            startDelay: 500, loop: true, smartBackspace: true
        };
        var typed = new Typed('#hero-subtitle', options);
    }
});

function fetchBooks() {
    fetch(`${backendUrl}/books`)
        .then(res => res.json())
        .then(books => {
            allBooksData = books;
            populateAuthorFilter();
            filterAndRenderBooks();
        });
}

function populateAuthorFilter() {
    const authorFilter = document.getElementById('author-filter');
    if (!authorFilter) return;
    const authors = [...new Set(allBooksData.map(book => book.author))];
    authors.sort().forEach(author => {
        const option = document.createElement('option');
        option.value = author;
        option.textContent = author;
        authorFilter.appendChild(option);
    });
}

function filterAndRenderBooks() {
    const searchBar = document.getElementById('search-bar');
    const authorFilter = document.getElementById('author-filter');
    const searchTerm = searchBar ? searchBar.value.toLowerCase() : '';
    const selectedAuthor = authorFilter ? authorFilter.value : 'all';

    let filteredBooks = allBooksData;
    if (searchTerm) {
        filteredBooks = filteredBooks.filter(book =>
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm)
        );
    }
    if (selectedAuthor !== 'all') {
        filteredBooks = filteredBooks.filter(book => book.author === selectedAuthor);
    }
    renderBooks(filteredBooks);
}

// ▼▼▼ THIS ENTIRE FUNCTION IS UPDATED FOR RATINGS ▼▼▼
function renderBooks(booksToRender) {
    const bookListDiv = document.getElementById("book-list");
    if (!bookListDiv) return;

    const selectedCurrency = localStorage.getItem('currency') || 'INR';
    const rate = exchangeRates[selectedCurrency];
    const symbol = currencySymbols[selectedCurrency];

    if (booksToRender.length === 0) {
        bookListDiv.innerHTML = "<p>No books match your criteria.</p>";
        return;
    }

    let bookListHTML = "";
    booksToRender.forEach(book => {
        const convertedPrice = (book.price * rate).toFixed(2);
        
        // Calculate average rating
        const averageRating = book.ratingCount > 0 ? (book.ratingSum / book.ratingCount) : 0;
        const ratingText = book.ratingCount > 0 ? `${averageRating.toFixed(1)} (${book.ratingCount} ratings)` : "Not rated yet";
        
        // Generate stars for display
        let displayStars = '';
        for (let i = 1; i <= 5; i++) {
            displayStars += `<span class="star ${i <= Math.round(averageRating) ? 'filled' : ''}">&#9733;</span>`;
        }
        
        // Generate stars for user input
        let inputStars = '';
        for (let i = 1; i <= 5; i++) {
            inputStars += `<span class="star-input" data-value="${i}" onclick="rateBook('${book._id}', ${i})">&#9734;</span>`;
        }

        bookListHTML += `
            <div class="book-card">
                <img src="${book.imageUrl}" alt="Cover of ${book.title}" class="book-cover">
                <div class="book-info">
                    <h3>${book.title}</h3>
                    <p class="author">by ${book.author}</p>
                    <div class="rating-display">
                        ${displayStars}
                        <span class="rating-text">${ratingText}</span>
                    </div>
                    <p>Price: ${symbol}${convertedPrice}</p>
                    <div class="rating-input">
                        <p>Rate this book:</p>
                        <div class="stars-container">${inputStars}</div>
                    </div>
                    <button onclick="purchaseBook('${book._id}')">Buy</button>
                </div>
            </div>
        `;
    });
    bookListDiv.innerHTML = bookListHTML;
}
// ▲▲▲ END OF UPDATED FUNCTION ▲▲▲

// ▼▼▼ NEW FUNCTION TO HANDLE RATING A BOOK ▼▼▼
async function rateBook(bookId, rating) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("You must be logged in to rate a book.");
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch(`${backendUrl}/books/${bookId}/rate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ rating: rating })
        });

        const result = await res.json();
        alert(result.msg);

        if (res.ok) {
            // Refresh book list to show the new rating
            fetchBooks();
        }

    } catch (error) {
        console.error("Error submitting rating:", error);
        alert("An error occurred. Please try again.");
    }
}
// ▲▲▲ END OF NEW FUNCTION ▲▲▲


function initializeTheme() {
    const themeToggle = document.getElementById("theme-toggle");
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeToggle) themeToggle.textContent = '☀️';
    } else {
        if (themeToggle) themeToggle.textContent = '🌙';
    }
}

function handleThemeToggle() {
    const themeToggle = document.getElementById("theme-toggle");
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        themeToggle.textContent = '☀️';
    } else {
        localStorage.setItem('theme', 'light');
        themeToggle.textContent = '🌙';
    }
}

async function updateNav() {
    const navLinksContainer = document.querySelector('.nav-links');
    const token = localStorage.getItem('token');

    if (token) {
        try {
            const res = await fetch(`${backendUrl}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const user = await res.json();
                
                navLinksContainer.innerHTML = `
                    <a href="upload.html" class="nav-link-with-icon" title="Upload Book">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></svg>
                        <span>Upload Book</span>
                    </a>
                    <a href="my-uploads.html" class="nav-link-with-icon" title="My Uploads">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zm0-8h14V7H7v2z"/></svg>
                        <span>My Uploads</span>
                    </a>
                    <a href="my-books.html" class="nav-link-with-icon" title="My Purchased Books">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
                        <span>My Books</span>
                    </a>
                    <div class="profile-container">
                        <div class="user-info" id="profile-button">
                            <div class="user-avatar">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                            </div>
                            <span class="user-name">${user.name}</span>
                        </div>
                        <div class="profile-dropdown" id="profile-dropdown-content">
                            <div class="profile-header">
                                <strong>Account Details</strong>
                            </div>
                            <div class="profile-body">
                                <p><strong>Name:</strong> ${user.name}</p>
                                <p><strong>Email:</strong> ${user.email}</p>
                            </div>
                        </div>
                    </div>
                    <a href="#" id="logout-link" class="logout-button-styled" title="Logout">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
                    </a>
                `;

                // Add event listener for the new profile button
                const profileButton = document.getElementById('profile-button');
                const profileDropdown = document.getElementById('profile-dropdown-content');
                if (profileButton && profileDropdown) {
                    profileButton.addEventListener('click', (event) => {
                        event.stopPropagation(); // Prevents the window click listener from firing immediately
                        profileDropdown.classList.toggle('show');
                    });
                }
                
                // Add event listener for the logout link
                const logoutLink = document.getElementById('logout-link');
                if (logoutLink) {
                    logoutLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        logout();
                    });
                }

            } else { logout(); }
        } catch (error) {
            console.error('Error fetching user info:', error);
            logout();
        }
    } else {
        navLinksContainer.innerHTML = `
            <a href="register.html">Register</a>
            <a href="login.html">Login</a>
        `;
    }
    navLinksContainer.style.opacity = 1;
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${backendUrl}/users/register`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });
    const messageEl = document.getElementById("message");
    messageEl.innerText = (await res.json()).msg;
    messageEl.style.color = res.ok ? 'var(--success-color)' : 'var(--error-color)';
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch(`${backendUrl}/users/login`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const loginMessage = document.getElementById("loginMessage");
    if (!res.ok) {
        loginMessage.innerText = (await res.json()).msg || "Invalid credentials.";
        loginMessage.style.color = 'var(--error-color)';
        return;
    }

    const data = await res.json();
    if (data.token) {
        localStorage.setItem('token', data.token);
        loginMessage.innerText = "Login successful! Redirecting...";
        loginMessage.style.color = 'var(--success-color)';
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    }
}

function purchaseBook(bookId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("You must be logged in to purchase a book.");
        window.location.href = 'login.html';
        return;
    }
    const bookToBuy = allBooksData.find(book => book._id === bookId);
    if (bookToBuy) {
        localStorage.setItem('bookToCheckout', JSON.stringify(bookToBuy));
        window.location.href = 'checkout.html';
    } else {
        alert('Error: Could not find book details. Please refresh and try again.');
    }
}

// Hero Slider Logic
const slides = document.querySelectorAll('.slide');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
let currentSlide = 0;
let slideInterval;

function showSlide(n) {
    if (slides.length === 0) return;
    slides[currentSlide].classList.remove('active');
    const currentVideo = slides[currentSlide].querySelector('video');
    if (currentVideo) currentVideo.pause();
    currentSlide = (n + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    const nextVideo = slides[currentSlide].querySelector('video');
    if (nextVideo) {
        nextVideo.currentTime = 0;
        nextVideo.play().catch(error => console.log("Autoplay prevented:", error));
    }
}

function nextSlide() { showSlide(currentSlide + 1); }
function prevSlide() { showSlide(currentSlide - 1); }
function startAutoplay() { slideInterval = setInterval(nextSlide, 10000); }
function resetAutoplay() { clearInterval(slideInterval); startAutoplay(); }

if (nextBtn) {
    nextBtn.addEventListener('click', () => { nextSlide(); resetAutoplay(); });
}
if (prevBtn) {
    prevBtn.addEventListener('click', () => { prevSlide(); resetAutoplay(); });
}
if (slides.length > 0) {
    showSlide(0);
    startAutoplay();
}

// Scroll-to-top Button Logic
const scrollToTopBtn = document.getElementById("scroll-to-top-btn");
if (scrollToTopBtn) {
    window.onscroll = function () {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            scrollToTopBtn.style.display = "block";
        } else {
            scrollToTopBtn.style.display = "none";
        }
    };
    scrollToTopBtn.onclick = function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
}