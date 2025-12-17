-- ============================================================================
-- ADD INGREDIENTS TO MODIFIER OPTIONS
-- This allows tracking inventory usage for modifiers (e.g. Extra Cheese -> -1 Cheese Slice)
-- ============================================================================

-- Add JSONB column for ingredients
-- Format: [{ stockItemId: "uuid", quantity: 1.0 }]
ALTER TABLE public.modifier_options 
ADD COLUMN IF NOT EXISTS ingredients JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.modifier_options.ingredients IS 'List of ingredients [{stockItemId, quantity}] used by this modifier';

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
