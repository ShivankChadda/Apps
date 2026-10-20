# Atlas

A place-name game for the family, with rules made up by Arin. Players take turns naming a country, state or city that starts with the last letter of the place before it. A globe spins to each place and lights it up in the player's colour, and every country comes with a cool fact.

Play it: https://claude.ai/artifact/JLNRYpPsqkGuGd9jTSvNKk

## Rules

- Take turns naming a country, state or city. No place can be said twice.
- Your place must start with the last letter of the place before it (India → Australia).
- 30 seconds per turn.
- 3 hints each for the whole game. In a turn, hint 1 tells the continent, hint 2 lights the place up on the globe, hint 3 tells the second letter.
- Time runs out: lose a hint. First mistake in a turn: a warning. Each mistake after that: lose a hint.
- Out of hints and you lose another one: you're out. The last player left wins.
- A place the game doesn't know pauses the clock. Check it on Google; if it's real, pin it on the globe.

## Running it yourself

The page loads its map data from `data/`, so serve the folder rather than opening the file directly:

```sh
cd atlas
python3 -m http.server 8000
# open http://localhost:8000
```

## Data

| File | What it holds | Source |
|---|---|---|
| `data/world.json` | Country borders (India's official view) and the four UK nations | [Natural Earth](https://www.naturalearthdata.com), public domain |
| `data/states.json` | States and provinces of every country | Natural Earth, public domain |
| `data/cities.json` | 34,000 cities with more than 15,000 people | [GeoNames](https://www.geonames.org), CC BY 4.0 |
| `data/countryinfo.json` | Capitals and continents | GeoNames, CC BY 4.0 |
| `data/facts.json` | Two kid-friendly facts per country | Written for this game |

`tools/build-data.mjs` rebuilds the first four files from the raw downloads; its header lists the source URLs and the command. It needs [mapshaper](https://github.com/mbloch/mapshaper).
