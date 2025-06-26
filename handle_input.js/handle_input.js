const express = require('express');
const axios = require('axios');
const multer = require('multer');
const dotenv = require('dotenv');
const FormData = require('form-data');
dotenv.config();

const app = express();
app.use(express.json());
const upload = multer();

app.post('/handle-input', upload.none(), async (req, res) => {
    try {
        const userSpeech = req.body.SpeechResult || '';
        
        // Your AI + Cloudinary logic here
        const aiReply = "Simulated AI reply for testing";  // Replace with real logic
        
        // Simulated Cloudinary upload for testing
        const audioUrl = "https://res.cloudinary.com/dhsj8hypc/video/upload/sample.mp3";

        res.json({ audioUrl, message: aiReply });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
