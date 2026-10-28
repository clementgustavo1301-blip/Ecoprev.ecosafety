-- ==============================================================================
-- ECOPREV - SCRIPT CONSOLIDADO DE BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- ==============================================================================

-- 1. Garante que o tipo de opções 'Role' existe com as opções permitidas
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role" AS ENUM ('PARTNER', 'DOCTOR');
  END IF;
END $$;

-- 2. Garante que a coluna 'role' da tabela User usa o tipo Role (Select no Supabase)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'role' AND udt_name <> 'Role'
  ) THEN
    ALTER TABLE public."User" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE public."User" ALTER COLUMN "role" TYPE "Role" USING ("role"::"Role");
    ALTER TABLE public."User" ALTER COLUMN "role" SET DEFAULT 'PARTNER'::"Role";
  END IF;
END $$;

-- 3. Remove a coluna password da tabela User (segurança: gerenciada pelo Supabase Auth)
ALTER TABLE public."User" DROP COLUMN IF EXISTS password;

-- 4. Função que sincroniza novos usuários do Auth para a tabela public."User"
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role "Role";
  v_raw_role text;
  v_name text;
BEGIN
  -- Identifica o perfil se vier nos metadados, senão define como PARTNER (Empresa)
  v_raw_role := UPPER(COALESCE(NEW.raw_user_meta_data->>'role', ''));
  
  IF v_raw_role = 'DOCTOR' THEN
    v_role := 'DOCTOR'::"Role";
  ELSE
    v_role := 'PARTNER'::"Role";
  END IF;

  -- Define o nome do usuário a partir dos metadados ou do e-mail
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Se já existir pelo ID ou e-mail, atualiza; senão insere o novo registro
  IF EXISTS (SELECT 1 FROM public."User" WHERE id = NEW.id::text OR email = LOWER(NEW.email)) THEN
    UPDATE public."User"
    SET
      id = NEW.id::text,
      email = LOWER(NEW.email),
      name = COALESCE(public."User".name, v_name),
      crm = COALESCE(NEW.raw_user_meta_data->>'crm', public."User".crm),
      specialty = COALESCE(NEW.raw_user_meta_data->>'specialty', public."User".specialty),
      cnpj = COALESCE(NEW.raw_user_meta_data->>'cnpj', public."User".cnpj),
      "tradeName" = COALESCE(NEW.raw_user_meta_data->>'tradeName', public."User"."tradeName"),
      phone = COALESCE(NEW.raw_user_meta_data->>'phone', public."User".phone),
      address = COALESCE(NEW.raw_user_meta_data->>'address', public."User".address),
      "updatedAt" = NOW()
    WHERE id = NEW.id::text OR email = LOWER(NEW.email);
  ELSE
    INSERT INTO public."User" (
      id,
      email,
      name,
      role,
      crm,
      specialty,
      cnpj,
      "tradeName",
      phone,
      address,
      "createdAt",
      "updatedAt"
    )
    VALUES (
      NEW.id::text,
      LOWER(NEW.email),
      v_name,
      v_role,
      NEW.raw_user_meta_data->>'crm',
      NEW.raw_user_meta_data->>'specialty',
      NEW.raw_user_meta_data->>'cnpj',
      COALESCE(NEW.raw_user_meta_data->>'tradeName', v_name),
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'address',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, public."User".name),
      "updatedAt" = NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Ativa o gatilho automático na tabela de autenticação
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 6. Sincroniza retroativamente qualquer usuário do Auth que ainda não esteja na tabela User
INSERT INTO public."User" (
  id,
  email,
  name,
  role,
  "createdAt",
  "updatedAt"
)
SELECT 
  u.id::text,
  LOWER(u.email),
  COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  CASE 
    WHEN UPPER(COALESCE(u.raw_user_meta_data->>'role', '')) = 'DOCTOR' THEN 'DOCTOR'::"Role" 
    ELSE 'PARTNER'::"Role" 
  END,
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public."User" pu WHERE pu.id = u.id::text OR pu.email = LOWER(u.email)
);
