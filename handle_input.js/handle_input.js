const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/handle-input', (req, res) => {
  const userSpeech = req.body.speech || '';

  console.log('User Speech Received:', userSpeech);

  // Basic response
  res.json({
    message: `You said: ${userSpeech}`
  });
});

app.get('/', (req, res) => {
  res.send('Twilio AI API is running.');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
