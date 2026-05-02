DROP POLICY IF EXISTS "Allow migration access" ON public.services;
CREATE POLICY "Allow migration access" ON public.services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow migration access" ON public.services;
CREATE POLICY "Allow public read access on services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Allow admin manage services" ON public.services FOR ALL USING (auth.role() = 'authenticated');
