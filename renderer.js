// Renderer process logic for SW5E Character Sheet
let fs, path, app, dataPath;
let storageBackend = 'none';
let forcePowerCatalog = [];
let techPowerCatalog = [];
let classProgressionCatalog = {};
let speciesReferenceNames = [];
let speciesReferenceSource = '';
let backgroundReferenceNames = [];
let backgroundReferenceSource = '';
let speciesDetailsByName = {};
let backgroundDetailsByName = {};
let archetypeReferenceEntries = [];
let archetypeReferenceSource = '';
let activeFeatureClassTab = '';
let activeCharacterArchetypeTab = '';
let activePowerCatalogTab = 'force';
const LOCAL_STORAGE_KEY = 'sw5e.character';
const ROSTER_STORAGE_KEY = 'sw5e.roster';

// The filename (without .json) of the currently active character
let activeCharacterId = null;

const CONSULAR_TABLE = {
  1: { pb: 2, features: ['Forcecasting', 'Force Recovery'], forcePowersKnown: 9, forcePoints: 4, maxPowerLevel: 1, fecOptions: 0 },
  2: { pb: 2, features: ['Force-Empowered Casting', 'Force Shield'], forcePowersKnown: 11, forcePoints: 8, maxPowerLevel: 1, fecOptions: 2 },
  3: { pb: 2, features: ['Force Affinity', 'Consular Tradition'], forcePowersKnown: 13, forcePoints: 12, maxPowerLevel: 2, fecOptions: 2 },
  4: { pb: 2, features: ['Ability Score Improvement'], forcePowersKnown: 15, forcePoints: 16, maxPowerLevel: 2, fecOptions: 2 },
  5: { pb: 3, features: [], forcePowersKnown: 17, forcePoints: 20, maxPowerLevel: 3, fecOptions: 2 },
  6: { pb: 3, features: ['Tradition Feature'], forcePowersKnown: 19, forcePoints: 24, maxPowerLevel: 3, fecOptions: 2 },
  7: { pb: 3, features: [], forcePowersKnown: 21, forcePoints: 28, maxPowerLevel: 4, fecOptions: 2 },
  8: { pb: 3, features: ['Ability Score Improvement'], forcePowersKnown: 23, forcePoints: 32, maxPowerLevel: 4, fecOptions: 2 },
  9: { pb: 4, features: [], forcePowersKnown: 25, forcePoints: 36, maxPowerLevel: 5, fecOptions: 3 },
  10: { pb: 4, features: ['Tradition Feature'], forcePowersKnown: 26, forcePoints: 40, maxPowerLevel: 5, fecOptions: 3 },
  11: { pb: 4, features: [], forcePowersKnown: 28, forcePoints: 44, maxPowerLevel: 6, fecOptions: 3 },
  12: { pb: 4, features: ['Ability Score Improvement'], forcePowersKnown: 29, forcePoints: 48, maxPowerLevel: 6, fecOptions: 3 },
  13: { pb: 5, features: [], forcePowersKnown: 31, forcePoints: 52, maxPowerLevel: 7, fecOptions: 3 },
  14: { pb: 5, features: ['Tradition Feature'], forcePowersKnown: 32, forcePoints: 56, maxPowerLevel: 7, fecOptions: 3 },
  15: { pb: 5, features: [], forcePowersKnown: 34, forcePoints: 60, maxPowerLevel: 8, fecOptions: 3 },
  16: { pb: 5, features: ['Ability Score Improvement'], forcePowersKnown: 35, forcePoints: 64, maxPowerLevel: 8, fecOptions: 3 },
  17: { pb: 6, features: [], forcePowersKnown: 37, forcePoints: 68, maxPowerLevel: 9, fecOptions: 4 },
  18: { pb: 6, features: ['Tradition Feature'], forcePowersKnown: 38, forcePoints: 72, maxPowerLevel: 9, fecOptions: 4 },
  19: { pb: 6, features: ['Ability Score Improvement'], forcePowersKnown: 39, forcePoints: 76, maxPowerLevel: 9, fecOptions: 4 },
  20: { pb: 6, features: ['One with the Force'], forcePowersKnown: 40, forcePoints: 80, maxPowerLevel: 9, fecOptions: 4 }
};

const TECH_POWERS_KNOWN_TABLES = {
  engineer: {
    1: 6, 2: 7, 3: 9, 4: 10, 5: 12,
    6: 13, 7: 15, 8: 16, 9: 18, 10: 19,
    11: 21, 12: 22, 13: 23, 14: 24, 15: 25,
    16: 26, 17: 27, 18: 28, 19: 29, 20: 30
  },
  scout: {
    1: 0, 2: 4, 3: 5, 4: 6, 5: 7,
    6: 8, 7: 9, 8: 10, 9: 12, 10: 13,
    11: 14, 12: 15, 13: 16, 14: 17, 15: 18,
    16: 19, 17: 20, 18: 21, 19: 22, 20: 23
  }
};

const GUARDIAN_FORCE_TABLE = {
  1: { forcePowersKnown: 5, maxPowerLevel: 1 },
  2: { forcePowersKnown: 7, maxPowerLevel: 1 },
  3: { forcePowersKnown: 9, maxPowerLevel: 1 },
  4: { forcePowersKnown: 10, maxPowerLevel: 1 },
  5: { forcePowersKnown: 12, maxPowerLevel: 2 },
  6: { forcePowersKnown: 13, maxPowerLevel: 2 },
  7: { forcePowersKnown: 14, maxPowerLevel: 2 },
  8: { forcePowersKnown: 15, maxPowerLevel: 2 },
  9: { forcePowersKnown: 17, maxPowerLevel: 3 },
  10: { forcePowersKnown: 18, maxPowerLevel: 3 },
  11: { forcePowersKnown: 19, maxPowerLevel: 3 },
  12: { forcePowersKnown: 20, maxPowerLevel: 3 },
  13: { forcePowersKnown: 22, maxPowerLevel: 4 },
  14: { forcePowersKnown: 23, maxPowerLevel: 4 },
  15: { forcePowersKnown: 24, maxPowerLevel: 4 },
  16: { forcePowersKnown: 25, maxPowerLevel: 4 },
  17: { forcePowersKnown: 27, maxPowerLevel: 5 },
  18: { forcePowersKnown: 28, maxPowerLevel: 5 },
  19: { forcePowersKnown: 29, maxPowerLevel: 5 },
  20: { forcePowersKnown: 30, maxPowerLevel: 5 }
};

const SENTINEL_FORCE_TABLE = {
  1: { forcePowersKnown: 7, maxPowerLevel: 1 },
  2: { forcePowersKnown: 9, maxPowerLevel: 1 },
  3: { forcePowersKnown: 11, maxPowerLevel: 2 },
  4: { forcePowersKnown: 13, maxPowerLevel: 2 },
  5: { forcePowersKnown: 15, maxPowerLevel: 2 },
  6: { forcePowersKnown: 17, maxPowerLevel: 3 },
  7: { forcePowersKnown: 18, maxPowerLevel: 3 },
  8: { forcePowersKnown: 19, maxPowerLevel: 3 },
  9: { forcePowersKnown: 21, maxPowerLevel: 4 },
  10: { forcePowersKnown: 22, maxPowerLevel: 4 },
  11: { forcePowersKnown: 24, maxPowerLevel: 5 },
  12: { forcePowersKnown: 25, maxPowerLevel: 5 },
  13: { forcePowersKnown: 26, maxPowerLevel: 5 },
  14: { forcePowersKnown: 28, maxPowerLevel: 6 },
  15: { forcePowersKnown: 29, maxPowerLevel: 6 },
  16: { forcePowersKnown: 30, maxPowerLevel: 6 },
  17: { forcePowersKnown: 32, maxPowerLevel: 7 },
  18: { forcePowersKnown: 33, maxPowerLevel: 7 },
  19: { forcePowersKnown: 34, maxPowerLevel: 7 },
  20: { forcePowersKnown: 35, maxPowerLevel: 7 }
};

const TECH_MAX_POWER_LEVEL_TABLES = {
  engineer: {
    1: 1, 2: 1, 3: 2, 4: 2, 5: 3,
    6: 3, 7: 4, 8: 4, 9: 5, 10: 5,
    11: 6, 12: 6, 13: 7, 14: 7, 15: 8,
    16: 8, 17: 9, 18: 9, 19: 9, 20: 9
  },
  scout: {
    1: 0, 2: 1, 3: 1, 4: 1, 5: 2,
    6: 2, 7: 2, 8: 2, 9: 3, 10: 3,
    11: 3, 12: 3, 13: 4, 14: 4, 15: 4,
    16: 4, 17: 5, 18: 5, 19: 5, 20: 5
  }
};

const PLACEHOLDER_CLASS = 'Select Class';

const CLASS_OPTIONS = [
  PLACEHOLDER_CLASS,
  'Berserker',
  'Consular',
  'Engineer',
  'Fighter',
  'Guardian',
  'Monk',
  'Operative',
  'Scholar',
  'Scout',
  'Sentinel'
];

const SUPPORTED_PROGRESSION_CLASSES = ['consular', 'engineer', 'scout'];

const CLASS_CHOICE_RULES = {
  berserker: {
    unlockLevel: 3,
    label: 'Approach',
    description: 'Choose your berserker approach at 3rd level.',
    options: ['Ballistic Approach', 'Cyclone Approach', 'Juggernaut Approach', 'Marauder Approach']
  },
  consular: {
    unlockLevel: 3,
    label: 'Way',
    description: 'Choose your consular way at 3rd level.',
    options: ['Way of Balance', 'Way of Lightning', 'Way of the Sage', 'Way of Suggestion']
  },
  engineer: {
    unlockLevel: 3,
    label: 'Engineering',
    description: 'Choose your engineering discipline at 3rd level.',
    options: ['Armormech Engineering', 'Armstech Engineering', 'Gadgeteer Engineering', 'Unstable Engineering']
  },
  fighter: {
    unlockLevel: 3,
    label: 'Specialist',
    description: 'Choose your fighter specialist at 3rd level.',
    options: ['Assault Specialist', 'Blademaster Specialist', 'Shield Specialist', 'Tactical Specialist']
  },
  guardian: {
    unlockLevel: 3,
    label: 'Form',
    description: 'Choose your guardian lightsaber form at 3rd level.',
    options: ['Makashi Form', 'Niman Form', 'Shien/Djem So Form', 'Soresu Form']
  },
  monk: {
    unlockLevel: 3,
    label: 'Order',
    description: 'Choose your monk order at 3rd level.',
    options: ['Crimson Order', 'Echani Order', 'Matukai Order', 'Nightsister Order']
  },
  operative: {
    unlockLevel: 3,
    label: 'Practice',
    description: 'Choose your operative practice at 3rd level.',
    options: ['Acquisitions Practice', 'Beguiler Practice', 'Lethality Practice', 'Sharpshooter Practice']
  },
  scholar: {
    unlockLevel: 3,
    label: 'Pursuit',
    description: 'Choose your scholar pursuit at 3rd level.',
    options: ['Gambler Pursuit', 'Physician Pursuit', 'Politician Pursuit', 'Tactician Pursuit']
  },
  scout: {
    unlockLevel: 3,
    label: 'Technique',
    description: 'Choose your scout technique at 3rd level.',
    options: ['Bulwark Technique', 'Hunter Technique', 'Slayer Technique', 'Stalker Technique']
  },
  sentinel: {
    unlockLevel: 3,
    label: 'Path',
    description: 'Choose your sentinel path at 3rd level.',
    options: ['Path of the Corsair', 'Path of Focus', 'Path of the Forceblade', 'Path of Shadows']
  }
};

const FEC_OPTIONS = {
  'Careful Power': {
    cost: '1 force point',
    description: 'When you cast a power that forces other creatures to make a saving throw, you can protect some of those creatures from the full force of the power. To do so, you spend 1 force point and choose a number of those creatures up to your Wisdom or Charisma modifier (minimum one creature). A chosen creature automatically succeeds on its saving throw against the power.'
  },
  'Distant Power': {
    cost: '1 force point',
    description: 'When you cast a power that has a range of 5 feet or greater, you can spend 1 force point to double the range of the power. When you cast a power that has a range of touch, you can spend 1 force point to make the range of the power 30 feet.'
  },
  'Empowered Power': {
    cost: '1 force point',
    description: 'When you roll damage for a power, you can spend 1 force point to reroll a number of the damage dice up to your Wisdom or Charisma modifier (minimum one). You must use the new rolls. You can use Empowered Power even if you have already used a different Force-Empowered Casting option during the casting of the power.'
  },
  'Extended Power': {
    cost: '1 force point',
    description: 'When you cast a power that has a duration of 1 minute or longer, you can spend 1 force point to double its duration, to a maximum duration of 24 hours.'
  },
  'Heightened Power': {
    cost: '3 force points',
    description: 'When you cast a power that forces a creature to make a saving throw to resist its effects, you can spend 3 force points to give one target of the power disadvantage on its first saving throw made against the power.'
  },
  'Quickened Power': {
    cost: '2 force points',
    description: 'When you cast a power that has a casting time of 1 action, you can spend 2 force points to change the casting time to 1 bonus action for this casting.'
  },
  'Seeking Power': {
    cost: '2 force points',
    description: 'If you miss with a force attack roll, you can spend 2 force points to reroll the attack. You must use the new roll.'
  },
  'Twinned Power': {
    cost: 'power level in force points (min 1)',
    description: 'When you cast a power that can only target one creature and doesn\'t have a range of self, you can spend a number of force points equal to the power\'s level to target a second creature in range with the same power (1 force point if the power is an at-will).'
  }
};

const FORCE_AFFINITY_DETAILS = {
  none: {
    title: 'No Affinity Chosen',
    description: 'Choose Ashla, Bendu, or Bogan at level 3+ to finalize your Force Affinity. This choice can affect progression warnings and Force point calculations.'
  },
  ashla: {
    title: 'Ashla (Light Side)',
    description: 'Ashla represents harmony, protection, and compassion. In this sheet it identifies your Light-side alignment choice for progression tracking.'
  },
  bendu: {
    title: 'Bendu (Balance)',
    description: 'Bendu embraces balance between light and dark. At level 3+, this sheet calculates your max Force points using both Wisdom and Charisma modifiers combined (instead of only one casting modifier).'
  },
  bogan: {
    title: 'Bogan (Dark Side)',
    description: 'Bogan represents passion, ambition, and power. In this sheet it identifies your Dark-side alignment choice for progression tracking.'
  }
};

const FEATURE_DETAILS = {
  'Forcecasting': 'You can cast force powers using your chosen casting ability (Wisdom or Charisma). Your force powers known, max power level, and Force point pool scale with consular level.',
  'Force Recovery': 'You can recover expended Force points during a short rest. The amount recovered is shown in your progression outputs as Force Recovery.',
  'Force-Empowered Casting': 'You can modify force powers by spending Force points on selected Force-Empowered options. The number of options you can choose scales by level.',
  'Force Shield': 'You gain uses of Force Shield that refresh with rest. The number of uses increases at higher levels and is shown in progression outputs.',
  'Force Affinity': 'At level 3+, choose Ashla, Bendu, or Bogan. Bendu changes max Force point calculation in this sheet by adding both Wisdom and Charisma modifiers.',
  'Consular Tradition': 'At level 3, you choose your consular tradition/archetype. This unlocks tradition features at higher levels.',
  'Ability Score Improvement': 'Increase ability scores using ASI choices in the Leveling tab. ASI availability follows consular progression levels.',
  'Tradition Feature': 'Your selected consular tradition grants a feature at this level. Details depend on your chosen archetype.',
  'One with the Force': 'Capstone feature at level 20. You achieve peak mastery of the Force for your class progression.',
  'Way of Telekinetics: Staggering Stratagem (Large or smaller, push/pull 10 ft once/turn)': 'Your telekinetic powers can affect creatures of Large size or smaller, and you can push or pull a target 10 feet once each turn when your effect applies.',
  'Way of Telekinetics: Mighty Blast (1 target can be knocked prone on failed STR save)': 'When your telekinetic power hits, one target can be forced to make a Strength saving throw or be knocked prone.',
  'Way of Telekinetics: Size Matters Not (Huge or smaller; bonus action fly 10 ft after casting)': 'You can affect creatures up to Huge size with telekinetic effects, and after casting a force power you can fly 10 feet as a bonus action.',
  'Mighty Blast improves to 2 targets': 'Mighty Blast can affect up to 2 targets when the feature triggers.',
  'Way of Telekinetics: Repulsing Wave (5 uses, short/long rest)': 'You gain Repulsing Wave with 5 uses, recovering uses on a short or long rest.',
  'Mighty Blast improves to 3 targets': 'Mighty Blast can affect up to 3 targets when the feature triggers.',
  'Repulsing Wave improves to 6 uses': 'Your Repulsing Wave pool increases to 6 uses per short or long rest.',
  'Way of Telekinetics: My Ally is the Force (Gargantuan or smaller, +20 ft push/pull)': 'You can affect creatures up to Gargantuan size and increase your push/pull distance by 20 feet with telekinetic effects.'
};

const XP_THRESHOLDS = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000
};

function clampLevel(level) {
  return Math.max(1, Math.min(20, Number(level) || 1));
}

function getAsiSlots(level) {
  const thresholds = [4, 8, 12, 16, 19];
  return thresholds.filter((threshold) => level >= threshold).length;
}

function normalizeFeatureLookupKey(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function getClassProgressionData(className) {
  const normalized = String(className || '').trim().toLowerCase();
  return classProgressionCatalog[normalized] || null;
}

function createFeatureEntry(name, level = null, description = '', className = '') {
  return {
    name,
    level,
    className,
    description,
    displayName: level != null ? `Level ${level}: ${name}` : name
  };
}

function getCatalogClassFeaturesByLevel(className, level) {
  const classData = getClassProgressionData(className);
  if (!classData?.progression) {
    return [];
  }

  const maxLevel = Math.max(1, Number(level) || 1);
  const features = [];
  for (let currentLevel = 1; currentLevel <= maxLevel; currentLevel += 1) {
    const row = classData.progression[String(currentLevel)];
    if (!row?.features?.length) {
      continue;
    }

    row.features.forEach((featureName) => {
      features.push(createFeatureEntry(
        featureName,
        currentLevel,
        classData.featureDescriptions?.[normalizeFeatureLookupKey(featureName)] || '',
        classData.name
      ));
    });
  }

  return features;
}

function getAsiSlotsForClass(className, level) {
  const classData = getClassProgressionData(className);
  if (!classData?.progression) {
    return getAsiSlots(level);
  }

  let total = 0;
  for (let currentLevel = 1; currentLevel <= Math.max(1, Number(level) || 1); currentLevel += 1) {
    const row = classData.progression[String(currentLevel)];
    if (row?.features?.includes('Ability Score Improvement')) {
      total += 1;
    }
  }
  return total;
}

function syncClassChoiceRulesFromCatalog() {
  Object.entries(CLASS_CHOICE_RULES).forEach(([classKey, rule]) => {
    const classData = classProgressionCatalog[classKey];
    if (classData?.subclasses?.length) {
      rule.options = classData.subclasses.map((entry) => entry.name);
    }
  });
}

function getAbilityModifier(score) {
  const parsed = Number(score) || 0;
  return Math.floor((parsed - 10) / 2);
}

function formatModifier(score) {
  const mod = getAbilityModifier(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function getXpThreshold(level) {
  return XP_THRESHOLDS[clampLevel(level)] || 0;
}

function updateXpProgress() {
  const xpInput = document.getElementById('experiencePoints');
  const levelInput = document.getElementById('level');
  const fillEl = document.getElementById('xpFill');
  const progressTextEl = document.getElementById('xpProgressText');
  const currentLevelEl = document.getElementById('xpCurrentLevel');
  const nextLevelEl = document.getElementById('xpNextLevel');

  if (!xpInput || !levelInput || !fillEl || !progressTextEl || !currentLevelEl || !nextLevelEl) {
    return;
  }

  const xp = Math.max(0, Number(xpInput.value) || 0);
  const level = clampLevel(levelInput.value);
  const currentThreshold = getXpThreshold(level);
  const hasNextLevel = level < 20;
  const nextThreshold = hasNextLevel ? getXpThreshold(level + 1) : currentThreshold;

  currentLevelEl.textContent = `Level ${level}`;
  nextLevelEl.textContent = hasNextLevel ? `Level ${level + 1}` : 'Max Level';

  if (!hasNextLevel) {
    fillEl.style.width = '100%';
    fillEl.style.background = 'linear-gradient(90deg, #1a6e1a, #4caf50)';
    progressTextEl.textContent = `${xp.toLocaleString()} XP (Level 20 cap)`;
    return;
  }

  const span = Math.max(1, nextThreshold - currentThreshold);
  const normalized = Math.max(0, Math.min(1, (xp - currentThreshold) / span));
  fillEl.style.width = `${Math.round(normalized * 100)}%`;
  fillEl.style.background = normalized >= 1
    ? 'linear-gradient(90deg, #1a6e1a, #4caf50)'
    : normalized >= 0.75
      ? 'linear-gradient(90deg, #e67e22, #f5b041)'
      : 'linear-gradient(90deg, #2d5aa7, #4a89f0)';

  progressTextEl.textContent = `${xp.toLocaleString()} / ${nextThreshold.toLocaleString()} XP`;
}

const SKILLS = [
  { id: 'strSave', ability: 'str' },
  { id: 'athletics', ability: 'str' },
  { id: 'dexSave', ability: 'dex' },
  { id: 'acrobatics', ability: 'dex' },
  { id: 'sleightOfHand', ability: 'dex' },
  { id: 'stealth', ability: 'dex' },
  { id: 'conSave', ability: 'con' },
  { id: 'intSave', ability: 'int' },
  { id: 'investigation', ability: 'int' },
  { id: 'lore', ability: 'int' },
  { id: 'nature', ability: 'int' },
  { id: 'piloting', ability: 'int' },
  { id: 'technology', ability: 'int' },
  { id: 'wisSave', ability: 'wis' },
  { id: 'animalHandling', ability: 'wis' },
  { id: 'insight', ability: 'wis' },
  { id: 'medicine', ability: 'wis' },
  { id: 'perception', ability: 'wis' },
  { id: 'survival', ability: 'wis' },
  { id: 'chaSave', ability: 'cha' },
  { id: 'deception', ability: 'cha' },
  { id: 'intimidation', ability: 'cha' },
  { id: 'performance', ability: 'cha' },
  { id: 'persuasion', ability: 'cha' },
];

function updateSkills() {
  const scores = {
    str: parseInt(document.getElementById('str').value) || 0,
    dex: parseInt(document.getElementById('dex').value) || 0,
    con: parseInt(document.getElementById('con').value) || 0,
    int: parseInt(document.getElementById('int').value) || 0,
    wis: parseInt(document.getElementById('wis').value) || 0,
    cha: parseInt(document.getElementById('cha').value) || 0,
  };
  const level = clampLevel(document.getElementById('level')?.value || 1);
  const pb = CONSULAR_TABLE[level]?.pb || 2;
  SKILLS.forEach((skill) => {
    const mod = getAbilityModifier(scores[skill.ability]);
    const profEl = document.getElementById('prof_' + skill.id);
    const expEl = document.getElementById('exp_' + skill.id);
    const valEl = document.getElementById('val_' + skill.id);
    if (!valEl) {
      return;
    }
    const isProf = profEl?.checked || false;
    const isExp = expEl?.checked || false;
    const bonus = isExp ? pb * 2 : isProf ? pb : 0;
    const total = mod + bonus;
    valEl.value = total >= 0 ? `+${total}` : `${total}`;
  });
}

function setAbilityValue(abilityId, nextValue) {
  const element = document.getElementById(abilityId);
  if (!element) {
    return;
  }
  const clamped = Math.max(1, Math.min(20, Number(nextValue) || 1));
  element.value = clamped;
}

function updateAbilityModifiers() {
  document.getElementById('strMod').value = formatModifier(document.getElementById('str').value);
  document.getElementById('dexMod').value = formatModifier(document.getElementById('dex').value);
  document.getElementById('conMod').value = formatModifier(document.getElementById('con').value);
  document.getElementById('intMod').value = formatModifier(document.getElementById('int').value);
  document.getElementById('wisMod').value = formatModifier(document.getElementById('wis').value);
  document.getElementById('chaMod').value = formatModifier(document.getElementById('cha').value);
  updateSkills();
}

function updateAsiStatus(level, asiHistory) {
  const available = getAsiSlots(level);
  const spent = asiHistory.length;
  document.getElementById('asiSpent').value = `ASI Spent: ${spent}`;
  document.getElementById('asiAvailable').value = `ASI Available: ${available}`;
}

function getAsiHistoryFromUi() {
  const raw = document.getElementById('asiHistory')?.value || '[]';
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

function setAsiHistoryToUi(history) {
  document.getElementById('asiHistory').value = JSON.stringify(history || []);
}

function applyAsi(mode) {
  const level = clampLevel(document.getElementById('level').value);
  const available = getAsiSlots(level);
  const existingHistory = getAsiHistoryFromUi();

  if (existingHistory.length >= available) {
    alert(`No ASI slots remaining at level ${level}.`);
    return;
  }

  const primary = document.getElementById('asiPrimary').value;
  const secondary = document.getElementById('asiSecondary').value;
  const before = {
    str: Number(document.getElementById('str').value) || 0,
    dex: Number(document.getElementById('dex').value) || 0,
    con: Number(document.getElementById('con').value) || 0,
    int: Number(document.getElementById('int').value) || 0,
    wis: Number(document.getElementById('wis').value) || 0,
    cha: Number(document.getElementById('cha').value) || 0
  };

  if (mode === '+2') {
    setAbilityValue(primary, before[primary] + 2);
  } else {
    setAbilityValue(primary, before[primary] + 1);
    setAbilityValue(secondary, before[secondary] + 1);
  }

  const after = {
    str: Number(document.getElementById('str').value) || 0,
    dex: Number(document.getElementById('dex').value) || 0,
    con: Number(document.getElementById('con').value) || 0,
    int: Number(document.getElementById('int').value) || 0,
    wis: Number(document.getElementById('wis').value) || 0,
    cha: Number(document.getElementById('cha').value) || 0
  };

  existingHistory.push({ mode, primary, secondary, before, after });
  setAsiHistoryToUi(existingHistory);

  updateAbilityModifiers();
  applyLevelProgression();
}

function undoAsi() {
  const historyEntries = getAsiHistoryFromUi();
  if (!historyEntries.length) {
    alert('No ASI to undo.');
    return;
  }

  const last = historyEntries.pop();
  setAbilityValue('str', last.before.str);
  setAbilityValue('dex', last.before.dex);
  setAbilityValue('con', last.before.con);
  setAbilityValue('int', last.before.int);
  setAbilityValue('wis', last.before.wis);
  setAbilityValue('cha', last.before.cha);

  setAsiHistoryToUi(historyEntries);
  updateAbilityModifiers();
  applyLevelProgression();
}

function parseCommaList(value) {
  if (!value) {
    return [];
  }
  return value.split(',').map((part) => part.trim()).filter(Boolean);
}

function coerceNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeConditionList(conditions) {
  if (Array.isArray(conditions)) {
    return conditions.map((item) => String(item || '').trim()).filter(Boolean).join(', ');
  }
  if (typeof conditions === 'string') {
    return conditions;
  }
  return '';
}

function extractClassForcePowers(classes) {
  if (!Array.isArray(classes)) {
    return [];
  }

  const powersByName = new Map();
  classes.forEach((classEntry) => {
    const classPowers = Array.isArray(classEntry?.forcePowers) ? classEntry.forcePowers : [];
    classPowers.forEach((power) => {
      const powerName = String(power?.name || '').trim();
      if (!powerName) {
        return;
      }

      if (!powersByName.has(powerName.toLowerCase())) {
        powersByName.set(powerName.toLowerCase(), {
          name: powerName,
          level: Math.max(0, coerceNumber(power?.level, 0)),
          alignment: String(power?.alignment || 'universal').toLowerCase(),
          description: String(power?.description || '')
        });
      }
    });
  });

  return Array.from(powersByName.values());
}

function buildSkillsFromTweaks(tweaks) {
  const mapped = {};
  const skillByLabel = {
    'athletics': 'athletics',
    'acrobatics': 'acrobatics',
    'sleight of hand': 'sleightOfHand',
    'stealth': 'stealth',
    'investigation': 'investigation',
    'lore': 'lore',
    'nature': 'nature',
    'piloting': 'piloting',
    'technology': 'technology',
    'animal handling': 'animalHandling',
    'insight': 'insight',
    'medicine': 'medicine',
    'perception': 'perception',
    'survival': 'survival',
    'deception': 'deception',
    'intimidation': 'intimidation',
    'performance': 'performance',
    'persuasion': 'persuasion'
  };

  const abilityScores = tweaks?.abilityScores || {};
  Object.keys(abilityScores).forEach((abilityName) => {
    const abilityTweaks = abilityScores[abilityName] || {};
    const skills = abilityTweaks.skills || {};

    Object.keys(skills).forEach((skillLabel) => {
      const normalizedLabel = String(skillLabel || '').trim().toLowerCase();
      const targetId = skillByLabel[normalizedLabel];
      if (!targetId) {
        return;
      }

      const profText = String(skills[skillLabel]?.proficiency || '').toLowerCase();
      mapped[targetId] = {
        prof: profText === 'proficient' || profText === 'expertise',
        expertise: profText === 'expertise'
      };
    });
  });

  return mapped;
}

function mapBuilderCharacterToSheet(data) {
  const classes = Array.isArray(data?.classes) ? data.classes : [];
  const firstClass = classes[0] || {};
  const classConfig = classes.length
    ? classes.map((entry) => ({
      name: String(entry?.name || PLACEHOLDER_CLASS),
      level: Math.max(1, coerceNumber(entry?.levels, 1)),
      archetype: String(entry?.archetype?.name || '')
    }))
    : [{ name: PLACEHOLDER_CLASS, level: 1, archetype: '' }];

  const importedSkills = (data?.skills && typeof data.skills === 'object')
    ? data.skills
    : buildSkillsFromTweaks(data?.tweaks);

  const forcePowers = extractClassForcePowers(classes);
  const techPowers = Array.isArray(data?.customTechPowers)
    ? data.customTechPowers.map((power) => ({
      name: String(power?.name || '').trim(),
      level: Math.max(0, coerceNumber(power?.level, 0)),
      description: String(power?.description || ''),
      powerType: 'tech'
    })).filter((power) => power.name)
    : [];
  const conditions = normalizeConditionList(data?.currentStats?.conditions);

  return {
    name: String(data?.name || 'Unnamed Character'),
    species: String(data?.species?.name || ''),
    class: String(firstClass?.name || ''),
    level: Math.max(1, coerceNumber(firstClass?.levels, 1)),
    experiencePoints: Math.max(0, coerceNumber(data?.experiencePoints, 0)),
    background: String(data?.background?.name || ''),
    archetype: String(firstClass?.archetype?.name || ''),
    attributes: {
      str: coerceNumber(data?.baseAbilityScores?.Strength, 0),
      dex: coerceNumber(data?.baseAbilityScores?.Dexterity, 0),
      con: coerceNumber(data?.baseAbilityScores?.Constitution, 0),
      int: coerceNumber(data?.baseAbilityScores?.Intelligence, 0),
      wis: coerceNumber(data?.baseAbilityScores?.Wisdom, 0),
      cha: coerceNumber(data?.baseAbilityScores?.Charisma, 0)
    },
    characteristics: {
      alignment: String(data?.characteristics?.alignment || ''),
      gender: String(data?.characteristics?.Gender || ''),
      age: String(data?.characteristics?.Age || ''),
      height: String(data?.characteristics?.Height || ''),
      weight: String(data?.characteristics?.Weight || ''),
      hair: String(data?.characteristics?.Hair || ''),
      eyes: String(data?.characteristics?.Eyes || ''),
      skin: String(data?.characteristics?.Skin || ''),
      appearance: String(data?.characteristics?.Appearance || ''),
      backstory: String(data?.characteristics?.Backstory || ''),
      personality: String(data?.characteristics?.['Personality Traits'] || ''),
      ideal: String(data?.characteristics?.Ideal || ''),
      bond: String(data?.characteristics?.Bond || ''),
      flaw: String(data?.characteristics?.Flaw || '')
    },
    combatStats: {
      maxHitPoints: coerceNumber(data?.currentStats?.maxHitPoints, (Array.isArray(firstClass?.hitPoints)
        ? firstClass.hitPoints.reduce((sum, hp) => sum + coerceNumber(hp, 0), 0)
        : 0)),
      hitPointsLost: coerceNumber(data?.currentStats?.hitPointsLost, 0),
      temporaryHitPoints: coerceNumber(data?.currentStats?.temporaryHitPoints, 0),
      forcePointsUsed: coerceNumber(data?.currentStats?.forcePointsUsed, 0),
      forceShieldUsed: coerceNumber(data?.currentStats?.forceShieldUsed, 0),
      techPointsUsed: coerceNumber(data?.currentStats?.techPointsUsed, 0),
      techPointsMax: coerceNumber(data?.currentStats?.techPointsMax, 0),
      credits: coerceNumber(data?.credits, 0)
    },
    status: {
      inspiration: Boolean(data?.currentStats?.hasInspiration),
      exhaustion: coerceNumber(data?.currentStats?.exhaustion, 0),
      conditions,
      notes: String(data?.notes || '')
    },
    forceConfig: {
      castingAbility: 'wis',
      forceAffinity: 'none',
      fecChosen: []
    },
    abilityScoreConfig: {
      asiHistory: []
    },
    classes: classConfig,
    skills: importedSkills,
    forcePowers,
    techPowers
  };
}

function getBlankCharacterTemplate() {
  const emptySkills = {};
  SKILLS.forEach((skill) => {
    emptySkills[skill.id] = { prof: false, expertise: false };
  });

  return {
    name: '',
    species: '',
    class: '',
    level: 1,
    experiencePoints: 0,
    background: '',
    archetype: '',
    attributes: {
      str: 0,
      dex: 0,
      con: 0,
      int: 0,
      wis: 0,
      cha: 0
    },
    characteristics: {
      alignment: '',
      gender: '',
      age: '',
      height: '',
      weight: '',
      hair: '',
      eyes: '',
      skin: '',
      appearance: '',
      backstory: '',
      personality: '',
      ideal: '',
      bond: '',
      flaw: ''
    },
    combatStats: {
      maxHitPoints: 0,
      hitPointsLost: 0,
      temporaryHitPoints: 0,
      forcePointsUsed: 0,
      forceShieldUsed: 0,
      techPointsUsed: 0,
      techPointsMax: 0,
      credits: 0
    },
    status: {
      inspiration: false,
      exhaustion: 0,
      conditions: '',
      notes: ''
    },
    forceConfig: {
      castingAbility: 'wis',
      forceAffinity: 'none',
      fecChosen: []
    },
    abilityScoreConfig: {
      asiHistory: []
    },
    classes: [{ name: PLACEHOLDER_CLASS, level: 1, archetype: '' }],
    skills: emptySkills,
    forcePowers: [],
    techPowers: []
  };
}

function isTelekineticsArchetype(archetype) {
  return String(archetype || '').toLowerCase().includes('telekin');
}

function getTelekineticsFeatures(level) {
  const features = [];
  const telekineticStats = {
    mightyBlastTargets: 0,
    repulsingWaveUses: 0
  };

  if (level >= 3) {
    features.push('Way of Telekinetics: Staggering Stratagem (Large or smaller, push/pull 10 ft once/turn)');
  }

  if (level >= 6) {
    telekineticStats.mightyBlastTargets = 1;
    features.push('Way of Telekinetics: Mighty Blast (1 target can be knocked prone on failed STR save)');
  }

  if (level >= 10) {
    features.push('Way of Telekinetics: Size Matters Not (Huge or smaller; bonus action fly 10 ft after casting)');
  }

  if (level >= 11) {
    telekineticStats.mightyBlastTargets = 2;
    features.push('Mighty Blast improves to 2 targets');
  }

  if (level >= 14) {
    telekineticStats.repulsingWaveUses = 5;
    features.push('Way of Telekinetics: Repulsing Wave (5 uses, short/long rest)');
  }

  if (level >= 17) {
    telekineticStats.mightyBlastTargets = 3;
    telekineticStats.repulsingWaveUses = 6;
    features.push('Mighty Blast improves to 3 targets');
    features.push('Repulsing Wave improves to 6 uses');
  }

  if (level >= 18) {
    features.push('Way of Telekinetics: My Ally is the Force (Gargantuan or smaller, +20 ft push/pull)');
  }

  return { features, telekineticStats };
}

function getClassFeaturesByLevel(level) {
  const classFeatures = [];

  for (let i = 1; i <= level; i += 1) {
    const row = CONSULAR_TABLE[i];
    if (!row) {
      continue;
    }
    row.features.forEach((feature) => {
      classFeatures.push(`Level ${i}: ${feature}`);
    });
  }

  return classFeatures;
}

function getGenericClassFeaturesByLevel(className, level, archetype) {
  const features = [];
  const normalizedName = String(className || '').trim();
  if (!normalizedName || normalizedName === PLACEHOLDER_CLASS) {
    return features;
  }

  const classKey = normalizedName.toLowerCase();
  const choiceRule = CLASS_CHOICE_RULES[classKey];
  const classLevel = Math.max(1, Number(level) || 1);

  if (classLevel >= 1) {
    features.push(`Level 1: ${normalizedName} core features`);
  }
  if (classLevel >= 2) {
    features.push(`Level 2: ${normalizedName} class feature`);
  }

  if (choiceRule && classLevel >= choiceRule.unlockLevel) {
    const chosenText = archetype
      ? `${choiceRule.label} chosen (${archetype})`
      : `${choiceRule.label} choice available`;
    features.push(`Level ${choiceRule.unlockLevel}: ${normalizedName} ${chosenText}`);

    [6, 10, 14, 18].forEach((featureLevel) => {
      if (classLevel >= featureLevel) {
        features.push(`Level ${featureLevel}: ${normalizedName} ${choiceRule.label} feature`);
      }
    });
  }

  [4, 8, 12, 16, 19].forEach((asiLevel) => {
    if (classLevel >= asiLevel) {
      features.push(`Level ${asiLevel}: ${normalizedName} Ability Score Improvement`);
    }
  });

  if (classLevel >= 20) {
    features.push(`Level 20: ${normalizedName} capstone feature`);
  }

  return features;
}

function getDefaultClassEntry() {
  return {
    name: PLACEHOLDER_CLASS,
    level: 1,
    archetype: ''
  };
}

function normalizeClassEntry(entry) {
  const fallback = getDefaultClassEntry();
  return {
    name: String(entry?.name || fallback.name),
    level: Math.max(1, Number(entry?.level) || fallback.level),
    archetype: String(entry?.archetype || '')
  };
}

function normalizeClassConfig(config) {
  const normalized = Array.isArray(config)
    ? config.map(normalizeClassEntry).filter((entry) => entry.name)
    : [];

  return normalized.length ? normalized : [getDefaultClassEntry()];
}

function getTotalCharacterLevel(classConfig) {
  return normalizeClassConfig(classConfig).reduce((total, entry) => {
    if (entry.name === PLACEHOLDER_CLASS) {
      return total;
    }
    return total + Math.max(0, Number(entry.level) || 0);
  }, 0);
}

function getProficiencyBonusForLevel(level) {
  const clamped = clampLevel(level);
  return Math.min(6, 2 + Math.floor((clamped - 1) / 4));
}

function getClassLevelConfig() {
  const container = document.getElementById('classLevelList');
  const hiddenInput = document.getElementById('classConfig');

  if (container) {
    const rows = Array.from(container.querySelectorAll('.class-level-row')).map((row) => ({
      name: row.querySelector('.class-level-select')?.value || PLACEHOLDER_CLASS,
      level: parseInt(row.querySelector('.class-level-input')?.value, 10) || 1,
      archetype: row.querySelector('.class-archetype-input')?.value || ''
    }));

    if (rows.length) {
      return normalizeClassConfig(rows);
    }
  }

  if (hiddenInput?.value) {
    try {
      return normalizeClassConfig(JSON.parse(hiddenInput.value));
    } catch (_err) {
      return [getDefaultClassEntry()];
    }
  }

  return [getDefaultClassEntry()];
}

function syncClassSummaryFields(classConfig) {
  const normalized = normalizeClassConfig(classConfig);
  const levelEl = document.getElementById('level');
  const classEl = document.getElementById('class');
  const archetypeEl = document.getElementById('archetype');
  const hiddenInput = document.getElementById('classConfig');
  const totalLevel = getTotalCharacterLevel(normalized);
  const concreteClasses = normalized.filter((entry) => entry.name !== PLACEHOLDER_CLASS);

  if (levelEl) {
    levelEl.value = totalLevel;
  }
  if (classEl) {
    classEl.value = concreteClasses.map((entry) => `${entry.name} ${entry.level}`).join(' / ');
  }
  if (archetypeEl) {
    archetypeEl.value = concreteClasses.map((entry) => entry.archetype).filter(Boolean).join(' / ');
  }
  if (hiddenInput) {
    hiddenInput.value = JSON.stringify(normalized);
  }

  return normalized;
}

function renderClassLevelRows(classConfig) {
  const container = document.getElementById('classLevelList');
  if (!container) {
    return;
  }

  const normalized = syncClassSummaryFields(classConfig);
  container.innerHTML = normalized.map((entry, index) => {
    const archetypeOptions = buildSelectOptionsHtml(
      archetypeReferenceEntries.map((archetype) => archetype?.name),
      entry.archetype,
      'Choose Archetype / Tradition'
    );

    return `
    <div class="class-level-row" data-index="${index}">
      <div class="class-level-field class-level-field--class">
        <label class="fp-label" for="classLevelName_${index}">Class</label>
        <select id="classLevelName_${index}" class="class-level-select" onchange="updateClassLevelRow(${index}, 'name', this.value)">
          ${CLASS_OPTIONS.map((option) => `<option value="${option}" ${option === entry.name ? 'selected' : ''}>${option}</option>`).join('')}
        </select>
      </div>
      <div class="class-level-field class-level-field--level">
        <label class="fp-label" for="classLevelValue_${index}">Class Level</label>
        <div class="class-level-stepper">
          <button type="button" class="class-level-step-btn" onclick="changeClassLevelBy(${index}, -1)">&#8722;</button>
          <input id="classLevelValue_${index}" type="number" min="1" class="class-level-input" value="${entry.level}" onchange="updateClassLevelRow(${index}, 'level', this.value)">
          <button type="button" class="class-level-step-btn" onclick="changeClassLevelBy(${index}, 1)">&#43;</button>
        </div>
      </div>
      <div class="class-level-field class-level-field--archetype">
        <label class="fp-label" for="classArchetype_${index}">Archetype / Tradition</label>
        <select id="classArchetype_${index}" class="class-archetype-input" onchange="updateClassLevelRow(${index}, 'archetype', this.value)">
          ${archetypeOptions}
        </select>
      </div>
      <div class="class-level-field class-level-field--actions">
        <label class="fp-label">Row</label>
        <button type="button" class="class-level-remove" onclick="removeClassLevelRow(${index})" ${normalized.length <= 1 ? 'disabled' : ''}>Remove</button>
      </div>
    </div>
  `;
  }).join('');

  refreshArchetypeInputHints();
}

function buildLevelChoiceDefinitions(classConfig) {
  return normalizeClassConfig(classConfig).flatMap((entry, index) => {
    const key = String(entry.name || '').toLowerCase();
    const rule = CLASS_CHOICE_RULES[key];
    if (!rule || entry.level < rule.unlockLevel) {
      return [];
    }

    const options = [...rule.options];
    const current = String(entry.archetype || '');
    if (current && !options.includes(current)) {
      options.unshift(current);
    }

    return [{
      index,
      className: entry.name,
      level: entry.level,
      label: rule.label,
      description: rule.description,
      options,
      current
    }];
  });
}

function renderLevelChoicePanel(classConfig) {
  const container = document.getElementById('levelChoiceList');
  if (!container) {
    return;
  }

  const choices = buildLevelChoiceDefinitions(classConfig);
  if (!choices.length) {
    container.innerHTML = '<p class="features-empty">No class-specific choices unlocked at the current levels.</p>';
    return;
  }

  container.innerHTML = choices.map((choice) => {
    const selectOptions = [
      `<option value="">Choose ${choice.className} ${choice.label}</option>`,
      ...choice.options.map((option) => `<option value="${option}" ${option === choice.current ? 'selected' : ''}>${option}</option>`)
    ].join('');

    const customHint = choice.current && !CLASS_CHOICE_RULES[String(choice.className).toLowerCase()]?.options.includes(choice.current)
      ? '<span class="fp-used-label">Current selection is a custom/expanded archetype.</span>'
      : '<span class="fp-used-label">Expanded PDF archetypes can still be entered manually in the class row if needed.</span>';

    return `
      <div class="level-choice-card">
        <div class="level-choice-card-header">
          <span class="level-choice-title">${choice.className} Level ${choice.level}</span>
          <span class="level-choice-badge">${choice.label} Unlock</span>
        </div>
        <p class="level-choice-description">${choice.description}</p>
        <select class="level-choice-select" onchange="updateClassLevelRow(${choice.index}, 'archetype', this.value)">
          ${selectOptions}
        </select>
        ${customHint}
      </div>
    `;
  }).join('');
}

function renderCharacterInfoArchetypeTabs(classConfig) {
  const container = document.getElementById('basicInfoArchetypeTabs');
  if (!container) {
    return;
  }

  const concreteClasses = normalizeClassConfig(classConfig)
    .map((entry, index) => ({ ...entry, index }))
    .filter((entry) => entry.name !== PLACEHOLDER_CLASS);

  if (!concreteClasses.length) {
    activeCharacterArchetypeTab = '';
    container.innerHTML = '<p class="features-empty">Add a class to choose an archetype.</p>';
    return;
  }

  const tabKeys = concreteClasses.map((entry) => `${entry.name}-${entry.index}`);
  if (!tabKeys.includes(activeCharacterArchetypeTab)) {
    activeCharacterArchetypeTab = tabKeys[0];
  }

  container.innerHTML = '';

  if (concreteClasses.length > 1) {
    const tabs = document.createElement('div');
    tabs.className = 'character-archetype-tabs';

    concreteClasses.forEach((entry) => {
      const key = `${entry.name}-${entry.index}`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `character-archetype-tab${key === activeCharacterArchetypeTab ? ' active' : ''}`;
      btn.textContent = entry.name;
      btn.onclick = () => {
        activeCharacterArchetypeTab = key;
        renderCharacterInfoArchetypeTabs(classConfig);
      };
      tabs.appendChild(btn);
    });

    container.appendChild(tabs);
  }

  const selectedEntry = concreteClasses.find((entry) => `${entry.name}-${entry.index}` === activeCharacterArchetypeTab) || concreteClasses[0];
  const classRule = CLASS_CHOICE_RULES[String(selectedEntry.name || '').toLowerCase()];
  const panel = document.createElement('div');
  panel.className = 'character-archetype-panel';

  const title = document.createElement('div');
  title.className = 'character-archetype-title';
  title.textContent = `${selectedEntry.name} Level ${selectedEntry.level}`;
  panel.appendChild(title);

  const label = document.createElement('label');
  label.className = 'fp-label';
  label.textContent = 'Archetype / Tradition';
  panel.appendChild(label);

  if (!classRule) {
    const select = document.createElement('select');
    select.className = 'character-archetype-input';
    select.innerHTML = buildSelectOptionsHtml(
      archetypeReferenceEntries.map((archetype) => archetype?.name),
      selectedEntry.archetype,
      'Choose Archetype / Tradition'
    );
    select.value = selectedEntry.archetype;
    select.onchange = () => updateClassLevelRow(selectedEntry.index, 'archetype', select.value);
    panel.appendChild(select);

    const hint = document.createElement('p');
    hint.className = 'character-archetype-help';
    hint.textContent = 'Choose from reference archetypes for this class.';
    panel.appendChild(hint);
  } else {
    const select = document.createElement('select');
    select.className = 'character-archetype-select';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = `Choose ${classRule.label}`;
    select.appendChild(defaultOption);

    classRule.options.forEach((optionName) => {
      const option = document.createElement('option');
      option.value = optionName;
      option.textContent = optionName;
      select.appendChild(option);
    });

    const currentValue = String(selectedEntry.archetype || '');
    if (currentValue && !classRule.options.includes(currentValue)) {
      const customOption = document.createElement('option');
      customOption.value = currentValue;
      customOption.textContent = `${currentValue} (custom)`;
      select.appendChild(customOption);
    }

    select.value = currentValue;
    select.onchange = () => updateClassLevelRow(selectedEntry.index, 'archetype', select.value);
    panel.appendChild(select);

    const hint = document.createElement('p');
    hint.className = 'character-archetype-help';
    hint.textContent = selectedEntry.level < classRule.unlockLevel
      ? `${classRule.label} usually unlocks at level ${classRule.unlockLevel}.`
      : `Choose the ${classRule.label.toLowerCase()} for this class.`;
    panel.appendChild(hint);
  }

  container.appendChild(panel);
  refreshArchetypeInputHints();
}

function setClassLevelConfig(classConfig) {
  const normalized = normalizeClassConfig(classConfig);
  renderClassLevelRows(normalized);
  renderLevelChoicePanel(normalized);
  renderCharacterInfoArchetypeTabs(normalized);
}

function addClassLevelRow() {
  const current = getClassLevelConfig();
  const selectableClasses = CLASS_OPTIONS.filter((option) => option !== PLACEHOLDER_CLASS);
  const nextClass = selectableClasses.find((option) => !current.some((entry) => entry.name === option)) || 'Consular';
  current.push({ name: nextClass, level: 1, archetype: '' });
  setClassLevelConfig(current);
  applyLevelProgression();
}

function updateClassLevelRow(index, field, value) {
  const current = getClassLevelConfig();
  if (!current[index]) {
    return;
  }

  if (field === 'level') {
    current[index][field] = Math.max(1, parseInt(value, 10) || 1);
  } else {
    current[index][field] = value;
  }

  setClassLevelConfig(current);
  applyLevelProgression();
}

function changeClassLevelBy(index, delta) {
  const current = getClassLevelConfig();
  if (!current[index]) {
    return;
  }

  current[index].level = Math.max(1, (parseInt(current[index].level, 10) || 1) + delta);
  setClassLevelConfig(current);
  applyLevelProgression();
}

function removeClassLevelRow(index) {
  const current = getClassLevelConfig();
  if (current.length <= 1) {
    return;
  }
  current.splice(index, 1);
  setClassLevelConfig(current);
  applyLevelProgression();
}

function getTechPowersKnownForClass(className, level) {
  const normalized = String(className || '').toLowerCase();
  const classKey = Object.keys(TECH_POWERS_KNOWN_TABLES).find((key) => normalized.includes(key));
  if (!classKey) {
    return 0;
  }
  return TECH_POWERS_KNOWN_TABLES[classKey][clampLevel(level)] || 0;
}

function getTechMaxPowerLevelForClass(className, level) {
  const normalized = String(className || '').toLowerCase();
  const classKey = Object.keys(TECH_MAX_POWER_LEVEL_TABLES).find((key) => normalized.includes(key));
  if (!classKey) {
    return 0;
  }
  return TECH_MAX_POWER_LEVEL_TABLES[classKey][clampLevel(level)] || 0;
}

function getTechCastingBasePointsForClass(className, level) {
  const normalized = String(className || '').toLowerCase();
  const clamped = clampLevel(level);
  if (normalized.includes('engineer')) {
    return clamped * 2;
  }
  if (normalized.includes('scout')) {
    return clamped >= 2 ? clamped : 0;
  }
  return 0;
}

function getForceCastingRowForClass(className, level) {
  const normalized = String(className || '').toLowerCase();
  const clamped = clampLevel(level);

  if (normalized.includes('consular')) {
    const row = CONSULAR_TABLE[clamped];
    return row
      ? {
        forcePowersKnown: row.forcePowersKnown,
        forcePointsBase: row.forcePoints,
        maxPowerLevel: row.maxPowerLevel
      }
      : null;
  }

  if (normalized.includes('guardian')) {
    const row = GUARDIAN_FORCE_TABLE[clamped];
    return row
      ? {
        forcePowersKnown: row.forcePowersKnown,
        forcePointsBase: clamped * 2,
        maxPowerLevel: row.maxPowerLevel
      }
      : null;
  }

  if (normalized.includes('sentinel')) {
    const row = SENTINEL_FORCE_TABLE[clamped];
    return row
      ? {
        forcePowersKnown: row.forcePowersKnown,
        forcePointsBase: clamped * 3,
        maxPowerLevel: row.maxPowerLevel
      }
      : null;
  }

  return null;
}

function buildProgression(character) {
  const classConfig = normalizeClassConfig(character.classes || [{ name: character.class, level: character.level, archetype: character.archetype }]);
  const totalLevel = getTotalCharacterLevel(classConfig);
  const level = clampLevel(totalLevel || character.level);
  const consularLevel = classConfig
    .filter((entry) => String(entry.name || '').toLowerCase().includes('consular'))
    .reduce((total, entry) => total + (parseInt(entry.level, 10) || 0), 0);
  const row = CONSULAR_TABLE[clampLevel(consularLevel || 1)] || { pb: getProficiencyBonusForLevel(level), forcePowersKnown: 0, forcePoints: 0, maxPowerLevel: 0, fecOptions: 0, features: [] };
  const castingAbility = character.forceConfig?.castingAbility || 'wis';
  const affinity = character.forceConfig?.forceAffinity || 'none';
  const wisMod = getAbilityModifier(character.attributes?.wis);
  const intMod = getAbilityModifier(character.attributes?.int);
  const chaMod = getAbilityModifier(character.attributes?.cha);
  const activeCastingMod = castingAbility === 'cha' ? chaMod : wisMod;
  const primaryConsularArchetype = classConfig.find((entry) => String(entry.name || '').toLowerCase().includes('consular'))?.archetype || character.archetype;

  let forcePowersKnown = 0;
  let forcePointsBase = 0;
  let maxPowerLevel = 0;
  classConfig.forEach((entry) => {
    const forceRow = getForceCastingRowForClass(entry.name, entry.level);
    if (!forceRow) {
      return;
    }
    forcePowersKnown += forceRow.forcePowersKnown;
    forcePointsBase += forceRow.forcePointsBase;
    maxPowerLevel = Math.max(maxPowerLevel, forceRow.maxPowerLevel);
  });

  const techPowersKnown = classConfig.reduce((sum, entry) => sum + getTechPowersKnownForClass(entry.name, entry.level), 0);
  const techPointsBase = classConfig.reduce((sum, entry) => sum + getTechCastingBasePointsForClass(entry.name, entry.level), 0);
  const techMaxPowerLevel = classConfig.reduce((max, entry) => Math.max(max, getTechMaxPowerLevelForClass(entry.name, entry.level)), 0);

  let forcePointsMax = forcePointsBase;
  if (forcePointsBase > 0 && consularLevel >= 3 && affinity === 'bendu') {
    forcePointsMax += wisMod + chaMod;
  } else if (forcePointsBase > 0) {
    forcePointsMax += activeCastingMod;
  }

  const techPointsMax = techPointsBase > 0
    ? Math.max(0, techPointsBase + intMod)
    : 0;

  const forceShieldUses = consularLevel < 2 ? 0 : 2 + (consularLevel >= 5 ? 1 : 0) + (consularLevel >= 9 ? 1 : 0) + (consularLevel >= 13 ? 1 : 0) + (consularLevel >= 17 ? 1 : 0);
  const forceRecoveryAmount = consularLevel < 1 ? 0 : Math.max(1, Math.floor(consularLevel / 2) + activeCastingMod);
  const classFeatures = classConfig.flatMap((entry) => {
    const className = String(entry.name || '');
    if (!className || className === PLACEHOLDER_CLASS) {
      return [];
    }

    const catalogFeatures = getCatalogClassFeaturesByLevel(className, entry.level);
    if (catalogFeatures.length) {
      return catalogFeatures;
    }

    if (className.toLowerCase().includes('consular')) {
      return getClassFeaturesByLevel(Math.max(1, Number(entry.level) || 1)).map((feature) => {
        const withoutLevelPrefix = String(feature).replace(/^Level\s+\d+:\s*/, '');
        const featureLevelMatch = String(feature).match(/^Level\s+(\d+):/);
        return createFeatureEntry(
          withoutLevelPrefix,
          featureLevelMatch ? Number(featureLevelMatch[1]) : null,
          FEATURE_DETAILS[withoutLevelPrefix] || '',
          'Consular'
        );
      });
    }
    return getGenericClassFeaturesByLevel(className, entry.level, entry.archetype).map((feature) => {
      const withoutLevelPrefix = String(feature).replace(/^Level\s+\d+:\s*/, '');
      const featureLevelMatch = String(feature).match(/^Level\s+(\d+):/);
      return createFeatureEntry(withoutLevelPrefix, featureLevelMatch ? Number(featureLevelMatch[1]) : null, '', className);
    });
  });
  const telekinetics = isTelekineticsArchetype(primaryConsularArchetype)
    ? getTelekineticsFeatures(consularLevel)
    : { features: [], telekineticStats: { mightyBlastTargets: 0, repulsingWaveUses: 0 } };

  const allFeatures = classFeatures.concat(telekinetics.features.map((feature) => createFeatureEntry(feature, null, FEATURE_DETAILS[feature] || '', 'Consular')));
  const warnings = [];
  const selectedFec = character.forceConfig?.fecChosen || [];
  const asiSpent = character.abilityScoreConfig?.asiHistory?.length || 0;
  const asiAllowed = classConfig.reduce((sum, entry) => sum + getAsiSlotsForClass(entry.name, entry.level), 0);
  const unsupportedClasses = Array.from(new Set(classConfig
    .map((entry) => String(entry.name || ''))
    .filter((name) => name && name !== PLACEHOLDER_CLASS && !getClassProgressionData(name) && !SUPPORTED_PROGRESSION_CLASSES.includes(name.toLowerCase()))));

  if (consularLevel >= 2 && selectedFec.length > row.fecOptions) {
    warnings.push(`You selected ${selectedFec.length} Force-Empowered options, but only ${row.fecOptions} are allowed at Consular level ${consularLevel}.`);
  }

  if (consularLevel >= 3 && affinity === 'none') {
    warnings.push('At level 3+, choose Force Affinity (Ashla, Bendu, or Bogan).');
  }

  if (consularLevel >= 6 && !isTelekineticsArchetype(primaryConsularArchetype) && classConfig.some((entry) => String(entry.name || '').toLowerCase().includes('consular'))) {
    warnings.push('Tradition features at levels 6/10/14/18 require a valid Consular tradition/archetype.');
  }

  if (unsupportedClasses.length) {
    warnings.push(`Class feature data is not yet loaded for: ${unsupportedClasses.join(', ')}.`);
  }

  if (totalLevel > 20) {
    warnings.push('Total multiclass level exceeds 20. Progression outputs are capped at level 20.');
  }

  if (asiSpent > asiAllowed) {
    warnings.push(`ASI overspent: ${asiSpent} spent but only ${asiAllowed} available at level ${level}.`);
  }

  return {
    level,
    pb: getProficiencyBonusForLevel(level),
    forcePowersKnown,
    techPowersKnown,
    forcePointsMax,
    maxPowerLevel,
    techMaxPowerLevel,
    techPointsMax,
    fecOptionsAllowed: consularLevel > 0 ? row.fecOptions : 0,
    forceRecoveryAmount,
    forceShieldUses,
    repulsingWaveUses: telekinetics.telekineticStats.repulsingWaveUses,
    mightyBlastTargets: telekinetics.telekineticStats.mightyBlastTargets,
    asiAllowed,
    asiSpent,
    features: allFeatures,
    warnings
  };
}

function updateForceCounter() {
  const maxEl = document.getElementById('forcePointsMax');
  const usedEl = document.getElementById('forcePointsUsed');
  const remainingEl = document.getElementById('fpRemaining');
  const maxLabelEl = document.getElementById('fpMax');
  const usedLabelEl = document.getElementById('fpUsedLabel');
  if (!remainingEl || !maxEl) { return; }

  // Parse max from the readonly field which reads e.g. "Force Points Max: 23"
  const rawMax = maxEl.value || '';
  const max = parseInt(rawMax.replace(/[^\d]/g, '')) || 0;
  const used = parseInt(usedEl?.value) || 0;
  const remaining = Math.max(0, max - used);

  if (maxLabelEl) { maxLabelEl.textContent = max; }
  if (remainingEl) { remainingEl.textContent = remaining; }
  if (usedLabelEl) { usedLabelEl.textContent = used; }

  // Colour remaining red when low
  remainingEl.style.color = remaining === 0 ? '#c0392b' : remaining <= Math.ceil(max * 0.25) ? '#e67e22' : '#1a6e1a';
  refreshPowerCastButtons();
  updateForceRecoveryButtonState(getCurrentForceRecoveryAmount());
}

function refreshPowerCastButtons() {
  const forceRemaining = Math.max(0, parseInt(document.getElementById('fpRemaining')?.textContent, 10) || 0);
  const techRemaining = Math.max(0, parseInt(document.getElementById('tpRemaining')?.textContent, 10) || 0);
  const castButtons = document.querySelectorAll('.power-cast[data-power-type]');

  castButtons.forEach((button) => {
    const cost = parseInt(button.dataset.cost, 10) || 0;
    const powerType = button.dataset.powerType === 'tech' ? 'tech' : 'force';
    const remaining = powerType === 'tech' ? techRemaining : forceRemaining;
    const disabled = cost > remaining;

    button.disabled = disabled;
    button.title = disabled
      ? `Requires ${cost} ${powerType === 'tech' ? 'Tech' : 'Force'} Points`
      : `Cast for ${cost} ${powerType === 'tech' ? 'Tech' : 'Force'} Points`;
  });
}

function adjustForcePoints(delta) {
  const usedEl = document.getElementById('forcePointsUsed');
  const maxEl = document.getElementById('forcePointsMax');
  const rawMax = maxEl?.value || '';
  const max = parseInt(rawMax.replace(/[^\d]/g, '')) || 0;
  let used = parseInt(usedEl?.value) || 0;
  used = Math.min(max, Math.max(0, used - delta));
  usedEl.value = used;
  updateForceCounter();
}

function updateTechCounter() {
  const maxEl = document.getElementById('techPointsMax');
  const usedEl = document.getElementById('techPointsUsed');
  const remainingEl = document.getElementById('tpRemaining');
  const maxLabelEl = document.getElementById('tpMax');
  const usedLabelEl = document.getElementById('tpUsedLabel');
  if (!remainingEl || !maxEl) { return; }

  const max = parseInt(maxEl.value) || 0;
  const used = parseInt(usedEl?.value) || 0;
  const remaining = Math.max(0, max - used);

  if (maxLabelEl) { maxLabelEl.textContent = max; }
  if (remainingEl) { remainingEl.textContent = remaining; }
  if (usedLabelEl) { usedLabelEl.textContent = used; }

  remainingEl.style.color = remaining === 0 ? '#c0392b' : remaining <= Math.ceil(max * 0.25) ? '#e67e22' : '#1a6e1a';
  refreshPowerCastButtons();
}

function adjustTechPoints(delta) {
  const usedEl = document.getElementById('techPointsUsed');
  const maxEl = document.getElementById('techPointsMax');
  const max = parseInt(maxEl?.value) || 0;
  let used = parseInt(usedEl?.value) || 0;
  used = Math.min(max, Math.max(0, used - delta));
  usedEl.value = used;
  updateTechCounter();
}

function updateHitPointCounter() {
  const maxInputEl = document.getElementById('maxHitPoints');
  const lostInputEl = document.getElementById('hitPoints');
  const currentEl = document.getElementById('hpCurrent');
  const maxEl = document.getElementById('hpMax');
  const lostLabelEl = document.getElementById('hpLostLabel');

  if (!maxInputEl || !lostInputEl || !currentEl || !maxEl || !lostLabelEl) {
    return;
  }

  const max = Math.max(0, parseInt(maxInputEl.value) || 0);
  let lost = Math.max(0, parseInt(lostInputEl.value) || 0);
  lost = Math.min(max, lost);
  const current = Math.max(0, max - lost);

  maxInputEl.value = max;
  lostInputEl.value = lost;
  currentEl.textContent = current;
  maxEl.textContent = max;
  lostLabelEl.textContent = lost;

  currentEl.style.color = current === 0 && max > 0
    ? '#c0392b'
    : current <= Math.ceil(max * 0.25)
      ? '#e67e22'
      : '#1a6e1a';
}

function adjustHitPoints(delta) {
  const maxInputEl = document.getElementById('maxHitPoints');
  const lostInputEl = document.getElementById('hitPoints');
  if (!maxInputEl || !lostInputEl) {
    return;
  }

  const max = Math.max(0, parseInt(maxInputEl.value) || 0);
  let lost = Math.max(0, parseInt(lostInputEl.value) || 0);
  const current = Math.max(0, max - lost);
  const nextCurrent = Math.min(max, Math.max(0, current + delta));
  lost = max - nextCurrent;
  lostInputEl.value = lost;
  updateHitPointCounter();
}

function updateFecChosen() {
  const checkboxes = document.querySelectorAll('.fec-checkbox:checked');
  const chosen = Array.from(checkboxes).map(cb => cb.value);
  const hiddenInput = document.getElementById('fecChosen');
  if (hiddenInput) {
    hiddenInput.value = chosen.join(', ');
  }
  renderFecDisplay(chosen);
  applyLevelProgression();
}

function renderFecDisplay(chosenList) {
  const panel = document.getElementById('fecDisplay');
  if (!panel) return;

  if (!chosenList || chosenList.length === 0) {
    panel.innerHTML = '<p class="fec-empty-msg">No Force-Empowered options chosen. Select options in the Leveling tab.</p>';
    return;
  }

  panel.innerHTML = chosenList.map(name => {
    const opt = FEC_OPTIONS[name];
    if (!opt) return '';
    return `<div class="fec-card">
      <div class="fec-card-header">
        <span class="fec-card-name">${name}</span>
        <span class="fec-card-cost">${opt.cost}</span>
      </div>
      <p class="fec-card-desc">${opt.description}</p>
    </div>`;
  }).join('');
}

function renderForceAffinityInfo(affinity) {
  const titleEl = document.getElementById('affinityInfoTitle');
  const descEl = document.getElementById('affinityInfoDesc');
  const panelEl = document.getElementById('affinityInfo');

  if (!titleEl || !descEl || !panelEl) {
    return;
  }

  const selectedAffinity = String(affinity || 'none').toLowerCase();
  const details = FORCE_AFFINITY_DETAILS[selectedAffinity] || FORCE_AFFINITY_DETAILS.none;

  titleEl.textContent = details.title;
  descEl.textContent = details.description;

  panelEl.classList.remove('affinity-ashla', 'affinity-bendu', 'affinity-bogan', 'affinity-none');
  panelEl.classList.add(`affinity-${selectedAffinity in FORCE_AFFINITY_DETAILS ? selectedAffinity : 'none'}`);
}

function getConsularLevelFromCharacter(character) {
  const classConfig = normalizeClassConfig(character?.classes || []);
  return classConfig
    .filter((entry) => String(entry.name || '').toLowerCase().includes('consular'))
    .reduce((total, entry) => total + (parseInt(entry.level, 10) || 0), 0);
}

function updateForceAffinityState(character) {
  const affinitySelect = document.getElementById('forceAffinity');
  const titleEl = document.getElementById('affinityInfoTitle');
  const descEl = document.getElementById('affinityInfoDesc');
  const panelEl = document.getElementById('affinityInfo');
  const consularConfigSection = document.getElementById('consularConfigSection');
  const consularFecOptionsSection = document.getElementById('consularFecOptionsSection');
  const consularFecDisplaySection = document.getElementById('consularFecDisplaySection');
  const consularAffinityDisplaySection = document.getElementById('consularAffinityDisplaySection');
  if (!affinitySelect || !titleEl || !descEl || !panelEl) {
    return;
  }

  const hasConsularLevels = getConsularLevelFromCharacter(character) > 0;
  if (consularConfigSection) {
    consularConfigSection.hidden = !hasConsularLevels;
  }
  if (consularFecOptionsSection) {
    consularFecOptionsSection.hidden = !hasConsularLevels;
  }
  if (consularFecDisplaySection) {
    consularFecDisplaySection.hidden = !hasConsularLevels;
  }
  if (consularAffinityDisplaySection) {
    consularAffinityDisplaySection.hidden = !hasConsularLevels;
  }

  affinitySelect.disabled = !hasConsularLevels;
  affinitySelect.title = hasConsularLevels
    ? 'Force Affinity applies to Consular progression.'
    : 'Force Affinity becomes available when a Consular class is added.';

  if (!hasConsularLevels) {
    const hiddenFec = document.getElementById('fecChosen');
    if (hiddenFec) {
      hiddenFec.value = '';
    }
    document.querySelectorAll('.fec-checkbox').forEach((checkbox) => {
      checkbox.checked = false;
      checkbox.disabled = true;
    });
    renderFecDisplay([]);

    if (affinitySelect.value !== 'none') {
      affinitySelect.value = 'none';
    }
    panelEl.classList.remove('affinity-ashla', 'affinity-bendu', 'affinity-bogan');
    panelEl.classList.add('affinity-none');
    titleEl.textContent = 'Force Affinity Unavailable';
    descEl.textContent = 'Force Affinity is specific to Consular progression and is disabled until you add at least one Consular level.';
  } else {
    enforceFecCheckboxLimit(getNumericReadonlyFieldValue('fecOptionsAllowed'));
    renderForceAffinityInfo(affinitySelect.value || 'none');
  }
}

function enforceFecCheckboxLimit(limit) {
  const checkboxes = document.querySelectorAll('.fec-checkbox');
  const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
  checkboxes.forEach(cb => {
    if (!cb.checked && checkedCount >= limit) {
      cb.disabled = true;
    } else {
      cb.disabled = false;
    }
  });
}

function getFeatureDescription(feature) {
  if (feature && typeof feature === 'object' && feature.description) {
    return feature.description;
  }

  const featureName = typeof feature === 'object' ? feature.name : feature;
  const withoutLevelPrefix = String(featureName || '').replace(/^Level\s+\d+:\s*/, '');
  const directKey = normalizeFeatureLookupKey(withoutLevelPrefix);
  const catalogDescription = Object.values(classProgressionCatalog).find((classData) => classData?.featureDescriptions?.[directKey])?.featureDescriptions?.[directKey];
  return catalogDescription || FEATURE_DETAILS[withoutLevelPrefix] || FEATURE_DETAILS[featureName] || 'Feature description not yet added to the sheet.';
}

function getCurrentForceShieldMaxUses() {
  const raw = document.getElementById('forceShieldUses')?.value || '';
  return Math.max(0, parseInt(String(raw).replace(/[^\d]/g, ''), 10) || 0);
}

function getNumericReadonlyFieldValue(fieldId) {
  const raw = document.getElementById(fieldId)?.value || '';
  return Math.max(0, parseInt(String(raw).replace(/[^\d]/g, ''), 10) || 0);
}

function getCurrentMaxForcePowerLevel() {
  return getNumericReadonlyFieldValue('maxPowerLevel');
}

function getCurrentMaxTechPowerLevel() {
  return getNumericReadonlyFieldValue('techMaxPowerLevel');
}

function getCurrentForcePowersKnown() {
  return getNumericReadonlyFieldValue('forcePowersKnown');
}

function getCurrentTechPowersKnown() {
  return getNumericReadonlyFieldValue('techPowersKnown');
}

function updatePowerCatalogTabAvailability(progression = null) {
  const forceBtn = document.getElementById('powerCatalogTabForce');
  const techBtn = document.getElementById('powerCatalogTabTech');
  if (!forceBtn || !techBtn) {
    return;
  }

  const forceKnown = progression?.forcePowersKnown ?? getCurrentForcePowersKnown();
  const techKnown = progression?.techPowersKnown ?? getCurrentTechPowersKnown();
  const forceEnabled = forceKnown > 0;
  const techEnabled = techKnown > 0;

  forceBtn.disabled = !forceEnabled;
  techBtn.disabled = !techEnabled;
  forceBtn.title = forceEnabled ? 'Browse Force powers' : 'Requires Forcecasting class levels';
  techBtn.title = techEnabled ? 'Browse Tech powers' : 'Requires Techcasting class levels';

  if (activePowerCatalogTab === 'force' && !forceEnabled && techEnabled) {
    activePowerCatalogTab = 'tech';
  }
  if (activePowerCatalogTab === 'tech' && !techEnabled && forceEnabled) {
    activePowerCatalogTab = 'force';
  }
  if (!forceEnabled && !techEnabled) {
    activePowerCatalogTab = 'force';
  }

  switchPowerCatalogTab(activePowerCatalogTab);
}

function switchPowerCatalogTab(tabName) {
  const nextTab = tabName === 'tech' ? 'tech' : 'force';
  activePowerCatalogTab = nextTab;

  const forceBtn = document.getElementById('powerCatalogTabForce');
  const techBtn = document.getElementById('powerCatalogTabTech');
  const forcePanel = document.getElementById('forcePowerCatalogPanel');
  const techPanel = document.getElementById('techPowerCatalogPanel');

  if (forceBtn) {
    forceBtn.classList.toggle('active', nextTab === 'force');
  }
  if (techBtn) {
    techBtn.classList.toggle('active', nextTab === 'tech');
  }
  if (forcePanel) {
    forcePanel.classList.toggle('active', nextTab === 'force');
  }
  if (techPanel) {
    techPanel.classList.toggle('active', nextTab === 'tech');
  }
}

function getCurrentForceRecoveryAmount() {
  const raw = document.getElementById('forceRecoveryAmount')?.value || '';
  return Math.max(0, parseInt(String(raw).replace(/[^\d]/g, ''), 10) || 0);
}

function updateForceRecoveryButtonState(recoveryAmount) {
  const recoveryBtn = document.getElementById('forceRecoveryUseBtn');
  const usedEl = document.getElementById('forcePointsUsed');

  if (!recoveryBtn || !usedEl) {
    return;
  }

  const amount = Math.max(0, Number(recoveryAmount) || 0);
  const used = Math.max(0, parseInt(usedEl.value, 10) || 0);
  const canUse = amount > 0 && used > 0;

  recoveryBtn.disabled = !canUse;
  recoveryBtn.title = canUse
    ? `Recover up to ${Math.min(used, amount)} Force Points`
    : 'No spent Force Points to recover';
}

function applyForceRecovery(recoveryAmount) {
  const usedEl = document.getElementById('forcePointsUsed');
  if (!usedEl) {
    return;
  }

  const amount = Math.max(0, Number(recoveryAmount) || getCurrentForceRecoveryAmount());
  const used = Math.max(0, parseInt(usedEl.value, 10) || 0);
  if (amount <= 0 || used <= 0) {
    updateForceRecoveryButtonState(amount);
    return;
  }

  const recovered = Math.min(used, amount);
  usedEl.value = used - recovered;
  updateForceCounter();
}

function updateForceShieldUsageDisplay(maxUses) {
  const usedEl = document.getElementById('forceShieldUsed');
  const labelEl = document.getElementById('forceShieldUsageLabel');
  const fillEl = document.getElementById('forceShieldUsageFill');
  const useBtn = document.getElementById('forceShieldUseBtn');
  const restoreBtn = document.getElementById('forceShieldRestoreBtn');

  if (!usedEl) {
    return;
  }

  const max = Math.max(0, Number(maxUses) || 0);
  let used = Math.max(0, parseInt(usedEl.value, 10) || 0);
  if (used > max) {
    used = max;
  }
  usedEl.value = used;
  const remaining = Math.max(0, max - used);
  const usedPercent = max > 0 ? Math.round((used / max) * 100) : 0;

  if (labelEl) {
    labelEl.textContent = `${remaining} left (${used}/${max} used)`;
    labelEl.classList.remove('low', 'empty');
    if (remaining <= 0) {
      labelEl.classList.add('empty');
    } else if (max > 0 && remaining <= Math.ceil(max * 0.25)) {
      labelEl.classList.add('low');
    }
  }
  if (fillEl) {
    fillEl.style.width = `${usedPercent}%`;
  }
  if (useBtn) {
    useBtn.disabled = used >= max;
  }
  if (restoreBtn) {
    restoreBtn.disabled = used <= 0;
  }
}

function adjustForceShieldUses(delta, maxUses) {
  const usedEl = document.getElementById('forceShieldUsed');
  if (!usedEl) {
    return;
  }

  const max = Math.max(0, Number(maxUses) || getCurrentForceShieldMaxUses());
  const currentUsed = Math.max(0, parseInt(usedEl.value, 10) || 0);
  const nextUsed = Math.max(0, Math.min(max, currentUsed + delta));
  usedEl.value = nextUsed;
  updateForceShieldUsageDisplay(max);
}

function renderFeatureList(features, progression = null) {
  const listElement = document.getElementById('unlockedFeaturesCenter');
  if (!listElement) {
    return;
  }

  listElement.innerHTML = '';

  if (!features || features.length === 0) {
    activeFeatureClassTab = '';
    listElement.innerHTML = '<p class="features-empty">No features unlocked yet.</p>';
    return;
  }

  const normalizedFeatures = features.map((feature) => {
    if (feature && typeof feature === 'object') {
      return {
        ...feature,
        className: String(feature.className || 'General')
      };
    }

    const plainName = String(feature || '');
    return createFeatureEntry(
      plainName.replace(/^Level\s+\d+:\s*/, ''),
      null,
      '',
      'General'
    );
  });

  const featuresByClass = normalizedFeatures.reduce((acc, feature) => {
    const className = String(feature.className || 'General').trim() || 'General';
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(feature);
    return acc;
  }, {});

  const classTabs = Object.keys(featuresByClass);
  if (!classTabs.includes(activeFeatureClassTab)) {
    activeFeatureClassTab = classTabs[0] || '';
  }

  if (classTabs.length > 1) {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'feature-class-tabs';

    classTabs.forEach((className) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = `feature-class-tab${className === activeFeatureClassTab ? ' active' : ''}`;
      tab.textContent = className;
      tab.setAttribute('aria-pressed', className === activeFeatureClassTab ? 'true' : 'false');
      tab.onclick = () => {
        activeFeatureClassTab = className;
        renderFeatureList(features, progression);
      };
      tabsContainer.appendChild(tab);
    });

    listElement.appendChild(tabsContainer);
  }

  const visibleFeatures = featuresByClass[activeFeatureClassTab] || normalizedFeatures;

  const forceShieldMaxUses = progression?.forceShieldUses ?? getCurrentForceShieldMaxUses();
  const forceRecoveryAmount = progression?.forceRecoveryAmount ?? getCurrentForceRecoveryAmount();
  let hasForceShield = false;
  let hasForceRecovery = false;

  visibleFeatures.forEach((feature) => {
    const featureName = typeof feature === 'object' ? feature.name : feature;
    const featureDisplayName = typeof feature === 'object' ? feature.displayName : feature;
    const item = document.createElement('div');
    item.className = 'feature-item';

    const header = document.createElement('div');
    header.className = 'feature-header';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'feature-expand';
    toggleBtn.setAttribute('aria-label', 'Toggle feature description');
    toggleBtn.innerHTML = '▼';

    const name = document.createElement('span');
    name.className = 'feature-name';
    name.textContent = featureDisplayName;

    const desc = document.createElement('div');
    desc.className = 'feature-description hidden';
    desc.textContent = getFeatureDescription(feature);

    const baseFeature = String(featureName || '').replace(/^Level\s+\d+:\s*/, '');
    if (baseFeature === 'Force Recovery') {
      hasForceRecovery = true;
      const recoveryInfoRow = document.createElement('div');
      recoveryInfoRow.className = 'feature-usage-row';

      const recoveryBtn = document.createElement('button');
      recoveryBtn.type = 'button';
      recoveryBtn.id = 'forceRecoveryUseBtn';
      recoveryBtn.className = 'feature-usage-btn';
      recoveryBtn.textContent = 'Recover';
      recoveryBtn.onclick = () => applyForceRecovery(forceRecoveryAmount);

      const recoveryValue = document.createElement('span');
      recoveryValue.className = 'feature-usage-label';
      recoveryValue.textContent = `${forceRecoveryAmount} Force Points`;

      recoveryInfoRow.appendChild(recoveryBtn);
      recoveryInfoRow.appendChild(recoveryValue);
      item.appendChild(recoveryInfoRow);
    }

    if (baseFeature === 'Force Shield') {
      hasForceShield = true;
      const usageRow = document.createElement('div');
      usageRow.className = 'feature-usage-row';

      const useBtn = document.createElement('button');
      useBtn.type = 'button';
      useBtn.id = 'forceShieldUseBtn';
      useBtn.className = 'feature-usage-btn';
      useBtn.textContent = 'Use';
      useBtn.onclick = () => adjustForceShieldUses(1, forceShieldMaxUses);

      const restoreBtn = document.createElement('button');
      restoreBtn.type = 'button';
      restoreBtn.id = 'forceShieldRestoreBtn';
      restoreBtn.className = 'feature-usage-btn';
      restoreBtn.textContent = 'Restore';
      restoreBtn.onclick = () => adjustForceShieldUses(-1, forceShieldMaxUses);

      const usageLabel = document.createElement('span');
      usageLabel.id = 'forceShieldUsageLabel';
      usageLabel.className = 'feature-usage-label';

      const usageMeter = document.createElement('div');
      usageMeter.className = 'feature-usage-meter';
      const usageFill = document.createElement('div');
      usageFill.id = 'forceShieldUsageFill';
      usageFill.className = 'feature-usage-fill';
      usageMeter.appendChild(usageFill);

      usageRow.appendChild(useBtn);
      usageRow.appendChild(restoreBtn);
      usageRow.appendChild(usageLabel);
      item.appendChild(usageRow);
      item.appendChild(usageMeter);
    }

    toggleBtn.onclick = () => {
      desc.classList.toggle('hidden');
      toggleBtn.classList.toggle('expanded');
    };

    header.appendChild(toggleBtn);
    header.appendChild(name);
    item.appendChild(header);
    item.appendChild(desc);
    listElement.appendChild(item);
  });

  if (hasForceShield) {
    updateForceShieldUsageDisplay(forceShieldMaxUses);
  }
  if (hasForceRecovery) {
    updateForceRecoveryButtonState(forceRecoveryAmount);
  }
}

function getClassFeaturesAtExactLevel(className, level, archetype = '') {
  const normalizedClassName = String(className || '').trim();
  const exactLevel = clampLevel(level);
  if (!normalizedClassName || normalizedClassName === PLACEHOLDER_CLASS) {
    return [];
  }

  const classData = getClassProgressionData(normalizedClassName);
  if (classData?.progression) {
    const row = classData.progression[String(exactLevel)];
    if (!row?.features?.length) {
      return [];
    }

    return row.features.map((featureName) => createFeatureEntry(
      featureName,
      exactLevel,
      classData.featureDescriptions?.[normalizeFeatureLookupKey(featureName)] || '',
      classData.name
    ));
  }

  if (normalizedClassName.toLowerCase().includes('consular')) {
    const consularRow = CONSULAR_TABLE[exactLevel];
    if (!consularRow?.features?.length) {
      return [];
    }

    return consularRow.features.map((featureName) => createFeatureEntry(
      featureName,
      exactLevel,
      FEATURE_DETAILS[featureName] || '',
      'Consular'
    ));
  }

  const genericFeatures = getGenericClassFeaturesByLevel(normalizedClassName, exactLevel, archetype)
    .map((feature) => {
      const match = String(feature).match(/^Level\s+(\d+):\s*(.+)$/);
      if (!match) {
        return null;
      }
      const featureLevel = Number(match[1]);
      const featureName = String(match[2] || '').trim();
      if (featureLevel !== exactLevel || !featureName) {
        return null;
      }
      return createFeatureEntry(featureName, featureLevel, FEATURE_DETAILS[featureName] || '', normalizedClassName);
    })
    .filter(Boolean);

  return genericFeatures;
}

function createLevelingFeatureItem(feature) {
  const item = document.createElement('div');
  item.className = 'leveling-feature-row';

  const name = document.createElement('span');
  name.className = 'leveling-feature-name';
  name.textContent = feature.displayName || feature.name;

  const descText = getFeatureDescription(feature);
  const infoBtn = document.createElement('button');
  infoBtn.type = 'button';
  infoBtn.className = 'leveling-feature-info-btn';
  infoBtn.setAttribute('aria-label', 'View feature description');
  infoBtn.innerHTML = '&#9432;';
  infoBtn.title = 'View description';
  infoBtn.onclick = () => {
    openReferenceInfoModal({
      title: feature.name,
      meta: feature.level != null ? `Level ${feature.level}${feature.className ? ' — ' + feature.className : ''}` : (feature.className || ''),
      sections: [descText]
    });
  };

  item.appendChild(name);
  item.appendChild(infoBtn);
  return item;
}

function renderLevelingUnlockedFeatures(classConfig) {
  const container = document.getElementById('levelUnlockedFeatureList');
  if (!container) {
    return;
  }

  const concreteClasses = normalizeClassConfig(classConfig).filter((entry) => String(entry.name || '') !== PLACEHOLDER_CLASS);
  container.innerHTML = '';

  if (!concreteClasses.length) {
    container.innerHTML = '<p class="features-empty">Add a class to view feature unlocks.</p>';
    return;
  }

  concreteClasses.forEach((entry) => {
    const classLevel = clampLevel(entry.level);
    const unlockedThroughCurrent = [];
    for (let unlockedLevel = 1; unlockedLevel <= classLevel; unlockedLevel += 1) {
      const features = getClassFeaturesAtExactLevel(entry.name, unlockedLevel, entry.archetype);
      if (features.length) {
        unlockedThroughCurrent.push({ level: unlockedLevel, features });
      }
    }

    const futureUnlocks = [];

    for (let futureLevel = classLevel + 1; futureLevel <= 20; futureLevel += 1) {
      const features = getClassFeaturesAtExactLevel(entry.name, futureLevel, entry.archetype);
      if (features.length) {
        futureUnlocks.push({ level: futureLevel, features });
      }
    }

    const classCard = document.createElement('div');
    classCard.className = 'level-unlocked-card';

    const cardHeader = document.createElement('div');
    cardHeader.className = 'level-unlocked-card-header';

    const title = document.createElement('span');
    title.className = 'level-unlocked-title';
    title.textContent = entry.name;

    const badge = document.createElement('span');
    badge.className = 'level-unlocked-badge';
    badge.textContent = `Current Level ${classLevel}`;

    cardHeader.appendChild(title);
    cardHeader.appendChild(badge);
    classCard.appendChild(cardHeader);

    const sections = document.createElement('div');
    sections.className = 'level-unlocked-sections';

    const currentCard = document.createElement('div');
    currentCard.className = 'level-unlocked-subcard';

    const currentHeading = document.createElement('p');
    currentHeading.className = 'level-unlocked-section-title';
    currentHeading.textContent = `Unlocked Through Level ${classLevel}`;
    currentCard.appendChild(currentHeading);

    const currentParityGrid = document.createElement('div');
    currentParityGrid.className = 'level-unlocked-parity-grid';

    const oddCard = document.createElement('div');
    oddCard.className = 'level-unlocked-parity-card';
    const oddTitle = document.createElement('p');
    oddTitle.className = 'level-unlocked-section-title';
    oddTitle.textContent = 'Odd Levels';
    oddCard.appendChild(oddTitle);
    const oddLevelsWrap = document.createElement('div');
    oddLevelsWrap.className = 'level-unlocked-level-grid';

    const evenCard = document.createElement('div');
    evenCard.className = 'level-unlocked-parity-card';
    const evenTitle = document.createElement('p');
    evenTitle.className = 'level-unlocked-section-title';
    evenTitle.textContent = 'Even Levels';
    evenCard.appendChild(evenTitle);
    const evenLevelsWrap = document.createElement('div');
    evenLevelsWrap.className = 'level-unlocked-level-grid';

    if (unlockedThroughCurrent.length) {
      unlockedThroughCurrent.forEach((levelGroup) => {
        const levelCard = document.createElement('div');
        levelCard.className = 'level-unlocked-level-card unlocked';

        const levelCardHeader = document.createElement('div');
        levelCardHeader.className = 'level-unlocked-level-card-header';

        const levelLabel = document.createElement('span');
        levelLabel.className = 'level-unlocked-locked-label';
        levelLabel.textContent = `Level ${levelGroup.level}`;

        const levelPill = document.createElement('span');
        levelPill.className = 'level-unlocked-level-pill';
        levelPill.textContent = 'Unlocked';

        levelCardHeader.appendChild(levelLabel);
        levelCardHeader.appendChild(levelPill);
        levelCard.appendChild(levelCardHeader);

        const levelList = document.createElement('div');
        levelList.className = 'features-dropdown-list';
        levelGroup.features.forEach((feature) => levelList.appendChild(createLevelingFeatureItem(feature)));
        levelCard.appendChild(levelList);

        if ((Number(levelGroup.level) || 0) % 2 === 0) {
          evenLevelsWrap.appendChild(levelCard);
        } else {
          oddLevelsWrap.appendChild(levelCard);
        }
      });
    }

    if (!oddLevelsWrap.children.length) {
      const oddEmpty = document.createElement('p');
      oddEmpty.className = 'features-empty';
      oddEmpty.textContent = 'No odd level unlocks yet.';
      oddLevelsWrap.appendChild(oddEmpty);
    }

    if (!evenLevelsWrap.children.length) {
      const evenEmpty = document.createElement('p');
      evenEmpty.className = 'features-empty';
      evenEmpty.textContent = 'No even level unlocks yet.';
      evenLevelsWrap.appendChild(evenEmpty);
    }

    oddCard.appendChild(oddLevelsWrap);
    evenCard.appendChild(evenLevelsWrap);
    currentParityGrid.appendChild(oddCard);
    currentParityGrid.appendChild(evenCard);
    currentCard.appendChild(currentParityGrid);
    sections.appendChild(currentCard);

    const lockedCard = document.createElement('div');
    lockedCard.className = 'level-unlocked-subcard';

    const lockedHeading = document.createElement('p');
    lockedHeading.className = 'level-unlocked-section-title';
    lockedHeading.textContent = `Locked Levels (${classLevel + 1}–20)`;
    lockedCard.appendChild(lockedHeading);

    const lockedParityGrid = document.createElement('div');
    lockedParityGrid.className = 'level-unlocked-parity-grid';

    const lockedOddCard = document.createElement('div');
    lockedOddCard.className = 'level-unlocked-parity-card';
    const lockedOddTitle = document.createElement('p');
    lockedOddTitle.className = 'level-unlocked-section-title';
    lockedOddTitle.textContent = 'Odd Levels';
    lockedOddCard.appendChild(lockedOddTitle);
    const lockedOddWrap = document.createElement('div');
    lockedOddWrap.className = 'level-unlocked-level-grid';

    const lockedEvenCard = document.createElement('div');
    lockedEvenCard.className = 'level-unlocked-parity-card';
    const lockedEvenTitle = document.createElement('p');
    lockedEvenTitle.className = 'level-unlocked-section-title';
    lockedEvenTitle.textContent = 'Even Levels';
    lockedEvenCard.appendChild(lockedEvenTitle);
    const lockedEvenWrap = document.createElement('div');
    lockedEvenWrap.className = 'level-unlocked-level-grid';

    if (futureUnlocks.length) {
      futureUnlocks.forEach((futureGroup) => {
        const levelCard = document.createElement('div');
        levelCard.className = 'level-unlocked-level-card locked';

        const levelRow = document.createElement('div');
        levelRow.className = 'level-unlocked-level-card-header';

        const levelLabel = document.createElement('span');
        levelLabel.className = 'level-unlocked-locked-label';
        levelLabel.textContent = `Level ${futureGroup.level}`;

        const showMoreBtn = document.createElement('button');
        showMoreBtn.type = 'button';
        showMoreBtn.className = 'level-unlocked-show-more';
        showMoreBtn.textContent = 'Show';

        const futureList = document.createElement('div');
        futureList.className = 'leveling-feature-list level-unlocked-future hidden';
        futureGroup.features.forEach((feature) => futureList.appendChild(createLevelingFeatureItem(feature)));

        showMoreBtn.onclick = () => {
          futureList.classList.toggle('hidden');
          const expanded = !futureList.classList.contains('hidden');
          showMoreBtn.textContent = expanded ? 'Hide' : 'Show';
        };

        levelRow.appendChild(levelLabel);
        levelRow.appendChild(showMoreBtn);
        levelCard.appendChild(levelRow);
        levelCard.appendChild(futureList);

        if ((Number(futureGroup.level) || 0) % 2 === 0) {
          lockedEvenWrap.appendChild(levelCard);
        } else {
          lockedOddWrap.appendChild(levelCard);
        }
      });
    }

    if (!lockedOddWrap.children.length) {
      const e = document.createElement('p');
      e.className = 'features-empty';
      e.textContent = 'No odd locked levels.';
      lockedOddWrap.appendChild(e);
    }

    if (!lockedEvenWrap.children.length) {
      const e = document.createElement('p');
      e.className = 'features-empty';
      e.textContent = 'No even locked levels.';
      lockedEvenWrap.appendChild(e);
    }

    lockedOddCard.appendChild(lockedOddWrap);
    lockedEvenCard.appendChild(lockedEvenWrap);
    lockedParityGrid.appendChild(lockedOddCard);
    lockedParityGrid.appendChild(lockedEvenCard);
    lockedCard.appendChild(lockedParityGrid);
    sections.appendChild(lockedCard);
    classCard.appendChild(sections);

    container.appendChild(classCard);
  });
}

function setProgressionOutputs(progression) {
  document.getElementById('proficiencyBonus').value = `Proficiency Bonus: +${progression.pb}`;
  document.getElementById('forcePowersKnown').value = `Force Powers Known: ${progression.forcePowersKnown}`;
  const techPowersKnownEl = document.getElementById('techPowersKnown');
  if (techPowersKnownEl) {
    techPowersKnownEl.value = `Tech Powers Known: ${progression.techPowersKnown}`;
  }
  const techPointsMaxEl = document.getElementById('techPointsMax');
  if (techPointsMaxEl) {
    techPointsMaxEl.value = progression.techPointsMax;
  }
  document.getElementById('forcePointsMax').value = `Maximum Force Points: ${progression.forcePointsMax}`;
  document.getElementById('maxPowerLevel').value = `Max Power Level: ${progression.maxPowerLevel}`;
  const techMaxPowerLevelEl = document.getElementById('techMaxPowerLevel');
  if (techMaxPowerLevelEl) {
    techMaxPowerLevelEl.value = `Tech Max Power Level: ${progression.techMaxPowerLevel}`;
  }
  document.getElementById('fecOptionsAllowed').value = `FEC Options Allowed: ${progression.fecOptionsAllowed}`;
  document.getElementById('forceRecoveryAmount').value = `Force Recovery: ${progression.forceRecoveryAmount}`;
  document.getElementById('forceShieldUses').value = `Force Shield Uses: ${progression.forceShieldUses}`;
  document.getElementById('repulsingWaveUses').value = `Repulsing Wave Uses: ${progression.repulsingWaveUses}`;
  document.getElementById('mightyBlastTargets').value = `Mighty Blast Targets: ${progression.mightyBlastTargets}`;
  updateAsiStatus(progression.level, getAsiHistoryFromUi());
  updateSkills();
  updateXpProgress();
  updateForceCounter();
  updateTechCounter();
  updatePowerCatalogTabAvailability(progression);
  renderForcePowerCatalog();
  renderTechPowerCatalog();

  // Update FEC slots label and enforce checkbox limit
  const slotsLabel = document.getElementById('fecSlotsLabel');
  if (slotsLabel) {
    slotsLabel.textContent = progression.fecOptionsAllowed;
  }
  enforceFecCheckboxLimit(progression.fecOptionsAllowed);

  const validation = document.getElementById('levelValidation');
  validation.textContent = progression.warnings.length
    ? progression.warnings.join(' ')
    : 'Level requirements satisfied.';

  renderFeatureList(progression.features, progression);
  renderLevelingUnlockedFeatures(getClassLevelConfig());
}

function applyLevelProgression(options = {}) {
  const character = options.characterData || getCharacterData();
  const progression = buildProgression(character);

  document.getElementById('level').value = progression.level;
  setProgressionOutputs(progression);
  updateForceAffinityState(character);
  ensureIdentityFieldsEditable();
  ensureCoreTextInputsEditable();
  ensureRosterOverlayClosed();

  if (options.announce) {
    const validation = document.getElementById('levelValidation');
    if (validation) {
      validation.textContent = `Level rules applied for level ${progression.level}.`;
    }
  }

  return progression;
}

function levelUp() {
  const current = getClassLevelConfig();
  current[0].level = Math.max(1, (parseInt(current[0].level, 10) || 1) + 1);
  setClassLevelConfig(current);
  applyLevelProgression({ announce: true });
}

function levelDown() {
  const current = getClassLevelConfig();
  current[0].level = Math.max(1, (parseInt(current[0].level, 10) || 1) - 1);
  setClassLevelConfig(current);
  applyLevelProgression({ announce: true });
}

try {
  fs = require('fs');
  path = require('path');
  ({ app } = require('electron'));
  
  // Get the user data directory for saving characters
  dataPath = path.join(app.getPath('userData'), 'characters');
  
  // Ensure the directory exists
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }
  storageBackend = 'electron';
  console.log('Electron modules loaded successfully');
} catch (e) {
  storageBackend = 'localStorage';
  console.log('Electron modules unavailable; using localStorage fallback:', e.message);
  dataPath = null;
}

function getStorageModeLabel() {
  return storageBackend === 'electron' ? 'desktop file' : 'browser local storage';
}

function ensureIdentityFieldsEditable() {
  ['name', 'species', 'background'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }
    el.disabled = false;
    el.readOnly = false;
    el.style.pointerEvents = 'auto';
  });
}

function ensureCoreTextInputsEditable() {
  const selectors = [
    '#name', '#species', '#background', '#credits', '#maxHitPoints', '#temporaryHitPoints',
    '#conditions', '#notes', '#experiencePoints', '#gender', '#age', '#height', '#weight',
    '#hair', '#eyes', '#skin', '#appearance', '#backstory', '#personality', '#ideal', '#bond', '#flaw',
    '.class-level-input', '.class-archetype-input', '.class-level-select'
  ];

  document.querySelectorAll(selectors.join(',')).forEach((el) => {
    if (!el) {
      return;
    }
    el.disabled = false;
    if ('readOnly' in el) {
      el.readOnly = false;
    }
    el.style.pointerEvents = 'auto';
  });
}

function ensureRosterOverlayClosed() {
  const overlay = document.getElementById('rosterOverlay');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '-1';
  }
}

function bindIdentityFieldGuards() {
  ['name', 'species', 'background'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }

    const unlock = () => {
      el.disabled = false;
      el.readOnly = false;
      ensureRosterOverlayClosed();
    };

    el.addEventListener('focus', unlock);
    el.addEventListener('click', unlock);
  });
}

function getCharacterData() {
  const asiHistory = getAsiHistoryFromUi();

  const skills = {};
  SKILLS.forEach((skill) => {
    skills[skill.id] = {
      prof: document.getElementById('prof_' + skill.id)?.checked || false,
      expertise: document.getElementById('exp_' + skill.id)?.checked || false,
    };
  });

  return {
    name: document.getElementById('name').value,
    species: document.getElementById('species').value,
    class: document.getElementById('class').value,
    level: document.getElementById('level').value,
    classes: getClassLevelConfig(),
    experiencePoints: parseInt(document.getElementById('experiencePoints').value) || 0,
    background: document.getElementById('background').value,
    archetype: document.getElementById('archetype').value,
    attributes: {
      str: parseInt(document.getElementById('str').value) || 0,
      dex: parseInt(document.getElementById('dex').value) || 0,
      con: parseInt(document.getElementById('con').value) || 0,
      int: parseInt(document.getElementById('int').value) || 0,
      wis: parseInt(document.getElementById('wis').value) || 0,
      cha: parseInt(document.getElementById('cha').value) || 0
    },
    characteristics: {
      alignment: document.getElementById('alignment').value,
      gender: document.getElementById('gender').value,
      age: document.getElementById('age').value,
      height: document.getElementById('height').value,
      weight: document.getElementById('weight').value,
      hair: document.getElementById('hair').value,
      eyes: document.getElementById('eyes').value,
      skin: document.getElementById('skin').value,
      appearance: document.getElementById('appearance').value,
      backstory: document.getElementById('backstory').value,
      personality: document.getElementById('personality').value,
      ideal: document.getElementById('ideal').value,
      bond: document.getElementById('bond').value,
      flaw: document.getElementById('flaw').value
    },
    combatStats: {
      maxHitPoints: parseInt(document.getElementById('maxHitPoints').value) || 0,
      hitPointsLost: parseInt(document.getElementById('hitPoints').value) || 0,
      temporaryHitPoints: parseInt(document.getElementById('temporaryHitPoints').value) || 0,
      forcePointsUsed: parseInt(document.getElementById('forcePointsUsed').value) || 0,
      forceShieldUsed: parseInt(document.getElementById('forceShieldUsed')?.value) || 0,
      techPointsUsed: parseInt(document.getElementById('techPointsUsed').value) || 0,
      techPointsMax: parseInt(document.getElementById('techPointsMax')?.value) || 0,
      credits: parseInt(document.getElementById('credits').value) || 0
    },
    status: {
      inspiration: document.getElementById('inspiration').checked,
      exhaustion: parseInt(document.getElementById('exhaustion').value) || 0,
      conditions: document.getElementById('conditions').value,
      notes: document.getElementById('notes').value
    },
    forceConfig: {
      castingAbility: document.getElementById('castingAbility')?.value || 'wis',
      forceAffinity: document.getElementById('forceAffinity')?.value || 'none',
      fecChosen: parseCommaList(document.getElementById('fecChosen')?.value || '')
    },
    abilityScoreConfig: {
      asiHistory
    },
    skills,
    forcePowers: getForcePowersList(),
    techPowers: getTechPowersList()
  };
}

function setCharacterData(data) {
  try {
    if (!data) {
      console.error('setCharacterData: data is null or undefined');
      return;
    }
    
    // Basic Info
  document.getElementById('name').value = data.name || '';
  syncSelectOptions('species', speciesReferenceNames, 'Choose Species');
  syncSelectOptions('background', backgroundReferenceNames, 'Choose Background');
  document.getElementById('species').value = data.species || '';
  const classConfig = normalizeClassConfig(data.classes || [{ name: data.class || 'Consular', level: data.level || 1, archetype: data.archetype || '' }]);
  setClassLevelConfig(classConfig);
  document.getElementById('experiencePoints').value = data.experiencePoints || 0;
  document.getElementById('background').value = data.background || '';

  // Attributes
  document.getElementById('str').value = data.attributes?.str || 0;
  document.getElementById('dex').value = data.attributes?.dex || 0;
  document.getElementById('con').value = data.attributes?.con || 0;
  document.getElementById('int').value = data.attributes?.int || 0;
  document.getElementById('wis').value = data.attributes?.wis || 0;
  document.getElementById('cha').value = data.attributes?.cha || 0;
  updateAbilityModifiers();

  // Skills
  SKILLS.forEach((skill) => {
    const s = data.skills?.[skill.id] || {};
    const profEl = document.getElementById('prof_' + skill.id);
    const expEl = document.getElementById('exp_' + skill.id);
    if (profEl) { profEl.checked = s.prof || false; }
    if (expEl) { expEl.checked = s.expertise || false; }
  });
  updateSkills();

  // Characteristics
  document.getElementById('alignment').value = data.characteristics?.alignment || '';
  document.getElementById('gender').value = data.characteristics?.gender || '';
  document.getElementById('age').value = data.characteristics?.age || '';
  document.getElementById('height').value = data.characteristics?.height || '';
  document.getElementById('weight').value = data.characteristics?.weight || '';
  document.getElementById('hair').value = data.characteristics?.hair || '';
  document.getElementById('eyes').value = data.characteristics?.eyes || '';
  document.getElementById('skin').value = data.characteristics?.skin || '';
  document.getElementById('appearance').value = data.characteristics?.appearance || '';
  document.getElementById('backstory').value = data.characteristics?.backstory || '';
  document.getElementById('personality').value = data.characteristics?.personality || '';
  document.getElementById('ideal').value = data.characteristics?.ideal || '';
  document.getElementById('bond').value = data.characteristics?.bond || '';
  document.getElementById('flaw').value = data.characteristics?.flaw || '';

  // Combat Stats
  document.getElementById('maxHitPoints').value = data.combatStats?.maxHitPoints || 0;
  document.getElementById('hitPoints').value = data.combatStats?.hitPointsLost || 0;
  document.getElementById('temporaryHitPoints').value = data.combatStats?.temporaryHitPoints || 0;
  document.getElementById('forcePointsUsed').value = data.combatStats?.forcePointsUsed || 0;
  const forceShieldUsedEl = document.getElementById('forceShieldUsed');
  if (forceShieldUsedEl) {
    forceShieldUsedEl.value = data.combatStats?.forceShieldUsed || 0;
  }
  document.getElementById('techPointsUsed').value = data.combatStats?.techPointsUsed || 0;
  
  // Explicitly handle techPointsMax
  const techPointsMaxEl = document.getElementById('techPointsMax');
  if (techPointsMaxEl) {
    techPointsMaxEl.value = data.combatStats?.techPointsMax || 0;
  }
  
  document.getElementById('credits').value = data.combatStats?.credits || 0;

  updateHitPointCounter();
  updateForceCounter();
  updateTechCounter();
  document.getElementById('inspiration').checked = data.status?.inspiration || false;
  document.getElementById('exhaustion').value = data.status?.exhaustion || 0;
  document.getElementById('conditions').value = data.status?.conditions || '';
  document.getElementById('notes').value = data.status?.notes || '';

  // Force configuration
  document.getElementById('castingAbility').value = data.forceConfig?.castingAbility || 'wis';
  document.getElementById('forceAffinity').value = data.forceConfig?.forceAffinity || 'none';

  // Populate FEC checkboxes
  const fecList = data.forceConfig?.fecChosen || [];
  document.getElementById('fecChosen').value = fecList.join(', ');
  document.querySelectorAll('.fec-checkbox').forEach(cb => {
    cb.checked = fecList.includes(cb.value);
  });
  renderFecDisplay(fecList);

  setAsiHistoryToUi(data.abilityScoreConfig?.asiHistory || []);

  // Known powers - merge force + tech lists for unified render/cast controls
  const forcePowers = Array.isArray(data.forcePowers) ? data.forcePowers.map((power) => ({ ...power, powerType: 'force' })) : [];
  const techPowers = Array.isArray(data.techPowers) ? data.techPowers.map((power) => ({ ...power, powerType: 'tech', alignment: 'tech' })) : [];
  const powersList = [...forcePowers, ...techPowers];

  if (Array.isArray(powersList)) {
    renderKnownPowers(powersList);
  } else {
    console.warn('Known powers are not arrays:', { forcePowers: data.forcePowers, techPowers: data.techPowers });
    renderKnownPowers([]);
  }

  // Apply level progression to update all calculated fields
  applyLevelProgression({ characterData: data });
  ensureIdentityFieldsEditable();
  ensureCoreTextInputsEditable();
  ensureRosterOverlayClosed();
  
  console.log('Character data loaded successfully:', data.name);
  } catch (err) {
    console.error('Error in setCharacterData:', err);
  }
}

function saveCharacter(options = {}) {
  const silent = Boolean(options.silent);
  try {
    const data = getCharacterData();
    
    // Ensure techPointsMax is included
    const techPointsMaxEl = document.getElementById('techPointsMax');
    if (techPointsMaxEl) {
      data.combatStats.techPointsMax = parseInt(techPointsMaxEl.value) || 0;
    }
    
    const progression = applyLevelProgression({ characterData: data });
    data.progression = progression;

    if (storageBackend === 'electron' && dataPath && fs && path) {
      // Assign an ID if this character doesn't have one yet
      if (!activeCharacterId) {
        activeCharacterId = slugifyCharName(data.name);
      }
      const charPath = path.join(dataPath, activeCharacterId + '.json');
      fs.writeFileSync(charPath, JSON.stringify(data, null, 2));
      console.log('Character saved to:', charPath);
      if (!silent) {
        alert(`Character "${data.name}" saved successfully!`);
      }
      return;
    }

    // localStorage fallback — store roster as an object keyed by id
    if (!activeCharacterId) {
      activeCharacterId = slugifyCharName(data.name);
    }
    const roster = getRosterFromLocalStorage();
    roster[activeCharacterId] = data;
    localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(roster));
    // Legacy single-char key for backward compat
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    console.log('Character saved to localStorage roster key:', activeCharacterId);
    if (!silent) {
      alert(`Character "${data.name}" saved successfully!`);
    }
  } catch (err) {
    console.error('Error saving character:', err);
    if (!silent) {
      alert('Error saving character: ' + err.message);
    }
  }
}

function loadCharacter(options = {}) {
  const silent = Boolean(options.silent);
  const targetId = options.id || activeCharacterId;
  try {
    let data;

    if (storageBackend === 'electron' && dataPath && fs && path) {
      // Try the specific id first, then fall back to legacy character.json
      let charPath = targetId ? path.join(dataPath, targetId + '.json') : null;
      if (!charPath || !fs.existsSync(charPath)) {
        charPath = path.join(dataPath, 'character.json');
      }
      if (!fs.existsSync(charPath)) {
        if (!silent) {
          alert('No saved character file found.');
        }
        return false;
      }
      const fileData = fs.readFileSync(charPath, 'utf-8');
      data = JSON.parse(fileData);
      console.log('Character loaded from:', charPath);
    } else {
      // localStorage fallback
      if (targetId) {
        const roster = getRosterFromLocalStorage();
        data = roster[targetId] || null;
      }
      if (!data) {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!raw) {
          if (!silent) {
            alert('No saved character found.');
          }
          return false;
        }
        data = JSON.parse(raw);
      }
      console.log('Character loaded from localStorage');
    }
    
    if (!data || !data.name) {
      if (!silent) {
        alert('Invalid character file: missing name');
      }
      return false;
    }
    
    // Ensure techPointsMax is set
    if (!data.combatStats?.techPointsMax && data.combatStats) {
      data.combatStats.techPointsMax = 0;
    }
    if (!data.combatStats?.forceShieldUsed && data.combatStats) {
      data.combatStats.forceShieldUsed = 0;
    }
    
    // Track which character is active
    if (targetId) {
      activeCharacterId = targetId;
    } else if (data.name) {
      activeCharacterId = slugifyCharName(data.name);
    }
    
    setCharacterData(data);
    if (!silent) {
      alert(`Character "${data.name}" loaded successfully!`);
    }
    return true;
  } catch (err) {
    console.error('Error loading character:', err);
    if (!silent) {
      alert('Error loading character: ' + err.message);
    }
    return false;
  }
}

function loadTemplate() {
  try {
    let data;

    if (fs && path) {
      const filePath = path.join(__dirname, 'data', 'netahl.json');
      console.log('Reading template from fs:', filePath);
      const fileData = fs.readFileSync(filePath, 'utf-8');
      data = JSON.parse(fileData);
    } else {
      throw new Error('fs/path unavailable in renderer');
    }

    console.log('Successfully loaded template:', data.name);
    return mapBuilderCharacterToSheet(data);
  } catch (err) {
    console.error('Error loading template:', err);
    // Fallback path for environments where require/fs is unavailable.
    try {
      const request = new XMLHttpRequest();
      request.open('GET', './data/netahl.json', false);
      request.send(null);

      if (request.status !== 200 && request.status !== 0) {
        throw new Error('Template request failed with status ' + request.status);
      }

      const data = JSON.parse(request.responseText);
      console.log('Successfully loaded template via XHR fallback:', data.name);
      return mapBuilderCharacterToSheet(data);
    } catch (fallbackErr) {
      console.error('Fallback template load failed:', fallbackErr);
      alert('Error loading template: ' + fallbackErr.message);
    }

    return null;
  }
}

function normalizePowerCatalogRows(rawRows, defaultType = 'force', descriptions = null) {
  return (Array.isArray(rawRows) ? rawRows : [])
    .map((power) => ({
      name: String(power?.name || '').trim(),
      level: Number(power?.level) || 0,
      description: String(power?.description || descriptions?.[power?.name] || ''),
      alignment: defaultType === 'force' ? resolveForcePowerAlignment(power) : 'tech',
      powerType: defaultType
    }))
    .filter((power) => power.name)
    .sort((left, right) => left.level - right.level || left.name.localeCompare(right.name));
}

function loadForcePowerCatalog() {
  const statusEl = document.getElementById('forcePowerCatalogStatus');

  try {
    if (!fs || !path) {
      throw new Error('fs/path unavailable in renderer');
    }

    const filePath = path.join(__dirname, 'data', 'force-powers.json');
    const descriptionsPath = path.join(__dirname, 'data', 'force-power-descriptions.json');
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const descriptions = fs.existsSync(descriptionsPath)
      ? JSON.parse(fs.readFileSync(descriptionsPath, 'utf-8'))
      : {};

    forcePowerCatalog = normalizePowerCatalogRows(JSON.parse(fileData), 'force', descriptions);
    renderForcePowerCatalog();
  } catch (err) {
    console.error('Error loading force power catalog:', err);
    forcePowerCatalog = [];
    if (statusEl) {
      statusEl.textContent = 'Force power catalog unavailable.';
    }
    const listEl = document.getElementById('forcePowerCatalogList');
    if (listEl) {
      listEl.innerHTML = '<p class="features-empty">Unable to load force power catalog.</p>';
    }
  }
}

function loadTechPowerCatalog() {
  const statusEl = document.getElementById('techPowerCatalogStatus');

  try {
    if (!fs || !path) {
      throw new Error('fs/path unavailable in renderer');
    }

    const filePath = path.join(__dirname, 'data', 'tech-powers.json');
    const fileData = fs.readFileSync(filePath, 'utf-8');
    techPowerCatalog = normalizePowerCatalogRows(JSON.parse(fileData), 'tech');
    renderTechPowerCatalog();
  } catch (err) {
    console.error('Error loading tech power catalog:', err);
    techPowerCatalog = [];
    if (statusEl) {
      statusEl.textContent = 'Tech power catalog unavailable.';
    }
    const listEl = document.getElementById('techPowerCatalogList');
    if (listEl) {
      listEl.innerHTML = '<p class="features-empty">Unable to load tech power catalog.</p>';
    }
  }
}

function loadClassProgressionCatalog() {
  try {
    let data;

    if (fs && path) {
      const filePath = path.join(__dirname, 'data', 'class-progressions.json');
      data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } else {
      const request = new XMLHttpRequest();
      request.open('GET', './data/class-progressions.json', false);
      request.send(null);
      if (request.status !== 200 && request.status !== 0) {
        throw new Error('Class progression catalog request failed with status ' + request.status);
      }
      data = JSON.parse(request.responseText);
    }

    classProgressionCatalog = data?.classes || {};
    syncClassChoiceRulesFromCatalog();
  } catch (err) {
    console.error('Error loading class progression catalog:', err);
    classProgressionCatalog = {};
  }
}

function loadJsonFromDataFile(fileName) {
  if (fs && path) {
    const filePath = path.join(__dirname, 'data', fileName);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  const request = new XMLHttpRequest();
  request.open('GET', `./data/${fileName}`, false);
  request.send(null);
  if (request.status !== 200 && request.status !== 0) {
    throw new Error(`${fileName} request failed with status ${request.status}`);
  }
  return JSON.parse(request.responseText);
}

function populateDatalist(datalistId, values) {
  const listEl = document.getElementById(datalistId);
  if (!listEl) {
    return;
  }

  const unique = Array.from(new Set((Array.isArray(values) ? values : []).map((item) => String(item || '').trim()).filter(Boolean)))
    .sort((left, right) => left.localeCompare(right));
  listEl.innerHTML = unique.map((name) => `<option value="${name.replace(/"/g, '&quot;')}"></option>`).join('');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildSelectOptionsHtml(values, currentValue, placeholderText) {
  const normalizedCurrent = String(currentValue || '');
  const unique = Array.from(new Set((Array.isArray(values) ? values : []).map((item) => String(item || '').trim()).filter(Boolean)))
    .sort((left, right) => left.localeCompare(right));

  const options = [`<option value="">${escapeHtml(placeholderText)}</option>`];
  unique.forEach((name) => {
    options.push(`<option value="${escapeHtml(name)}" ${name === normalizedCurrent ? 'selected' : ''}>${escapeHtml(name)}</option>`);
  });

  if (normalizedCurrent && !unique.includes(normalizedCurrent)) {
    options.push(`<option value="${escapeHtml(normalizedCurrent)}" selected>${escapeHtml(normalizedCurrent)} (custom)</option>`);
  }

  return options.join('');
}

function syncSelectOptions(selectId, values, placeholderText) {
  const selectEl = document.getElementById(selectId);
  if (!selectEl) {
    return;
  }

  const currentValue = String(selectEl.value || '');
  selectEl.innerHTML = buildSelectOptionsHtml(values, currentValue, placeholderText);
  selectEl.value = currentValue;
}

function getArchetypeSourceHint(name) {
  const normalized = String(name || '').trim().toLowerCase();
  if (!normalized) {
    return '';
  }

  const match = archetypeReferenceEntries.find((entry) => String(entry?.name || '').trim().toLowerCase() === normalized);
  if (!match) {
    return '';
  }

  const pages = Array.isArray(match.sourcePages) && match.sourcePages.length
    ? ` (p. ${match.sourcePages.join(', ')})`
    : '';
  return archetypeReferenceSource ? `Source: ${archetypeReferenceSource}${pages}` : `Source${pages}`;
}

function updateSimpleSourceHint(inputId, validNames, sourceLabel) {
  const input = document.getElementById(inputId);
  if (!input) {
    return;
  }

  const current = String(input.value || '').trim().toLowerCase();
  const isKnown = current && validNames.has(current);
  input.title = isKnown && sourceLabel ? `Source: ${sourceLabel}` : '';
}

function updateArchetypeInputTitle(input) {
  if (!input) {
    return;
  }
  input.title = getArchetypeSourceHint(input.value);
}

function refreshArchetypeInputHints() {
  document.querySelectorAll('.class-archetype-input, .character-archetype-input, .character-archetype-select').forEach((control) => {
    if (!control.dataset.sourceHintBound) {
      control.addEventListener('change', () => updateArchetypeInputTitle(control));
      control.dataset.sourceHintBound = '1';
    }
    updateArchetypeInputTitle(control);
  });
}

function loadSheetReferenceCatalogs() {
  try {
    const speciesData = loadJsonFromDataFile('species-reference.json');
    speciesReferenceNames = (speciesData?.species || []).map((entry) => entry?.name).filter(Boolean);
    speciesReferenceSource = (speciesData?.generatedFrom || [])[0] || '';
  } catch (err) {
    console.warn('Unable to load species-reference.json:', err.message);
    speciesReferenceNames = [];
    speciesReferenceSource = '';
  }

  try {
    const backgroundsData = loadJsonFromDataFile('backgrounds-reference.json');
    backgroundReferenceNames = (backgroundsData?.backgrounds || []).map((entry) => entry?.name).filter(Boolean);
    backgroundReferenceSource = (backgroundsData?.generatedFrom || [])[0] || '';
  } catch (err) {
    console.warn('Unable to load backgrounds-reference.json:', err.message);
    backgroundReferenceNames = [];
    backgroundReferenceSource = '';
  }

  try {
    const archetypesData = loadJsonFromDataFile('archetypes-reference.json');
    archetypeReferenceEntries = Array.isArray(archetypesData?.archetypes) ? archetypesData.archetypes : [];
    archetypeReferenceSource = (archetypesData?.generatedFrom || [])[0] || '';
  } catch (err) {
    console.warn('Unable to load archetypes-reference.json:', err.message);
    archetypeReferenceEntries = [];
    archetypeReferenceSource = '';
  }

  try {
    const speciesDetailsData = loadJsonFromDataFile('species-details.json');
    const speciesEntries = Array.isArray(speciesDetailsData?.species) ? speciesDetailsData.species : [];
    speciesDetailsByName = speciesEntries.reduce((acc, entry) => {
      const key = normalizeLookupName(entry?.name);
      if (key) {
        acc[key] = entry;
      }
      return acc;
    }, {});
  } catch (err) {
    console.warn('Unable to load species-details.json:', err.message);
    speciesDetailsByName = {};
  }

  try {
    const backgroundDetailsData = loadJsonFromDataFile('background-details.json');
    const backgroundEntries = Array.isArray(backgroundDetailsData?.backgrounds) ? backgroundDetailsData.backgrounds : [];
    backgroundDetailsByName = backgroundEntries.reduce((acc, entry) => {
      const key = normalizeLookupName(entry?.name);
      if (key) {
        acc[key] = entry;
      }
      return acc;
    }, {});
  } catch (err) {
    console.warn('Unable to load background-details.json:', err.message);
    backgroundDetailsByName = {};
  }

  populateDatalist('speciesOptions', speciesReferenceNames);
  populateDatalist('backgroundOptions', backgroundReferenceNames);
  populateDatalist('archetypeOptions', archetypeReferenceEntries.map((entry) => entry?.name).filter(Boolean));
  syncSelectOptions('species', speciesReferenceNames, 'Choose Species');
  syncSelectOptions('background', backgroundReferenceNames, 'Choose Background');

  const speciesNameSet = new Set(speciesReferenceNames.map((name) => String(name).trim().toLowerCase()));
  const backgroundNameSet = new Set(backgroundReferenceNames.map((name) => String(name).trim().toLowerCase()));
  const speciesInput = document.getElementById('species');
  const backgroundInput = document.getElementById('background');

  if (speciesInput && !speciesInput.dataset.sourceHintBound) {
    speciesInput.addEventListener('change', () => updateSimpleSourceHint('species', speciesNameSet, speciesReferenceSource));
    speciesInput.dataset.sourceHintBound = '1';
  }

  if (backgroundInput && !backgroundInput.dataset.sourceHintBound) {
    backgroundInput.addEventListener('change', () => updateSimpleSourceHint('background', backgroundNameSet, backgroundReferenceSource));
    backgroundInput.dataset.sourceHintBound = '1';
  }

  if (speciesInput && !speciesInput.dataset.infoModalBound) {
    speciesInput.addEventListener('change', updateIdentityInfoButtonState);
    speciesInput.dataset.infoModalBound = '1';
  }

  if (backgroundInput && !backgroundInput.dataset.infoModalBound) {
    backgroundInput.addEventListener('change', updateIdentityInfoButtonState);
    backgroundInput.dataset.infoModalBound = '1';
  }

  updateSimpleSourceHint('species', speciesNameSet, speciesReferenceSource);
  updateSimpleSourceHint('background', backgroundNameSet, backgroundReferenceSource);
  updateIdentityInfoButtonState();
  refreshArchetypeInputHints();
}

function getKnownPowersList() {
  const items = document.querySelectorAll('#powersLeft .power-item, #powersRight .power-item');
  return Array.from(items).map((el) => ({
    name: el.dataset.power,
    level: parseInt(el.dataset.level, 10),
    alignment: el.dataset.alignment || 'universal',
    description: el.dataset.description || '',
    powerType: el.dataset.powerType === 'tech' ? 'tech' : 'force'
  }));
}

function getForcePowersList() {
  return getKnownPowersList().filter((power) => power.powerType !== 'tech');
}

function getTechPowersList() {
  return getKnownPowersList().filter((power) => power.powerType === 'tech');
}

function normalizeForcePowerName(name) {
  return String(name || '').trim().toLowerCase();
}

function normalizeLookupName(name) {
  return String(name || '').trim().toLowerCase();
}

function resolveForcePowerAlignment(power) {
  const explicitAlignment = normalizeForcePowerName(power?.alignment);
  if (explicitAlignment === 'light' || explicitAlignment === 'dark' || explicitAlignment === 'universal') {
    // Keep explicit non-default values, but still allow handbook text to override stale "universal" data.
    if (explicitAlignment !== 'universal') {
      return explicitAlignment;
    }
  }

  const firstDescriptionLine = String(power?.description || '').split('\n').find((line) => line.trim()) || '';
  const normalizedLine = firstDescriptionLine.toLowerCase();
  if (normalizedLine.includes('light side power')) {
    return 'light';
  }
  if (normalizedLine.includes('dark side power')) {
    return 'dark';
  }
  if (normalizedLine.includes('universal power')) {
    return 'universal';
  }

  return explicitAlignment === 'light' || explicitAlignment === 'dark' ? explicitAlignment : 'universal';
}

function powerLevelLabel(level) {
  if (level === 0) return 'At-will';
  const suffixes = ['th','st','nd','rd'];
  const suf = level <= 3 ? suffixes[level] : 'th';
  return `${level}${suf} Level`;
}

function getForcePowerCost(level) {
  return level <= 0 ? 0 : level + 1;
}

function castForcePower(level, powerName) {
  const usedEl = document.getElementById('forcePointsUsed');
  const maxEl = document.getElementById('forcePointsMax');
  if (!usedEl || !maxEl) {
    return;
  }

  const rawMax = maxEl.value || '';
  const max = parseInt(rawMax.replace(/[^\d]/g, '')) || 0;
  const used = parseInt(usedEl.value) || 0;
  const remaining = Math.max(0, max - used);
  const cost = getForcePowerCost(level);

  if (cost > remaining) {
    alert(`Not enough Force Points to cast ${powerName}. Need ${cost}, have ${remaining}.`);
    return;
  }

  usedEl.value = used + cost;
  updateForceCounter();
}

function ensurePowerDescriptionModal() {
  let overlay = document.getElementById('powerDescriptionModal');
  if (overlay) {
    return overlay;
  }

  overlay = document.createElement('div');
  overlay.id = 'powerDescriptionModal';
  overlay.className = 'power-modal-overlay hidden';
  overlay.innerHTML = `
    <div class="power-modal-panel" role="dialog" aria-modal="true" aria-labelledby="powerModalTitle">
      <button type="button" class="power-modal-close" aria-label="Close power description">✕</button>
      <h3 id="powerModalTitle" class="power-modal-title"></h3>
      <div id="powerModalMeta" class="power-modal-meta"></div>
      <div id="powerModalBody" class="power-modal-body"></div>
    </div>
  `;

  const closeBtn = overlay.querySelector('.power-modal-close');
  closeBtn.onclick = closePowerDescriptionModal;

  overlay.onclick = (event) => {
    if (event.target === overlay) {
      closePowerDescriptionModal();
    }
  };

  document.body.appendChild(overlay);
  return overlay;
}

function openReferenceInfoModal(options) {
  const overlay = ensurePowerDescriptionModal();
  const titleEl = document.getElementById('powerModalTitle');
  const metaEl = document.getElementById('powerModalMeta');
  const bodyEl = document.getElementById('powerModalBody');

  if (!titleEl || !metaEl || !bodyEl) {
    return;
  }

  const title = options?.title || 'Details';
  const meta = options?.meta || '';
  const sections = Array.isArray(options?.sections) ? options.sections.filter(Boolean) : [];

  titleEl.textContent = title;
  metaEl.textContent = meta;
  metaEl.style.display = meta ? '' : 'none';
  bodyEl.textContent = sections.length ? sections.join('\n\n') : 'No description available.';
  overlay.classList.remove('hidden');
}

function openPowerDescriptionModal(power) {
  const sections = [];
  if (power?.description) {
    sections.push(power.description);
  }

  openReferenceInfoModal({
    title: power?.name || 'Power Details',
    meta: typeof power?.level === 'number' ? powerLevelLabel(power.level) : '',
    sections
  });
}

function getSpeciesDetailByName(name) {
  return speciesDetailsByName[normalizeLookupName(name)] || null;
}

function getBackgroundDetailByName(name) {
  return backgroundDetailsByName[normalizeLookupName(name)] || null;
}

function updateIdentityInfoButtonState() {
  const speciesName = document.getElementById('species')?.value || '';
  const backgroundName = document.getElementById('background')?.value || '';
  const speciesBtn = document.getElementById('speciesInfoBtn');
  const backgroundBtn = document.getElementById('backgroundInfoBtn');

  if (speciesBtn) {
    const hasSelection = Boolean(speciesName);
    speciesBtn.disabled = !hasSelection;
    speciesBtn.title = hasSelection ? `Show details for ${speciesName}` : 'Select a species to view details';
  }

  if (backgroundBtn) {
    const hasSelection = Boolean(backgroundName);
    backgroundBtn.disabled = !hasSelection;
    backgroundBtn.title = hasSelection ? `Show details for ${backgroundName}` : 'Select a background to view details';
  }
}

function showSpeciesInfoModal() {
  const speciesName = document.getElementById('species')?.value || '';
  if (!speciesName) {
    return;
  }

  const details = getSpeciesDetailByName(speciesName) || {};
  const sections = [];
  if (details.description) {
    sections.push(`Description\n${details.description}`);
  }
  if (details.benefits) {
    sections.push(`Species Benefits\n${details.benefits}`);
  }
  if (!sections.length) {
    sections.push('No species details found for this selection.');
  }

  const sourceMeta = details.sourcePage
    ? `Source: ${details.source || speciesReferenceSource || 'Species Reference'} (p. ${details.sourcePage})`
    : `Source: ${details.source || speciesReferenceSource || 'Species Reference'}`;

  openReferenceInfoModal({
    title: speciesName,
    meta: sourceMeta,
    sections
  });
}

function showBackgroundInfoModal() {
  const backgroundName = document.getElementById('background')?.value || '';
  if (!backgroundName) {
    return;
  }

  const details = getBackgroundDetailByName(backgroundName) || {};
  const sections = [];
  if (details.description) {
    sections.push(`Description\n${details.description}`);
  }
  if (details.benefits) {
    sections.push(`Background Benefits\n${details.benefits}`);
  }
  if (!sections.length) {
    sections.push('No background details found for this selection.');
  }

  const sourceMeta = details.sourcePage
    ? `Source: ${details.source || backgroundReferenceSource || 'Background Reference'} (p. ${details.sourcePage})`
    : `Source: ${details.source || backgroundReferenceSource || 'Background Reference'}`;

  openReferenceInfoModal({
    title: backgroundName,
    meta: sourceMeta,
    sections
  });
}

function closePowerDescriptionModal() {
  const overlay = document.getElementById('powerDescriptionModal');
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

function renderPowerCatalog(options) {
  const {
    listElementId,
    statusElementId,
    emptyCatalogText,
    noMatchText,
    catalog,
    knownPowers,
    canLearn,
    maxPowerLevel,
    powerType,
    filterValue,
    searchValue,
    alignmentFilter = 'all',
    onAdd
  } = options;

  const listEl = document.getElementById(listElementId);
  const statusEl = document.getElementById(statusElementId);
  if (!listEl || !statusEl) {
    return;
  }

  if (!catalog.length) {
    statusEl.textContent = emptyCatalogText;
    listEl.innerHTML = `<p class="features-empty">${emptyCatalogText}</p>`;
    return;
  }

  const knownSet = new Set((knownPowers || []).map((power) => normalizeForcePowerName(power.name)));
  const normalizedSearch = normalizeForcePowerName(searchValue || '');
  const filteredPowers = catalog.filter((power) => {
    if (knownSet.has(normalizeForcePowerName(power.name))) {
      return false;
    }

    const matchesLevel = filterValue === 'all' || String(power.level) === filterValue;
    const matchesSearch = !normalizedSearch || normalizeForcePowerName(power.name).includes(normalizedSearch);
    const matchesAlignment = alignmentFilter === 'all' || (power.alignment || 'universal') === alignmentFilter;

    return matchesLevel && matchesSearch && matchesAlignment;
  });

  const typeLabel = powerType === 'tech' ? 'tech' : 'force';
  const availabilityLabel = canLearn
    ? `Current max usable level: ${powerLevelLabel(maxPowerLevel)}.`
    : `${typeLabel.charAt(0).toUpperCase()}${typeLabel.slice(1)}casting progression is not active for this character yet.`;
  statusEl.textContent = `Showing ${filteredPowers.length} of ${catalog.length} ${typeLabel} powers. ${availabilityLabel}`;

  if (!filteredPowers.length) {
    listEl.innerHTML = `<p class="features-empty">${noMatchText}</p>`;
    return;
  }

  listEl.innerHTML = '';
  filteredPowers.forEach((power) => {
    const isLocked = !canLearn || power.level > maxPowerLevel;
    const hasDescription = Boolean(power.description);

    const row = document.createElement('div');
    row.className = 'power-catalog-row';
    if (isLocked) {
      row.classList.add('is-locked');
    }

    const info = document.createElement('div');
    info.className = 'power-catalog-info';

    const topRow = document.createElement('div');
    topRow.className = 'power-catalog-top';

    if (hasDescription) {
      const expandBtn = document.createElement('button');
      expandBtn.type = 'button';
      expandBtn.className = 'power-expand power-catalog-expand';
      expandBtn.setAttribute('aria-label', `Toggle ${power.name} description`);
      expandBtn.innerHTML = '▼';
      topRow.appendChild(expandBtn);
    } else {
      const spacer = document.createElement('span');
      spacer.className = 'power-expand-spacer';
      topRow.appendChild(spacer);
    }

    const meta = document.createElement('span');
    meta.className = 'power-catalog-meta-label';
    meta.textContent = powerLevelLabel(power.level);
    topRow.appendChild(meta);
    info.appendChild(topRow);

    const name = document.createElement('span');
    name.className = `power-name power-name--${power.alignment || 'universal'}`;
    name.textContent = power.name;
    info.appendChild(name);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'power-catalog-add power-cast';
    addBtn.textContent = isLocked ? 'Locked' : 'Add';
    addBtn.disabled = isLocked;
    addBtn.title = isLocked
      ? `Requires ${powerLevelLabel(power.level)} access.`
      : `Add ${power.name}`;
    addBtn.onclick = () => onAdd(power.name);

    row.appendChild(info);
    row.appendChild(addBtn);

    if (hasDescription) {
      const expandBtn = topRow.querySelector('.power-catalog-expand');
      expandBtn.onclick = () => openPowerDescriptionModal(power);
    }

    listEl.appendChild(row);
  });
}

function renderForcePowerCatalog() {
  renderPowerCatalog({
    listElementId: 'forcePowerCatalogList',
    statusElementId: 'forcePowerCatalogStatus',
    emptyCatalogText: 'Force power catalog unavailable.',
    noMatchText: 'No force powers match the current filters.',
    catalog: forcePowerCatalog,
    knownPowers: getForcePowersList(),
    canLearn: getCurrentForcePowersKnown() > 0,
    maxPowerLevel: getCurrentMaxForcePowerLevel(),
    powerType: 'force',
    filterValue: document.getElementById('forcePowerFilter')?.value || 'all',
    searchValue: document.getElementById('forcePowerSearch')?.value || '',
    alignmentFilter: document.getElementById('forcePowerAlignmentFilter')?.value || 'all',
    onAdd: addCatalogForcePower
  });
}

function renderTechPowerCatalog() {
  renderPowerCatalog({
    listElementId: 'techPowerCatalogList',
    statusElementId: 'techPowerCatalogStatus',
    emptyCatalogText: 'Tech power catalog unavailable.',
    noMatchText: 'No tech powers match the current filters.',
    catalog: techPowerCatalog,
    knownPowers: getTechPowersList(),
    canLearn: getCurrentTechPowersKnown() > 0,
    maxPowerLevel: getCurrentMaxTechPowerLevel(),
    powerType: 'tech',
    filterValue: document.getElementById('techPowerFilter')?.value || 'all',
    searchValue: document.getElementById('techPowerSearch')?.value || '',
    onAdd: addCatalogTechPower
  });
}

function castTechPower(level, powerName) {
  const usedEl = document.getElementById('techPointsUsed');
  const maxEl = document.getElementById('techPointsMax');
  if (!usedEl || !maxEl) {
    return;
  }

  const max = parseInt(maxEl.value, 10) || 0;
  const used = parseInt(usedEl.value, 10) || 0;
  const remaining = Math.max(0, max - used);
  const cost = getForcePowerCost(level);

  if (cost > remaining) {
    alert(`Not enough Tech Points to cast ${powerName}. Need ${cost}, have ${remaining}.`);
    return;
  }

  usedEl.value = used + cost;
  updateTechCounter();
}

function renderKnownPowers(powers) {
  const leftCol = document.getElementById('powersLeft');
  const rightCol = document.getElementById('powersRight');
  if (!leftCol || !rightCol) {
    return;
  }
  leftCol.innerHTML = '';
  rightCol.innerHTML = '';

  const normalized = powers.map((power) => {
    if (typeof power === 'string') {
      return { name: power.trim(), level: 0, alignment: 'universal', description: '', powerType: 'force' };
    }

    const nextType = power.powerType === 'tech' ? 'tech' : 'force';
    return {
      name: String(power.name || '').trim(),
      level: power.level ?? 0,
      alignment: power.alignment || (nextType === 'tech' ? 'tech' : 'universal'),
      description: power.description || '',
      powerType: nextType
    };
  }).filter((power) => power.name);

  const groups = {};
  normalized.forEach((power) => {
    if (!groups[power.level]) {
      groups[power.level] = [];
    }
    groups[power.level].push(power);
  });

  const sortedLevels = Object.keys(groups).map(Number).sort((a, b) => a - b);

  sortedLevels.forEach((lvl, idx) => {
    const col = idx % 2 === 0 ? leftCol : rightCol;
    const section = document.createElement('div');
    section.className = 'powers-level-group';

    const heading = document.createElement('div');
    heading.className = 'powers-level-heading';
    heading.textContent = powerLevelLabel(lvl);
    section.appendChild(heading);

    const tagsRow = document.createElement('div');
    tagsRow.className = 'powers-tags-row';
    groups[lvl].forEach((power) => {
      const powerContainer = document.createElement('div');
      powerContainer.className = 'power-item';

      const headerRow = document.createElement('div');
      headerRow.className = 'power-header';

      if (power.description) {
        const expandBtn = document.createElement('button');
        expandBtn.type = 'button';
        expandBtn.className = 'power-expand';
        expandBtn.setAttribute('aria-label', `Show ${power.name} description`);
        expandBtn.innerHTML = '▼';
        expandBtn.onclick = (event) => {
          event.stopPropagation();
          openPowerDescriptionModal({
            name: power.name,
            level: lvl,
            description: power.description
          });
        };
        headerRow.appendChild(expandBtn);
      } else {
        const spacer = document.createElement('span');
        spacer.className = 'power-expand-spacer';
        headerRow.appendChild(spacer);
      }

      const nameAndCost = document.createElement('div');
      nameAndCost.className = 'power-name-cost';

      const name = document.createElement('span');
      name.className = `power-name power-name--${power.alignment}`;
      name.textContent = power.name;
      nameAndCost.appendChild(name);

      const cost = document.createElement('span');
      cost.className = 'power-cost';
      cost.textContent = `${getForcePowerCost(lvl)} ${power.powerType === 'tech' ? 'TP' : 'FP'}`;
      nameAndCost.appendChild(cost);

      headerRow.appendChild(nameAndCost);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'power-actions';

      const castBtn = document.createElement('button');
      castBtn.type = 'button';
      castBtn.className = 'power-cast';
      castBtn.textContent = 'Cast';
      castBtn.dataset.cost = getForcePowerCost(lvl);
      castBtn.dataset.powerType = power.powerType;
      castBtn.setAttribute('aria-label', `Cast ${power.name}`);
      castBtn.onclick = () => {
        if (power.powerType === 'tech') {
          castTechPower(lvl, power.name);
        } else {
          castForcePower(lvl, power.name);
        }
      };
      actionsDiv.appendChild(castBtn);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'power-remove';
      removeBtn.setAttribute('aria-label', 'Remove');
      removeBtn.innerHTML = '✕';
      removeBtn.onclick = () => removeKnownPower(removeBtn);
      actionsDiv.appendChild(removeBtn);

      headerRow.appendChild(actionsDiv);
      powerContainer.appendChild(headerRow);

      powerContainer.dataset.power = power.name;
      powerContainer.dataset.level = lvl;
      powerContainer.dataset.alignment = power.alignment;
      powerContainer.dataset.description = power.description || '';
      powerContainer.dataset.powerType = power.powerType;

      tagsRow.appendChild(powerContainer);
    });
    section.appendChild(tagsRow);
    col.appendChild(section);
  });

  refreshPowerCastButtons();
  renderForcePowerCatalog();
  renderTechPowerCatalog();
}

function renderForcePowers(powers) {
  renderKnownPowers(powers);
}

function addCatalogForcePower(powerName) {
  const selectedPower = forcePowerCatalog.find((power) => power.name === powerName);
  if (!selectedPower) {
    return;
  }

  if (getCurrentForcePowersKnown() <= 0 || selectedPower.level > getCurrentMaxForcePowerLevel()) {
    renderForcePowerCatalog();
    return;
  }

  const current = getKnownPowersList();
  if (!current.some((power) => normalizeForcePowerName(power.name) === normalizeForcePowerName(selectedPower.name) && power.powerType !== 'tech')) {
    renderKnownPowers([...current, { ...selectedPower, powerType: 'force', alignment: selectedPower.alignment || 'universal' }]);
  }
}

function addCatalogTechPower(powerName) {
  const selectedPower = techPowerCatalog.find((power) => power.name === powerName);
  if (!selectedPower) {
    return;
  }

  if (getCurrentTechPowersKnown() <= 0 || selectedPower.level > getCurrentMaxTechPowerLevel()) {
    renderTechPowerCatalog();
    return;
  }

  const current = getKnownPowersList();
  if (!current.some((power) => normalizeForcePowerName(power.name) === normalizeForcePowerName(selectedPower.name) && power.powerType === 'tech')) {
    renderKnownPowers([...current, { ...selectedPower, powerType: 'tech', alignment: 'tech' }]);
  }
}

function removeKnownPower(btn) {
  btn.closest('.power-item')?.remove();
  renderKnownPowers(getKnownPowersList());
}

function removeForcePower(btn) {
  removeKnownPower(btn);
}

function resetCharacter() {
  if (!confirm('Reset character to template? All unsaved changes will be lost.')) {
    return;
  }
  
  try {
    console.log('Resetting character to template...');
    const characterData = loadTemplate();
    
    if (!characterData) {
      alert('Error: Could not load template');
      return;
    }
    
    // Ensure force powers are properly initialized
    if (!characterData.forcePowers) {
      characterData.forcePowers = [];
    }
    
    // Ensure force/tech point data is reset
    if (!characterData.combatStats) {
      characterData.combatStats = {};
    }
    characterData.combatStats.forcePointsUsed = 0;
    characterData.combatStats.forceShieldUsed = 0;
    characterData.combatStats.techPointsUsed = 0;
    characterData.combatStats.hitPointsLost = 0;
    characterData.combatStats.temporaryHitPoints = 0;
    
    setCharacterData(characterData);
    console.log('Character reset to template:', characterData.name);
    alert(`Character reset to template (${characterData.name})`);
  } catch (err) {
    console.error('Error resetting character:', err);
    alert('Error resetting character: ' + err.message);
  }
}

// ── Character Roster ─────────────────────────────────────────────────

/**
 * Turn a character name into a safe filename (no extension).
 * Falls back to a timestamp if name is empty/blank.
 */
function slugifyCharName(name) {
  const base = (name || '').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || ('character-' + Date.now());
}

function getRosterFromLocalStorage() {
  try {
    return JSON.parse(localStorage.getItem(ROSTER_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

/**
 * Returns array of { id, name, classLabel, level } for all saved characters.
 */
function listRosterCharacters() {
  const entries = [];

  if (storageBackend === 'electron' && dataPath && fs && path) {
    try {
      const files = fs.readdirSync(dataPath).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const raw = fs.readFileSync(path.join(dataPath, file), 'utf-8');
          const data = JSON.parse(raw);
          if (!data.name) continue;
          const id = file.replace(/\.json$/, '');
          const classLabel = buildClassLabel(data);
          entries.push({ id, name: data.name, classLabel });
        } catch { /* skip corrupt files */ }
      }
    } catch { /* dataPath unreadable */ }
  } else {
    const roster = getRosterFromLocalStorage();
    for (const [id, data] of Object.entries(roster)) {
      if (!data.name) continue;
      const classLabel = buildClassLabel(data);
      entries.push({ id, name: data.name, classLabel });
    }
  }

  // Sort alphabetically by name
  entries.sort((a, b) => a.name.localeCompare(b.name));
  return entries;
}

function buildClassLabel(data) {
  // Build a short "Class X / Class Y" summary from the classes array
  const classes = data.classes;
  if (Array.isArray(classes) && classes.length > 0) {
    return classes
      .filter(c => c.name && c.name !== 'Select Class')
      .map(c => `${c.name} ${c.level || ''}`.trim())
      .join(' / ') || 'Unknown';
  }
  // Fallback for flat format
  const cls = data.class || '';
  const lvl = data.level || '';
  return cls ? `${cls} ${lvl}`.trim() : 'Unknown';
}

function openRosterPanel() {
  renderRosterPanel();
  const overlay = document.getElementById('rosterOverlay');
  if (overlay) {
    overlay.style.zIndex = '500';
    overlay.style.pointerEvents = 'auto';
    overlay.classList.add('open');
  }
}

function closeRosterPanel(event) {
  // If called from overlay click, only close if the overlay itself was clicked (not the panel)
  if (event && event.target !== document.getElementById('rosterOverlay')) return;
  const overlay = document.getElementById('rosterOverlay');
  if (overlay) {
    overlay.classList.remove('open');
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '-1';
  }
}

function renderRosterPanel() {
  const listEl = document.getElementById('rosterList');
  const currentSection = document.getElementById('rosterCurrentSection');
  if (!listEl) return;

  // ── Pinned "Currently Loaded" block ──────────────────────────────
  if (currentSection) {
    const currentName = (document.getElementById('name')?.value || '').trim();
    if (currentName) {
      const currentData = getCharacterData();
      const subLabel = buildClassLabel(currentData);
      currentSection.innerHTML = `
        <div class="roster-current-label">Currently Loaded</div>
        <div class="roster-current-row">
          <div class="roster-current-info">
            <div class="roster-current-name">${escHtml(currentName)}</div>
            <div class="roster-current-sub">${escHtml(subLabel)}</div>
          </div>
          <button class="roster-save-current-btn" onclick="saveAndRefreshRoster()">Save</button>
        </div>`;
    } else {
      currentSection.innerHTML = `
        <div class="roster-current-label">Currently Loaded</div>
        <div class="roster-current-name roster-current-unnamed">No character loaded</div>`;
    }
  }

  // ── Saved characters list ─────────────────────────────────────────
  const chars = listRosterCharacters();
  if (chars.length === 0) {
    listEl.innerHTML = '<p class="roster-empty">No saved characters yet.<br>Click <strong>Save</strong> above to add the current character.</p>';
    return;
  }

  listEl.innerHTML = chars.map(({ id, name, classLabel }) => {
    const isActive = id === activeCharacterId;
    return `<div class="roster-item${isActive ? ' active-char' : ''}">
      <div class="roster-item-info" onclick="switchToCharacter('${escHtml(id)}')">
        <div class="roster-item-name">${escHtml(name)}</div>
        <div class="roster-item-sub">${escHtml(classLabel)}</div>
      </div>
      <button class="roster-item-load-btn" onclick="switchToCharacter('${escHtml(id)}')">Load</button>
      <button class="roster-item-delete-btn" title="Delete character" onclick="deleteRosterCharacter('${escHtml(id)}', '${escHtml(name)}')">&#x2715;</button>
    </div>`;
  }).join('');
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function switchToCharacter(id) {
  // Save current character first (silently)
  if (activeCharacterId) {
    saveCharacter({ silent: true });
  }
  // Load the selected character
  const loaded = loadCharacter({ id, silent: true });
  if (loaded) {
    closeRosterPanel();
  } else {
    alert('Could not load character.');
  }
}

function deleteRosterCharacter(id, name) {
  if (!confirm(`Delete character "${name}"? This cannot be undone.`)) return;

  if (storageBackend === 'electron' && dataPath && fs && path) {
    const charPath = path.join(dataPath, id + '.json');
    try {
      if (fs.existsSync(charPath)) fs.unlinkSync(charPath);
    } catch (err) {
      alert('Could not delete file: ' + err.message);
      return;
    }
  } else {
    const roster = getRosterFromLocalStorage();
    delete roster[id];
    localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(roster));
  }

  // If we deleted the active character, clear it and reset the sheet
  if (id === activeCharacterId) {
    activeCharacterId = null;
    setCharacterData(getBlankCharacterTemplate());
  }

  renderRosterPanel();
}

function newBlankCharacter() {
  // Save current before switching
  if (activeCharacterId) {
    saveCharacter({ silent: true });
  }
  activeCharacterId = null;
  setCharacterData(getBlankCharacterTemplate());
  ensureIdentityFieldsEditable();
  closeRosterPanel();
}

function saveAndRefreshRoster() {
  saveCharacter({ silent: true });
  renderRosterPanel();
  alert('Character saved to roster!');
}

// ── End Character Roster ──────────────────────────────────────────────

function importCharacterFromFile() {
  const fileInput = document.getElementById('characterImportInput');
  if (!fileInput) {
    alert('Import control is unavailable on this page.');
    return;
  }
  fileInput.value = '';
  fileInput.click();
}

function handleCharacterFileSelected(event) {
  const selectedFile = event?.target?.files?.[0];
  if (!selectedFile) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const rawText = String(reader.result || '');
      const parsed = JSON.parse(rawText);
      const mapped = mapBuilderCharacterToSheet(parsed);
      // Assign a new roster ID for this imported character
      activeCharacterId = slugifyCharName(mapped.name);
      setCharacterData(mapped);
      saveCharacter({ silent: true });
      alert(`Imported and saved character "${mapped.name}" from ${selectedFile.name}.`);
    } catch (err) {
      console.error('Error importing character file:', err);
      alert('Unable to import that file. Make sure it is a valid SW5E builder JSON export.');
    }
  };

  reader.onerror = () => {
    alert('Unable to read the selected file.');
  };

  reader.readAsText(selectedFile);
}

// Load default character template from bundled data on page load
window.addEventListener('DOMContentLoaded', () => {
  loadClassProgressionCatalog();
  loadForcePowerCatalog();
  loadTechPowerCatalog();
  loadSheetReferenceCatalogs();
  bindIdentityFieldGuards();

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePowerDescriptionModal();
    }
  });

  setCharacterData(getBlankCharacterTemplate());
  console.log('DOMContentLoaded - initialized blank character template');

  document.getElementById('level').addEventListener('change', () => applyLevelProgression());
  document.getElementById('experiencePoints').addEventListener('input', () => updateXpProgress());
  document.getElementById('experiencePoints').addEventListener('change', () => updateXpProgress());
  document.getElementById('maxHitPoints').addEventListener('input', () => updateHitPointCounter());
  document.getElementById('maxHitPoints').addEventListener('change', () => updateHitPointCounter());
  document.getElementById('techPointsMax')?.addEventListener('input', () => updateTechCounter());
  document.getElementById('techPointsMax')?.addEventListener('change', () => updateTechCounter());
  document.getElementById('castingAbility').addEventListener('change', () => applyLevelProgression());
  document.getElementById('forceAffinity').addEventListener('change', () => applyLevelProgression());
  document.getElementById('fecChosen').addEventListener('change', () => applyLevelProgression());
  document.getElementById('str').addEventListener('change', () => {
    updateAbilityModifiers();
    applyLevelProgression();
  });
  document.getElementById('dex').addEventListener('change', () => updateAbilityModifiers());
  document.getElementById('con').addEventListener('change', () => updateAbilityModifiers());
  document.getElementById('int').addEventListener('change', () => updateAbilityModifiers());
  document.getElementById('wis').addEventListener('change', () => {
    updateAbilityModifiers();
    applyLevelProgression();
  });
  document.getElementById('cha').addEventListener('change', () => {
    updateAbilityModifiers();
    applyLevelProgression();
  });

  window.addClassLevelRow = addClassLevelRow;
  window.updateClassLevelRow = updateClassLevelRow;
  window.changeClassLevelBy = changeClassLevelBy;
  window.removeClassLevelRow = removeClassLevelRow;
  window.applyLevelProgression = applyLevelProgression;
  window.switchPowerCatalogTab = switchPowerCatalogTab;
  window.importCharacterFromFile = importCharacterFromFile;
  window.openRosterPanel = openRosterPanel;
  window.closeRosterPanel = closeRosterPanel;
  window.switchToCharacter = switchToCharacter;
  window.deleteRosterCharacter = deleteRosterCharacter;
  window.newBlankCharacter = newBlankCharacter;
  window.saveAndRefreshRoster = saveAndRefreshRoster;

  const importInput = document.getElementById('characterImportInput');
  if (importInput) {
    importInput.addEventListener('change', handleCharacterFileSelected);
  }
});
