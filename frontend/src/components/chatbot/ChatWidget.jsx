import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, AlertTriangle, Sparkles, User, RefreshCw } from 'lucide-react';
import { chatbotApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I am your AI Automotive Advisor for Track Automotive. Ask me about vehicle symptoms, maintenance schedules, or how to use the garage portal."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  const starterQuestions = [
    "When should I change my synthetic engine oil?",
    "Why are my brakes squeaking?",
    "What does a flashing check engine light mean?",
    "How do I book a service appointment?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText = input) => {
    const textToSend = messageText.trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Prepare history for context
      const history = messages.slice(-4).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await chatbotApi.sendMessage(textToSend, history);
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: res.data.response || "No response received."
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "I am having trouble reaching the automotive AI service right now. Please try again in a few moments or contact our service desk.",
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-900 text-white shadow-xl hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 border border-slate-700/50 group"
          aria-label="Open AI Help Chatbot"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-blue-400 group-hover:text-white transition-colors" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <span className="text-sm font-medium pr-1">AI Garage Advisor</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[90vw] sm:w-[420px] h-[550px] max-h-[85vh] rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  AI Automotive Advisor
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-1.5 py-0.2 rounded font-mono">
                    AI
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">Track Automotive Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-[82%] text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                      : m.isError
                      ? 'bg-red-50 text-red-800 border border-red-200 rounded-tl-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none shadow-sm whitespace-pre-line'
                  }`}
                >
                  {m.text}
                </div>
                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Analyzing automotive recommendations...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starters */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-slate-100/70 border-t border-slate-200 overflow-x-auto flex gap-1.5">
              {starterQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="whitespace-nowrap px-2.5 py-1 text-[11px] bg-white text-slate-700 border border-slate-200 rounded-full hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about car symptoms or maintenance..."
                disabled={loading}
                className="flex-1 text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-slate-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              Guidance only. Does not replace physical mechanical inspection.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
