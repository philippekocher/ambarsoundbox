# AMBAR Soundbox

AMBAR Soundbox is an open source, browser-based sound and music playground. It's a visual, patch-based programming environment for sound synthesis, built on the Web Audio API and running entirely in the browser. A live version is available at [ambarsoundbox.ch](https://ambarsoundbox.ch).

## Quickstart

If you don't already have it, install [Node.js](https://nodejs.org/) (which includes npm) — version 20 or later.

Clone the repository and install the dependencies:

```
git clone https://github.com/philippekocher/ambarsoundbox.git
cd ambarsoundbox
npm i
```

The server-side sharing feature needs database credentials. Copy `api/config.example.php` to `api/config.php` and fill in your database credentials — or leave it empty if you don't need sharing locally (see below).

```
cp api/config.example.php api/config.php
```

Start a development server:

```
npm start
```

AMBAR Soundbox can now be accessed at [localhost:8000](http://localhost:8000/) in a browser. This uses esbuild's built-in dev server, which only serves static files — PHP isn't executed, so the sharing/database backend (`api/`) is **not** functional here (shared patches can't be created or loaded). Use `npm run dev` instead if you need to test that.

Press `Ctrl + C` to quit.

For `npm run dev`, esbuild only watches and rebuilds `dist/` without serving it, so you need to point your own PHP-capable web server at the `dist` folder. This lets `api/db.php` actually run against your configured database, so sharing works too:

```
npm run dev
```

Create a minified production build for deployment:

```
npm run build
```

The output is written to `dist/`, ready to be uploaded to a PHP-capable web server.


## Contributing

### Add a module

1. Copy [src/modules/_TEMPLATE.js](src/modules/_TEMPLATE.js), rename it (e.g. `myModule.js`), and keep it in `src/modules/`.
2. Edit the `definition` object, the `UGen` class, and optionally the `Visualisation` class — each section in the template explains what's expected.
3. If you use the language system (`L:...` strings), add the corresponding entries to [src/i18n/dictionary.csv](src/i18n/dictionary.csv) — see [src/i18n/README.md](src/i18n/README.md) for the full i18n workflow.
4. Rebuild the project (`npm run dev` / `npm start` / `npm run build`) — new modules are picked up automatically.

### Add examples and encyclopaedia entries

Since [src/examples](src/examples) and [src/encyclopaedia](src/encyclopaedia) are content rather than code, they're intentionally excluded from this repository (see [.gitignore](.gitignore)).

See each folder's own README for the file format: [src/examples/README.md](src/examples/README.md), [src/encyclopaedia/README.md](src/encyclopaedia/README.md).