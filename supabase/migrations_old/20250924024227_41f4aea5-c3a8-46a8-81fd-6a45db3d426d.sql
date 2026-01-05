-- Check if event_themes table exists and alter it, or create it if it doesn't exist
DO $$
BEGIN
    -- Check if the table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'event_themes') THEN
        -- Table exists, alter it
        -- Drop the existing id column and recreate it as serial
        ALTER TABLE public.event_themes DROP COLUMN IF EXISTS id CASCADE;
        ALTER TABLE public.event_themes ADD COLUMN id SERIAL PRIMARY KEY;
        
        -- Reorder columns to put id first
        ALTER TABLE public.event_themes ALTER COLUMN id SET NOT NULL;
    ELSE
        -- Table doesn't exist, create it with the correct structure
        CREATE TABLE public.event_themes (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT,
            tags TEXT[],
            icon TEXT,
            color TEXT,
            bg_color TEXT,
            usage_count INTEGER DEFAULT 0,
            pricing NUMERIC,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        
        -- Enable RLS
        ALTER TABLE public.event_themes ENABLE ROW LEVEL SECURITY;
        
        -- Create policies for viewing themes
        CREATE POLICY "Anyone can view event themes" 
        ON public.event_themes 
        FOR SELECT 
        USING (true);
        
        -- Create policies for admin management
        CREATE POLICY "Admins can manage event themes" 
        ON public.event_themes 
        FOR ALL 
        USING (has_role(auth.uid(), 'admin'::app_role))
        WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
        
        -- Create trigger for updated_at
        CREATE TRIGGER update_event_themes_updated_at
        BEFORE UPDATE ON public.event_themes
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
        
        -- Insert some sample themes
        INSERT INTO public.event_themes (name, description, category, tags, icon, color, bg_color, usage_count, pricing) VALUES
        ('Corporate Conference', 'Professional business events and conferences', 'Business', ARRAY['corporate', 'professional', 'networking'], 'briefcase', 'hsl(220, 70%, 50%)', 'hsl(220, 70%, 95%)', 45, 2500.00),
        ('Wedding Celebration', 'Elegant wedding ceremonies and receptions', 'Wedding', ARRAY['wedding', 'celebration', 'romance'], 'heart', 'hsl(340, 60%, 60%)', 'hsl(340, 60%, 95%)', 78, 5000.00),
        ('Birthday Party', 'Fun and festive birthday celebrations', 'Social', ARRAY['birthday', 'party', 'celebration'], 'cake', 'hsl(280, 80%, 60%)', 'hsl(280, 80%, 95%)', 62, 800.00),
        ('Product Launch', 'Professional product unveiling events', 'Business', ARRAY['product', 'launch', 'marketing'], 'rocket', 'hsl(120, 60%, 50%)', 'hsl(120, 60%, 95%)', 23, 3000.00),
        ('Charity Gala', 'Elegant fundraising and charity events', 'Charity', ARRAY['charity', 'fundraising', 'gala'], 'heart-handshake', 'hsl(30, 70%, 55%)', 'hsl(30, 70%, 95%)', 34, 4000.00),
        ('Music Festival', 'Outdoor music and entertainment events', 'Entertainment', ARRAY['music', 'festival', 'outdoor'], 'music', 'hsl(260, 80%, 60%)', 'hsl(260, 80%, 95%)', 18, 8000.00),
        ('Family Reunion', 'Casual family gathering and reunion events', 'Family', ARRAY['family', 'reunion', 'casual'], 'users', 'hsl(160, 50%, 50%)', 'hsl(160, 50%, 95%)', 41, 1200.00),
        ('Holiday Party', 'Seasonal and holiday celebration events', 'Holiday', ARRAY['holiday', 'seasonal', 'celebration'], 'calendar', 'hsl(10, 80%, 60%)', 'hsl(10, 80%, 95%)', 56, 1500.00);
    END IF;
END $$;