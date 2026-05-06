// Renderer process logic for SW5E Character Sheet
let fs, path, app, dataPath;
let storageBackend = 'none';
let forcePowerCatalog = [];
const LOCAL_STORAGE_KEY = 'sw5e.character';

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
    1: 4, 2: 5, 3: 6, 4: 7, 5: 8,
    6: 9, 7: 10, 8: 11, 9: 12, 10: 12,
    11: 13, 12: 13, 13: 14, 14: 14, 15: 15,
    16: 15, 17: 16, 18: 16, 19: 17, 20: 17
  },
  scout: {
    1: 0, 2: 2, 3: 3, 4: 3, 5: 4,
    6: 4, 7: 5, 8: 5, 9: 6, 10: 6,
    11: 7, 12: 7, 13: 8, 14: 8, 15: 9,
    16: 9, 17: 10, 18: 10, 19: 11, 20: 11
  }
};

const CLASS_OPTIONS = [
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
      name: String(entry?.name || 'Consular'),
      level: Math.max(1, coerceNumber(entry?.levels, 1)),
      archetype: String(entry?.archetype?.name || '')
    }))
    : [{ name: 'Consular', level: 1, archetype: '' }];

  const importedSkills = (data?.skills && typeof data.skills === 'object')
    ? data.skills
    : buildSkillsFromTweaks(data?.tweaks);

  const forcePowers = extractClassForcePowers(classes);
  const conditions = normalizeConditionList(data?.currentStats?.conditions);

  return {
    name: String(data?.name || 'Unnamed Character'),
    species: String(data?.species?.name || ''),
    class: String(firstClass?.name || 'Consular'),
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
    forcePowers
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

function getDefaultClassEntry() {
  return {
    name: 'Consular',
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
  return normalizeClassConfig(classConfig).reduce((total, entry) => total + Math.max(0, Number(entry.level) || 0), 0);
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
      name: row.querySelector('.class-level-select')?.value || 'Consular',
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

  if (levelEl) {
    levelEl.value = totalLevel;
  }
  if (classEl) {
    classEl.value = normalized.map((entry) => `${entry.name} ${entry.level}`).join(' / ');
  }
  if (archetypeEl) {
    archetypeEl.value = normalized.map((entry) => entry.archetype).filter(Boolean).join(' / ');
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
  container.innerHTML = normalized.map((entry, index) => `
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
        <input id="classArchetype_${index}" class="class-archetype-input" value="${entry.archetype.replace(/"/g, '&quot;')}" placeholder="Optional" onchange="updateClassLevelRow(${index}, 'archetype', this.value)">
      </div>
      <div class="class-level-field class-level-field--actions">
        <label class="fp-label">Row</label>
        <button type="button" class="class-level-remove" onclick="removeClassLevelRow(${index})" ${normalized.length <= 1 ? 'disabled' : ''}>Remove</button>
      </div>
    </div>
  `).join('');
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

function setClassLevelConfig(classConfig) {
  const normalized = normalizeClassConfig(classConfig);
  renderClassLevelRows(normalized);
  renderLevelChoicePanel(normalized);
}

function addClassLevelRow() {
  const current = getClassLevelConfig();
  const nextClass = CLASS_OPTIONS.find((option) => !current.some((entry) => entry.name === option)) || 'Consular';
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
  const chaMod = getAbilityModifier(character.attributes?.cha);
  const activeCastingMod = castingAbility === 'cha' ? chaMod : wisMod;
  const primaryConsularArchetype = classConfig.find((entry) => String(entry.name || '').toLowerCase().includes('consular'))?.archetype || character.archetype;

  let forcePointsMax = consularLevel > 0 ? row.forcePoints : 0;
  if (consularLevel >= 3 && affinity === 'bendu') {
    forcePointsMax += wisMod + chaMod;
  } else if (consularLevel > 0) {
    forcePointsMax += activeCastingMod;
  }

  const forceShieldUses = consularLevel < 2 ? 0 : 2 + (consularLevel >= 5 ? 1 : 0) + (consularLevel >= 9 ? 1 : 0) + (consularLevel >= 13 ? 1 : 0) + (consularLevel >= 17 ? 1 : 0);
  const forceRecoveryAmount = consularLevel < 1 ? 0 : Math.max(1, Math.floor(consularLevel / 2) + activeCastingMod);
  const techPowersKnown = classConfig.reduce((sum, entry) => sum + getTechPowersKnownForClass(entry.name, entry.level), 0);
  const classFeatures = consularLevel > 0 ? getClassFeaturesByLevel(consularLevel) : [];
  const telekinetics = isTelekineticsArchetype(primaryConsularArchetype)
    ? getTelekineticsFeatures(consularLevel)
    : { features: [], telekineticStats: { mightyBlastTargets: 0, repulsingWaveUses: 0 } };

  const allFeatures = classFeatures.concat(telekinetics.features);
  const warnings = [];
  const selectedFec = character.forceConfig?.fecChosen || [];
  const asiSpent = character.abilityScoreConfig?.asiHistory?.length || 0;
  const asiAllowed = classConfig.reduce((sum, entry) => sum + getAsiSlots(entry.level), 0);
  const unsupportedClasses = Array.from(new Set(classConfig
    .map((entry) => String(entry.name || ''))
    .filter((name) => name && !SUPPORTED_PROGRESSION_CLASSES.includes(name.toLowerCase()))));

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
    warnings.push(`Detailed progression tables are not yet implemented for: ${unsupportedClasses.join(', ')}. Those classes still count toward total level and proficiency bonus.`);
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
    forcePowersKnown: consularLevel > 0 ? row.forcePowersKnown : 0,
    techPowersKnown,
    forcePointsMax,
    maxPowerLevel: consularLevel > 0 ? row.maxPowerLevel : 0,
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
  refreshForcePowerCastButtons(remaining);
  updateForceRecoveryButtonState(getCurrentForceRecoveryAmount());
}

function refreshForcePowerCastButtons(remainingPoints) {
  const castButtons = document.querySelectorAll('.power-cast');
  castButtons.forEach((button) => {
    const cost = parseInt(button.dataset.cost, 10) || 0;
    const disabled = cost > remainingPoints;
    button.disabled = disabled;
    button.title = disabled ? `Requires ${cost} Force Points` : `Cast for ${cost} Force Points`;
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
  const withoutLevelPrefix = String(feature || '').replace(/^Level\s+\d+:\s*/, '');
  return FEATURE_DETAILS[withoutLevelPrefix] || FEATURE_DETAILS[feature] || 'Feature description not yet added to the sheet. Add this text to FEATURE_DETAILS in renderer.js if you want custom wording.';
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

function getCurrentForcePowersKnown() {
  return getNumericReadonlyFieldValue('forcePowersKnown');
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
    listElement.innerHTML = '<p class="features-empty">No features unlocked yet.</p>';
    return;
  }

  const forceShieldMaxUses = progression?.forceShieldUses ?? getCurrentForceShieldMaxUses();
  const forceRecoveryAmount = progression?.forceRecoveryAmount ?? getCurrentForceRecoveryAmount();
  let hasForceShield = false;
  let hasForceRecovery = false;

  features.forEach((feature) => {
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
    name.textContent = feature;

    const desc = document.createElement('div');
    desc.className = 'feature-description hidden';
    desc.textContent = getFeatureDescription(feature);

    const baseFeature = String(feature || '').replace(/^Level\s+\d+:\s*/, '');
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

function setProgressionOutputs(progression) {
  document.getElementById('proficiencyBonus').value = `Proficiency Bonus: +${progression.pb}`;
  document.getElementById('forcePowersKnown').value = `Force Powers Known: ${progression.forcePowersKnown}`;
  const techPowersKnownEl = document.getElementById('techPowersKnown');
  if (techPowersKnownEl) {
    techPowersKnownEl.value = `Tech Powers Known: ${progression.techPowersKnown}`;
  }
  document.getElementById('forcePointsMax').value = `Maximum Force Points: ${progression.forcePointsMax}`;
  document.getElementById('maxPowerLevel').value = `Max Power Level: ${progression.maxPowerLevel}`;
  document.getElementById('fecOptionsAllowed').value = `FEC Options Allowed: ${progression.fecOptionsAllowed}`;
  document.getElementById('forceRecoveryAmount').value = `Force Recovery: ${progression.forceRecoveryAmount}`;
  document.getElementById('forceShieldUses').value = `Force Shield Uses: ${progression.forceShieldUses}`;
  document.getElementById('repulsingWaveUses').value = `Repulsing Wave Uses: ${progression.repulsingWaveUses}`;
  document.getElementById('mightyBlastTargets').value = `Mighty Blast Targets: ${progression.mightyBlastTargets}`;
  updateAsiStatus(progression.level, getAsiHistoryFromUi());
  updateSkills();
  updateXpProgress();
  updateForceCounter();
  renderForcePowerCatalog();

  // Update FEC slots label and enforce checkbox limit
  const slotsLabel = document.getElementById('fecSlotsLabel');
  if (slotsLabel) {
    slotsLabel.textContent = progression.fecOptionsAllowed;
  }
  enforceFecCheckboxLimit(progression.fecOptionsAllowed);

  renderForceAffinityInfo(document.getElementById('forceAffinity')?.value || 'none');

  const validation = document.getElementById('levelValidation');
  validation.textContent = progression.warnings.length
    ? progression.warnings.join(' ')
    : 'Level requirements satisfied.';

  renderFeatureList(progression.features, progression);
}

function applyLevelProgression(options = {}) {
  const character = options.characterData || getCharacterData();
  const progression = buildProgression(character);

  document.getElementById('level').value = progression.level;
  setProgressionOutputs(progression);

  if (options.announce) {
    alert(`Level rules applied for level ${progression.level}.`);
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
    forcePowers: getForcePowersList()
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

  // Force powers - ensure they render properly
  const powersList = data.forcePowers || [];
  if (Array.isArray(powersList)) {
    renderForcePowers(powersList);
  } else {
    console.warn('Force powers is not an array:', powersList);
    renderForcePowers([]);
  }

  // Apply level progression to update all calculated fields
  applyLevelProgression({ characterData: data });
  
  console.log('Character data loaded successfully:', data.name);
  } catch (err) {
    console.error('Error in setCharacterData:', err);
  }
}

function saveCharacter() {
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
      const charPath = path.join(dataPath, 'character.json');
      fs.writeFileSync(charPath, JSON.stringify(data, null, 2));
      console.log('Character saved to:', charPath);
      alert(`Character "${data.name}" saved successfully to desktop file!`);
      return;
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    console.log('Character saved to localStorage key:', LOCAL_STORAGE_KEY);
    alert(`Character "${data.name}" saved successfully to browser local storage!`);
  } catch (err) {
    console.error('Error saving character:', err);
    alert('Error saving character: ' + err.message);
  }
}

function loadCharacter(options = {}) {
  const silent = Boolean(options.silent);
  try {
    let data;

    if (storageBackend === 'electron' && dataPath && fs && path) {
      const charPath = path.join(dataPath, 'character.json');
      if (!fs.existsSync(charPath)) {
        if (!silent) {
          alert('No saved character file found at: ' + charPath);
        }
        return false;
      }
      const fileData = fs.readFileSync(charPath, 'utf-8');
      data = JSON.parse(fileData);
      console.log('Character loaded from:', charPath);
    } else {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) {
        if (!silent) {
          alert('No saved character found in browser local storage.');
        }
        return false;
      }
      data = JSON.parse(raw);
      console.log('Character loaded from localStorage key:', LOCAL_STORAGE_KEY);
    }
    
    if (!data.name) {
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
    
    setCharacterData(data);
    if (!silent) {
      alert(`Character "${data.name}" loaded successfully from ${getStorageModeLabel()}!`);
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
    forcePowerCatalog = JSON.parse(fileData)
      .map((power) => ({
        name: power.name,
        level: Number(power.level) || 0,
        description: power.description || descriptions[power.name] || ''
      }))
      .map((power) => ({
        ...power,
        alignment: resolveForcePowerAlignment(power)
      }))
      .filter((power) => power.name)
      .sort((left, right) => left.level - right.level || left.name.localeCompare(right.name));

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

function getForcePowersList() {
  const items = document.querySelectorAll('#powersLeft .power-item, #powersRight .power-item');
  return Array.from(items).map(el => ({
    name: el.dataset.power,
    level: parseInt(el.dataset.level, 10),
    alignment: el.dataset.alignment || 'universal',
    description: el.dataset.description || ''
  }));
}

function normalizeForcePowerName(name) {
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

function openPowerDescriptionModal(power) {
  const overlay = ensurePowerDescriptionModal();
  const titleEl = document.getElementById('powerModalTitle');
  const metaEl = document.getElementById('powerModalMeta');
  const bodyEl = document.getElementById('powerModalBody');

  if (!titleEl || !metaEl || !bodyEl) {
    return;
  }

  titleEl.textContent = power.name;
  metaEl.textContent = powerLevelLabel(power.level);
  bodyEl.textContent = power.description || 'No description available.';
  overlay.classList.remove('hidden');
}

function closePowerDescriptionModal() {
  const overlay = document.getElementById('powerDescriptionModal');
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

function renderForcePowerCatalog() {
  const listEl = document.getElementById('forcePowerCatalogList');
  const statusEl = document.getElementById('forcePowerCatalogStatus');
  if (!listEl || !statusEl) {
    return;
  }

  if (!forcePowerCatalog.length) {
    statusEl.textContent = 'Force power catalog unavailable.';
    listEl.innerHTML = '<p class="features-empty">Unable to load force power catalog.</p>';
    return;
  }

  const filterValue = document.getElementById('forcePowerFilter')?.value || 'all';
  const alignmentFilter = document.getElementById('forcePowerAlignmentFilter')?.value || 'all';
  const searchValue = normalizeForcePowerName(document.getElementById('forcePowerSearch')?.value || '');
  const knownPowers = new Set(getForcePowersList().map((power) => normalizeForcePowerName(power.name)));
  const maxPowerLevel = getCurrentMaxForcePowerLevel();
  const canLearnForcePowers = getCurrentForcePowersKnown() > 0;
  const filteredPowers = forcePowerCatalog.filter((power) => {
    const isKnown = knownPowers.has(normalizeForcePowerName(power.name));
    if (isKnown) {
      return false;
    }
    const matchesLevel = filterValue === 'all' || String(power.level) === filterValue;
    const matchesAlignment = alignmentFilter === 'all' || (power.alignment || 'universal') === alignmentFilter;
    const matchesSearch = !searchValue || normalizeForcePowerName(power.name).includes(searchValue);
    return matchesLevel && matchesAlignment && matchesSearch;
  });

  const availabilityLabel = canLearnForcePowers
    ? `Current max usable level: ${powerLevelLabel(maxPowerLevel)}.`
    : 'Forcecasting progression is not active for this character yet.';
  statusEl.textContent = `Showing ${filteredPowers.length} of ${forcePowerCatalog.length} force powers. ${availabilityLabel}`;

  if (!filteredPowers.length) {
    listEl.innerHTML = '<p class="features-empty">No force powers match the current filters.</p>';
    return;
  }

  listEl.innerHTML = '';
  filteredPowers.forEach((power) => {
    const isLocked = !canLearnForcePowers || power.level > maxPowerLevel;
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
    addBtn.onclick = () => addCatalogForcePower(power.name);

    row.appendChild(info);
    row.appendChild(addBtn);

    if (hasDescription) {
      const expandBtn = topRow.querySelector('.power-catalog-expand');
      expandBtn.onclick = () => openPowerDescriptionModal(power);
    }

    listEl.appendChild(row);
  });
}

function renderForcePowers(powers) {
  const leftCol = document.getElementById('powersLeft');
  const rightCol = document.getElementById('powersRight');
  if (!leftCol || !rightCol) return;
  leftCol.innerHTML = '';
  rightCol.innerHTML = '';

  // Normalize: accept both { name, level, alignment } objects and legacy strings
  const normalized = powers.map(p =>
    typeof p === 'string'
      ? { name: p.trim(), level: 0, alignment: 'universal', description: '' }
      : { name: p.name, level: p.level ?? 0, alignment: p.alignment || 'universal', description: p.description || '' }
  ).filter(p => p.name);

  // Group by level
  const groups = {};
  normalized.forEach(p => {
    if (!groups[p.level]) groups[p.level] = [];
    groups[p.level].push(p);
  });

  const sortedLevels = Object.keys(groups).map(Number).sort((a, b) => a - b);

  // Even-index levels go left, odd-index go right
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
    groups[lvl].forEach(p => {
      const powerContainer = document.createElement('div');
      powerContainer.className = 'power-item';

      // Header row with expand button, name, cost, and actions
      const headerRow = document.createElement('div');
      headerRow.className = 'power-header';

      let expandBtn = null;
      if (p.description) {
        expandBtn = document.createElement('button');
        expandBtn.type = 'button';
        expandBtn.className = 'power-expand';
        expandBtn.setAttribute('aria-label', `Show ${p.name} description`);
        expandBtn.innerHTML = '▼';
        expandBtn.onclick = (e) => {
          e.stopPropagation();
          openPowerDescriptionModal({
            name: p.name,
            level: lvl,
            description: p.description
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
      name.className = `power-name power-name--${p.alignment}`;
      name.textContent = p.name;
      nameAndCost.appendChild(name);

      const cost = document.createElement('span');
      cost.className = 'power-cost';
      cost.textContent = `${getForcePowerCost(lvl)} FP`;
      nameAndCost.appendChild(cost);

      headerRow.appendChild(nameAndCost);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'power-actions';

      const castBtn = document.createElement('button');
      castBtn.type = 'button';
      castBtn.className = 'power-cast';
      castBtn.textContent = 'Cast';
      castBtn.dataset.cost = getForcePowerCost(lvl);
      castBtn.setAttribute('aria-label', `Cast ${p.name}`);
      castBtn.onclick = () => castForcePower(lvl, p.name);
      actionsDiv.appendChild(castBtn);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'power-remove';
      removeBtn.setAttribute('aria-label', 'Remove');
      removeBtn.innerHTML = '✕';
      removeBtn.onclick = () => removeForcePower(removeBtn);
      actionsDiv.appendChild(removeBtn);

      headerRow.appendChild(actionsDiv);
      powerContainer.appendChild(headerRow);

      powerContainer.dataset.power = p.name;
      powerContainer.dataset.level = lvl;
      powerContainer.dataset.alignment = p.alignment;
      powerContainer.dataset.description = p.description || '';

      tagsRow.appendChild(powerContainer);
    });
    section.appendChild(tagsRow);
    col.appendChild(section);
  });

  const remaining = parseInt(document.getElementById('fpRemaining')?.textContent, 10) || 0;
  refreshForcePowerCastButtons(remaining);
  renderForcePowerCatalog();
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

  const current = getForcePowersList();
  if (!current.some((power) => normalizeForcePowerName(power.name) === normalizeForcePowerName(selectedPower.name))) {
    renderForcePowers([...current, selectedPower]);
  }
}

function removeForcePower(btn) {
  btn.closest('.power-item')?.remove();
  // Re-render to clean up empty level groups
  renderForcePowers(getForcePowersList());
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
      setCharacterData(mapped);
      alert(`Imported character "${mapped.name}" from ${selectedFile.name}.`);
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
  loadForcePowerCatalog();

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePowerDescriptionModal();
    }
  });

  const loadedSaved = loadCharacter({ silent: true });
  if (loadedSaved) {
    console.log('DOMContentLoaded - loaded saved character');
  } else {
    console.log('DOMContentLoaded - loading netahl.json template');
    const characterData = loadTemplate();
    if (characterData) {
      setCharacterData(characterData);
      console.log('Character template populated successfully');
    }
  }

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
  window.importCharacterFromFile = importCharacterFromFile;

  const importInput = document.getElementById('characterImportInput');
  if (importInput) {
    importInput.addEventListener('change', handleCharacterFileSelected);
  }
});
