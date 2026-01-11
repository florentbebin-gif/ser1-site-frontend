-- ============================================================================
-- Supabase setup pour SER1 - Placement & Settings
-- ============================================================================
-- 1) Extensions utiles
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2) Table profiles (utilisateurs + rôle admin)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index sur email pour lookup rapide
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 3) Tables de settings (1 ligne par table, id=1)
-- ============================================================================
-- fiscality_settings (AV, PER, dividendes, etc.)
CREATE TABLE IF NOT EXISTS public.fiscality_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  settings JSONB NOT NULL DEFAULT '{}',
  version INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- tax_settings (barème IR, DMTG, etc.)
CREATE TABLE IF NOT EXISTS public.tax_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  settings JSONB NOT NULL DEFAULT '{}',
  version INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ps_settings (prélèvements sociaux)
CREATE TABLE IF NOT EXISTS public.ps_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  settings JSONB NOT NULL DEFAULT '{}',
  version INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Triggers updated_at pour les settings
CREATE TRIGGER set_fiscality_settings_updated_at
  BEFORE UPDATE ON public.fiscality_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_tax_settings_updated_at
  BEFORE UPDATE ON public.tax_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_ps_settings_updated_at
  BEFORE UPDATE ON public.ps_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4) RLS (Row Level Security) - Activer sur toutes les tables
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscality_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ps_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5) Policies
-- ============================================================================

-- profiles : lecture pour son propre profil, écriture admin
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- fiscality_settings : lecture pour tous connectés, écriture admin
CREATE POLICY "Authenticated users can read fiscality_settings" ON public.fiscality_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can write fiscality_settings" ON public.fiscality_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- tax_settings : lecture pour tous connectés, écriture admin
CREATE POLICY "Authenticated users can read tax_settings" ON public.tax_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can write tax_settings" ON public.tax_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ps_settings : lecture pour tous connectés, écriture admin
CREATE POLICY "Authenticated users can read ps_settings" ON public.ps_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can write ps_settings" ON public.ps_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================================
-- 6) Seeds initiaux (en cohérence avec les defaults du code)
-- ============================================================================

-- fiscality_settings (AV, PER, dividendes)
INSERT INTO public.fiscality_settings (id, settings, version) VALUES (1, '{
  "assuranceVie": {
    "retraitsCapital": {
      "psRatePercent": 17.2,
      "depuis2017": {
        "moins8Ans": { "irRatePercent": 12.8 },
        "plus8Ans": {
          "abattementAnnuel": { "single": 4600, "couple": 9200 },
          "primesNettesSeuil": 150000,
          "irRateUnderThresholdPercent": 7.5,
          "irRateOverThresholdPercent": 12.8
        }
      }
    },
    "deces": {
      "primesApres1998": {
        "allowancePerBeneficiary": 152500,
        "brackets": [
          { "upTo": 852500, "ratePercent": 20 },
          { "upTo": null, "ratePercent": 31.25 }
        ]
      },
      "apres70ans": { "globalAllowance": 30500 }
    }
  },
  "perIndividuel": {
    "sortieCapital": {
      "pfu": { "irRatePercent": 12.8, "psRatePercent": 17.2 }
    }
  },
  "dividendes": {
    "abattementBaremePercent": 40
  }
}', 1) ON CONFLICT (id) DO UPDATE SET
  settings = EXCLUDED.settings,
  version = fiscality_settings.version + 1,
  updated_at = now();

-- tax_settings (barème IR, DMTG)
INSERT INTO public.tax_settings (id, settings, version) VALUES (1, '{
  "incomeTax": {
    "scaleCurrent": [
      { "from": 0, "to": 11294, "rate": 0 },
      { "from": 11295, "to": 28797, "rate": 11 },
      { "from": 28798, "to": 82341, "rate": 30 },
      { "from": 82342, "to": 177106, "rate": 41 },
      { "from": 177107, "to": null, "rate": 45 }
    ]
  },
  "dmtg": {
    "abattementLigneDirecte": 100000,
    "scale": [
      { "from": 0, "to": 8072, "rate": 5 },
      { "from": 8072, "to": 12109, "rate": 10 },
      { "from": 12109, "to": 15932, "rate": 15 },
      { "from": 15932, "to": 552324, "rate": 20 },
      { "from": 552324, "to": 902838, "rate": 30 },
      { "from": 902838, "to": 1805677, "rate": 40 },
      { "from": 1805677, "to": null, "rate": 45 }
    ]
  }
}', 1) ON CONFLICT (id) DO UPDATE SET
  settings = EXCLUDED.settings,
  version = tax_settings.version + 1,
  updated_at = now();

-- ps_settings (prélèvements sociaux)
INSERT INTO public.ps_settings (id, settings, version) VALUES (1, '{
  "patrimony": {
    "current": { "totalRate": 17.2, "csgDeductibleRate": 6.8 }
  }
}', 1) ON CONFLICT (id) DO UPDATE SET
  settings = EXCLUDED.settings,
  version = ps_settings.version + 1,
  updated_at = now();

-- ============================================================================
-- 7) Créer un utilisateur admin (optionnel, à faire manuellement après auth)
-- ============================================================================
-- Exemple : après vous être connecté, exécutez :
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'votre-email@example.com';
-- ============================================================================
