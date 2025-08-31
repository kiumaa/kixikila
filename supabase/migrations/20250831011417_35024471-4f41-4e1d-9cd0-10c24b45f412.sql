-- Remover foreign key constraint users_id_fkey que causa erro 500
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Criar tabela para PINs dos utilizadores (hash seguro)
CREATE TABLE IF NOT EXISTS public.auth_pin (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela para sessões de dispositivos (gestão de confiança)
CREATE TABLE IF NOT EXISTS public.device_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  device_name text,
  trusted boolean DEFAULT false,
  failed_pin_attempts integer DEFAULT 0,
  lock_until timestamp with time zone,
  last_seen timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela para estado KYC
CREATE TABLE IF NOT EXISTS public.kyc_status (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending','in_progress','approved','rejected')) DEFAULT 'pending',
  document_type text,
  document_number text,
  submitted_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id ON public.device_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_device_id ON public.device_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_trusted ON public.device_sessions(user_id, trusted) WHERE trusted = true;
CREATE INDEX IF NOT EXISTS idx_auth_pin_user_id ON public.auth_pin(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status_user_id ON public.kyc_status(user_id);

-- RLS Policies para auth_pin
ALTER TABLE public.auth_pin ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own PIN" ON public.auth_pin;
CREATE POLICY "Users can manage their own PIN" ON public.auth_pin
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies para device_sessions  
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own device sessions" ON public.device_sessions;
CREATE POLICY "Users can manage their own device sessions" ON public.device_sessions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all device sessions" ON public.device_sessions;
CREATE POLICY "Admins can view all device sessions" ON public.device_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies para kyc_status
ALTER TABLE public.kyc_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own KYC status" ON public.kyc_status;
CREATE POLICY "Users can view their own KYC status" ON public.kyc_status
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own KYC status" ON public.kyc_status;
CREATE POLICY "Users can insert their own KYC status" ON public.kyc_status
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own KYC status" ON public.kyc_status;
CREATE POLICY "Users can update their own KYC status" ON public.kyc_status
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all KYC status" ON public.kyc_status;
CREATE POLICY "Admins can manage all KYC status" ON public.kyc_status
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );