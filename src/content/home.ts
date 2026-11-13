import type { Finish, Locale } from '@/lib/wardrobe';

/** Copy for the sections below the hero. Shared labels (finishes, model names, steps) stay in dict.ts. */
export interface HomeCopy {
  intro: { text: string[]; facts: [string, string][] };
  compare: { closed: string; open: string; hint: string; caption: string };
  models: { eyebrow: string; cta: string };
  price: { eyebrow: string };
  anatomy: { eyebrow: string; title: string[]; lead: string; points: Record<AnatomyKey, [string, string]> };
  materials: { eyebrow: string; desc: Record<Finish, string>; pick: string };
  measure: { eyebrow: string };
  process: { eyebrow: string };
  closing: { eyebrow: string; wall: string };
}

export type AnatomyKey = 'band' | 'rod' | 'hinge' | 'shelf' | 'knob' | 'filler' | 'plinth';

const fr: HomeCopy = {
  intro: {
    text: ['Une armoire encastrée ne se pose pas devant le mur.', 'Elle prend sa place : du sol au plafond, d’un mur à l’autre.'],
    facts: [
      ['2400', 'mm, du sol au plafond'],
      ['18', 'mm, tous les panneaux'],
      ['20', 'décors de façade'],
      ['494', 'CHF par mètre de niche, pose comprise'],
    ],
  },
  compare: { closed: 'Fermée', open: 'Ouverte', hint: 'Glissez pour ouvrir', caption: 'H3303 ST10 Chêne Hamilton naturel · niche de 1896 mm · quatre portes' },
  models: { eyebrow: 'Modèles', cta: 'Configurer' },
  price: { eyebrow: 'Prix' },
  anatomy: {
    eyebrow: 'Intérieur',
    title: ['Rien de caché,', 'sauf vos affaires.'],
    lead: 'Survolez un élément pour le situer dans l’armoire.',
    points: {
      band: ['Bandeau', 'Ferme l’espace jusqu’au plafond'],
      rod: ['Penderie', 'Tringle sous une étagère haute'],
      hinge: ['Charnières', 'Blum CLIP top BLUMOTION, cinq par porte, fermeture amortie'],
      shelf: ['Étagères', 'Profondeur 524 mm, panneau de 18 mm'],
      knob: ['Bouton', 'Panama Ø20, nickel satiné, à 1050 mm du sol'],
      filler: ['Fileur', 'Rattrape l’écart entre l’armoire et le mur'],
      plinth: ['Socle', '100 mm, en retrait des portes'],
    },
  },
  materials: {
    eyebrow: 'Matières',
    desc: {
      mel: 'Panneau décor Egger de 18 mm. Mat, uni ou chêne : le choix le plus courant.',
      hpl: 'Stratifié haute pression sur panneau. Une surface plus dure, pour les passages fréquents.',
      mdf: 'MDF laqué à la teinte, RAL ou NCS. Une surface lisse et continue.',
    },
    pick: 'Survolez une façade',
  },
  measure: { eyebrow: 'Mesure' },
  process: { eyebrow: 'Déroulé' },
  closing: { eyebrow: 'À vous', wall: 'mur' },
};

const bs: HomeCopy = {
  intro: {
    text: ['Ugradni ormar se ne postavlja ispred zida.', 'On zauzima njegovo mjesto: od poda do plafona, od zida do zida.'],
    facts: [
      ['2400', 'mm, od poda do plafona'],
      ['18', 'mm, sve ploče'],
      ['20', 'dekora fronta'],
      ['494', 'CHF po metru niše, s ugradnjom'],
    ],
  },
  compare: { closed: 'Zatvoren', open: 'Otvoren', hint: 'Povucite da otvorite', caption: 'H3303 ST10 Hrast Hamilton natur · niša 1896 mm · četvora vrata' },
  models: { eyebrow: 'Modeli', cta: 'Konfiguriši' },
  price: { eyebrow: 'Cijena' },
  anatomy: {
    eyebrow: 'Unutrašnjost',
    title: ['Ništa nije skriveno,', 'osim vaših stvari.'],
    lead: 'Pređite preko elementa da vidite gdje se nalazi u ormaru.',
    points: {
      band: ['Gornja maska', 'Zatvara prostor do plafona'],
      rod: ['Vješanje', 'Šipka ispod gornje police'],
      hinge: ['Šarke', 'Blum CLIP top BLUMOTION, pet po vratima, s prigušenjem'],
      shelf: ['Police', 'Dubina 524 mm, ploča 18 mm'],
      knob: ['Dugme', 'Panama Ø20, nikl satinirano, na 1050 mm od poda'],
      filler: ['Filer', 'Zatvara razmak između ormara i zida'],
      plinth: ['Sokl', '100 mm, uvučen u odnosu na vrata'],
    },
  },
  materials: {
    eyebrow: 'Materijali',
    desc: {
      mel: 'Egger ploča s dekorom, 18 mm. Mat, jednobojna ili hrast: najčešći izbor.',
      hpl: 'Laminat visokog pritiska na ploči. Tvrđa površina, za mjesta kroz koja se često prolazi.',
      mdf: 'MDF lakiran u nijansi, RAL ili NCS. Glatka površina bez prekida.',
    },
    pick: 'Pređite preko fronta',
  },
  measure: { eyebrow: 'Mjerenje' },
  process: { eyebrow: 'Tok' },
  closing: { eyebrow: 'Vaš red', wall: 'zid' },
};

export const home: Record<Locale, HomeCopy> = { fr, bs };
