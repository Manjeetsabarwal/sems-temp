import React, { useState, useRef, useEffect } from 'react';
import { Send, ThumbsUp, ThumbsDown, Star, Bot, User, Sparkles, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cn } from '../ui/utils';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  category?: string;
  confidence?: number;
  feedback?: {
    rating?: number;
    type?: 'thumbs_up' | 'thumbs_down';
  };
}

interface Suggestion {
  text: string;
  category: string;
  icon: React.ElementType;
}

const suggestions: Suggestion[] = [
  { text: 'Show me students who are performing poorly', category: 'academic', icon: Sparkles },
  { text: 'What is the fee collection status this month?', category: 'financial', icon: Sparkles },
  { text: 'Compare attendance between classes', category: 'operational', icon: Sparkles },
  { text: 'Predict exam performance trends', category: 'predictive', icon: Sparkles },
];

export function AiChatbot() {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowSuggestions(false);
    setIsLoading(true);

    try {
      // Call AI API
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          question: input,
          context: {
            currentView: 'ai-chat',
            userRole: currentUser?.role,
          },
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        category: data.category,
        confidence: data.confidence,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, type: 'thumbs_up' | 'thumbs_down', rating?: number) => {
    try {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          interactionId: parseInt(messageId),
          feedbackType: rating ? 'star_rating' : type,
          rating,
        }),
      });

      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, feedback: { rating, type } }
          : msg
      ));
      setShowFeedback(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setInput(suggestion.text);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">AI Assistant</h3>
          <p className="text-xs text-gray-500">Ask me anything about your school data</p>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronDown className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && showSuggestions && (
          <div className="space-y-4">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900 mb-1">How can I help you today?</h4>
              <p className="text-sm text-gray-500">Try asking about student performance, fees, or attendance</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <suggestion.icon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">{suggestion.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.type === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.type === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div className={cn(
              'max-w-[80%] rounded-lg p-3',
              message.type === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-900'
            )}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {message.type === 'assistant' && (
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {message.category && (
                      <span className="text-xs bg-white px-2 py-1 rounded text-gray-600">
                        {message.category}
                      </span>
                    )}
                    {message.confidence && (
                      <span className="text-xs text-gray-500">
                        {Math.round(message.confidence * 100)}% confident
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {!message.feedback ? (
                      <>
                        <button
                          onClick={() => setShowFeedback(showFeedback === message.id ? null : message.id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Star className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, 'thumbs_up')}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <ThumbsUp className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, 'thumbs_down')}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <ThumbsDown className="w-4 h-4 text-gray-500" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500">
                        {message.feedback.type === 'thumbs_up' && '👍'}
                        {message.feedback.type === 'thumbs_down' && '👎'}
                        {message.feedback.rating && `⭐ ${message.feedback.rating}`}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {message.type === 'user' && (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {showFeedback && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
            <span className="text-sm text-gray-700">Rate this response:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleFeedback(showFeedback, 'thumbs_up', star)}
                className="p-1 hover:bg-yellow-100 rounded transition-colors"
              >
                <Star className={cn(
                  'w-4 h-4',
                  star <= (messages.find(m => m.id === showFeedback)?.feedback?.rating || 0)
                    ? 'text-yellow-500 fill-current'
                    : 'text-gray-400'
                )} />
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              'p-2 rounded-lg transition-colors',
              input.trim() && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
