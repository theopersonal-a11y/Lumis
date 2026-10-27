import { makeSprite, PAL } from '../engine/sprites.js';
// Armor pieces: 4 slots per set + charms. Buff keys: hp, mana, def, speed, crit, dmg, luck, regen, manaRegen, petDmg, petHp, fireRes, iceRes, lifesteal, xp, coinBonus
const ICONS = {
  head: ['...kkkkk..', '..kaaaaak.', '.kaaaaaaak', '.kacaaaaak', '.kaaaaaaak', '.kkkkkkkkk', '.kbk...kbk', '..kk...kk.', '..........', '..........'],
  body: ['.kkk..kkk.', 'kaaakkaaak', 'kaaaaaaaak', '.kaaaaaak.', '.kacaaaak.', '.kaaaaaak.', '.kaaabaak.', '.kaaaaaak.', '.kbbbbbbk.', '.kkkkkkkk.'],
  legs: ['.kkkkkkkk.', '.kaaaaaak.', '.kaaaaaak.', '.kaaakaak.', '.kaaakaak.', '.kacakaak.', '.kaaakaak.', '.kbbbkbbk.', '.kkkk.kkk.', '..........'],
  feet: ['..........', '..........', '..kkk..kkk', '..kaak.kaa', '..kaak.kaa', '.kkaakkkaa', 'kaaaakaaaa', 'kbbbbkbbbb', 'kkkkkkkkkk', '..........'],
  charm: ['....kk....', '...kaak...', '..kaaaak..', '..kkkkkk..', '...kaak...', '..kacaak..', '.kaaaaaak.', '.kaaaaaak.', '..kaabak..', '...kkkk...'],
};
const SETS = [
  // id, name, tier, rarity, colors(a,b,c), base def per piece, buffs per piece (scaled by slot), recipe per piece (materials), station, set bonus, desc
  ['leather', 'Leather', 1, 'common', 'n,N,t', 2, { hp: 5 }, [['leather', 3], ['string', 2]], null, { hp: 20, speed: 0.05 }, 'Simple and sturdy.'],
  ['iron', 'Iron', 2, 'uncommon', 'G,g,w', 5, { hp: 8 }, [['iron_bar', 3], ['leather', 1]], 'anvil', { def: 6, hp: 30 }, 'Heavy plate for the brave.'],
  ['apprentice', 'Apprentice Robe', 2, 'uncommon', 'b,B,c', 2, { mana: 15, manaRegen: 0.5 }, [['fiber', 6], ['string', 3], ['crystal', 1]], null, { mana: 50, manaRegen: 2 }, 'Robes of the magic school.'],
  ['hunter', 'Hunter', 2, 'uncommon', 'L,d,t', 3, { speed: 0.04, crit: 0.03 }, [['leather', 3], ['fang', 2], ['feather', 2]], null, { speed: 0.1, crit: 0.1 }, 'Quick and quiet.'],
  ['shadow', 'Shadowweave', 3, 'rare', 'P,k,p', 5, { crit: 0.05, dmg: 0.04 }, [['leather', 4], ['shadow_essence', 1], ['obsidian', 1]], 'altar', { crit: 0.15, dmg: 0.15, lifesteal: 0.05 }, 'Woven from midnight.'],
  ['crystal', 'Crystalline', 3, 'rare', 'c,C,w', 6, { mana: 20, manaRegen: 0.8 }, [['crystal', 8], ['iron_bar', 2], ['arcane_dust', 2]], 'altar', { mana: 80, dmg: 0.1, manaRegen: 2 }, 'Resonates with spells.'],
  ['golden', 'Golden', 3, 'rare', 'y,Y,h', 6, { luck: 0.05, coinBonus: 0.1 }, [['gold_bar', 3], ['leather', 2]], 'anvil', { luck: 0.25, coinBonus: 0.5 }, 'Gaudy, but lucky.'],
  ['frostguard', 'Frostguard', 3, 'rare', 'i,C,w', 8, { hp: 12, iceRes: 0.2 }, [['iron_bar', 3], ['frost_core', 1], ['ice_shard', 4]], 'anvil', { def: 8, hp: 50, thorns_freeze: 1 }, 'Attackers are chilled.'],
  ['emberforge', 'Emberforge', 3, 'rare', 'x,R,y', 8, { dmg: 0.05, fireRes: 0.2 }, [['iron_bar', 3], ['ember_core', 1], ['coal', 6]], 'anvil', { dmg: 0.2, thorns_burn: 1 }, 'Attackers are burned.'],
  ['druid', 'Druid', 3, 'rare', 'l,d,n', 5, { regen: 0.5, petDmg: 0.08 }, [['leather', 3], ['nature_essence', 1], ['herb', 6]], 'cauldron', { regen: 3, petDmg: 0.4, petHp: 0.4 }, 'Beasts fight harder beside you.'],
  ['dragon', 'Dragonscale', 4, 'epic', 'r,R,o', 12, { hp: 20, dmg: 0.06, fireRes: 0.3 }, [['dragon_scale', 3], ['mithril_bar', 1], ['leather', 3]], 'anvil', { def: 15, dmg: 0.3, hp: 100 }, 'Scales of Ignis.'],
  ['mithril', 'Mithril', 4, 'epic', 'I,c,w', 11, { hp: 15, speed: 0.04, crit: 0.03 }, [['mithril_bar', 3], ['leather', 2], ['arcane_dust', 3]], 'anvil', { speed: 0.15, crit: 0.15, def: 10 }, 'Light as silk, hard as stone.'],
  ['phoenix', 'Phoenix', 5, 'legendary', 'o,R,X', 14, { hp: 25, regen: 1, fireRes: 0.5 }, [['phoenix_feather', 1], ['dragon_scale', 2], ['mithril_bar', 2], ['ember_core', 3]], 'altar', { regen: 5, revive: 1, dmg: 0.25 }, 'Rise again from the ashes (once per day).'],
  ['void', 'Voidwalker', 5, 'legendary', 'Z,P,U', 14, { dmg: 0.1, lifesteal: 0.03, crit: 0.04 }, [['void_shard', 1], ['shadow_essence', 3], ['mithril_bar', 2], ['lich_dust', 1]], 'altar', { dmg: 0.4, lifesteal: 0.15, crit: 0.2 }, 'Half here, half elsewhere.'],
  ['celestial', 'Celestial', 6, 'mythic', 'W,U,h', 20, { hp: 40, mana: 40, dmg: 0.1, regen: 1.5, manaRegen: 1 }, [['celestial_dust', 3], ['star_fragment', 1], ['mithril_bar', 3], ['holy_essence', 3]], 'altar', { dmg: 0.5, def: 25, hp: 200, speed: 0.15, luck: 0.3, xp: 0.5 }, 'Armor of the stars themselves.'],
];
const SLOT_MULT = { head: 0.8, body: 1.4, legs: 1.1, feet: 0.7 };
const SLOT_NAMES = { head: ['Cap', 'Helm', 'Hood', 'Crown'], body: ['Tunic', 'Chestplate', 'Robe', 'Mantle'], legs: ['Pants', 'Greaves', 'Leggings', 'Skirt'], feet: ['Shoes', 'Boots', 'Sandals', 'Treads'] };
export const ARMOR = {};
export const ARMOR_LIST = [];
for (const [id, name, tier, rarity, cols, def, buffs, recipe, station, setBonus, desc] of SETS) {
  for (const slot of ['head', 'body', 'legs', 'feet']) {
    const m = SLOT_MULT[slot];
    const b = {}; for (const k in buffs) b[k] = +(buffs[k] * m).toFixed(3);
    const nm = slot === 'head' ? (['apprentice', 'druid', 'shadow', 'void'].includes(id) ? 'Hood' : ['celestial', 'golden'].includes(id) ? 'Crown' : ['leather', 'hunter'].includes(id) ? 'Cap' : 'Helm')
      : slot === 'body' ? (['apprentice', 'druid', 'crystal', 'celestial'].includes(id) ? 'Robe' : ['shadow', 'void', 'phoenix'].includes(id) ? 'Mantle' : ['leather', 'hunter'].includes(id) ? 'Tunic' : 'Chestplate')
      : slot === 'legs' ? (['apprentice', 'druid', 'celestial', 'crystal'].includes(id) ? 'Leggings' : ['leather', 'hunter', 'shadow', 'void'].includes(id) ? 'Pants' : 'Greaves')
      : (['apprentice', 'druid'].includes(id) ? 'Sandals' : ['celestial', 'void', 'shadow'].includes(id) ? 'Treads' : ['leather', 'hunter'].includes(id) ? 'Shoes' : 'Boots');
    const piece = { id: id + '_' + slot, name: name + ' ' + nm, slot, set: id, setName: name, tier, rarity, cols, def: Math.round(def * m), buffs: b, recipe: recipe.map(([i, n]) => [i, Math.max(1, Math.round(n * m))]), station, setBonus, desc, type: 'armor', value: tier * tier * 20, stack: 1 };
    ARMOR[piece.id] = piece; ARMOR_LIST.push(piece);
  }
}
const CH = (id, name, rarity, cols, buffs, recipe, station, desc, extra = {}) => { const c = { id, name, slot: 'charm', tier: 3, rarity, cols, def: 0, buffs, recipe, station, desc, type: 'armor', value: 100, stack: 1, ...extra }; ARMOR[id] = c; ARMOR_LIST.push(c); };
CH('ring_luck', 'Ring of Fortune', 'rare', 'y,Y,h', { luck: 0.2, coinBonus: 0.2 }, [['gold_bar', 2], ['ancient_coin', 1]], 'anvil', 'Finders keepers.');
CH('amulet_regen', 'Amulet of Vitality', 'rare', 'l,L,w', { regen: 2, hp: 30 }, [['nature_essence', 1], ['herb', 10], ['string', 3]], 'cauldron', 'Wounds close on their own.');
CH('swift_charm', 'Swift Charm', 'uncommon', 'i,c,w', { speed: 0.15 }, [['feather', 10], ['gale_core', 1]], null, 'Light on your feet.');
CH('beast_charm', 'Beast Charm', 'rare', 'n,N,r', { petDmg: 0.3, petHp: 0.3 }, [['fang', 10], ['leather', 3], ['nature_essence', 1]], null, 'Your pets fight with fury.');
CH('mana_pendant', 'Mana Pendant', 'rare', 'b,B,c', { mana: 60, manaRegen: 2 }, [['crystal', 10], ['arcane_dust', 5]], 'altar', 'Spells flow freely.');
CH('vampire_fang', 'Vampire Fang', 'epic', 'r,R,w', { lifesteal: 0.1, dmg: 0.1 }, [['fang', 20], ['shadow_essence', 2], ['soul_shard', 5]], 'altar', 'Drink deep.');
CH('lucky_coin', 'Lucky Coin', 'uncommon', 'Y,N,y', { luck: 0.1, coinBonus: 0.3 }, [['coins', 200], ['ancient_coin', 1]], null, 'Always lands on heads.');
CH('dragon_eye', "Dragon's Eye", 'epic', 'o,R,y', { dmg: 0.25, crit: 0.1, fireRes: 0.3 }, [['dragon_scale', 2], ['ember_core', 2], ['gold_bar', 2]], 'altar', 'It still watches.');
CH('timepiece', "Chronomancer's Watch", 'legendary', 'j,z,c', { cdr: 0.25, speed: 0.1 }, [['time_shard', 1], ['gold_bar', 5], ['crystal', 20]], 'altar', '-25% ability cooldowns.');
CH('phoenix_heart', 'Phoenix Heart', 'legendary', 'x,R,W', { regen: 4, revive: 1, fireRes: 0.5 }, [['phoenix_feather', 1], ['ember_core', 5], ['holy_essence', 2]], 'altar', 'Revive once per day.');
CH('scholar_glasses', "Scholar's Spectacles", 'rare', 'G,g,w', { xp: 0.3, manaRegen: 1 }, [['crystal', 6], ['iron_bar', 2], ['xp_tome', 1]], null, '+30% XP gained.');
CH('tamer_bell', "Tamer's Bell", 'epic', 'y,Y,h', { tame: 0.2, petDmg: 0.2, petHp: 0.2 }, [['gold_bar', 3], ['honey', 10], ['magic_treat', 3]], 'anvil', '+20% taming chance.');
CH('lumis_shard', 'Shard of Lumis', 'mythic', 'W,X,h', { dmg: 0.3, regen: 3, luck: 0.3, xp: 0.3, cdr: 0.15, speed: 0.1 }, [['lumis_fragment', 1], ['celestial_dust', 5], ['star_fragment', 2]], 'altar', 'A fragment of the lost beacon.');
export function armorIcon(id) {
  const a = ARMOR[id]; if (!a) return null; if (a._icon) return a._icon;
  const [x, y, z] = a.cols.split(',');
  return a._icon = makeSprite(ICONS[a.slot], { a: PAL[x], b: PAL[y], c: PAL[z], k: '#10101a' }, 'armor:' + id);
}
