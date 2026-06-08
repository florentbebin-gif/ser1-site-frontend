// Pack partiel F4d : seul le seuil dividendes TNS est consommable.
export const DEFAULT_SOCIAL_DIRIGEANT_SETTINGS = {
  current: {
    remuneration: {
      tns: {
        status: 'a-completer',
      },
      assimileSalarie: {
        status: 'a-completer',
      },
    },
    dividends: {
      tnsSocialBasePct: 10,
    },
    passTranches: {
      status: 'a-completer',
    },
    madelin: {
      status: 'bloque-consommateur',
    },
  },
};
