# AMBAR Soundbox

AMBAR Soundbox is an open-source, browser-based playground for sound and music. It's a visual, patch-based programming environment for sound synthesis, built on the Web Audio API and running entirely in the browser. A live version is available at [ambarsoundbox.ch](https://ambarsoundbox.ch).

## Quickstart

If you don't already have it, install [Node.js](https://nodejs.org/) (which includes npm) — version 20 or newer.

Clone the repository and install the dependencies:

```
git clone https://github.com/philippekocher/ambarsoundbox.git
cd ambarsoundbox
npm i
```

The server-side sharing feature needs database credentials. If you need sharing locally, copy `api/config.example.php` to `api/config.php` and fill in your database credentials.

```
cp api/config.example.php api/config.php
```

Start a development server:

```
npm start
```

AMBAR Soundbox can now be accessed at [localhost:8000](http://localhost:8000/) in a browser. This uses esbuild's built-in dev server, which serves static files only. PHP is not executed, so the sharing/database backend (`api/`) does **not** work here and shared patches can't be created or loaded. Use `npm run dev` instead if you need to test sharing.

Press `Ctrl + C` to quit.

With `npm run dev`, esbuild watches and rebuilds `dist/`, but does not serve it. You need to point a PHP-capable web server at the `dist` folder. This allows `api/db.php` to connect to your configured database, so sharing works too.

```
npm run dev
```

Create a minified production build for deployment:

```
npm run build
```

The output is written to `dist/`, ready to be uploaded to a PHP-capable web server.


## Add a module

1. Copy [src/modules/_TEMPLATE.js](src/modules/_TEMPLATE.js), rename it (e.g. `myModule.js`), and keep it in `src/modules/`.
2. Edit the `definition` object, the `UGen` class, and optionally the `Visualisation` class. Each section in the template explains what is expected.
3. If you use the language system (`L:...` strings), add the corresponding entries to [src/i18n/dictionary.csv](src/i18n/dictionary.csv) — see [src/i18n/README.md](src/i18n/README.md) for the full i18n workflow.
4. Rebuild the project (`npm start` / `npm run dev` / `npm run build`). New modules are picked up automatically.


## Add examples and encyclopaedia entries

The content of [src/examples](src/examples) and [src/encyclopaedia](src/encyclopaedia) is user-specific and can grow quite large, so it's intentionally excluded from this repository (see [.gitignore](.gitignore)).

See each folder's README for the file format: [src/examples/README.md](src/examples/README.md), [src/encyclopaedia/README.md](src/encyclopaedia/README.md).