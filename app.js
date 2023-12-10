const express = require('express');
const puppeteer = require('puppeteer');
const multer = require('multer');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });

const app = express();

// Middleware to handle raw text in requests
app.use(express.text());

// Middleware to handle urlencoded data (for filename in form field)
app.use(express.urlencoded({ extended: true }));

// Endpoint to convert raw HTML text to PDF
app.post('/html-to-pdf', async (req, res) => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(req.body);

        const pdf = await page.pdf({ format: 'A4' });
        await browser.close();

        const filename = req.query.filename || 'document.pdf';
        res.contentType('application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdf);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});

app.get('/html-to-pdf', async (req, res) => {
    try {
        const htmlContent = req.query.html;
        if (!htmlContent) {
            return res.status(400).send('No HTML content provided.');
        }

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // these arguments are often necessary in cloud environments
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent);

        const pdf = await page.pdf({ format: 'A4' });
        await browser.close();

        res.contentType('application/pdf');
        res.send(pdf);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});



// Endpoint to convert uploaded HTML file to PDF
app.post('/upload-html-to-pdf', upload.single('htmlfile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        const htmlContent = fs.readFileSync(req.file.path, 'utf8');
        await page.setContent(htmlContent);

        const pdf = await page.pdf({ format: 'A4' });
        await browser.close();

        fs.unlinkSync(req.file.path); // Clean up uploaded file

        const filename = req.body.filename || 'uploaded-document.pdf';
        res.contentType('application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdf);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
