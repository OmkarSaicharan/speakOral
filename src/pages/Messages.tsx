import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Message } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User, Search, Check, CheckCheck, MessageSquare, ChevronLeft, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { deleteDoc } from 'firebase/firestore';

interface MessagesProps {
  user: UserProfile;
}

export default function Messages({ user }: MessagesProps) {
  const [chats, setChats] = useState<{ student: UserProfile, lastMessage?: Message }[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = user.role === 'admin';
  const [adminUid, setAdminUid] = useState<string | null>(null);
  const [fetchingAdmin, setFetchingAdmin] = useState(!isAdmin);

  // Find admin UID
  useEffect(() => {
    if (isAdmin) return;
    const fetchAdmin = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'admin'), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setAdminUid(snap.docs[0].id);
        }
      } catch (error) {
        console.error("Error fetching admin:", error);
      } finally {
        setFetchingAdmin(false);
      }
    };
    fetchAdmin();
  }, [isAdmin]);

  // Fetch all students for admin to chat with
  useEffect(() => {
    if (!isAdmin) return;

    const fetchChats = async () => {
      try {
        const studentsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        const studentsList = studentsSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        
        setChats(studentsList.map(s => ({ student: s })));
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };

    fetchChats();
  }, [isAdmin]);

  // Listen for messages in the selected chat
  useEffect(() => {
    const chatId = isAdmin ? selectedStudent?.uid : user.uid;
    if (!chatId) return;

    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      
      // Mark as read if receiver is current user
      snapshot.docs.forEach(async (d) => {
        const data = d.data();
        if (data.receiverId === user.uid && !data.read) {
          await updateDoc(doc(db, 'messages', d.id), { read: true });
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    return () => unsubscribe();
  }, [selectedStudent, user.uid, isAdmin]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const receiverId = isAdmin ? selectedStudent?.uid : adminUid;
    const chatId = isAdmin ? selectedStudent?.uid : user.uid;

    if (!input.trim() || !chatId) return;
    
    if (!receiverId) {
      alert("Support is currently unavailable. Please try again later.");
      return;
    }

    try {
      await addDoc(collection(db, 'messages'), {
        chatId,
        senderId: user.uid,
        receiverId,
        text: input.trim(),
        timestamp: new Date().toISOString(),
        read: false
      });
      setInput('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'messages', messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const filteredChats = chats.filter(c => 
    c.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] flex flex-col md:flex-row gap-4 md:gap-6 animate-in fade-in duration-500 font-sans">
      {/* Sidebar - Chat List (Admin Only) */}
      {isAdmin && (
        <Card className={cn(
          "w-full md:w-80 border-none shadow-sm flex flex-col overflow-hidden bg-white shrink-0",
          selectedStudent ? "hidden md:flex" : "flex"
        )}>
          <CardHeader className="p-4 border-b border-slate-100 bg-[#075e54] text-white">
            <CardTitle className="text-lg">Chats</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input 
                placeholder="Search students..." 
                className="pl-9 h-9 rounded-xl border-none bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {filteredChats.map((chat) => (
              <div 
                key={chat.student.uid}
                className={cn(
                  "p-4 flex items-center space-x-3 cursor-pointer transition-colors border-b border-slate-50",
                  selectedStudent?.uid === chat.student.uid ? "bg-slate-100" : "hover:bg-slate-50"
                )}
                onClick={() => setSelectedStudent(chat.student)}
              >
                <div className="h-12 w-12 rounded-full bg-[#128c7e] flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {chat.student.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="text-sm font-bold text-slate-900 truncate">{chat.student.name}</p>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{chat.student.email}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Chat Window */}
      <Card className={cn(
        "flex-1 border-none shadow-sm flex flex-col overflow-hidden bg-[#e5ddd5] relative",
        isAdmin && !selectedStudent ? "hidden md:flex" : "flex"
      )}>
        {(!isAdmin || selectedStudent) ? (
          <>
            <CardHeader className="p-3 border-b border-slate-100 bg-[#075e54] text-white flex flex-row items-center space-x-3 z-20">
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden text-white hover:bg-white/10"
                  onClick={() => setSelectedStudent(null)}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold shrink-0">
                {(isAdmin ? selectedStudent?.name : 'Admin')?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">{isAdmin ? selectedStudent?.name : 'speakOral Support'}</CardTitle>
                <p className="text-[10px] text-white/60">Online</p>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col relative overflow-hidden">
              {/* WhatsApp Background Pattern Overlay (Simulated) */}
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat z-0" />
              
              {fetchingAdmin ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4 relative z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#128c7e]"></div>
                  <p className="text-sm">Connecting to support...</p>
                </div>
              ) : (
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative z-10"
                >
                <div className="max-w-4xl mx-auto w-full space-y-4">
                  {messages.map((msg) => {
                    const isMe = msg.senderId === user.uid;
                    return (
                      <div 
                        key={msg.id}
                        className={cn(
                          "flex flex-col w-full",
                          isMe ? "items-end" : "items-start"
                        )}
                      >
                        <div className={cn(
                          "p-2.5 px-4 rounded-xl shadow-sm text-sm relative max-w-[85%] md:max-w-[70%] group/msg",
                          isMe ? "bg-[#dcf8c6] text-slate-800 rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none"
                        )}>
                          {isAdmin && (
                            <button 
                              className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md text-red-500 opacity-0 group-hover/msg:opacity-100 transition-opacity z-10"
                              onClick={() => setDeleteId(msg.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                          {msg.text}
                          <div className="flex items-center justify-end space-x-1 mt-1">
                            <span className="text-[9px] text-slate-400">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              msg.read ? <CheckCheck className="h-3 w-3 text-[#34b7f1]" /> : <Check className="h-3 w-3 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <div className="bg-white/50 p-4 rounded-full">
                      <MessageSquare className="h-12 w-12 opacity-20" />
                    </div>
                    <p className="text-sm font-medium">No messages yet. Say hello!</p>
                  </div>
                )}
              </div>
              )}
              <div className="p-3 bg-[#f0f0f0] border-t border-slate-200 relative z-10">
                <form onSubmit={handleSend} className="flex items-center space-x-2 max-w-4xl mx-auto w-full">
                  <Input 
                    placeholder="Type a message..." 
                    className="rounded-full border-none bg-white h-11 px-6 focus-visible:ring-0 shadow-sm flex-1"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="bg-[#128c7e] hover:bg-[#075e54] rounded-full h-11 w-11 shrink-0 shadow-md"
                    disabled={!input.trim()}
                  >
                    <Send className="h-5 w-5 text-white" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4 bg-[#f0f2f5]">
            <div className="bg-white p-8 rounded-full shadow-sm border border-slate-100">
              <MessageSquare className="h-16 w-16 text-[#128c7e]" />
            </div>
            <div className="text-center px-4">
              <h3 className="text-xl font-bold text-slate-900">speakOral Web</h3>
              <p className="text-sm max-w-xs mx-auto text-slate-500 mt-2">Select a student from the left to start chatting and answering their doubts.</p>
            </div>
          </div>
        )}
      </Card>

      <DeleteConfirmDialog 
        isOpen={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)} 
        onConfirm={() => deleteId && handleDeleteMessage(deleteId)}
        title="Delete Message"
        description="Are you sure you want to delete this message? This action cannot be undone."
      />
    </div>
  );
}
