// Hämtar bildarkivet med piktogram från ARASAAC (https://arasaac.org, CC BY-NC-SA 4.0).
// Körs en gång: node scripts/fetch-pictograms.mjs
import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';

const OUT = new URL('../public/pictograms/', import.meta.url);

/** Mappar i "Välj bild". Varje rad: [namn på svenska, sökord på engelska, ev. ARASAAC-id när sökningen ger fel bild]. */
const FOLDERS = {
  'Mat och dryck': [
    ['Frukost', 'breakfast'],
    ['Lunch', 'lunch'],
    ['Middag', 'supper'],
    ['Mellanmål', 'snack'],
    ['Fika', 'coffee'],
    ['Äta', 'eat'],
    ['Dricka vatten', 'glass of water', 4768],
    ['Te', 'tea'],
    ['Mjölk', 'milk'],
    ['Juice', 'juice'],
    ['Smörgås', 'sandwich'],
    ['Frukt', 'fruit'],
    ['Pizza', 'pizza'],
    ['Soppa', 'soup'],
    ['Kaka', 'cake'],
    ['Glass', 'ice cream'],
    ['Laga mat', 'cook'],
    ['Duka', 'set the table'],
    ['Diska', 'wash the dishes'],
    ['Restaurang', 'restaurant'],
  ],
  'Hygien och kläder': [
    ['Duscha', 'shower'],
    ['Bada', 'have a bath'],
    ['Borsta tänderna', 'brush teeth'],
    ['Tvätta händerna', 'wash hands', 8975],
    ['Toalett', 'toilet'],
    ['Raka sig', 'shave'],
    ['Kamma håret', 'comb'],
    ['Klä på sig', 'get dressed'],
    ['Klä av sig', 'undress'],
    ['Pyjamas', 'pyjamas'],
    ['Jacka', 'jacket'],
    ['Skor', 'shoes'],
    ['Tvätta kläder', 'washing machine'],
    ['Frisör', 'hairdresser'],
  ],
  Hemma: [
    ['Vakna', 'wake up'],
    ['Sova', 'sleep'],
    ['Vila', 'rest'],
    ['Hem', 'house'],
    ['Städa', 'tidy up', 8680],
    ['Dammsuga', 'vacuum'],
    ['Bädda sängen', 'make the bed'],
    ['Soppor', 'take out the rubbish'],
    ['Vattna blommor', 'watering can', 2817],
    ['Post', 'mail'],
    ['Nycklar', 'keys'],
    ['Ladda telefonen', 'charge battery', 34939],
    ['Telefon', 'telephone'],
    ['Mobiltelefon', 'mobile phone', 25269],
    ['Dator', 'computer'],
    ['Surfplatta', 'tablet'],
    ['TV', 'television'],
  ],
  Hälsa: [
    ['Medicin', 'medicine'],
    ['Ta tabletter', 'pills'],
    ['Läkare', 'doctor'],
    ['Sjuksköterska', 'nurse'],
    ['Tandläkare', 'dentist'],
    ['Sjukhus', 'hospital'],
    ['Vårdcentral', 'health centre'],
    ['Apotek', 'pharmacy'],
    ['Sjukgymnast', 'physiotherapist'],
    ['Mäta blodtryck', 'blood pressure'],
    ['Spruta', 'injection'],
    ['Sjuk', 'sick'],
    ['Ont', 'pain'],
    ['Glasögon', 'glasses', 3329],
    ['Hörapparat', 'hearing aid'],
    ['Hemtjänst', 'caregiver'],
  ],
  'Ute och resor': [
    ['Promenad', 'walk'],
    ['Handla', 'go shopping'],
    ['Affär', 'supermarket'],
    ['Buss', 'bus'],
    ['Bil', 'car'],
    ['Taxi', 'taxi'],
    ['Rullstol', 'wheelchair'],
    ['Tåg', 'train'],
    ['Tunnelbana', 'underground'],
    ['Flygplan', 'aeroplane', 2264],
    ['Cykla', 'ride a bike'],
    ['Bank', 'bank'],
    ['Pengar', 'money'],
    ['Kyrka', 'church'],
    ['Resa', 'suitcase', 2931],
  ],
  Fritid: [
    ['Läsa', 'read'],
    ['Tidning', 'newspaper'],
    ['Musik', 'music'],
    ['Träna', 'gym'],
    ['Simma', 'swim'],
    ['Fotboll', 'football'],
    ['Bowling', 'bowling'],
    ['Spela spel', 'game pieces', 9135],
    ['Pussel', 'puzzle'],
    ['Måla', 'paint'],
    ['Rita', 'draw'],
    ['Sticka', 'knit'],
    ['Trädgård', 'garden'],
    ['Fiska', 'fish'],
    ['Bio', 'cinema'],
    ['Teater', 'theatre'],
    ['Fest', 'party'],
    ['Födelsedag', 'birthday'],
    ['Present', 'present'],
    ['Semester', 'holidays'],
    ['Teckenspråk', 'sign language'],
  ],
  'Personer och djur': [
    ['Familj', 'family'],
    ['Mamma', 'mother'],
    ['Pappa', 'father'],
    ['Syster', 'sister'],
    ['Bror', 'brother'],
    ['Mormor/farmor', 'grandmother'],
    ['Morfar/farfar', 'grandfather'],
    ['Vänner', 'friends'],
    ['Besök', 'visit'],
    ['Pojkvän/flickvän', 'boyfriend'],
    ['Hund', 'dog'],
    ['Katt', 'cat'],
    ['Häst', 'horse'],
  ],
  'Arbete och skola': [
    ['Arbete', 'work'],
    ['Skola', 'school'],
    ['Daglig verksamhet', 'workshop'],
    ['Möte', 'meeting'],
    ['Rast', 'playtime', 27339],
    ['Skriva', 'write'],
  ],
  Känslor: [
    ['Glad', 'happy'],
    ['Ledsen', 'sad'],
    ['Arg', 'angry'],
    ['Trött', 'tired'],
    ['Rädd', 'scared'],
    ['Lugn', 'calm'],
  ],
};

await mkdir(OUT, { recursive: true });
const manifest = [];
const used = new Set();
for (const [folder, list] of Object.entries(FOLDERS)) {
  for (const [name, query, fixedId] of list) {
    let id = fixedId;
    if (!id) {
      const res = await fetch(`https://api.arasaac.org/v1/pictograms/en/search/${encodeURIComponent(query)}`);
      if (!res.ok) {
        console.warn(`Ingen träff: ${query}`);
        continue;
      }
      const hits = await res.json();
      const hit = hits.find((h) => !used.has(h._id)) ?? hits[0];
      if (!hit) continue;
      id = hit._id;
    }
    used.add(id);
    const file = `${id}.png`;
    const png = await fetch(`https://static.arasaac.org/pictograms/${id}/${id}_300.png`);
    if (!png.ok) continue;
    await writeFile(new URL(file, OUT), Buffer.from(await png.arrayBuffer()));
    manifest.push({ file, name, folder });
    console.log(`${folder} / ${name} → ${file}`);
  }
}
// Ta bort filer som inte längre används.
const keep = new Set(manifest.map((m) => m.file));
for (const f of await readdir(OUT)) if (!keep.has(f)) await unlink(new URL(f, OUT));
await writeFile(new URL('../src/pictograms.json', import.meta.url), JSON.stringify(manifest, null, 2) + '\n');
console.log(`${manifest.length} piktogram sparade.`);
