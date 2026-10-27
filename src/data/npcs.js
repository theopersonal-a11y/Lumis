import { makeSprite, PAL } from '../engine/sprites.js';
const HUMAN = ['....hhhh....', '...hhhhhh...', '...hTkTkh...', '...hTTTTh...', '....TTTT....', '...rrrrrr...', '..rrrrrrrr..', '..r.rrrr.r..', '..T.rrrr.T..', '....rrrr....', '....rrrr....', '....rr.rr...', '....NN.NN...'];
const DWARF = ['....hhhh....', '...hhhhhh...', '...hTkTkh...', '...hhhhhh...', '...hhhhhh...', '..rrrrrrrr..', '..rrrrrrrr..', '.rr.rrrr.rr.', '....rrrr....', '....rr.rr...', '....NN.NN...'];
const FAIRY = ['....hhhh....', '...hhkhkh...', '..c.TTTT.c..', '.cc.rrrr.cc.', '.cccrrrrccc.', '..ccrrrrcc..', '...crrrrc...', '....rrrr....', '....r..r....'];
const SHROOM = ['...hhhhhh...', '..hhwhhhwh..', '.hhhhhhhhhh.', '.hwhhhhhhwh.', '..rrrrrrrr..', '...TTTTTT...', '...TkTTkT...', '...TTTTTT...', '...TT..TT...', '...NN..NN...'];
const ELF = ['....hhhh....', '..h.hhhh.h..', '..hhTkTkhh..', '...hTTTTh...', '....TTTT....', '...rrrrrr...', '..rrrrrrrr..', '..r.rrrr.r..', '..T.rrrr.T..', '....rrrr....', '....rr.rr...', '....NN.NN...'];
const GHOST = ['....hhhh....', '...hhhhhh...', '..hhkhhkhh..', '..hhhhhhhh..', '..hhhhhhhh..', '..hhhhhhhh..', '..hhhhhhhh..', '..h.hh.hh.h.'];
// [id, name, title, shape, hair/robe/skin colors, idle lines, shop items (ids), extra]
const N = [
  ['elder', 'Elder Rowan', 'Village Elder', HUMAN, 'G,b,T', ['The beacon has been dark for a hundred years. Perhaps you will be the one to relight it.', 'Everdawn was once the brightest village in the realm.', 'Rest at a bed to pass the night, young wizard.'], null],
  ['merchant', 'Mira', 'Merchant', HUMAN, 'o,l,T', ['Buy something! Or sell me your junk. I mean treasures.', 'Coins make the world go round.', 'Potions on the left, snacks on the right.'], ['potion_hp', 'potion_mana', 'bread', 'apple', 'meat', 'fish', 'carrot', 'cheese', 'honey', 'bug', 'hay', 'recall_scroll', 'bomb', 'saddle', 'magic_treat']],
  ['blacksmith', 'Borin', 'Blacksmith', DWARF, 'o,G,T', ['Bring me ore and I\'ll smelt it. Well, YOU smelt it at my anvil.', 'A good wand needs a good core.', 'Mithril! Now THAT is a metal.'], ['copper_bar', 'iron_bar', 'coal', 'flint', 'leather', 'string']],
  ['baker', 'Hob', 'Baker', HUMAN, 'n,w,T', ['Fresh bread! Still warm.', 'My ovens never go cold.', 'Pets love my honey buns. So do bandits.'], ['bread', 'honey', 'cheese', 'cherry', 'pumpkin', 'cooked_meat', 'cooked_fish']],
  ['guard', 'Captain Ada', 'Village Guard', HUMAN, 'k,G,T', ['Goblins to the east, bandits in the west. Stay alert.', 'The night brings worse things than wolves.', 'If you see the Warlord, run. Or don\'t. Your call.'], null],
  ['tailor', 'Wren', 'Tailor', HUMAN, 'p,m,T', ['Leather, cloth, scales... I can tell you what armor you need.', 'A matching set gives you a bonus, you know.', 'Celestial thread is a myth. Probably.'], ['leather', 'string', 'fiber', 'feather']],
  ['farmer', 'Old Pip', 'Farmer', HUMAN, 'G,n,T', ['The boars trampled everything. Everything!', 'Scarecrows don\'t scare what comes at night.', 'Pumpkins. Pumpkins as far as the eye can see, once.'], ['seed', 'carrot', 'pumpkin', 'hay']],
  ['fairyqueen', 'Queen Lune', 'Fairy Queen', FAIRY, 'y,m,T', ['Welcome, mortal. The pond remembers kindness.', 'Fairies adore honey. Hint, hint.', 'The unicorns have fled to the Elven Grove.'], null],
  ['hermit', 'Odd', 'Hermit', HUMAN, 'w,g,T', ['...', 'Secrets? Try pressing V with a wand that deserves it.', 'There are 182 creatures in this world. I have counted.', 'Chronos is not a legend. Time Shards fall when the Void Lord dies.'], null],
  ['fisher', 'Finn', 'Fisher', HUMAN, 'y,b,T', ['Stand by the water and press F. Patience!', 'Caught a boot once. It bit me.', 'The Kraken took my brother\'s boat. And my brother.'], ['fish', 'cooked_fish', 'coral', 'reed']],
  ['sailor', 'Salty Sam', 'Sailor', HUMAN, 'k,b,T', ['There\'s treasure buried in the cove to the south. Mimics guard it.', 'The lighthouse keeper is lonely. Visit her.', 'Yarr.'], null],
  ['scout', 'Fenn', 'Scout', HUMAN, 'l,L,T', ['From up here I can see the ruins to the northwest.', 'Griffins nest on the mountains. Bring meat.', 'The arena opens at night. The Jester laughs.'], null],
  ['archmage', 'Archmage Vel', 'Archmage', HUMAN, 'w,p,T', ['Magic is patience, and a great deal of arcane dust.', 'Tier 4 wands need the altar. I built it. You\'re welcome.', 'Each boss holds a Lumis Fragment. Five fragments, one core.'], ['arcane_dust', 'crystal', 'potion_mana2', 'xp_tome', 'wand_tome', 'runestone']],
  ['witch', 'Morgana', 'Witch', HUMAN, 'k,P,T', ['Eye of newt, spore of shroom... what do YOU need?', 'My cauldron brews nature wands. And trouble.', 'The Haunted Manor to the south was mine once.'], ['potion_regen', 'potion_luck', 'potion_invis', 'venom_sac', 'spore', 'soul_shard', 'glow_berry']],
  ['shroom_elder', 'Elder Puff', 'Shroom Elder', SHROOM, 'r,T,T', ['Welcome to Sporewood. Mind the spores.', 'The brutes have gone mad. Too many spores.', 'Shroomlings are gentle. Feed them vegetables.'], null],
  ['shroom_cook', 'Chef Morel', 'Shroom Cook', SHROOM, 'o,T,T', ['Mushroom stew! Best in the realm.', 'Glow caps make everything taste like starlight.'], ['mushroom', 'glow_cap', 'spore', 'cooked_meat', 'crystal_candy']],
  ['shroom_kid', 'Sprout', 'Shroom Kid', SHROOM, 'm,T,T', ['Have you seen a Cheshire Cat? It grins!', 'I want a pet butterfly!'], null],
  ['dwarf', 'Durga Ironfist', 'Mine Foreman', DWARF, 'r,G,T', ['Mithril runs deep. Crystal deeper. Starmetal deepest.', 'Golems guard the quarry to the east. Big fellas.', 'Feed a golem crystal candy and it\'ll follow you home.'], ['iron_ore', 'copper_ore', 'gold_ore', 'crystal', 'coal', 'crystal_candy', 'mithril_ore']],
  ['elf', 'Sylva', 'Elf Ranger', ELF, 'y,L,T', ['The grove is sacred. Harm nothing here.', 'Unicorns love sweet things. Honey, cherries.', 'The Angry Treants were our friends once.'], ['nature_essence', 'herb', 'cherry', 'apple', 'egg_nature']],
  ['librarian', 'Quill', 'Librarian', GHOST, 'I,I,I', ['Shhh. The books are sleeping.', 'I died in 1203. The late fees were... considerable.', 'Chapter 7: Elemental cores drop from elementals. Obviously.'], ['xp_tome', 'wand_tome', 'pet_tome', 'runestone', 'map_fragment']],
  ['alchemist', 'Zed', 'Alchemist', HUMAN, 'l,c,T', ['Don\'t touch that. Or that. That one is fine.', 'Elixirs! Rare, but I sell them.', 'Bombs are just potions that disagree with you.'], ['potion_hp2', 'potion_mana2', 'potion_speed', 'potion_str', 'potion_def', 'elixir', 'bomb']],
  ['beastmaster', 'Tilly', 'Beastmaster', HUMAN, 'o,y,T', ['Every creature has a favorite food. Find it, and press F near them.', 'Rarer creatures are harder to tame. Treats help!', 'Mount a pet with R. Flying pets cross water!', 'Golden Treats guarantee a tame. I only have a few.'], ['magic_treat', 'bug', 'meat', 'fish', 'hay', 'glow_berry', 'ember_fruit', 'crystal_candy', 'soul_shard', 'pet_tome', 'saddle', 'egg_mystery']],
  ['arenamaster', 'Gruk', 'Arena Master', DWARF, 'k,r,T', ['Fight! Win! Get loot! Simple.', 'The Chaos Jester shows up at night. Mad as a hatter.', 'Lions in the arena. Don\'t pet them. Actually, do.'], null],
  ['keeper', 'Ilse', 'Lighthouse Keeper', HUMAN, 'w,c,T', ['The light keeps the sea calm. Mostly.', 'Moths come from miles around.', 'The Sunken Temple is east. Only the brave go there.'], ['fish', 'pearl', 'coral', 'potion_hp']],
  ['trader', 'Kasim', 'Desert Trader', HUMAN, 'k,y,T', ['Water? Spices? Golden scorpions?', 'The Pyramid holds a golden chest. Also mummies.', 'Scarabs bring luck. Mine brought me here.'], ['cactus_fruit', 'gold_ore', 'ancient_coin', 'potion_luck', 'ruin_key', 'sand_pearl']],
  ['forgemaster', 'Ember', 'Forgemaster', DWARF, 'x,K,T', ['The lava heats my forge. And my temper.', 'Dragonbone needs dragon scales. Shocking, I know.', 'The Phoenix nests above. Bring Ember Fruit.'], ['ember_core', 'obsidian', 'coal', 'ember_fruit', 'egg_fire']],
  ['bogwitch', 'Grandmother Toad', 'Bog Witch', HUMAN, 'G,J,T', ['Ribbit. I mean, hello.', 'Frogs are easy to tame. Bugs!', 'A Hydra hatchling sleeps in the Sunken Temple.'], ['venom_sac', 'swamp_moss', 'bug', 'potion_regen']],
  ['icehunter', 'Bjorn', 'Ice Hunter', HUMAN, 'y,i,T', ['The Titan sleeps in the shrine. Let him sleep.', 'Frost Wolves make the best mounts in the snow.', 'Fish. Everything up here eats fish.'], ['fish', 'cooked_fish', 'ice_shard', 'frost_core', 'leather']],
  ['icechild', 'Lumi', 'Ice Child', HUMAN, 'w,m,T', ['I built that snowman! His name is Gerald.', 'Penguins are the best. The BEST.'], null],
];
export const NPCS = {}; export const NPC_LIST = [];
for (const [id, name, title, shape, cols, lines, shop] of N) { const n = { id, name, title, shape, cols, lines, shop }; NPCS[id] = n; NPC_LIST.push(n); }
export function npcSprite(id) {
  const n = NPCS[id]; if (!n) return null; if (n._spr) return n._spr;
  const [h, r, T] = n.cols.split(',');
  return n._spr = makeSprite(n.shape, { h: PAL[h], r: PAL[r], T: PAL[T], c: PAL.c, w: PAL.w }, 'npc:' + id);
}
