const axios = require('axios');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

exports.handler = async function (context, event, callback) {
  const twiml = new VoiceResponse();
  const userSpeech = event.SpeechResult || '';

  // Language detection
  const isSpanish = /\bespañol\b/i.test(userSpeech) || /[áéíóúñ¿¡]/i.test(userSpeech);
  const language = isSpanish ? 'es' : 'en';

  const systemPrompt = language === 'es'
    ? 'Eres Sofía, la asistente telefónica de La Teresita en Tampa. Responde de forma natural y útil.'
    : 'You are Sofia, the friendly AI phone assistant for La Teresita Restaurant in Tampa. Respond clearly and helpfully.';

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
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiMessage = gptResponse.data.choices[0]?.message?.content || '';

    twiml.say(aiMessage, { language: language === 'es' ? 'es-ES' : 'en-US' });

  } catch (error) {
    console.error('GPT Error:', error.message);
    twiml.say(language === 'es'
      ? 'Lo siento, tuve problemas para entender. Por favor, inténtalo de nuevo.'
      : 'Sorry, I had trouble understanding. Please try again.');
  }

  return callback(null, twiml.toString());
};
