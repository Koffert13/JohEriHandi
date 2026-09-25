# Kalender – en HandiKalender-klon som webbapp

En kalender med bildstöd och kvartursprickar, byggd efter handboken till Abilias HandiKalender (v2.5). Den ser ut och fungerar som Handi och körs som webbapp (PWA) på iPhone och Android. Man lägger den på hemskärmen, och sedan öppnas den i helskärm som en vanlig app.

**All data sparas bara på telefonen.** Det finns ingen server, inget konto och ingen synkning.

## Med i appen

Allt i handbokens kapitel 4–5 utom larm, påminnelser, talstöd, röstanteckningar och "Tillgänglig för" (stödpersoner i myAbilia).

- **Kalendervy**: datumfält i veckodagsfärg med veckonummer eller månadssymbol, och flikar för tidspelarvy, listvy, veckovy och månadsvy. Knappraden har bläddra, idag och Kalendermenyn.
- **Tidspelarvy**: en prick per kvart och röd linje för aktuell tid. Aktiviteter utan sluttid visas som 30 minuter. Liten eller stor zoom.
- **Aktivitetsvy**: kvartursprickar (1 prick = 15 min, sista kvarten som 5 punkter), digital nedräkning och stor bild. Här visas också anteckning, checklista, timer, extra bild, länk, adress, telefon eller SMS. Knapparna är Kvittera ("Klar?" JA/NEJ), Ta bort, Ändra och OK.
- **Lägg in aktivitet**: via Ändravyn (grundinställning) eller via sekvens. Typer: enstaka, heldag och återkommande (veckovis med varannan vecka, månadsvis eller årsvis, med eller utan slutdatum). Ändringar och borttagningar av återkommande aktiviteter gäller endast denna dag, denna dag och framåt, eller alla dagar.
- **Basaktiviteter, bastimers och kategorier**.
- **Starta timer** med nedräkning i prickar.
- **Klockvy** med del av dygnet (morgon, dag, kväll, natt), **Sök aktivitet** och **svenska helgdagar**.
- **Bildarkiv** med 128 piktogram i mappar, plus egna foton från kameran eller bildbiblioteket.
- **Inställningar** med kodskydd. Koden är 0353, precis som i Handi, och den kan bytas. Alla inställningssidor från handbokens kapitel 5 finns med, utom larm och talstöd.
- **Säkerhetskopia**: under Inställningar → Säkerhetskopia kan all data exporteras till en fil och läsas in igen.

## Publicera (GitHub Pages)

1. Gör repot publikt: *Settings → General → Change visibility*. Koden blir synlig, men ingen personlig data ligger i repot.
2. Välj *Settings → Pages → Build and deployment → Source: GitHub Actions*.
3. Slå ihop ändringarna till `main`. Arbetsflödet *Bygg och publicera* kör testerna och publicerar appen på `https://<användarnamn>.github.io/JohEriHandi/`.

Appen använder relativa sökvägar, så den fungerar även på Netlify, Cloudflare Pages eller en egen webbserver: kör `npm run build` och lägg upp mappen `dist`.

## Installera på telefonen

**iPhone (Safari):** öppna adressen, tryck på dela-knappen och välj **Lägg till på hemskärmen**.

**Android (Chrome):** öppna adressen, tryck på ⋮ och välj **Installera app**.

Appen fungerar utan internet när den väl är installerad. Nya versioner hämtas automatiskt nästa gång telefonen är uppkopplad.

**Tips:**
- Spara en säkerhetskopia då och då. Om telefonen tappas bort, eller om appen tas bort från hemskärmen, försvinner datan.
- Inställningen *Kalendervyn → Håll skärmen tänd* passar om telefonen står framme hela dagen.

## Utveckla

```bash
npm install
npm run dev        # utvecklingsserver
npm test           # enhetstester (återkommande aktiviteter, prickar, helgdagar)
npm run e2e        # webbläsartester (Playwright)
npm run build      # bygger till dist/
```

Koden ligger i `src/`:

- `domain/`: ren logik för datum, återkommande aktiviteter, kvartursprickar och helgdagar
- `views/`: skärmarna
- `components/`: knappar, väljare och ikoner
- `db.ts`: IndexedDB via Dexie

Bildarkivet hämtas med `node scripts/fetch-pictograms.mjs`.

## Bilder

Piktogrammen kommer från ARASAAC (<https://arasaac.org>). Upphovsperson är Sergio Palao, och bilderna ägs av Aragoniens regering. Licensen är CC BY-NC-SA 4.0 och tillåter bara icke-kommersiell användning.

## Obs

Använd inte appen som enda stöd för medicinering eller andra viktiga aktiviteter. Handi ger samma råd. Appen har inga larm.
