const cors = require('cors');
const express = require('express');
const axios = require('axios');
require('dotenv').config(); 

const app = express();
const port = process.env.PORT || 2000;

app.use(cors());
app.use(express.json()); 


const API_KEY = process.env.GEMINI_API_KEY;

app.get('/' , function (req, res) {
    res.send("backend is Running fine.")
})
app.post('/api/chat', async (req, res) => {
  const { userMessage } = req.body;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: userMessage, 
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const responseText = response.data.candidates[0].content.parts[0].text;

    res.json({ responseText });
    console.log(responseText);

} catch (error) {
    console.error('Error communicating with Gemini API:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
}
});



 

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
