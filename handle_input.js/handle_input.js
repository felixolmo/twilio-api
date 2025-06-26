const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
app.use(express.json());

app.post('/handle-input', async (req, res) => {
  try {
    const userSpeech = req.body.SpeechResult || 'No speech detected';
    const isSpanish = /\bespañol\b/i.test(userSpeech) || /[áéíóúñ¿¡]/i.test(userSpeech);
    const language = isSpanish ? 'es' : 'en';
    const aiReply = isSpanish ? 'Tu orden fue recibida.' : 'Your order was received.';

    const ttsResponse = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${isSpanish ? process.env.ELEVENLABS_VOICE_ES : process.env.ELEVENLABS_VOICE_EN}`,
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
      data: {
        text: aiReply,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.8 },
      },
    });

    const formData = new FormData();
    formData.append('file', Buffer.from(ttsResponse.data), 'response.mp3');
    formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET);

    const cloudinaryRes = await axios.post(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_BASE_URL}/video/upload`,
      formData,
      { headers: formData.getHeaders() }
    );

    const audioUrl = cloudinaryRes.data.secure_url;

    res.json({ audioUrl, message: aiReply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
