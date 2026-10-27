# LUMIS — A Wizard World

A 2D pixel-art wizard adventure that runs entirely in the browser. No build step, no dependencies.

**Play:** open `index.html` through any static server (or deploy to Vercel).

```
npm run dev      # local server at http://localhost:5173
npm run check    # validates every item / wand / pet / quest / POI reference
```

## What's inside

| | |
|---|---|
| **68 wands** | Each with E / Q / C abilities. Mythic & secret wands unlock a hidden **V** ultimate. Wands level up from kills (+8% dmg per level). |
| **182 pets** | 51 species with elemental variants. Tame them with their favorite food, they fight beside you, buff your stats, and 63 of them can be ridden (53 fly over water & lava). |
| **73 armor pieces** | 15 sets with 4-piece set bonuses, plus 13 charms. |
| **44 points of interest** | Villages, ruins, a pyramid, a sunken temple, a dragon's lair, a crystal cavern, a haunted manor, a portal nexus... each stamped into a procedurally generated island with 13 biomes. |
| **10 bosses** | Slime King, Goblin Warlord, Spider Matriarch, Lich, Chaos Jester, Golem King, Kraken, Frost Titan, Ignis the Dragon, the Void Lord. |
| **50 quests** | An 8-part main story (relight the Lumis Beacon) plus side quests from 29 NPCs. |
| **106 abilities**, 119 items, 92 world objects, day/night cycle, weather, fishing, chests, mimics, shops, achievements, a bestiary, procedural music & sound. |

## Controls

| Key | Action |
|---|---|
| WASD / arrows | Move |
| Mouse | Aim, left click (hold) to fire |
| E / Q / C | Wand abilities |
| **V** | Secret ability (mythic / secret wands only) |
| Space | Dodge roll |
| F | Interact: talk, open chest, chop, mine, feed/tame, fish |
| R | Ride / dismount a rideable pet |
| 1–5 | Quick-use items |
| I / K / P / J / M / T / B / O | Inventory, Craft, Pets, Quests, Map, Stats, Bestiary, Options |

## Saving

The game autosaves every 30 seconds to `localStorage` as JSON. From **Options** you can export the save as a `.json` file and import it on another device.

## Deploying to Vercel

The repo is a plain static site. Import it in Vercel (framework preset: *Other*, no build command, output directory `.`) or run `vercel` from the repo root. `vercel.json` is already configured.
