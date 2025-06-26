const express = require('express');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
app.use(express.json());

app.post('/handle-input', async (req, res) => {
  const userSpeech = req.body.SpeechResult || '';

  const isSpanish = /\bespañol\b/i.test(userSpeech) || /[áéíóúñ¿¡]/i.test(userSpeech);
  const language = isSpanish ? 'es' : 'en';

  const systemPrompt = language === 'es'
    ? 'Eres Sofía, la asistente telefónica de La Teresita en Tampa. Responde de forma natural, clara y útil.'
    : 'You are Sofia, the friendly AI phone assistant for La Teresita Restaurant in Tampa. Respond clearly, naturally, and helpfully.';

  const elevenLabsVoiceId = language === 'es'
    ? process.env.ELEVENLABS_VOICE_ES
    : process.env.ELEVENLABS_VOICE_EN;

  try {
    // GPT-4o request
    const gptResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.MODEL_NAME || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userSpeech }
        ],
        max_tokens: 150,
        temperature: 0.7
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
      }
    );

    const aiReply = gptResponse.data.choices[0].message.content.trim();

    // ElevenLabs TTS request
    const ttsResponse = await axios({
      method: 'post',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`,
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer',
      data: {
        text: aiReply,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.8 }
      }
    });

    // Upload to Cloudinary
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
