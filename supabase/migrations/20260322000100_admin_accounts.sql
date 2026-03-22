-- Migration : table admin_accounts — gouvernance des comptes admin
-- Contexte : PR-2 — sécurisation IDOR / gouvernance admin
-- Décision : app_metadata.role reste la source de vérité auth.
--            admin_accounts ajoute une seconde barrière d'allowlist :
--            seuls les comptes listés ici (actifs, non expirés) peuvent
--            passer la garde stricte de la fonction admin (PR-3).
-- Accès : service_role uniquement (pas de policy authenticated).
-- Enforcement : activer après seed owner validé (voir RUNBOOK.md).

CREATE TABLE public.admin_accounts (
  user_id      uuid        PRIMARY KEY,
  account_kind text        NOT NULL CHECK (account_kind IN ('owner', 'dev_admin', 'e2e')),
  status       text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  expires_at   timestamptz NULL,
  notes        text        NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  created_by   uuid        NULL
);

-- Trigger updated_at automatique
CREATE OR REPLACE FUNCTION public.admin_accounts_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admin_accounts_updated_at
  BEFORE UPDATE ON public.admin_accounts
  FOR EACH ROW EXECUTE FUNCTION public.admin_accounts_set_updated_at();

-- RLS : activée, aucune policy authenticated
-- Seul le service_role (Edge Function admin) peut lire/écrire cette table.
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
