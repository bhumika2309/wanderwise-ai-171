-- Add a share token to trips so they can be shared via a public link
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Index for fast share-token lookups
CREATE INDEX IF NOT EXISTS idx_trips_share_token ON public.trips(share_token);

-- Allow anyone (anon + authenticated) to read a trip ONLY when it is marked public
CREATE POLICY "Public can view shared trips"
ON public.trips
FOR SELECT
TO anon, authenticated
USING (is_public = true AND share_token IS NOT NULL);
