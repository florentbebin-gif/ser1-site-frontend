-- PR-11 : Journal des mutations admin
-- Accessible service_role uniquement (pas de policy RLS authenticated)

CREATE TABLE public.admin_action_audit (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    text        NULL,
  admin_user_id uuid        NOT NULL,
  account_kind  text        NULL,
  action        text        NOT NULL,
  target_type   text        NULL,
  target_id     text        NULL,
  status        text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_action_audit ENABLE ROW LEVEL SECURITY;
-- Aucune policy : table accessible service_role (Edge Function) uniquement.
-- Les comptes authenticated n'ont aucun accès, même en lecture.

COMMENT ON TABLE public.admin_action_audit IS
  'Journal des mutations admin — service_role uniquement. '
  'request_id = corrélation requête, action = action admin, '
  'target_type/target_id = ressource cible, status = success|error.';
