# LeetCode Assistant

<img width="1463" alt="Screenshot 2025-03-01 at 3 01 28 AM" src="https://github.com/user-attachments/assets/f4f74a6d-af00-4d81-a7a7-321d266de7a3" /><img width="1456" alt="Screenshot 2025-03-01 at 3 01 37 AM" src="https://github.com/user-attachments/assets/a2003f74-96d3-4116-8859-85a12e6f6930" />



A React-based AI chat application designed specifically to help developers understand and solve LeetCode problems. Get algorithm explanations, code solutions, and optimization tips by simply sharing a LeetCode problem URL.

## 🚀 Features

- **Problem Analysis**: Directly reference LeetCode problems by URL
- **Algorithm Explanations**: Get step-by-step explanations of solving algorithms
- **Code Solutions**: Receive optimized code with detailed comments
- **Time & Space Complexity Analysis**: Understand the efficiency of different approaches
- **Multiple Themes**: Choose between Dark and LeetCode-inspired themes
- **Quick Actions**: Pre-configured prompts for common questions
- **Syntax Highlighting**: Clean code display with copy functionality
- **Responsive Design**: Works on mobile and desktop

## 📋 Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [AI Integration](#ai-integration)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)


## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ansharma-as/Scaler_Assignment.git
   cd Scaler_Assignment
   ```

2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

    ```bash
   cd backend
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   VITE_API_URL=http://localhost:3000
   ```

4. Start the development server:
   for Frontend
   ```bash
   npm run dev
   ```
   for Backend
 ```bash
   node server.js
   ```

6. The application will be available at `http://localhost:5173` (or the port assigned by Vite)

## 💻 Usage

### Sharing a LeetCode Problem

1. Click the "Add LeetCode Problem" button in the sidebar
2. Paste a LeetCode problem URL (e.g., https://leetcode.com/problems/two-sum/)
3. Click "Set Problem" to associate your conversation with this problem

### Asking Questions

You can:
- Type your question in the input field at the bottom
- Use one of the pre-configured quick actions in the sidebar
- Directly paste a LeetCode URL in your message

### Example Prompts

- "Explain the algorithm to solve this problem step by step"
- "What's the time and space complexity of the optimal solution?"
- "Show me the optimal solution in JavaScript with comments"
- "What are the edge cases I should consider?"
- "Compare different approaches to solve this problem"

## 🏗️ Architecture

The application follows a client-server architecture:

### Frontend (This Repository)

- **React**: Core UI library
- **Axios**: API requests to the backend
- **React Markdown**: Rendering markdown responses
- **Syntax Highlighter**: Code formatting with Prism
- **React Icons**: UI icons

### Component Structure

- `ChatComponent`: Main component managing the chat interface
- `CodeSolution`: Displays formatted code with copy functionality
- `ProblemLink`: Renders LeetCode problem links with difficulty badges
- `DifficultyBadge`: Visual indicator of problem difficulty

### Backend (Separate Repository)

The backend should provide:
- An API endpoint at `/api/chat` that accepts:
  - `userMessage`: The user's question
  - `leetcodeUrl`: Optional LeetCode problem URL
  - `context`: Indication that this is a LeetCode query

## 🤖 AI Integration

This application integrates with a language model API through the backend. The communication flow is:

1. User sends a message or LeetCode URL
2. Frontend sends request to backend's `/api/chat` endpoint
3. Backend enriches the prompt with:
   - LeetCode problem context if a URL is provided
   - Instructions to format responses specifically for LeetCode problems
4. AI generates a response with:
   - Algorithm explanations
   - Code solutions (properly formatted)
   - Complexity analysis
5. Frontend renders the response with proper formatting (markdown, code highlighting)

### AI Prompt Engineering

For optimal results, the backend should structure prompts to the AI with:
- Problem context extraction from LeetCode
- Response format instructions (markdown, code blocks)
- Specific directions to include time/space complexity analysis
- Instructions to provide detailed code comments

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with:

```
VITE_API_URL=http://localhost:8000
```

### Theming

Two themes are available:
- Dark theme (default)
- LeetCode-inspired theme

You can modify theme colors in the `themeColors` object in `ChatComponent.jsx`.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📚 Resources

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Markdown Documentation](https://github.com/remarkjs/react-markdown)
