import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FiSend, FiLink, FiCode, FiCopy, FiFilter, FiX, FiBook, FiClock, FiCpu } from 'react-icons/fi';
import { FaRobot, FaLightbulb, FaCheck, FaCodeBranch, FaKeyboard, FaMedal } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const API_URL = import.meta.env.VITE_API_URL;

// setting up difficulty badges with LeetCode theme color
const DifficultyBadge = ({ level }) => {
  const colors = {
    easy: { bg: 'bg-green-600', text: 'text-green-100' },
    medium: { bg: 'bg-yellow-600', text: 'text-yellow-100' },
    hard: { bg: 'bg-red-600', text: 'text-red-100' }
  };
  
  const { bg, text } = colors[level.toLowerCase()] || colors.medium;
  
  return (
    <span className={`text-xs font-bold px-2 py-1 rounded ${bg} ${text} uppercase`}>
      {level}
    </span>
  );
};

const CodeSolution = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="relative mt-2 rounded-md overflow-hidden border border-gray-700 group">
      <div className="flex justify-between items-center bg-gray-800 px-3 py-2 border-b border-gray-700">
        <div className="flex items-center">
          <FiCode className="text-yellow-500 mr-2" />
          <span className="text-sm font-mono text-gray-300">{language || "javascript"}</span>
        </div>
        <button 
          onClick={copyToClipboard} 
          className="p-1.5 text-sm bg-gray-700 rounded hover:bg-gray-600 transition-colors flex items-center"
          title="Copy code"
        >
          {copied ? (
            <>
              <FaCheck className="mr-1.5 text-green-500" />
              <span className="text-xs">Copied</span>
            </>
          ) : (
            <>
              <FiCopy className="mr-1.5" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter 
        language={language || "javascript"} 
        style={atomDark}
        customStyle={{ margin: 0, borderRadius: 0 }}
        className="text-sm"
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

const ProblemLink = ({ url }) => {
  // Extract problem name and guess difficulty from LeetCode URL
  const getProblemDetails = (url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('leetcode.com')) {
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts.length >= 2 && pathParts[0] === 'problems') {
          const problemName = pathParts[1].split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          
          // Guess difficulty based on problem name (just for UI demonstration)
          // In a real app, you'd get this from the API
          let difficulty = 'Medium';
          if (problemName.includes('Easy') || problemName.toLowerCase().includes('simple')) {
            difficulty = 'Easy';
          } else if (problemName.includes('Hard') || problemName.toLowerCase().includes('difficult')) {
            difficulty = 'Hard';
          }
          
          return { name: problemName, difficulty };
        }
      }
      return { name: 'LeetCode Problem', difficulty: 'Medium' };
    } catch (e) {
      return { name: 'LeetCode Problem', difficulty: 'Medium' };
    }
  };

  const { name, difficulty } = getProblemDetails(url);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="inline-flex items-center px-3 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors border border-gray-700"
      >
        <FiLink className="mr-2 text-yellow-500" />
        <span className="font-medium">{name}</span>
      </a>
      <DifficultyBadge level={difficulty} />
    </div>
  );
};

const ChatComponent = () => {
  const [userMessage, setUserMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [leetcodeUrl, setLeetcodeUrl] = useState('');
  const [showLeetcodeInput, setShowLeetcodeInput] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('dark'); // making two theme dark or leetcode theme
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom if message length is big
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [userMessage]);

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
      leetcodeUrl: detectedUrl || leetcodeUrl,
      timestamp: new Date().toISOString()
    };

    setChatHistory((prevHistory) => [...prevHistory, newMessage]);
    setLoading(true);
    
    try {
      // making a post request to our backend with usermessage and leetcodeurl in body
      const response = await axios.post(`${API_URL}/api/chat`, {
        userMessage: messageToSend,
        leetcodeUrl: detectedUrl || leetcodeUrl,
        context: 'leetcode' // Adding context for our backend
      });

      // taking back the response from backend
      const processedResponse = response.data.response;

      const botResponse = {
        role: 'LeetCodeBot',
        text: processedResponse,
        rawResponse: response.data.aiResponse,
        timestamp: new Date().toISOString()
      };

      setChatHistory((prevHistory) => [...prevHistory, botResponse]); //saving history 
    } catch (error) {
      console.error('Error sending message:', error);
      setChatHistory((prevHistory) => [
        ...prevHistory, 
        { 
          role: 'LeetCodeBot', 
          text: 'Sorry, I encountered an error. Please try again.',
          error: true,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
      setUserMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };


  // function to submit leetcode url
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
    
    // Checking LeetCode URL in usermessgae
    const urlMatch = detectLeetCodeUrl(message.text);
    
    // showing up the response in marksdown markson for better ui
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
                <code className={`${inline ? 'bg-gray-700 px-1 py-0.5 rounded text-yellow-300' : 'block p-4 bg-gray-800 rounded-md border border-gray-700 my-2'}`} {...props}>
                  {children}
                </code>
              );
            },
            // Customize other markdown elements
            h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4 pb-2 border-b border-gray-700" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-4 mb-2" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-3 mb-2" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc list-inside my-2 space-y-1" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2 space-y-1" {...props} />,
            li: ({node, ...props}) => <li className="ml-2" {...props} />,
            p: ({node, ...props}) => <p className="my-2" {...props} />,
            a: ({node, ...props}) => <a className="text-blue-400 hover:underline" {...props} />,
            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-600 pl-4 py-2 my-2 bg-gray-800 rounded-r-md italic" {...props} />,
          }}
        >
          {message.text}
        </ReactMarkdown>
      </div>
    );
  };

  // Quick actions sidebar
  const quickActionCategories = [
    {
      title: "Algorithm Help",
      icon: <FaLightbulb className="text-yellow-500" />,
      actions: [
        {
          text: "Explain the algorithm step by step",
          prompt: "Explain the algorithm to solve this problem step by step with clear examples",
          icon: <FiBook className="text-yellow-400" />
        },
        {
          text: "Compare different approaches",
          prompt: "What are the different approaches to solve this problem? Compare their trade-offs.",
          icon: <FaCodeBranch className="text-blue-400" />
        }
      ]
    },
    {
      title: "Code Solutions",
      icon: <FiCode className="text-green-500" />,
      actions: [
        {
          text: "Optimal JavaScript solution",
          prompt: "Show me the optimal solution in JavaScript with detailed comments explaining each step",
          icon: <FiCpu className="text-green-400" />
        },
        {
          text: "Step-by-step code walkthrough",
          prompt: "Write a solution in JavaScript and walk through the execution step by step with examples",
          icon: <FaKeyboard className="text-blue-400" />
        }
      ]
    },
    {
      title: "Analysis",
      icon: <FiFilter className="text-purple-500" />,
      actions: [
        {
          text: "Time & space complexity",
          prompt: "What's the time and space complexity of the optimal solution? Explain in detail.",
          icon: <FiClock className="text-purple-400" />
        },
        {
          text: "Edge cases & optimizations",
          prompt: "What are the edge cases for this problem and how can I optimize my solution further?",
          icon: <FaMedal className="text-amber-400" />
        }
      ]
    }
  ];

  // LeetCode-inspired theme and the dark theme for attractivess of UI
  const themeColors = {
    dark: {
      bg: "bg-gray-900",
      sidebar: "bg-gray-800",
      card: "bg-gray-800",
      input: "bg-gray-700",
      border: "border-gray-700",
      accent: "text-blue-500",
      button: "bg-blue-600 hover:bg-blue-700",
      userBubble: "bg-blue-700",
      botBubble: "bg-gray-800"
    },
    leetcode: {
      bg: "bg-[#0a0a0a]",
      sidebar: "bg-[#121212]",
      card: "bg-[#181818]",
      input: "bg-[#1e1e1e]", 
      border: "border-[#3e3e3e]",
      accent: "text-[#ffa116]",
      button: "bg-[#ffa116] hover:bg-[#f59a07] text-black",
      userBubble: "bg-[#2c3e50]",
      botBubble: "bg-[#181818]"
    }
  };
  
  const colors = themeColors[theme];

  return (
    <div className={`flex flex-col lg:flex-row h-screen ${colors.bg} text-white transition-colors duration-300`}>
      {/* Toggle sidebar button (mobile only) */}
      <button 
        className={` fixed top-4 left-4 z-50 p-2 rounded-md ${colors.card} ${colors.border} border ${
          sidebarCollapsed ? '' : 'left-80'
        }`}
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        {sidebarCollapsed ? <FiLink /> : <FiX />}
      </button>

      {/* Left Sidebar */}
      <div className={`${sidebarCollapsed ? 'hidden' : 'fixed inset-0 z-40'} lg:relative lg:z-auto lg:block transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-0' : 'w-96 lg:w-96 xl:w-96'
      } ${colors.sidebar} border-r ${colors.border} overflow-y-auto`}>
        <div className="p-5">
          {/* Sidebar Header */}
          <div className="flex items-center space-x-3 mb-8">
            <div className={`p-3 rounded-lg ${theme === 'leetcode' ? 'bg-[#ffa116]' : 'bg-blue-600'}`}>
              <FaRobot className={`text-2xl ${theme === 'leetcode' ? 'text-black' : 'text-white'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold">LeetCode Assistant</h2>
              <p className={`text-sm ${colors.accent}`}>Your coding companion</p>
            </div>
          </div>

          {/* Theme Switch */}
          <div className="flex items-center justify-center mb-6 space-x-3">
            <button 
              className={`px-3 py-2 rounded-md flex-1 ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setTheme('dark')}
            >
              Dark Theme
            </button>
            <button 
              className={`px-3 py-2 rounded-md flex-1 ${theme === 'leetcode' ? 'bg-[#ffa116] text-black' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setTheme('leetcode')}
            >
              LeetCode Theme
            </button>
          </div>
          
          {/* LeetCode Problem Input */}
          <div className="mb-6">
            <button 
              onClick={() => setShowLeetcodeInput(!showLeetcodeInput)}
              className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors ${colors.button}`}
            >
              <FiLink className={`mr-2 ${theme === 'leetcode' ? 'text-black' : ''}`} />
              <span className={theme === 'leetcode' ? 'text-black' : ''}>
                {leetcodeUrl ? 'Change Problem' : 'Add LeetCode Problem'}
              </span>
            </button>
            
            {showLeetcodeInput && (
              <div className={`mt-3 p-4 ${colors.card} rounded-lg shadow-lg ${colors.border} border`}>
                <label className="block text-sm font-medium mb-2">Problem URL</label>
                <input 
                  type="text" 
                  value={leetcodeUrl} 
                  onChange={(e) => setLeetcodeUrl(e.target.value)}
                  placeholder="Paste LeetCode URL..."
                  className={`w-full p-3 mb-3 ${colors.input} border ${colors.border} rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 ${theme === 'leetcode' ? 'focus:ring-[#ffa116]' : 'focus:ring-blue-500'}`}
                />
                <div className="flex space-x-2">
                  <button 
                    onClick={handleLeetCodeSubmit}
                    className={`flex-1 p-2 ${colors.button} rounded-md transition-colors`}
                  >
                    <span className={theme === 'leetcode' ? 'text-black' : ''}>Set Problem</span>
                  </button>
                  <button 
                    onClick={() => setShowLeetcodeInput(false)}
                    className={`p-2 ${colors.input} border ${colors.border} rounded-md hover:bg-gray-600 transition-colors`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="space-y-6">
            {quickActionCategories.map((category, idx) => (
              <div key={idx}>
                <div className="flex items-center mb-3">
                  <span className="mr-2">{category.icon}</span>
                  <h3 className="font-medium text-gray-300">{category.title}</h3>
                </div>
                <div className="space-y-2">
                  {category.actions.map((action, actionIdx) => (
                    <button 
                      key={actionIdx}
                      onClick={() => {
                        setUserMessage(action.prompt);
                        setTimeout(() => sendMessage(), 100);
                        setSidebarCollapsed(true); // For mobile
                      }}
                      className={`w-full text-left p-3 ${colors.card} hover:bg-opacity-80 rounded-lg transition-colors flex items-start ${colors.border} border`}
                    >
                      <span className="mr-3 mt-0.5">{action.icon}</span>
                      <span>{action.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area - adjust for sidebar state */}
      <div className={`flex-1 flex flex-col h-full ${sidebarCollapsed ? 'w-full' : 'lg:ml-0'} transition-all duration-300`}>
        {/* Chat Messages Area */}
        <div className={`flex-1 p-4 overflow-y-auto ${colors.bg}`}>
          <div className="max-w-4xl mx-auto">
            {chatHistory.length === 0 ? (
              <div className={`flex flex-col items-center justify-center h-full text-center text-gray-400 p-6 ${colors.card} rounded-xl border ${colors.border} shadow-lg max-w-3xl mx-auto mt-8`}>
                <div className={`p-5 rounded-full mb-6 ${theme === 'leetcode' ? 'bg-[#ffa116]' : 'bg-blue-600 bg-opacity-20'}`}>
                  <FaRobot className={`text-6xl ${theme === 'leetcode' ? 'text-black' : 'text-blue-500'}`} />
                </div>
                <h2 className="text-2xl font-bold mb-4">Welcome to LeetCode Assistant</h2>
                <p className="mb-6 max-w-md">Share a LeetCode problem link and ask questions about algorithms, solutions, or concepts.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                  <div className={`p-4 ${colors.card} rounded-lg border ${colors.border}`}>
                    <div className="flex items-center mb-2">
                      <FiBook className={`mr-2 ${colors.accent}`} />
                      <h3 className="font-medium">How to use:</h3>
                    </div>
                    <p className="text-sm">Paste a LeetCode problem URL and ask for solutions, explanations, or optimization tips.</p>
                  </div>
                  <div className={`p-4 ${colors.card} rounded-lg border ${colors.border}`}>
                    <div className="flex items-center mb-2">
                      <FaLightbulb className={`mr-2 ${colors.accent}`} />
                      <h3 className="font-medium">Example questions:</h3>
                    </div>
                    <p className="text-sm">"Explain the dynamic programming approach" or "Help me optimize this solution"</p>
                  </div>
                </div>
              </div>
            ) : (
              chatHistory.map((message, index) => (
                <div key={index} className={`mb-6 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    px-4 py-3 rounded-lg shadow-md max-w-3xl break-words
                    ${message.role === 'user' 
                      ? colors.userBubble 
                      : message.error 
                        ? 'bg-red-900 text-red-100' 
                        : `${colors.botBubble} border ${colors.border}`}
                    ${message.role !== 'user' ? 'w-full md:w-auto' : ''}
                  `}>
                    <div className="flex items-center mb-2">
                      {message.role !== 'user' && (
                        <div className={`rounded-full p-1 mr-2 ${theme === 'leetcode' ? 'bg-[#ffa116] bg-opacity-20' : 'bg-blue-600 bg-opacity-20'}`}>
                          <FaRobot className={theme === 'leetcode' ? 'text-[#ffa116]' : 'text-blue-400'} />
                        </div>
                      )}
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
                      <details className={`mt-3 text-sm border-t ${colors.border} pt-2`}>
                        <summary className="cursor-pointer text-gray-400 hover:text-gray-300 flex items-center">
                          <FiCode className="mr-1.5" />
                          <span>Show raw response</span>
                        </summary>
                        <div className={`mt-2 p-2 ${colors.bg} rounded whitespace-pre-wrap font-mono text-xs overflow-x-auto`}>
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
        <div className={`p-4 ${colors.sidebar} border-t ${colors.border}`}>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={leetcodeUrl 
                  ? "Ask about this LeetCode problem..." 
                  : "Share a LeetCode problem link or ask a question..."}
                className={`w-full p-4 pr-14 ${colors.input} border ${colors.border} rounded-lg focus:outline-none focus:ring-2 ${theme === 'leetcode' ? 'focus:ring-[#ffa116]' : 'focus:ring-blue-500'} focus:ring-opacity-50 resize-none overflow-hidden min-h-[80px] max-h-[200px]`}
                rows="1"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading}
                className={`absolute right-3 bottom-3 p-3 rounded-full transition-all ${
                  loading 
                    ? `${colors.card} cursor-not-allowed` 
                    : colors.button
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                ) : (
                  <FiSend className={`text-lg ${theme === 'leetcode' ? 'text-black' : ''}`} />
                )}
              </button>
            </div>
            {leetcodeUrl && (
              <div className={`mt-2 text-sm ${theme === 'leetcode' ? 'text-[#ffa116]' : 'text-blue-400'} flex items-center`}>
                <FiLink className="mr-1.5" />
                <span className="truncate">{leetcodeUrl}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;