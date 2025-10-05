// seed.js
const client = require("./db");

// The list of books now includes ratingSum and ratingCount, both initialized to 0
const sampleBooks = [
    { title: "Learn C++ for Games", author: "Dhruv Sharma", price: 199, imageUrl: "https://placehold.co/400x600/0077cc/FFF?text=C++", pdfUrl: "assets/sample-pdf1.pdf", ratingSum: 0, ratingCount: 0 },
    { title: "Intro to Node.js", author: "A. Dev", price: 149, imageUrl: "https://placehold.co/400x600/339933/FFF?text=Node.js", pdfUrl: "assets/sample-pdf2.pdf", ratingSum: 0, ratingCount: 0 },
    { title: "Web Dev with HTML/CSS", author: "B. Author", price: 99, imageUrl: "https://placehold.co/400x600/d9534f/FFF?text=HTML/CSS", pdfUrl: "assets/sample-pdf3.pdf", ratingSum: 0, ratingCount: 0 },
    { title: "The Silent Patient", author: "Alex Michaelides", price: 249, imageUrl: "https://placehold.co/400x600/5bc0de/FFF?text=The+Silent+Patient", pdfUrl: "assets/sample-pdf4.pdf", ratingSum: 0, ratingCount: 0 },
    { title: "Atomic Habits", author: "James Clear", price: 299, imageUrl: "https://placehold.co/400x600/f0ad4e/FFF?text=Atomic+Habits", pdfUrl: "assets/sample-pdf5.pdf", ratingSum: 0, ratingCount: 0 },
    { title: "Ikigai", author: "Héctor García", price: 180, imageUrl: "https://placehold.co/400x600/5cb85c/FFF?text=Ikigai", pdfUrl: "assets/sample-pdf6.pdf", ratingSum: 0, ratingCount: 0 },
    { title: "Deep Work", author: "Cal Newport", price: 265, imageUrl: "https://placehold.co/400x600/428bca/FFF?text=Deep+Work", pdfUrl: "assets/sample-pdf7.pdf", ratingSum: 0, ratingCount: 0 },
    { title: "Sapiens: A Brief History", author: "Yuval Noah Harari", price: 350, imageUrl: "https://placehold.co/400x600/755a91/FFF?text=Sapiens", pdfUrl: "assets/sample-pdf8.pdf", ratingSum: 0, ratingCount: 0 },
    { title: "The Psychology of Money", author: "Morgan Housel", price: 220, imageUrl: "https://placehold.co/400x600/a94442/FFF?text=Psychology+of+Money", pdfUrl: "assets/sample-pdf9.pdf", ratingSum: 0, ratingCount: 0 },
    { title: "To Kill a Mockingbird", author: "Harper Lee", price: 150, imageUrl: "https://placehold.co/400x600/2a6496/FFF?text=To+Kill+a+Mockingbird", pdfUrl: "assets/sample-pdf10.pdf", ratingSum: 0, ratingCount: 0 },
    { title: "1984", author: "George Orwell", price: 130, imageUrl: "https://placehold.co/400x600/666/FFF?text=1984", pdfUrl: "assets/sample-pdf11.pdf", ratingSum: 0, ratingCount: 0 },
    { title: "The Great Gatsby", author: "F. Scott Fitzgerald", price: 125, imageUrl: "https://placehold.co/400x600/8c6e4a/FFF?text=The+Great+Gatsby", pdfUrl: "assets/sample-pdf12.pdf", ratingSum: 0, ratingCount: 0 }
];

// ... (the rest of the file remains the same) ...

async function run() {
    try {
        console.log("Ensuring databases exist...");
        // NEW: Add 'ratings' database
        for (const dbName of ["users", "books", "orders", "ratings"]) {
            try {
                await client.putDatabase({ db: dbName });
                console.log(`SUCCESS: Database '${dbName}' created.`);
            } catch (err) {
                if (err.code === 412) {
                    console.log(`INFO: Database '${dbName}' already exists. Skipping.`);
                } else {
                    throw err;
                }
            }
        }

        console.log("\nSeeding 'books' database with sample data...");
        const allDocs = await client.postAllDocs({ db: "books", includeDocs: true });
        const deleteOps = allDocs.result.rows.map(row => ({ _id: row.id, _rev: row.doc._rev, _deleted: true }));
        if (deleteOps.length > 0) {
            await client.postBulkDocs({ db: 'books', bulkDocs: { docs: deleteOps } });
            console.log("Cleared existing books.");
        }
        
        for (const book of sampleBooks) {
            await client.postDocument({ db: "books", document: book });
            console.log(` -> Inserted book: "${book.title}"`);
        }

        console.log("\n✅ Seeding completed successfully!");
    } catch (err) {
        console.error("\n❌ Seed error:", err.statusText || err.message);
    }
}

run();