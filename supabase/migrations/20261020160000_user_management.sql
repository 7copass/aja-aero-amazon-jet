-- Gestão de usuários pela própria aplicação.

-- 1. Admin passa a poder editar o perfil de qualquer usuário
--    (a política original só permitia o dono editar o próprio).
DROP POLICY IF EXISTS "Admins update any profile" ON public.profiles;
CREATE POLICY "Admins update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (app.is_admin())
  WITH CHECK (app.is_admin());

-- 2. Trava: o sistema nunca pode ficar sem administrador.
--    Sem isto, um admin remove o próprio papel e ninguém mais consegue
--    conceder permissão a ninguém — só restaria o acesso direto ao banco.
CREATE OR REPLACE FUNCTION public.prevent_last_admin_removal()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _remaining int;
BEGIN
  IF OLD.role <> 'admin'::public.app_role THEN
    RETURN OLD;
  END IF;

  SELECT count(*) INTO _remaining
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.role = 'admin'::public.app_role
    AND ur.user_id <> OLD.user_id
    AND NOT p.archived;

  IF _remaining = 0 THEN
    RAISE EXCEPTION 'Não é possível remover o último administrador do sistema'
      USING ERRCODE = 'check_violation',
            HINT = 'Conceda o papel de administrador a outro usuário antes de remover este.';
  END IF;

  RETURN OLD;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_user_roles_last_admin ON public.user_roles;
CREATE TRIGGER trg_user_roles_last_admin
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_last_admin_removal();
