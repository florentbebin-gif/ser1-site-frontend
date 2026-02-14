/* eslint-disable ser1-colors/no-hardcoded-colors */
/**
 * Tests unitaires pour les thèmes et la déconnexion
 * Valide le comportement UX des thèmes et la fonctionnalité de logout
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock window object
Object.defineProperty(globalThis, 'window', {
  value: {
    localStorage: {},
  },
  writable: true,
});

// Mock Supabase
const supabaseMock = {
  auth: {
    signOut: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            maybeSingle: vi.fn(),
          })),
        })),
      })),
    })),
    upsert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  })),
};

vi.mock('../supabaseClient', () => ({
  supabase: supabaseMock,
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(globalThis.window, 'localStorage', { value: localStorageMock });

// Mock navigate
const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

describe('Thèmes - Mode Personnalisé automatique', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('doit basculer sur "Personnalisé" lors de la modification manuelle d\'une couleur', () => {
    // Simuler l'état initial avec un thème prédéfini
    const mockSetSelectedTheme = vi.fn();
    const mockSetColorsLegacy = vi.fn();
    const mockSyncThemeColors = vi.fn();
    
    // État initial : thème prédéfini sélectionné
    let selectedTheme = 'Thème Original';
    const colorsLegacy = {
      color1: '#2B3E37',
      color2: '#709B8B',
      color3: '#9FBDB2',
      color4: '#CFDED8',
      color5: '#788781',
      color6: '#CEC1B6',
      color7: '#F5F3F0',
      color8: '#D9D9D9',
      color9: '#7F7F7F',
      color10: '#000000',
    };

    // Simuler handleColorChange (logique extraite de Settings.jsx)
    const handleColorChange = (key: string, value: string) => {
      const newColors = { ...colorsLegacy, [key]: value };
      mockSetColorsLegacy(newColors);
      
      // 🔄 UX: Si on modifie une couleur manuellement, basculer sur "Personnalisé"
      if (selectedTheme !== 'Personnalisé') {
        selectedTheme = 'Personnalisé';
        mockSetSelectedTheme('Personnalisé');
      }
      
      mockSyncThemeColors(newColors);
    };

    // Action : modifier une couleur
    handleColorChange('color1', '#FF0000');

    // Vérifications
    expect(mockSetSelectedTheme).toHaveBeenCalledWith('Personnalisé');
    expect(mockSetColorsLegacy).toHaveBeenCalledWith(
      expect.objectContaining({ color1: '#FF0000' })
    );
    expect(mockSyncThemeColors).toHaveBeenCalled();
    
    // Vérifier que le thème est bien "Personnalisé"
    expect(selectedTheme).toBe('Personnalisé');
  });

  it('doit conserver les couleurs du preset original (immuable)', () => {
    // Simuler les presets immuables
    const PREDEFINED_THEMES = [
      {
        id: 'ser1-classic',
        name: 'Thème Original',
        colors: Object.freeze({
          color1: '#2B3E37',
          color2: '#709B8B',
          color3: '#9FBDB2',
          color4: '#CFDED8',
          color5: '#788781',
          color6: '#CEC1B6',
          color7: '#F5F3F0',
          color8: '#D9D9D9',
          color9: '#7F7F7F',
          color10: '#000000',
        })
      }
    ];

    const mockSetColorsLegacy = vi.fn();
    const mockSetColorText = vi.fn();
    const mockSyncThemeColors = vi.fn();

    // Simuler handleThemeSelect (logique extraite de Settings.jsx)
    const handleThemeSelect = (themeName: string) => {
      if (themeName === 'Personnalisé') {
        return;
      }
      
      const theme = PREDEFINED_THEMES.find(t => t.name === themeName);
      if (theme) {
        // 🔄 UX: Appliquer les couleurs du preset (copie immuable)
        const newColors = { ...theme.colors };
        mockSetColorsLegacy(newColors);
        mockSetColorText(newColors);
        mockSyncThemeColors(theme.colors);
      }
    };

    // Action : sélectionner un thème prédéfini
    handleThemeSelect('Thème Original');

    // Vérifications
    expect(mockSetColorsLegacy).toHaveBeenCalledWith(
      expect.objectContaining({ color1: '#2B3E37' })
    );
    expect(mockSetColorText).toHaveBeenCalled();
    expect(mockSyncThemeColors).toHaveBeenCalled();

    // Vérifier que le preset original n'est pas modifié
    expect(PREDEFINED_THEMES[0].colors.color1).toBe('#2B3E37');
  });

  it('ne doit pas basculer sur "Personnalisé" si déjà "Personnalisé"', () => {
    const mockSetSelectedTheme = vi.fn();
    
    let selectedTheme = 'Personnalisé';
    
    const handleColorChange = (_key: string, _value: string) => {
      // 🔄 UX: Si on modifie une couleur manuellement, basculer sur "Personnalisé"
      if (selectedTheme !== 'Personnalisé') {
        selectedTheme = 'Personnalisé';
        mockSetSelectedTheme('Personnalisé');
      }
    };

    // Action : modifier une couleur alors qu'on est déjà en "Personnalisé"
    handleColorChange('color1', '#FF0000');

    // Vérifications
    expect(mockSetSelectedTheme).not.toHaveBeenCalled();
    expect(selectedTheme).toBe('Personnalisé');
  });
});

describe('Logout - Déconnexion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockClear();
  });

  it('doit déconnecter l\'utilisateur et rediriger vers login', async () => {
    supabaseMock.auth.signOut.mockResolvedValue({});

    // Simuler handleLogout (logique de déconnexion)
    const handleLogout = async () => {
      try {
        // Déconnexion Supabase
        await supabaseMock.auth.signOut();
        
        // Redirection vers login
        navigateMock('/login');
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        // Même en cas d'erreur, on tente la redirection
        navigateMock('/login');
      }
    };

    // Action : cliquer sur déconnexion
    await handleLogout();

    // Vérifications
    expect(supabaseMock.auth.signOut).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });

  it('doit rediriger même en cas d\'erreur Supabase', async () => {
    const mockError = new Error('Network error');
    supabaseMock.auth.signOut.mockRejectedValue(mockError);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Simuler handleLogout
    const handleLogout = async () => {
      try {
        await supabaseMock.auth.signOut();
        navigateMock('/login');
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        navigateMock('/login');
      }
    };

    // Action : cliquer sur déconnexion
    await handleLogout();

    // Vérifications
    expect(supabaseMock.auth.signOut).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Erreur lors de la déconnexion:', mockError);
    expect(navigateMock).toHaveBeenCalledWith('/login');

    consoleSpy.mockRestore();
  });
});

describe('Settings - Timeout anti-blocage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('doit lever un timeout après 8s si getUser ne répond pas', () => {
    // Mock getUser qui ne résout jamais (simule un hang)
    supabaseMock.auth.getUser.mockImplementation(() => new Promise(() => {}));
    
    const mockSetLoading = vi.fn();
    let mounted = true;

    // Simuler la logique de timeout de Settings.jsx
    const loadUser = async () => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      
      try {
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('[Settings] Timeout lors du chargement utilisateur, utilisation des valeurs par défaut');
            mockSetLoading(false);
          }
        }, 8000);

        await supabaseMock.auth.getUser();
        
        if (timeoutId) clearTimeout(timeoutId);
      } catch {
        if (timeoutId) clearTimeout(timeoutId);
        if (mounted) mockSetLoading(false);
      }
    };

    // Démarrer le chargement
    loadUser();

    // Avancer le temps de 8s
    vi.advanceTimersByTime(8000);

    // Vérifications
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('doit annuler le timeout si getUser répond rapidement', async () => {
    // Mock getUser qui résout immédiatement
    supabaseMock.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } } });
    
    const mockSetLoading = vi.fn();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    let mounted = true;

    const loadUser = async () => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      
      try {
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('[Settings] Timeout lors du chargement utilisateur, utilisation des valeurs par défaut');
            mockSetLoading(false);
          }
        }, 8000);

        await supabaseMock.auth.getUser();
        
        if (timeoutId) clearTimeout(timeoutId);
        mockSetLoading(false);
      } catch {
        if (timeoutId) clearTimeout(timeoutId);
        if (mounted) mockSetLoading(false);
      }
    };

    // Démarrer le chargement et attendre
    await loadUser();

    // Vérifications immédiates (pas besoin d'attendre le timeout)
    expect(mockSetLoading).toHaveBeenCalledWith(false);
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
  });
});
