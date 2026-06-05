-- جدول أدمنز النظام مع الأدوار
CREATE TABLE IF NOT EXISTS public.admin_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,                          -- مرتبط بـ auth.users بعد تسجيل الدخول
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL DEFAULT 'Admin',
  role        TEXT NOT NULL DEFAULT 'shein_staff'
                CHECK (role IN ('super_admin', 'shein_staff', 'other_staff')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل RLS — فقط service_role يستطيع القراءة
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON public.admin_users
  FOR ALL USING (false);

-- إدراج المدير العام الأول
INSERT INTO public.admin_users (email, name, role)
VALUES ('mo3iemohamed@gmail.com', 'المدير العام', 'super_admin')
ON CONFLICT (email) DO NOTHING;
