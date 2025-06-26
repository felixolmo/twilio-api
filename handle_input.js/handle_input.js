const express = require('express');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

const upload = multer({ dest: 'uploads/' });

app.use(express.json());

// Route to handle audio file upload
app.post('/handle_input', upload.single('audio'), async (req, res) => {
  console.log('✅ Received request to /handle_input');

  if (!req.file) {
    return res.status(400).send('No audio file provided.');
  }

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));
    formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET);

    console.log('✅ Uploading to Cloudinary...');

    const cloudinaryRes = await axios.post(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`,
      formData,
      { headers: formData.getHeaders() }
    );

    console.log('✅ Cloudinary upload successful:', cloudinaryRes.data);

    fs.unlinkSync(req.file.path); // Clean up local file

    return res.json({
      audio_url: cloudinaryRes.data.secure_url,
    });
  } catch (error) {
    console.error('Cloudinary Upload Error:', error.response?.data || error.message);
    fs.unlinkSync(req.file.path); // Clean up local file
    return res.status(500).send('Error uploading to Cloudinary.');
  }
});

// Simple health check
app.get('/', (req, res) => {
  res.send('Voice AI backend is running.');
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
