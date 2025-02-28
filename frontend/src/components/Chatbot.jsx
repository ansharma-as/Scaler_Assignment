import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FiSend, FiLink, FiCode, FiCopy } from 'react-icons/fi';
import { FaRobot, FaLightbulb } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeSolution = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="relative">
      <div className="absolute right-2 top-2 z-10">
        <button 
          onClick={copyToClipboard} 
          className="p-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
          title="Copy code"
        >
          {copied ? "Copied!" : <FiCopy />}
        </button>
      </div>
      <SyntaxHighlighter 
        language={language || "javascript"} 
        style={atomDark}
        className="rounded-md"
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

const ProblemLink = ({ url }) => {
  // Extract problem name from LeetCode URL
  const getProblemName = (url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('leetcode.com')) {
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts.length >= 2 && pathParts[0] === 'problems') {
          return pathParts[1].split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        }
      }
      return 'LeetCode Problem';
    } catch (e) {
      return 'LeetCode Problem';
    }
  };

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="inline-flex items-center p-2 bg-blue-900 text-blue-200 rounded-md hover:bg-blue-800 transition-colors"
    >
      <FiLink className="mr-2" />
      {getProblemName(url)}
    </a>
  );
};

const ChatComponent = () => {
  const [userMessage, setUserMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [leetcodeUrl, setLeetcodeUrl] = useState('');
  const [showLeetcodeInput, setShowLeetcodeInput] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const detectLeetCodeUrl = (text) => {
    const leetcodeRegex = /https?:\/\/(www\.)?leetcode\.com\/problems\/[^\s]+/g;
    const match = text.match(leetcodeRegex);
    return match ? match[0] : null;
  };

  

const sendMessage = async (additionalContext = '') => {
  if (!userMessage.trim() && !additionalContext) return;

  const detectedUrl = detectLeetCodeUrl(userMessage);
  let messageToSend = userMessage;
  
  if (detectedUrl) {
    setLeetcodeUrl(detectedUrl);
  }
  
  if (additionalContext) {
    messageToSend = additionalContext + ' ' + userMessage;
  }

  const newMessage = { 
    role: 'user', 
    text: userMessage,
    leetcodeUrl: detectedUrl || leetcodeUrl 
  };

  setChatHistory((prevHistory) => [...prevHistory, newMessage]);
  setLoading(true);
  
  try {
    // Updated API call to match our new backend
    const response = await axios.post('http://localhost:8000/api/chat', {
      userMessage: messageToSend,
      leetcodeUrl: detectedUrl || leetcodeUrl,
      context: 'leetcode' // Add context to inform the backend this is a LeetCode query
    });

    // Update how we access the response data to match our new backend structure
    const processedResponse = response.data.response;

    const botResponse = {
      role: 'LeetCodeBot',
      text: processedResponse,
      rawResponse: response.data.aiResponse,
      timestamp: new Date().toISOString()
    };

    setChatHistory((prevHistory) => [...prevHistory, botResponse]);
  } catch (error) {
    console.error('Error sending message:', error);
    setChatHistory((prevHistory) => [
      ...prevHistory, 
      { 
        role: 'LeetCodeBot', 
        text: 'Sorry, I encountered an error. Please try again.',
        error: true
      }
    ]);
  } finally {
    setLoading(false);
    setUserMessage('');
  }
};

  const handleLeetCodeSubmit = () => {
    if (leetcodeUrl) {
      const contextMessage = `I'm working on this LeetCode problem: ${leetcodeUrl}. `;
      sendMessage(contextMessage);
      setShowLeetcodeInput(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Function to extract code blocks for special rendering
  const renderMessage = (message) => {
    if (!message.text) return null;
    
    // Check if the message contains a LeetCode URL
    const urlMatch = detectLeetCodeUrl(message.text);
    
    // For regular messages, use ReactMarkdown
    return (
      <div>
        {urlMatch && <ProblemLink url={urlMatch} />}
        <ReactMarkdown
          components={{
            code({node, inline, className, children, ...props}) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <CodeSolution 
                  code={String(children).replace(/\n$/, '')} 
                  language={match[1]} 
                />
              ) : (
                <code className={`${inline ? 'bg-gray-700 px-1 py-0.5 rounded' : 'block p-4 bg-gray-700 rounded-md'}`} {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {message.text}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-900 text-white">
      {/* Left Sidebar */}
      <div className="w-full lg:w-1/4 bg-gray-800 p-4 overflow-y-auto border-r border-gray-700">
        <div className="flex items-center space-x-2 mb-6">
          <FaRobot className="text-2xl text-blue-500" />
          <h2 className="text-xl font-bold">LeetCode Assistant</h2>
        </div>
        
        <div className="mb-6">
          <button 
            onClick={() => setShowLeetcodeInput(!showLeetcodeInput)}
            className="w-full flex items-center justify-center p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <FiLink className="mr-2" />
            {leetcodeUrl ? 'Change Problem' : 'Add LeetCode Problem'}
          </button>
          
          {showLeetcodeInput && (
            <div className="mt-2 p-3 bg-gray-700 rounded-lg">
              <input 
                type="text" 
                value={leetcodeUrl} 
                onChange={(e) => setLeetcodeUrl(e.target.value)}
                placeholder="Paste LeetCode URL..."
                className="w-full p-2 mb-2 bg-gray-800 border border-gray-600 rounded"
              />
              <button 
                onClick={handleLeetCodeSubmit}
                className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Set Problem
              </button>
            </div>
          )}
        </div>
        
        {/* Previous Conversations or Suggestion Buttons */}
        <div>
          <h3 className="font-medium text-gray-400 mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <button 
              onClick={() => {
                setUserMessage("Explain the algorithm to solve this problem step by step");
                setTimeout(() => sendMessage(), 100);
              }}
              className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <FaLightbulb className="inline mr-2 text-yellow-500" />
              Explain algorithm step by step
            </button>
            <button 
              onClick={() => {
                setUserMessage("What's the time and space complexity of the optimal solution?");
                setTimeout(() => sendMessage(), 100);
              }}
              className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <FiCode className="inline mr-2 text-green-500" />
              Time & space complexity analysis
            </button>
            <button 
              onClick={() => {
                setUserMessage("Show me the optimal solution in JavaScript with comments");
                setTimeout(() => sendMessage(), 100);
              }}
              className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <FiCode className="inline mr-2 text-blue-500" />
              Get JavaScript solution
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Chat Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-900">
          <div className="max-w-4xl mx-auto">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <FaRobot className="text-6xl mb-4 text-blue-500" />
                <h2 className="text-2xl font-bold mb-2">Welcome to LeetCode Assistant</h2>
                <p className="mb-4">Share a LeetCode problem link and ask questions about algorithms, solutions, or concepts.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <h3 className="font-medium mb-1">How to use:</h3>
                    <p className="text-sm">Paste a LeetCode problem URL and ask for solutions, explanations, or optimization tips.</p>
                  </div>
                  <div className="p-3 bg-gray-800 rounded-lg">
                    <h3 className="font-medium mb-1">Example questions:</h3>
                    <p className="text-sm">"Explain the dynamic programming approach" or "Help me optimize this solution"</p>
                  </div>
                </div>
              </div>
            ) : (
              chatHistory.map((message, index) => (
                <div key={index} className={`mb-6 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    p-4 rounded-lg shadow-md max-w-3xl
                    ${message.role === 'user' 
                      ? 'bg-blue-700 text-white' 
                      : message.error 
                        ? 'bg-red-900 text-red-100' 
                        : 'bg-gray-800 text-gray-100'}
                  `}>
                    <div className="flex items-center mb-2">
                      {message.role !== 'user' && <FaRobot className="mr-2 text-blue-400" />}
                      <span className="font-medium">
                        {message.role === 'user' ? 'You' : 'LeetCode Assistant'}
                      </span>
                      {message.timestamp && (
                        <span className="ml-2 text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <div className="prose prose-invert max-w-none">
                      {renderMessage(message)}
                    </div>
                    {message.rawResponse && (
                      <details className="mt-3 text-sm border-t border-gray-700 pt-2">
                        <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
                          Show raw response
                        </summary>
                        <div className="mt-2 p-2 bg-gray-900 rounded whitespace-pre-wrap font-mono text-xs">
                          {message.rawResponse}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Input Area */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={leetcodeUrl 
                  ? "Ask about this LeetCode problem..." 
                  : "Share a LeetCode problem link or ask a question..."}
                className="w-full p-4 pr-12 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading}
                className={`absolute right-2 bottom-2 p-2 rounded-full ${
                  loading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors`}
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-t-transparent border-white rounded-full animate-spin" />
                ) : (
                  <FiSend className="text-xl" />
                )}
              </button>
            </div>
            {leetcodeUrl && (
              <div className="mt-2 text-sm text-gray-400">
                Current problem: <span className="text-blue-400">{leetcodeUrl}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;