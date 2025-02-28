const cors = require('cors');
const express = require('express');
const axios = require('axios');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Helper function to extract LeetCode problem details from a URL
const extractProblemInfo = async (leetcodeUrl) => {
  if (!leetcodeUrl) return null;
  
  try {
    // Extract problem slug from URL
    const urlObj = new URL(leetcodeUrl);
    if (!urlObj.hostname.includes('leetcode.com')) return null;
    
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2 && pathParts[0] === 'problems') {
      const problemSlug = pathParts[1];
      
      // For a more complete solution, you could use the LeetCode API to fetch more details
      // but that would require authentication. For now, we'll return just the basic info
      return {
        slug: problemSlug,
        title: problemSlug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        url: leetcodeUrl
      };
    }
    return null;
  } catch (error) {
    console.error('Error extracting problem info:', error);
    return null;
  }
};

// Function to generate a prompt for the AI based on the LeetCode problem and user query
const generatePrompt = async (userMessage, leetcodeUrl) => {
  let prompt = userMessage;
  
  // If a LeetCode URL is provided, enhance the prompt with problem context
  if (leetcodeUrl) {
    const problemInfo = await extractProblemInfo(leetcodeUrl);
    if (problemInfo) {
      prompt = `
I'm working on this LeetCode problem: ${problemInfo.title} (${leetcodeUrl}).

My question is: ${userMessage}

Please respond in the following format:
1. Provide a clear, detailed solution
2. Include well-commented code solutions
3. Explain the algorithm's time and space complexity
4. If relevant, offer multiple approaches (brute force, optimized, etc.)
5. Use markdown for formatting, especially code blocks with proper language syntax
      `;
    }
  }
  
  return prompt;
};

// Chat endpoint for handling LeetCode-specific questions
app.post('/api/chat', async (req, res) => {
  const { userMessage, leetcodeUrl, context } = req.body;

  try {
    // Generate a context-aware prompt for the AI
    const enhancedPrompt = await generatePrompt(userMessage, leetcodeUrl);
    
    // System instructions to guide the AI response
    const systemInstructions = `
You are LeetCodeBot, a specialized assistant for helping programmers solve LeetCode problems.
Follow these instructions carefully:

1. Focus on providing detailed algorithmic explanations
2. When sharing code solutions, use proper markdown code blocks with language specification
3. Always analyze the time and space complexity of your solutions
4. Provide multiple approaches when appropriate (brute force → optimized)
5. Include comments in your code to explain key steps
6. Be concise yet comprehensive
7. If the user is struggling, offer hints before giving the full solution
8. When relevant, explain common patterns (two pointers, sliding window, etc.)
    `;
    
    // Generate a response from the Gemini API with the model chat interface
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemInstructions }],
        },
        {
          role: 'model',
          parts: [{ text: "I understand my role as LeetCodeBot. I'll provide detailed algorithmic explanations, proper code solutions, complexity analysis, and follow all the guidelines you've outlined." }],
        }
      ],
    });

    const result = await chat.sendMessage(enhancedPrompt);
    const aiResponse = result.response.text();

    // Process the response to enhance code formatting and structure
    const processedResponse = aiResponse
      // Ensure proper code block formatting
      .replace(/```(\w+)\s*\n/g, '```$1\n')
      // Clean up any potential formatting issues
      .replace(/\\n/g, '\n');
    
    // Send the response back to the frontend
    res.json({
      response: processedResponse,
      aiResponse: aiResponse, // Include raw response for debugging
    });
    
  } catch (error) {
    console.error('Error communicating with Gemini API:', error.message);
    res.status(500).json({ 
      error: 'An error occurred while processing your request.',
      details: error.message
    });
  }
});

// Default endpoint
app.get('/', (req, res) => {
  res.send('LeetCode Assistant Backend is running.');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});