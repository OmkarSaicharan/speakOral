import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Groq from 'groq-sdk';
import { cn } from '../lib/utils';

const groq = new Groq({
  apiKey: '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',
  dangerouslyAllowBrowser: true
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your speakOral assistant. How can I help you today? I can clear your English doubts or tell you about our courses.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an English Learning Assistant for the website "speakOral".
            Your goal is to clear English doubts (grammar, vocabulary, etc.) and provide information about speakOral.
            
            speakOral Courses:
            1. Monthly Plan (₹0): Grammar fundamentals, basic vocabulary, weekly quizzes.
            2. Professional Plan (₹0, 6 Months): Advanced business English, speaking practice, video tutorials.
            3. Mastery Program (₹0, 12 Months): Full fluency, IELTS/TOEFL prep, 1-on-1 mentorship.
            
            Website Features:
            - Study Notes, Video Tutorials, Interactive Quizzes, Assignments, Community Forum, and Direct Messaging with Admin.
            
            Keep your response helpful, concise, and encouraging. If the user asks about something unrelated to English or speakOral, politely redirect them.`
          },
          ...newMessages
        ],
        model: 'llama-3.3-70b-versatile',
      });

      const botText = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'assistant', content: botText }]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4"
          >
            <Card className="w-80 sm:w-96 shadow-2xl border-white/10 bg-black/90 backdrop-blur-xl rounded-3xl overflow-hidden text-white">
              <CardHeader className="bg-white text-black p-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center space-x-2">
                  <div className="bg-black/10 p-1.5 rounded-lg">
                    <Bot className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg font-bold">speakOral AI</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-black hover:bg-black/10 rounded-full h-8 w-8"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[400px]">
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/5"
                >
                  {messages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex items-start space-x-2",
                        msg.role === 'user' ? "flex-row-reverse space-x-reverse" : ""
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        msg.role === 'assistant' ? "bg-white/10 text-white" : "bg-white/20 text-white"
                      )}>
                        {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>
                      <div className={cn(
                        "p-3 rounded-2xl text-sm shadow-sm max-w-[80%]",
                        msg.role === 'assistant' ? "bg-white/10 text-white/90 rounded-tl-none" : "bg-white text-black rounded-tr-none"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-start space-x-2">
                      <div className="bg-white/10 text-white p-2 rounded-lg">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none shadow-sm">
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-black border-t border-white/10">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex items-center space-x-2"
                  >
                    <Input 
                      placeholder="Ask a doubt..." 
                      className="rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-white"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="bg-white text-black hover:bg-white/90 rounded-xl shrink-0"
                      disabled={!input.trim() || isLoading}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="lg"
        className={cn(
          "rounded-full h-14 w-14 shadow-2xl transition-all duration-300",
          isOpen ? "bg-white text-black rotate-90" : "bg-white text-black hover:scale-110"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
          </span>
        )}
      </Button>
    </div>
  );
}
