-- SOP Wizard Schema

-- 1. SOP Templates (The Checklist Header)
CREATE TABLE IF NOT EXISTS public.sop_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL, -- e.g., "Opening Checklist", "Closing Checklist"
  description TEXT,
  target_role TEXT[] DEFAULT '{}', -- e.g., ['staff', 'manager', 'all']
  shift_type TEXT NOT NULL, -- 'morning', 'mid', 'night', 'any'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.staff(id) ON DELETE SET NULL
);

-- 2. SOP Steps (The Items in the checklist)
CREATE TABLE IF NOT EXISTS public.sop_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.sop_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- "Check Temperature"
  description TEXT, -- Helper text
  step_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  requires_photo BOOLEAN DEFAULT false,
  requires_value BOOLEAN DEFAULT false, -- if true, asks for number/text input
  value_type TEXT DEFAULT 'boolean', -- 'boolean', 'number', 'text', 'temperature', 'currency'
  min_value NUMERIC, -- Using NUMERIC for precision
  max_value NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SOP Logs (The Submission header - one per shift/session)
CREATE TABLE IF NOT EXISTS public.sop_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.sop_templates(id),
  staff_id UUID REFERENCES public.staff(id),
  shift_id UUID, -- Optional link to a shift record if exists
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  notes TEXT,
  total_steps INTEGER DEFAULT 0,
  completed_steps INTEGER DEFAULT 0,
  outlet_id UUID REFERENCES public.outlets(id)
);

-- 4. SOP Log Items (The Submission details)
CREATE TABLE IF NOT EXISTS public.sop_log_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_id UUID NOT NULL REFERENCES public.sop_logs(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.sop_steps(id),
  is_checked BOOLEAN DEFAULT false,
  input_value TEXT, -- We store numeric values as text to be flexible, cast when needed
  photo_url TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sop_templates_shift ON public.sop_templates(shift_type);
CREATE INDEX IF NOT EXISTS idx_sop_steps_template ON public.sop_steps(template_id);
CREATE INDEX IF NOT EXISTS idx_sop_logs_staff ON public.sop_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_sop_logs_status ON public.sop_logs(status);
CREATE INDEX IF NOT EXISTS idx_sop_logs_date ON public.sop_logs(started_at);

-- RLS Policies
ALTER TABLE public.sop_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_log_items ENABLE ROW LEVEL SECURITY;

-- 1. Templates: Everyone can read, Only Admin/Manager can write
DO $$ BEGIN
    CREATE POLICY "Everyone can view active SOP templates"
        ON public.sop_templates FOR SELECT
        USING (is_active = true OR (
            EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND role IN ('Admin', 'Manager'))
        ));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can manage SOP templates"
        ON public.sop_templates FOR ALL
        USING (EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND role IN ('Admin', 'Manager')));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Steps: Same as templates
DO $$ BEGIN
    CREATE POLICY "Everyone can view SOP steps"
        ON public.sop_steps FOR SELECT
        USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can manage SOP steps"
        ON public.sop_steps FOR ALL
        USING (EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND role IN ('Admin', 'Manager')));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Logs: Staff can create and view their own. Admins view all.
DO $$ BEGIN
    CREATE POLICY "Staff can insert their own SOP logs"
        ON public.sop_logs FOR INSERT
        WITH CHECK (staff_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Staff can view/update their own logs"
        ON public.sop_logs FOR ALL
        USING (staff_id = auth.uid() OR EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND role IN ('Admin', 'Manager')));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 4. Log Items: Staff can manage items for their logs
DO $$ BEGIN
    CREATE POLICY "Staff can manage their own log items"
        ON public.sop_log_items FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM public.sop_logs 
                WHERE sop_logs.id = log_id 
                AND (sop_logs.staff_id = auth.uid() OR EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND role IN ('Admin', 'Manager')))
            )
        );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS handle_sop_templates_updated_at ON public.sop_templates;
CREATE TRIGGER handle_sop_templates_updated_at BEFORE UPDATE ON public.sop_templates
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

DROP TRIGGER IF EXISTS handle_sop_steps_updated_at ON public.sop_steps;
CREATE TRIGGER handle_sop_steps_updated_at BEFORE UPDATE ON public.sop_steps
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Seed Initial Templates (Morning and Night)
INSERT INTO public.sop_templates (title, description, target_role, shift_type, is_active)
VALUES 
('Opening Checklist (Morning)', 'Persediaan kedai sebelum operasi bermula', ARRAY['Staff', 'Manager'], 'morning', true),
('Closing Checklist (Night)', 'Prosedur keselamatan dan kebersihan sebelum tutup kedai', ARRAY['Staff', 'Manager'], 'night', true)
ON CONFLICT DO NOTHING;
