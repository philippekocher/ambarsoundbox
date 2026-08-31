# Encyclopaedia

Source content for AMBAR Soundbox's built-in encyclopaedia of sound and music terms.

Since this is content rather than code, it's intentionally excluded from this repository (see [.gitignore](../../.gitignore)). If you run your own instance, you can add your own entries as needed. If you want the encyclopaedia committed in your own fork/clone, change the `.gitignore` file accordingly.


## Add an entry

1. Create a subfolder named after a language code, e.g. `de` or `en`, if it doesn't exist yet. Any name is accepted but only a code that also exists in the [i18n dictionary](../i18n/README.md) is reachable through the app's language switch.
2. Add a Markdown file with YAML frontmatter to that folder:

   ```md
   ---
   id: myId
   title: myTitle
   modules: [myModule]
   ---

   Entry text goes here, written in Markdown.
   ```

   - `id` — unique identifier for the entry (required, must be unique within the language)
   - `title` — display title, also used to auto-link this term from other entries
   - `modules` — optional list of module names (from [src/modules](../modules)) related to this entry
3. Rebuild (`npm run dev` / `npm start` / `npm run build`) — new entries are picked up automatically.
