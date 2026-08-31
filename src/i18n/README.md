# i18n

All UI text lives in one file: [`dictionary.csv`](dictionary.csv). Upon build
per-language JS modules are generated that the app loads at runtime.


## Change an existing translation

1. Open `dictionary.csv` and edit content in the cell for that key.
2. Rebuild (`npm run dev` / `npm start` / `npm run build`) — the change takes effect automatically.


## Add a new entry

1. Add a row to `dictionary.csv`
   - Keys must be unique and are used verbatim in code via `L.get('yourKey')`.
   - Wrap a value in double quotes if it contains a comma or line break.
   - A row whose key starts with `//` and has no translations (e.g. `// Modules,,,`) is
     used purely as a comment in the spreadsheet and is dropped by the generator.
2. Use it in code:
   - Directly: `L.get('yourKey')`
   - With placeholders `%1`, `%2`, …: `deleteName,'%1' löschen,Delete '%1',` →
     `L.get('deleteName', patchName)`
   - In static data objects (module definitions, etc.) where `L.get()` can't be called
     inline, prefix the value with `L:` and pass it through `L.replace()` instead, e.g.
     `label: 'L:freq'`.
3. Rebuild (`npm run dev` / `npm start` / `npm run build`) — the change takes effect automatically.


## Add a new language

1. Add a column to `dictionary.csv` and fill in all translations.
2. Rebuild (`npm run dev` / `npm start` / `npm run build`) — the change takes effect automatically.