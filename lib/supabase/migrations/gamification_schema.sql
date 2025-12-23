-- Gamification System Schema

-- Table to store current progress for each staff member
CREATE TABLE IF NOT EXISTS public.staff_xp (
    staff_id UUID PRIMARY KEY REFERENCES public.staff(id) ON DELETE CASCADE,
    current_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    total_points_earned INTEGER DEFAULT 0, -- Lifetime points
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT positive_xp CHECK (current_xp >= 0),
    CONSTRAINT positive_level CHECK (current_level >= 1)
);

-- Table to log every XP transaction (audit trail)
CREATE TABLE IF NOT EXISTS public.xp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL, -- e.g., 'sop_completion', 'clock_in_ontime'
    metadata JSONB DEFAULT '{}', -- Extra info, e.g., { "sop_id": "..." }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.staff_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Staff can view their own XP
CREATE POLICY "Staff can view own XP" ON public.staff_xp
    FOR SELECT USING (auth.uid() = staff_id);

-- Everyone (Staff) can view Leaderboard (all XP data) - Gamification implies public visibility usually
CREATE POLICY "Staff can view all XP for leaderboard" ON public.staff_xp
    FOR SELECT USING (true);

-- Staff can view their own logs
CREATE POLICY "Staff can view own XP logs" ON public.xp_logs
    FOR SELECT USING (auth.uid() = staff_id);

-- System/Admin can manage everything (handled by service role usually, but add policy for admins if needed)
CREATE POLICY "Admins can manage XP" ON public.staff_xp
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
    );

-- Trigger to update updated_at
CREATE TRIGGER update_staff_xp_modtime
    BEFORE UPDATE ON public.staff_xp
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
