document.addEventListener('DOMContentLoaded', () => {
    // These constants need to be available on this page too
    const backendUrl = "http://localhost:3000";
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

    const bookDetailsContainer = document.getElementById('book-details-checkout');
    const paymentForm = document.getElementById('paymentForm');
    const messageContainer = document.getElementById('checkout-message');
    const checkoutView = document.getElementById('checkout-view');

    // 1. Get the book data saved in localStorage from the previous page
    const bookDataString = localStorage.getItem('bookToCheckout');

    // If for some reason a user lands here without a book, send them back
    if (!bookDataString) {
        window.location.href = 'index.html';
        return;
    }

    const book = JSON.parse(bookDataString);

    // 2. Display the book's details on the page
    displayBookDetails(book);

    // 3. Listen for the payment form submission
    paymentForm.addEventListener('submit', handlePurchase);

    function displayBookDetails(book) {
        const selectedCurrency = localStorage.getItem('currency') || 'INR';
        const rate = exchangeRates[selectedCurrency];
        const symbol = currencySymbols[selectedCurrency];
        const convertedPrice = (book.price * rate).toFixed(2);

        bookDetailsContainer.innerHTML = `
            <h2>Order Summary</h2>
            <img src="${book.imageUrl}" alt="Cover of ${book.title}" class="book-cover-checkout">
            <h3>${book.title}</h3>
            <p>by ${book.author}</p>
            <p class="price">Price: ${symbol}${convertedPrice}</p>
        `;
    }

  async function handlePurchase(e) {
        e.preventDefault();

        // ▼▼▼ NEW: Capture all form data ▼▼▼
        const orderDetails = {
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            pincode: document.getElementById('pincode').value,
            cardName: document.getElementById('card-name').value
        };

        // In a real app, you would send this data to the backend.
        // For this demo, we'll just log it to the browser's console.
        console.log("Order Details Collected:", orderDetails);
        // ▲▲▲ END OF NEW PART ▲▲▲

        const confirmBtn = document.getElementById('confirm-purchase-btn');
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Processing...';

        const token = localStorage.getItem('token');
        if (!token) {
            alert("Your session has expired. Please log in again.");
            window.location.href = 'login.html';
            return;
        }

        const res = await fetch(`${backendUrl}/orders`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ bookId: book._id }),
        });

        if (res.ok) {
            checkoutView.style.display = 'none';
            messageContainer.innerHTML = `
                <div class="success-message">
                    <h3>✅ Purchase Successful!</h3>
                    <p>Thank you for your order of "${book.title}".</p>
                    <a href="index.html" class="button-link">Back to Store</a>
                </div>
            `;
            localStorage.removeItem('bookToCheckout');
        } else {
            alert("There was an error placing your order. Please try again.");
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Purchase';
        }
    }
});