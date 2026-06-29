import { describe, expect, it } from 'vitest';

import { appearanceForAvatarChoice, optionsForAvatarSubject } from '../avatarAppearance';

describe('avatarAppearance', () => {
  it('propose quatre silhouettes adultes sans variante de carnation visible', () => {
    const choices = optionsForAvatarSubject('adulte');

    expect(choices.map((choice) => choice.label)).toEqual([
      'Homme',
      'Femme',
      'Grand-père',
      'Grand-mère',
    ]);
    expect(choices.map((choice) => `${choice.kind}:${choice.age}`)).toEqual([
      'homme:adulte',
      'femme:adulte',
      'homme:senior',
      'femme:senior',
    ]);
  });

  it('limite les enfants aux deux silhouettes enfant', () => {
    const choices = optionsForAvatarSubject('enfant');

    expect(choices.map((choice) => choice.label)).toEqual(['Garçon', 'Fille']);
    expect(choices.map((choice) => `${choice.kind}:${choice.age}`)).toEqual([
      'garcon:adulte',
      'fille:adulte',
    ]);
  });

  it('préserve la carnation existante lors du changement de silhouette', () => {
    const grandPere = optionsForAvatarSubject('adulte').find(
      (choice) => choice.id === 'homme-senior',
    );
    const fille = optionsForAvatarSubject('enfant').find((choice) => choice.id === 'fille');

    expect(grandPere).toBeDefined();
    expect(fille).toBeDefined();
    expect(appearanceForAvatarChoice(grandPere!, { skinTone: 'fonce', age: 'adulte' })).toEqual({
      skinTone: 'fonce',
      age: 'senior',
    });
    expect(appearanceForAvatarChoice(fille!, { skinTone: 'fonce', age: 'senior' })).toEqual({
      skinTone: 'fonce',
      age: 'adulte',
    });
    expect(appearanceForAvatarChoice(fille, undefined)).toEqual({
      skinTone: 'clair',
      age: 'adulte',
    });
  });
});
