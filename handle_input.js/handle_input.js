const axios = require('axios');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const FormData = require('form-data');

exports.handler = async function (context, event, callback) {
  const twiml = new VoiceResponse();
  const userSpeech = event.SpeechResult || '';

  // Language detection
  const isSpanish = /\bespañol\b/i.test(userSpeech) || /[áéíóúñ¿¡]/i.test(userSpeech);
  const language = isSpanish ? 'es' : 'en';

  const systemPrompt = language === 'es'
    ? 'Eres Sofía, la asistente telefónica de La Teresita en Tampa. Responde de forma natural, clara y útil.'
    : 'You are Sofia, the friendly AI phone assistant for La Teresita Restaurant in Tampa. Respond clearly, naturally, and helpfully.';

  const elevenLabsVoiceId = language === 'es'
    ? context.ELEVENLABS_VOICE_ES
    : context.ELEVENLABS_VOICE_EN;

  const apiKey = context.OPENAI_API_KEY;
  const modelName = context.MODEL_NAME || 'gpt-4o';

  try {
    // GPT-4o response
    const gptResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userSpeech }
        ],
        max_tokens: 150,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    );

    const aiReply = gptResponse.data.choices[0].message.content.trim();

    // ElevenLabs TTS
    const ttsResponse = await axios({
      method: 'post',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`,
      headers: {
        'xi-api-key': context.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer',
      data: {
        text: aiReply,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8
        }
      }
    });

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', Buffer.from(ttsResponse.data), 'response.mp3');
    formData.append('upload_preset', context.CLOUDINARY_UPLOAD_PRESET);

    const cloudinaryRes = await axios.post(
      `https://api.cloudinary.com/v1_1/${context.CLOUDINARY_BASE_URL}/video/upload`,
      formData,
      { headers: formData.getHeaders() }
    );

    const audioUrl = cloudinaryRes.data.secure_url;

    // TwiML Response
    twiml.play(audioUrl);
    twiml.gather({
      input: 'speech',
      action: '/handle-input',
      speechTimeout: 'auto',
      language: language === 'es' ? 'es-ES' : 'en-US'
    });

  } catch (error) {
    console.error('Error:', error);
    twiml.say(language === 'es' ? 'Ocurrió un error, inténtalo de nuevo.' : 'An error occurred, please try again.');
  }

  return callback(null, twiml.toString());
};
