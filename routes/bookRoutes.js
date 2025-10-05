// routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const client = require('../db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Node.js File System module for deleting files

// --- Multer Storage Configuration ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- Get all books (Public Route) ---
router.get('/', async (req, res) => {
    try {
        const result = await client.postAllDocs({ db: 'books', includeDocs: true });
        const books = result.result.rows.map(row => ({...row.doc, _id: row.doc._id}));
        res.json(books);
    } catch (err) {
        console.error('Error fetching books:', err);
        res.status(500).json({ error: 'Failed to retrieve books' });
    }
});

// --- UPDATED ROUTE: Rate or Update a Rating for a Book ---
router.post('/:id/rate', auth, async (req, res) => {
    try {
        const bookId = req.params.id;
        const userId = req.user.id;
        const { rating } = req.body; // The new rating from the user

        // 1. Validate the rating value
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ msg: 'Rating must be a number between 1 and 5.' });
        }

        // 2. Fetch the book and check if the user has previously rated it
        const bookResult = await client.getDocument({ db: 'books', docId: bookId });
        const book = bookResult.result;

        const ratingCheck = await client.postFind({
            db: 'ratings',
            selector: { userId, bookId }
        });

        let responseMsg = '';

        // 3. LOGIC: If a rating already exists, UPDATE it.
        if (ratingCheck.result.docs.length > 0) {
            const existingRatingDoc = ratingCheck.result.docs[0];
            const oldRating = existingRatingDoc.rating;

            // Adjust the book's total rating sum: remove the old rating, add the new one.
            book.ratingSum = book.ratingSum - oldRating + rating;
            
            // The rating count does not change because it's an update, not a new rater.
            
            // Update the rating document itself with the new rating value
            existingRatingDoc.rating = rating;
            await client.postDocument({ db: 'ratings', document: existingRatingDoc });

            responseMsg = 'Your rating has been successfully updated!';

        // 4. LOGIC: If no rating exists, CREATE a new one.
        } else {
            // Add the new rating to the sum and increment the count of raters.
            book.ratingSum = (book.ratingSum || 0) + rating;
            book.ratingCount = (book.ratingCount || 0) + 1;

            // Create a new document in 'ratings' to prevent future duplicate ratings.
            await client.postDocument({ db: 'ratings', document: { userId, bookId, rating } });

            responseMsg = 'Thank you for your rating!';
        }

        // 5. Save the updated book document back to the database
        await client.postDocument({ db: 'books', document: book });
        
        // 6. Send a success response
        res.json({ msg: responseMsg, book });

    } catch (err) {
        console.error("Rating error:", err);
        res.status(500).json({ msg: "Server error while submitting rating." });
    }
});


// --- Handle New Book Upload ---
router.post('/upload', auth, upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'bookPdf', maxCount: 1 }]),
    async (req, res) => {
        try {
            const { title, author, price } = req.body;
            const coverImage = req.files.coverImage[0];
            const bookPdf = req.files.bookPdf[0];

            if (!title || !author || !price || !coverImage || !bookPdf) {
                return res.status(400).json({ msg: "All fields, including files, are required." });
            }

            const newBook = {
                title,
                author,
                price: parseFloat(price),
                imageUrl: `/${coverImage.path.replace(/\\/g, "/")}`,
                pdfUrl: `/${bookPdf.path.replace(/\\/g, "/")}`,
                uploaderId: req.user.id,
                ratingSum: 0, // Initialize rating fields for all new uploads
                ratingCount: 0
            };

            await client.postDocument({ db: 'books', document: newBook });
            res.status(201).json({ msg: "Book uploaded successfully!" });
        } catch (error) {
            console.error("Upload error:", error);
            res.status(500).json({ msg: "Server error during upload." });
        }
    }
);

// --- Get Books Uploaded by the Logged-in User ---
router.get('/my-uploads', auth, async (req, res) => {
    try {
        const result = await client.postFind({
            db: 'books',
            selector: { uploaderId: req.user.id }
        });
        res.json(result.result.docs);
    } catch (err) {
        console.error("Error fetching user's uploads:", err);
        res.status(500).json({ msg: "Server error" });
    }
});

// --- Delete a Book Uploaded by the User ---
router.delete('/:id', auth, async (req, res) => {
    try {
        const bookId = req.params.id;
        const userId = req.user.id;
        
        // Fetch the book to verify ownership and get file paths
        const bookResult = await client.getDocument({ db: 'books', docId: bookId });
        const book = bookResult.result;

        if (!book) {
            return res.status(404).json({ msg: "Book not found." });
        }
        if (book.uploaderId !== userId) {
            return res.status(403).json({ msg: "Authorization denied. You can only delete your own books." });
        }

        // Delete associated image and PDF files from the server
        if (book.imageUrl) fs.unlinkSync(path.join(__dirname, '..', book.imageUrl.substring(1)));
        if (book.pdfUrl) fs.unlinkSync(path.join(__dirname, '..', book.pdfUrl.substring(1)));

        // Delete the book document from the database
        await client.deleteDocument({ db: 'books', docId: book._id, rev: book._rev });
        
        res.json({ msg: "Book and associated files deleted successfully." });
    } catch (err) {
        console.error("Error deleting book:", err);
        res.status(500).json({ msg: "Server error while deleting book." });
    }
});

module.exports = router;