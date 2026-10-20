#!/usr/bin/env node
// Builds the place data the Atlas game ships with.
//
// Sources (download each into its own folder first):
//   Natural Earth 10m countries, India point of view
//     https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries_ind.geojson
//   Natural Earth 10m states and provinces
//     https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson
//   GeoNames cities with more than 15,000 people, plus country and state names
//     https://download.geonames.org/export/dump/cities15000.zip
//     https://download.geonames.org/export/dump/countryInfo.txt
//     https://download.geonames.org/export/dump/admin1CodesASCII.txt
//
// Usage:
//   node build-data.mjs --countries <geojson> --states <geojson> --cities <cities15000.zip>
//     --country-info <txt> --admin1 <txt> --mapshaper <path to mapshaper bin> --out <dir>

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
for (const k of ['countries', 'states', 'cities', 'country-info', 'admin1', 'mapshaper', 'out']) {
  if (!args[k]) throw new Error(`missing --${k}`);
}
const out = args.out;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-'));
const mapshaper = (...cmd) => execFileSync(args.mapshaper, cmd, { stdio: ['ignore', 'ignore', 'inherit'], maxBuffer: 1 << 30 });

// Tiny military bases, uninhabited reefs and no-man's-land: not places anyone names in a game.
// PGA is the disputed Spratly Islands, mislabelled "Wake Island" in this file.
const DROP = new Set(['ESB', 'WSB', 'USG', 'BRI', 'BRT', 'SCR', 'PGA']);

const SHORT_NAME = { CHN: 'China', USA: 'United States', FSM: 'Micronesia', VAT: 'Vatican City', MAC: 'Macau' };

// Names people actually say that Natural Earth doesn't carry.
const EXTRA_ALIASES = {
  USA: ['USA', 'US', 'America', 'United States', 'United States of America'],
  GBR: ['UK', 'Britain', 'Great Britain', 'United Kingdom'],
  ARE: ['UAE', 'Emirates', 'United Arab Emirates'],
  NLD: ['Holland', 'Netherlands'],
  MMR: ['Burma', 'Myanmar'],
  CIV: ['Ivory Coast', "Cote d'Ivoire"],
  CZE: ['Czech Republic', 'Czechia'],
  SWZ: ['Swaziland', 'Eswatini'],
  MKD: ['Macedonia', 'North Macedonia'],
  TUR: ['Turkey', 'Turkiye'],
  COD: ['DRC', 'DR Congo', 'Congo DRC', 'Democratic Republic of Congo'],
  COG: ['Congo', 'Republic of Congo', 'Congo Brazzaville'],
  KOR: ['Korea', 'South Korea'],
  PRK: ['North Korea'],
  CPV: ['Cape Verde', 'Cabo Verde'],
  TLS: ['East Timor', 'Timor Leste'],
  VAT: ['Vatican', 'Vatican City', 'Holy See'],
  BIH: ['Bosnia'],
  FSM: ['Micronesia'],
  PSX: ['Palestine'],
  RUS: ['Russia'],
  LAO: ['Laos'],
  BHS: ['Bahamas'],
  GMB: ['Gambia'],
  VCT: ['Saint Vincent', 'Saint Vincent and the Grenadines'],
  KNA: ['Saint Kitts', 'Saint Kitts and Nevis'],
  STP: ['Sao Tome', 'Sao Tome and Principe'],
  TTO: ['Trinidad', 'Tobago', 'Trinidad and Tobago'],
  ATG: ['Antigua', 'Antigua and Barbuda'],
};

const STATE_EXTRA_ALIASES = {
  // Natural Earth keeps local spellings; these are the ones kids in India hear.
  'IND:Odisha': ['Orissa'],
  'IND:Puducherry': ['Pondicherry'],
  'IND:Uttarakhand': ['Uttaranchal'],
  'IND:Andaman and Nicobar': ['Andaman and Nicobar Islands', 'Andaman'],
  'IND:Jammu and Kashmir': ['Kashmir', 'Jammu'],
};

// Old names still heard at home.
const CITY_EXTRA_ALIASES = {
  'Chennai|IN': ['Madras'], 'Pune|IN': ['Poona'], 'Vadodara|IN': ['Baroda'], 'Varanasi|IN': ['Benares', 'Banaras', 'Kashi'],
  'Kanpur|IN': ['Cawnpore'], 'Thiruvananthapuram|IN': ['Trivandrum'], 'Kochi|IN': ['Cochin'], 'Kozhikode|IN': ['Calicut'],
  'Mysore|IN': ['Mysuru'], 'Mysuru|IN': ['Mysore'], 'Mangalore|IN': ['Mangaluru'], 'Mangaluru|IN': ['Mangalore'],
  'Prayagraj|IN': ['Allahabad'], 'Allahabad|IN': ['Prayagraj'], 'Belgaum|IN': ['Belagavi'],
  'Beijing|CN': ['Peking'], 'Guangzhou|CN': ['Canton'], 'Ho Chi Minh City|VN': ['Saigon'], 'Yangon|MM': ['Rangoon'],
};

const splitAlt = (s) => (s ? String(s).split(/[|,;]/).map((x) => x.trim()).filter(Boolean) : []);
const uniq = (xs) => [...new Set(xs.filter(Boolean).map((x) => x.trim()).filter(Boolean))];

// ---------- countries ----------
const cRaw = JSON.parse(fs.readFileSync(args.countries));
cRaw.features = cRaw.features
  .filter((f) => !DROP.has(f.properties.ADM0_A3))
  .map((f) => {
    const p = f.properties;
    const id = p.ADM0_A3;
    const name = SHORT_NAME[id] || p.NAME_EN || p.NAME;
    // S: a country in its own right. D: belongs to another country (Greenland, Hong Kong). O: anything else (Antarctica).
    const typeCode = id === 'ATA' ? 'O'
      : p.TYPE === 'Sovereign country' || (p.TYPE === 'Country' && p.ADMIN === p.SOVEREIGNT) ? 'S'
      : ['Dependency', 'Country', 'Lease'].includes(p.TYPE) ? 'D' : 'O';
    return {
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        id,
        n: name,
        al: uniq([name, p.NAME, p.NAME_EN, p.NAME_LONG, p.ADMIN, p.FORMAL_EN, p.NAME_SORT, p.GEOUNIT, p.SUBUNIT, ...splitAlt(p.NAME_ALT), ...(EXTRA_ALIASES[id] || [])]).join('|'),
        c: p.CONTINENT === 'Seven seas (open ocean)' ? 'the ocean' : p.CONTINENT,
        t: typeCode,
        sov: p.SOVEREIGNT,
        a2: p.ISO_A2_EH && p.ISO_A2_EH !== '-99' ? p.ISO_A2_EH : '',
        pop: p.POP_EST || 0,
      },
    };
  });
const cIn = path.join(tmp, 'countries.geojson');
fs.writeFileSync(cIn, JSON.stringify(cRaw));

// The four UK nations, dissolved out of Natural Earth's UK council areas.
const sRaw = JSON.parse(fs.readFileSync(args.states));
const NATION_ID = { England: 'ENG', Scotland: 'SCT', Wales: 'WLS', 'Northern Ireland': 'NIR' };
const gb = { type: 'FeatureCollection', features: sRaw.features.filter((f) => f.properties.adm0_a3 === 'GBR').map((f) => ({ type: 'Feature', geometry: f.geometry, properties: { geonunit: f.properties.geonunit } })) };
const nIn = path.join(tmp, 'nations.geojson');
fs.writeFileSync(nIn, JSON.stringify(gb));
const nDis = path.join(tmp, 'nations-dissolved.geojson');
mapshaper('-i', nIn, '-dissolve', 'geonunit', '-o', nDis, 'format=geojson');
const nations = JSON.parse(fs.readFileSync(nDis));
nations.features = nations.features.map((f) => {
  const n = f.properties.geonunit;
  return { type: 'Feature', geometry: f.geometry, properties: { id: NATION_ID[n], n, al: n, c: 'Europe', t: 'N', sov: 'United Kingdom', a2: 'GB', pop: 0 } };
});
fs.writeFileSync(nIn, JSON.stringify(nations));

mapshaper(
  '-i', cIn, nIn, 'combine-files',
  '-rename-layers', 'countries,nations',
  '-simplify', '6%', 'weighted', 'keep-shapes', 'target=*',
  '-o', path.join(out, 'world.json'), 'format=topojson', 'quantization=100000', 'target=*',
);

// ---------- states ----------
const states = {
  type: 'FeatureCollection',
  features: sRaw.features.map((f) => {
    const p = f.properties;
    const name = p.name_en || p.name;
    const key = `${p.adm0_a3}:${name}`;
    return {
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        n: name,
        al: uniq([name, p.name, p.gn_name, p.woe_name, ...splitAlt(p.name_alt), ...(STATE_EXTRA_ALIASES[key] || [])]).join('|'),
        a3: p.adm0_a3,
        cc: p.iso_a2 && p.iso_a2 !== '-99' ? p.iso_a2 : '',
        cn: p.admin,
        ty: (p.type_en || 'region').toLowerCase(),
        ar: Math.round(p.area_sqkm || 0),
      },
    };
  }),
};
const sIn = path.join(tmp, 'states.geojson');
fs.writeFileSync(sIn, JSON.stringify(states));
mapshaper('-i', sIn, '-rename-layers', 'states', '-simplify', '5%', 'weighted', 'keep-shapes', '-o', path.join(out, 'states.json'), 'format=topojson', 'quantization=100000');

// ---------- cities ----------
const citiesTxt = execFileSync('unzip', ['-p', args.cities, 'cities15000.txt'], { maxBuffer: 1 << 30 }).toString('utf8');
const admin1 = new Map();
for (const line of fs.readFileSync(args.admin1, 'utf8').split('\n')) {
  const [code, name, ascii] = line.split('\t');
  if (code) admin1.set(code, ascii || name);
}
const ASCII_NAME = /^[A-Za-z][A-Za-z .'-]{2,30}$/;
const rows = [];
for (const line of citiesTxt.split('\n')) {
  const c = line.split('\t');
  if (c.length < 15) continue;
  const [, name, ascii, alternates, lat, lon, fclass, fcode, cc, , a1, , , , pop] = c;
  if (fclass !== 'P' || fcode === 'PPLH' || fcode === 'PPLQ' || fcode === 'PPLW') continue;
  const population = Number(pop) || 0;
  // Well-known cities get their English alternates (Bombay, Calcutta, Peking); smaller ones keep their main name.
  const alts = population >= 300000
    ? uniq(alternates.split(',').filter((a) => ASCII_NAME.test(a) && a !== name && a !== ascii && !/^[A-Z .'-]+$/.test(a))).slice(0, population >= 1e6 ? 12 : 6)
    : [];
  const extra = CITY_EXTRA_ALIASES[`${name}|${cc}`] || CITY_EXTRA_ALIASES[`${ascii}|${cc}`] || [];
  rows.push([name, +(+lat).toFixed(3), +(+lon).toFixed(3), cc, admin1.get(`${cc}.${a1}`) || '', population, uniq([ascii !== name ? ascii : '', ...extra, ...alts]).join('|')]);
}
rows.sort((a, b) => b[5] - a[5]);
fs.writeFileSync(path.join(out, 'cities.json'), JSON.stringify({ cols: ['name', 'lat', 'lon', 'cc', 'state', 'pop', 'alt'], rows }));

// ---------- country info (capitals, continents for cities) ----------
const CONT = { AF: 'Africa', AS: 'Asia', EU: 'Europe', NA: 'North America', SA: 'South America', OC: 'Oceania', AN: 'Antarctica' };
const info = {};
for (const line of fs.readFileSync(args['country-info'], 'utf8').split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const c = line.split('\t');
  info[c[0]] = { name: c[4], capital: c[5], cont: CONT[c[8]] || '', currency: c[11] };
}
fs.writeFileSync(path.join(out, 'countryinfo.json'), JSON.stringify(info));

fs.rmSync(tmp, { recursive: true, force: true });
for (const f of ['world.json', 'states.json', 'cities.json', 'countryinfo.json']) {
  console.log(f, (fs.statSync(path.join(out, f)).size / 1024).toFixed(0) + ' KB');
}
console.log('countries', cRaw.features.length, 'nations', nations.features.length, 'states', states.features.length, 'cities', rows.length);
