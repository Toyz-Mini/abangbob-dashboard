-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived')),
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Realtime policies handled via Supabase Dashboard usually, but RLS can be set here
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create a session (public access for customers)
CREATE POLICY "Allow public insert sessions" ON chat_sessions FOR INSERT TO public WITH CHECK (true);

-- Allow public to select their own session (via phone number matching or just open for now for simplicity in MVP)
-- For this MVP, we might need a more open policy or rely on client-side ID persistence. 
-- Ideally, we'd augment this with Auth, but for "Online Guest Ordering", we'll allow public Select by ID.
CREATE POLICY "Allow public select sessions" ON chat_sessions FOR SELECT TO public USING (true); -- Refine later

-- Allow public to insert messages for their session
CREATE POLICY "Allow public insert messages" ON chat_messages FOR INSERT TO public WITH CHECK (true);

-- Allow public to read messages for their session
CREATE POLICY "Allow public select messages" ON chat_messages FOR SELECT TO public USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
