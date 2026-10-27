import { makeSprite } from '../engine/sprites.js';
const GLYPH = {
  burst: ['..........', '....a.....', '.a..a..a..', '..a.a.a...', '...aaa....', '.aaawaaa..', '...aaa....', '..a.a.a...', '.a..a..a..', '....a.....'],
  dash: ['..........', '..........', '.....a....', '......a...', '.aaaaaaa..', '........a.', '.aaaaaaa..', '......a...', '.....a....', '..........'],
  shield: ['..........', '.aaaaaaa..', '.awaaaaa..', '.awaaaaa..', '.aaaaaaa..', '..aaaaa...', '...aaa....', '....a.....', '..........', '..........'],
  heal: ['..........', '....aa....', '....aa....', '..aaaaaa..', '..aawwaa..', '..aaaaaa..', '....aa....', '....aa....', '..........', '..........'],
  nova: ['..........', '...aaaa...', '..a....a..', '.a......a.', '.a..ww..a.', '.a..ww..a.', '.a......a.', '..a....a..', '...aaaa...', '..........'],
  meteor: ['.a........', '..a.......', '...a......', '....aa....', '...aaaa...', '..aawwaa..', '..aaaaaa..', '...aaaa...', '....aa....', '..........'],
  summon: ['..........', '....aa....', '....aa....', '...aaaa...', '..a.aa.a..', '..a.aa.a..', '....aa....', '...a..a...', '...a..a...', '..........'],
  beam: ['..........', '..........', '..........', '.aaaaaaaa.', '.wwwwwwww.', '.aaaaaaaa.', '..........', '..........', '..........', '..........'],
  zone: ['..........', '..aaaaaa..', '.a......a.', '.a.aaaa.a.', '.a.a..a.a.', '.a.a.wa.a.', '.a.aaaa.a.', '.a......a.', '..aaaaaa..', '..........'],
  buff: ['..........', '....a.....', '...aaa....', '..aaaaa...', '....a.....', '....a.....', '..a...a...', '.aaa.aaa..', '..a...a...', '..........'],
  chain: ['..........', '....aa....', '...aa.....', '..aa......', '.aaaaa....', '...aa.....', '....aaaaa.', '......aa..', '.....aa...', '....aa....'],
  ultimate: ['....a.....', '....a.....', '...aaa....', '.aaawaaa..', '..aaaaa...', '..aaaaa...', '.aa...aa..', 'a.......a.', '..........', '..........'],
};
const RULES = [['ultimate', /storm$|black_hole|time_stop|rebirth|supernova|army|world_tree|stormlord|absolute|dragon_form|judgment|cataclysm|rewind|kraken|starfall|collapse/], ['chain', /chain|lightning|zap/], ['beam', /beam|jet|smite/], ['dash', /dash|blink|step|walk|dive/], ['shield', /shield|barrier|skin|wall/], ['heal', /heal|mend|restoration|regrowth|drain|harvest|surge/], ['summon', /summon|raise|clone|mirror|sprout|wolves|swarm|skeleton/], ['meteor', /meteor|strike|boulder|bomb|spike$/], ['zone', /cloud|field|inferno|blizzard|consecrate|trap|well|rift|whirlpool|tornado|orb|cyclone/], ['buff', /haste|berserk|focus|vanish|pact|rush|prism|blessing|slow|fear|terror|trick|toss|magic/], ['nova', /nova|quake|stomp|gust|grab|plague|burst_$/], ['burst', /./]];
export function abilityGlyph(id) { for (const [g, re] of RULES) if (re.test(id)) return g; return 'burst'; }
export function abilityIcon(id, color) { const g = abilityGlyph(id); return makeSprite(GLYPH[g], { a: color, w: '#ffffff' }, 'abil:' + g + color); }
