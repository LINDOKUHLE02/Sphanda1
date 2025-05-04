const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Use fs.promises for async/await support
const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = 3000;

// Middleware to parse incoming requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Create a Nodemailer transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Using environment variable
    pass: process.env.EMAIL_PASS  // Using environment variable
  }
});

// Route to handle form submissions
app.post('/submit', async (req, res) => {
  try {
    const submission = req.body;
    const timestamp = new Date().toISOString();
    submission.date = timestamp;

    // Read the current submissions from the file
    const data = await fs.readFile('submissions.json', 'utf8');
    const submissions = JSON.parse(data || '[]');
    submissions.push(submission);

    // Write the new submission to the JSON file
    await fs.writeFile('submissions.json', JSON.stringify(submissions, null, 2));

    // Send confirmation email to the company
    const companyMailOptions = {
      from: process.env.EMAIL_USER,
      to: 'cdw3bservices@gmail.com', // Replace with the company's email
      subject: 'New Quote Submission',
      text: `A new quote has been submitted.\n\nName: ${submission.name}\nEmail: ${submission.email}\nPhone: ${submission.phone}\nMessage: ${submission.message}\nDate: ${submission.date}`
    };

    await transporter.sendMail(companyMailOptions);

    // Send confirmation email to the person who submitted the quote
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: submission.email, // Send to the person's email
      subject: 'Thank You for Your Quote Submission!',
      text: `Dear ${submission.name},\n\nThank you for submitting your quote. We will be in touch as soon as possible.\n\nBest regards,\nSphanda Transport`
    };

    await transporter.sendMail(userMailOptions);

    res.sendStatus(200); // Respond to the client that the submission was successful
  } catch (err) {
    console.error('Error handling submission:', err);
    res.sendStatus(500); // Send an error response if something goes wrong
  }
});

// Route to get all submissions
app.get('/submissions', async (req, res) => {
  try {
    const data = await fs.readFile('submissions.json', 'utf8');
    const submissions = JSON.parse(data || '[]');
    res.json(submissions); // Send the submissions as a JSON response
  } catch (err) {
    console.error('Error reading submissions:', err);
    res.sendStatus(500); // Send an error response if something goes wrong
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
