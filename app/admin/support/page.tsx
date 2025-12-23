'use client';

import { useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { MessageCircle, Search, Send, CheckCircle, Clock, User, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';

type Session = {
    id: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    status: 'open' | 'closed' | 'archived';
    unread_count: number;
    created_at: string;
    last_message?: string; // Derived or fetched if needed
};

type Message = {
    id: string;
    session_id: string;
    sender_type: 'customer' | 'admin';
    message: string;
    created_at: string;
};

export default function SupportPage() {
    const supabase = getSupabaseClient() as any;
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load sessions
    useEffect(() => {
        if (!supabase) return;
        fetchSessions();

        // Subscribe to new sessions or updates
        const channel = supabase
            .channel('admin_sessions_list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, (payload: any) => {
                fetchSessions(); // Refresh list on any change for simplicity
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Load messages for selected session
    useEffect(() => {
        if (!selectedSessionId || !supabase) return;

        fetchMessages(selectedSessionId);

        // Subscribe to messages for this session
        const channel = supabase
            .channel(`admin_chat:${selectedSessionId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${selectedSessionId}` }, (payload: any) => {
                const newMsg = payload.new as Message;
                setMessages((prev) => [...prev, newMsg]);
                scrollToBottom();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedSessionId]);

    const fetchSessions = async () => {
        if (!supabase) return;
        const { data } = await supabase
            .from('chat_sessions')
            .select('*')
            .order('updated_at', { ascending: false }); // Show recent first
        if (data) setSessions(data as Session[]);
    };

    const fetchMessages = async (sessionId: string) => {
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
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedSessionId || !supabase) return;

        const msgText = newMessage.trim();
        setNewMessage('');

        try {
            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    session_id: selectedSessionId,
                    sender_type: 'admin',
                    message: msgText
                } as any);

            if (error) throw error;
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Gagal menghantar mesej.');
        }
    };

    const handleCloseSession = async () => {
        if (!selectedSessionId || !supabase) return;
        if (!confirm('Adakah anda pasti mahu menutup sesi ini?')) return;

        await supabase
            .from('chat_sessions')
            .update({ status: 'closed' } as any)
            .eq('id', selectedSessionId);

        // Optimistic update or wait for realtime
        setSessions(prev => prev.map(s => s.id === selectedSessionId ? { ...s, status: 'closed' } : s));
        setSelectedSessionId(null);
    };

    const selectedSession = sessions.find(s => s.id === selectedSessionId);

    return (
        <div className="flex h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h1 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <MessageCircle className="text-[#CC1512]" />
                        Support Inbox
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {sessions.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            Tiada chat aktif.
                        </div>
                    ) : (
                        sessions.map(session => (
                            <button
                                key={session.id}
                                onClick={() => setSelectedSessionId(session.id)}
                                className={`w-full text-left p-4 border-b border-gray-100 transition-colors hover:bg-white ${selectedSessionId === session.id ? 'bg-white border-l-4 border-l-[#CC1512] shadow-sm' : 'border-l-4 border-l-transparent'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-bold text-sm ${selectedSessionId === session.id ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {session.customer_name}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {format(new Date(session.created_at), 'HH:mm')}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-2 truncate">{session.customer_phone}</p>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${session.status === 'open' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {session.status.toUpperCase()}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedSession ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                    {selectedSession.customer_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-800">{selectedSession.customer_name}</h2>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><Phone size={12} /> {selectedSession.customer_phone}</span>
                                        {selectedSession.customer_email && <span className="flex items-center gap-1"><Mail size={12} /> {selectedSession.customer_email}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedSession.status === 'open' && (
                                    <button
                                        onClick={handleCloseSession}
                                        className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 flex items-center gap-1"
                                    >
                                        <CheckCircle size={14} /> Selesai
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
                            {messages.map((msg) => {
                                const isAdmin = msg.sender_type === 'admin';
                                return (
                                    <div key={msg.id} className={`flex w-full ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-xl text-sm shadow-sm ${isAdmin
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                            }`}>
                                            <p>{msg.message}</p>
                                            <span className={`text-[10px] block mt-1 text-right ${isAdmin ? 'text-blue-100' : 'text-gray-400'}`}>
                                                {format(new Date(msg.created_at), 'HH:mm')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-gray-200 bg-white">
                            {selectedSession.status === 'open' ? (
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Balas mesej..."
                                        className="flex-1 px-4 py-2 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2"
                                    >
                                        <Send size={16} />
                                        Hantar
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center text-gray-500 text-sm py-2 bg-gray-50 rounded-lg">
                                    Sesi ini telah ditutup.
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <MessageCircle size={48} className="mb-4 text-gray-200" />
                        <p>Pilih perbualan dari senarai</p>
                    </div>
                )}
            </div>
        </div>
    );
}
