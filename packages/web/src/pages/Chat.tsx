import { useState, useEffect, useRef } from 'react';
import * as api from '../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  PaperPlaneRight,
  Plus,
  Robot,
  User,
  Spinner,
  TrashSimple,
  ChatCircle,
  CaretLeft,
  WarningCircle,
} from '@phosphor-icons/react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

const AGENTS = [
  { id: 'ls-commander', name: 'HEYMACHA', desc: 'Mission commander' },
  { id: 'livescape-scout', name: 'SCOUT', desc: 'Artist research' },
  { id: 'livescape-pulse', name: 'PULSE', desc: 'Social analytics' },
  { id: 'livescape-radar', name: 'RADAR', desc: 'Trend detection' },
  { id: 'livescape-meta', name: 'META', desc: 'Metadata ops' },
  { id: 'livescape-brain', name: 'BRAIN', desc: 'Strategy engine' },
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    createSession();
  }, []);

  const createSession = async () => {
    try {
      const data = await api.chat.createSession();
      setSessionId(data.id || data.sessionId);
    } catch (err) {
      console.error('Failed to create chat session:', err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || loading) return;

    const userMessage = input.trim();
    setInput('');

    const tempUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      setLoading(true);
      const response = await api.chat.sendMessage(sessionId, userMessage);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response || 'No response',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: `Error: ${err.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleNewSession = () => {
    setMessages([]);
    setSessionId(null);
    createSession();
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] lg:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-cyber-border bg-cyber-bg-secondary/50 rounded-t-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center">
              <Robot size={20} className="text-cyber-cyan" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold text-cyber-text-primary">
                {selectedAgent.name}
              </h1>
              <p className="text-[10px] text-cyber-text-dim font-mono">{selectedAgent.desc}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Agent Picker */}
          <select
            value={selectedAgent.id}
            onChange={(e) => {
              const agent = AGENTS.find(a => a.id === e.target.value);
              if (agent) setSelectedAgent(agent);
            }}
            className="px-3 py-1.5 bg-cyber-bg-tertiary border border-cyber-border rounded text-xs text-cyber-text-primary font-mono focus:outline-none focus:border-cyber-cyan hidden sm:block"
          >
            {AGENTS.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <button
            onClick={handleClearChat}
            className="p-2 text-cyber-text-dim hover:text-cyber-red transition-colors"
            title="Clear chat"
          >
            <TrashSimple size={16} />
          </button>

          <button
            onClick={handleNewSession}
            className="cyber-btn px-3 py-1.5 text-xs font-heading uppercase tracking-wide"
          >
            <Plus size={14} className="mr-1 inline" />
            New
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-cyber-bg-primary/30">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-cyber-cyan/5 border border-cyber-cyan/20 flex items-center justify-center mx-auto mb-6">
              <Robot size={40} className="text-cyber-cyan/50" />
            </div>
            <h2 className="font-heading text-xl font-bold text-cyber-text-primary mb-2">
              {selectedAgent.name} READY
            </h2>
            <p className="text-sm text-cyber-text-dim max-w-md mx-auto">
              Ask about projects, tasks, agents, or anything related to your missions.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                'What tasks are in the queue?',
                'Show project status',
                'Which agents are active?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="px-3 py-1.5 text-xs text-cyber-text-secondary bg-cyber-bg-tertiary border border-cyber-border rounded-full hover:border-cyber-cyan hover:text-cyber-cyan transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-2xl px-4 py-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-cyber-cyan/15 border border-cyber-cyan/30 text-cyber-text-primary'
                  : msg.role === 'system'
                  ? 'bg-cyber-red/10 border border-cyber-red/30 text-cyber-red'
                  : 'cyber-card text-cyber-text-primary'
              }`}
            >
              <div className="flex items-start gap-3">
                {msg.role === 'user' ? (
                  <div className="w-6 h-6 rounded-full bg-cyber-cyan/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={12} className="text-cyber-cyan" />
                  </div>
                ) : msg.role === 'assistant' ? (
                  <div className="w-6 h-6 rounded-full bg-cyber-bg-tertiary border border-cyber-border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Robot size={12} className="text-cyber-cyan" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-cyber-red/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <WarningCircle size={12} className="text-cyber-red" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 text-cyber-text-primary">{children}</p>,
                          a: ({ href, children }) => (
                            <a href={href} className="text-cyber-cyan hover:underline" target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                          code: ({ inline, children }: any) =>
                            inline ? (
                              <code className="bg-cyber-bg-tertiary px-1.5 py-0.5 rounded text-cyber-cyan font-mono text-xs">
                                {children}
                              </code>
                            ) : (
                              <code className="block bg-cyber-bg-tertiary border border-cyber-border p-3 rounded font-mono text-xs overflow-x-auto">
                                {children}
                              </code>
                            ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  )}
                  <p className="text-[10px] text-cyber-text-dim font-mono mt-2">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="cyber-card px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-cyber-bg-tertiary border border-cyber-border flex items-center justify-center">
                  <Robot size={12} className="text-cyber-cyan" />
                </div>
                <div className="flex items-center gap-2 text-xs text-cyber-text-dim">
                  <Spinner size={14} className="text-cyber-cyan animate-spin" />
                  <span className="font-mono">{selectedAgent.name} is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-cyber-border bg-cyber-bg-secondary/50 p-4 rounded-b-lg">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${selectedAgent.name}...`}
            disabled={loading || !sessionId}
            className="flex-1 px-4 py-3 bg-cyber-bg-tertiary border border-cyber-border rounded-lg text-sm text-cyber-text-primary font-body placeholder-cyber-text-dim focus:outline-none focus:border-cyber-cyan transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !sessionId}
            className="cyber-btn px-4 py-3 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            <PaperPlaneRight size={18} weight="fill" />
          </button>
        </form>
        <p className="text-[9px] text-cyber-text-dim font-mono mt-2 text-center">
          Connected to {selectedAgent.id} • Session {sessionId?.slice(0, 8) || '...'}
        </p>
      </div>
    </div>
  );
}
