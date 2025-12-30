'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { MessageCircle, X, Send, Minus, User, Phone, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
    id: string;
    message: string;
    sender_type: 'customer' | 'admin';
    created_at: string;
};

type Session = {
    id: string;
    custome_name: string;
    status: string;
};

export default function ChatWidget() {
    const supabase = getSupabaseClient() as any;
    const [isOpen, setIsOpen] = useState(false);
    const [session, setSession] = useState<Session | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [details, setDetails] = useState({ name: '', phone: '', email: '' });
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, []);

    const fetchMessages = useCallback(async (sessionId: string) => {
        if (!supabase) return;
        const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (data) {
            setMessages(data as Message[]);
            scrollToBottom();
        }
    }, [supabase, scrollToBottom]);

    const fetchSession = useCallback(async (sessionId: string) => {
        if (!supabase) return;
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (data && !error) {
            setSession(data);
            fetchMessages(sessionId);
        } else {
            // Invalid session, clear it
            localStorage.removeItem('chatSessionId');
        }
    }, [supabase, fetchMessages]);

    // Load session from local storage on mount
    useEffect(() => {
        if (!supabase) return;
        const savedSessionId = localStorage.getItem('chatSessionId');
        if (savedSessionId) {
            fetchSession(savedSessionId);
        }

        // Check if customer is logged in to pre-fill details
        const savedCustomer = sessionStorage.getItem('customer');
        if (savedCustomer) {
            const c = JSON.parse(savedCustomer);
            setDetails({ name: c.name || '', phone: c.phone || '', email: c.email || '' });
        }
    }, [supabase, fetchSession]);

    // Subscribe to messages when session is active
    useEffect(() => {
        if (!session?.id || !supabase) return;

        console.log('Subscribing to chat:', session.id);

        const channel = supabase
            .channel(`chat:${session.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `session_id=eq.${session.id}`
                },
                (payload: any) => {
                    console.log('New message received:', payload);
                    const newMsg = payload.new as Message;
                    setMessages((prev) => [...prev, newMsg]);
                    scrollToBottom();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.id, supabase, scrollToBottom]);

    const handleStartChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;
        setIsLoading(true);

        try {
            // Create new session
            const { data, error } = await supabase
                .from('chat_sessions')
                .insert({
                    customer_name: details.name,
                    customer_phone: details.phone,
                    customer_email: details.email,
                    status: 'open'
                } as any)
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setSession(data);
                localStorage.setItem('chatSessionId', data.id);
            }
        } catch (error) {
            console.error('Error creating chat session:', error);
            alert('Gagal memulakan chat. Sila cuba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !session || !supabase) return;

        const msgText = newMessage.trim();
        setNewMessage(''); // Optimistic clear

        try {
            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    session_id: session.id,
                    sender_type: 'customer',
                    message: msgText
                } as any);

            if (error) throw error;
            // Subscription will handle adding to state
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Gagal menghantar mesej.');
            setNewMessage(msgText); // Restore on failure
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[350px] overflow-hidden mb-4 flex flex-col max-h-[500px]"
                    >
                        {/* Header */}
                        <div className="bg-[#CC1512] p-4 flex justify-between items-center text-white">
                            <div>
                                <h3 className="font-bold text-lg">Bantuan AbangBob</h3>
                                <p className="text-white/80 text-xs">Kami sedia membantu anda!</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <Minus size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        {!session ? (
                            // Registration Form
                            <div className="p-5">
                                <p className="text-gray-600 text-sm mb-4">Sila isikan maklumat anda untuk memulakan chat.</p>
                                <form onSubmit={handleStartChat} className="space-y-3">
                                    <div>
                                        <div className="relative">
                                            <User size={16} className="absolute left-3 top-3 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Nama Anda"
                                                required
                                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
                                                value={details.name}
                                                onChange={(e) => setDetails({ ...details, name: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="No Telefon"
                                                required
                                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
                                                value={details.phone}
                                                onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                                            <input
                                                type="email"
                                                placeholder="Email (Pilihan)"
                                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
                                                value={details.email}
                                                onChange={(e) => setDetails({ ...details, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-[#CC1512] text-white font-bold py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-70 mt-2"
                                    >
                                        {isLoading ? 'Memulakan...' : 'Mula Chat'}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            // Chat Interface
                            <>
                                <div className="flex-1 bg-gray-50 p-4 overflow-y-auto min-h-[300px] flex flex-col gap-3">
                                    {messages.length === 0 && (
                                        <div className="text-center text-gray-400 text-sm py-8">
                                            Mula bertanya soalan anda...
                                        </div>
                                    )}
                                    {messages.map((msg) => {
                                        const isMe = msg.sender_type === 'customer';
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] p-3 rounded-xl text-sm ${isMe
                                                        ? 'bg-[#CC1512] text-white rounded-br-none'
                                                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                                        }`}
                                                >
                                                    {msg.message}
                                                    <span className={`text-[10px] block mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Tulis mesej / Message..."
                                        className="flex-1 px-4 py-2 bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-red-500 outline-none text-sm"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="p-2 bg-[#CC1512] text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="bg-[#CC1512] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center relative group"
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={28} />}

                {/* Notification Badge - Fake for now or show '1' if admin active? */}
                {/* <span className="absolute -top-1 -right-1 bg-yellow-500 w-4 h-4 rounded-full border-2 border-white"></span> */}

                {!isOpen && (
                    <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Perlukan Bantuan?
                    </span>
                )}
            </motion.button>
        </div>
    );
}
