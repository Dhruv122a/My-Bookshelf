// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const client = require('../db');
const auth = require('../middleware/auth');

// This is your existing route for placing an order
router.post('/', auth, async (req, res) => {
    const userId = req.user.id; 
    const { bookId } = req.body;

    if (!userId || !bookId) {
        return res.status(400).json({ error: "Book ID is required." });
    }

    try {
        const orderDocument = {
            userId,
            bookId,
            orderDate: new Date()
        };

        await client.postDocument({
            db: 'orders',
            document: orderDocument
        });
        
        res.status(201).send("Order placed successfully!");
    } catch (err) {
        console.error("Order error:", err);
        res.status(500).send("Server error while placing order.");
    }
});

// ▼▼▼ THIS IS THE UPDATED AND CORRECTED ROUTE FOR THE "MY BOOKS" PAGE ▼▼▼
router.get('/mybooks', auth, async (req, res) => {
    try {
        // 1. Get the logged-in user's ID
        const userId = req.user.id;

        // 2. Find all orders placed by this user
        const ordersResult = await client.postFind({
            db: 'orders',
            selector: { userId: userId },
            fields: ['bookId']
        });

        if (ordersResult.result.docs.length === 0) {
            return res.json([]);
        }

        // 3. Collect all the unique and VALID book IDs from their orders
        const bookIds = [...new Set(
            ordersResult.result.docs
                .map(doc => doc.bookId)
                .filter(Boolean) // FIX: This removes any null, undefined, or empty bookIds
        )];

        // NEW CHECK: If after filtering, there are no valid book IDs, return an empty array
        if (bookIds.length === 0) {
            return res.json([]);
        }

        // 4. Fetch the full details for those valid book IDs
        const booksResult = await client.postFind({
            db: 'books',
            selector: {
                _id: { "$in": bookIds }
            }
        });

        // 5. Send the list of books back
        res.json(booksResult.result.docs);

    } catch (err) {
        console.error("Error fetching user's books:", err);
        res.status(500).send("Server error while fetching purchased books.");
    }
});
// ▲▲▲ END OF UPDATED ROUTE ▲▲▲

module.exports = router;