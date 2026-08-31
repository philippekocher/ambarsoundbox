import esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'

const watch = process.argv.includes('--watch')
const serve = process.argv.includes('--serve')

const buildDate = new Date().toLocaleString()

if(fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true })
}
fs.mkdirSync('dist', { recursive: true })

// api/config.php holds DB credentials and is gitignored, so it's absent on a
// fresh clone. Seed it from the example template (blank credentials) so the
// build doesn't fail.
if (!fs.existsSync('api/config.php')) {
  fs.copyFileSync('api/config.example.php', 'api/config.php')
}

// copy static files (except index.html, which is templated separately
// so hashed asset filenames can be injected into it)
const STATIC_FILES = [
  ['api/db.php', 'dist/db.php'],
  ['api/config.php', 'dist/config.php'],
  ['public/favicon.svg', 'dist/favicon.svg'],
  ['public/htaccess', 'dist/.htaccess'],
]

const copyStaticFiles = () => {
  for (const [src, dest] of STATIC_FILES) {
    fs.copyFileSync(src, dest)
  }
}

copyStaticFiles()

const entryNames = !watch ? '[name]-[hash]' : '[name]'
const assetNames = 'assets/[name]-[hash]'

// Find the filepath esbuild generated from its metafile
const findOutput = (metafile, entryPointSuffix) => {
  const match = Object.keys(metafile.outputs).find(file =>
    metafile.outputs[file].entryPoint?.endsWith(entryPointSuffix)
  )
  if (!match) {
    throw new Error(`Could not find build output for entry point "${entryPointSuffix}"`)
  }
  return path.basename(match)
}

// bundle CSS
const buildCSS = await esbuild.context({
  entryPoints: [ './src/styles/styles.gen.css' ],
  bundle: true,
  entryNames,
  assetNames,
  loader: {
    '.png': 'file',
    '.jpg': 'file',
    '.svg': 'dataurl',
    '.ttf': 'file'
  },
  logLevel: !watch ? 'error' : 'info',
  minify: !watch,
  sourcemap: watch && 'linked',
  metafile: true,
  outdir: './dist'
})

// bundle audio worklet JS
// (before buildJS to know the audioworklet's final – possibly hashed – name.)
const buildAudioWorkletJS = await esbuild.context({
  entryPoints: [ './src/audio/audioworklet.js' ],
  format: 'esm',
  bundle: true,
  entryNames,
  drop: !watch ? ['debugger', 'console'] : [],
  logLevel: !watch ? 'error' : 'info',
  minify: !watch,
  sourcemap: watch && 'linked',
  metafile: true,
  outdir: './dist'
})

let audioWorkletUrl
if(!watch) {
  const audioWorkletResult = await buildAudioWorkletJS.rebuild()
  audioWorkletUrl = findOutput(audioWorkletResult.metafile, 'src/audio/audioworklet.js')
}
else {
  audioWorkletUrl = 'audioworklet.js'
}

// bundle JS
const buildJS = await esbuild.context({
  entryPoints: [ './src/main.js' ],
  format: 'esm',
  bundle: true,
  splitting: true,
  entryNames,
  chunkNames: assetNames,
  drop: !watch ? ['debugger', 'console'] : [],
  define: {
    __AUDIOWORKLET_URL__: JSON.stringify(audioWorkletUrl),
    __BUILD_DATE__: JSON.stringify(buildDate)
  },
  // encyclopaedia.js dynamically imports `./encyclopaedia.${lang}.gen.js`;
  // esbuild resolves this as a glob. On a fresh clone the encyclopaedia
  // content is absent, so the glob legitimately matches nothing.
  logOverride: { 'empty-glob': 'silent' },
  logLevel: !watch ? 'error' : 'info',
  minify: !watch,
  sourcemap: watch && 'linked',
  metafile: true,
  outdir: './dist'
})

// Read public/index.html as a template and swap in the real (possibly hashed)
// filenames for styles.css and main.js.
const injectHashedFilenames = (cssResult, jsResult) => {
  const cssFile = findOutput(cssResult.metafile, 'src/styles/styles.gen.css')
  const jsFile = findOutput(jsResult.metafile, 'src/main.js')

  let html = fs.readFileSync('public/index.html', 'utf8')
  html = html
    .replace('href="styles.gen.css"', `href="${cssFile}"`)
    .replace('src="main.js"', `src="${jsFile}"`)

  fs.writeFileSync('dist/index.html', html)

  let player = fs.readFileSync('public/player.html', 'utf8')
  player = player
    .replace('href="../styles.gen.css"', `href="../${cssFile}"`)
    .replace('src="../main.js"', `src="../${jsFile}"`)

  fs.writeFileSync('dist/player.html', player)
}

if(!watch) {
  // single production build
  const cssResult = await buildCSS.rebuild()
  buildCSS.dispose()

  const jsResult = await buildJS.rebuild()
  buildJS.dispose()

  // audio worklet JS already built above
  buildAudioWorkletJS.dispose() 

  injectHashedFilenames(cssResult, jsResult)
}
else {
  // watch for file changes
  await buildCSS.watch()
  await buildJS.watch()
  await buildAudioWorkletJS.watch()

  // filenames are stable in watch mode, so index.html can bey copied w/o hash injection
  const copyIndexHtml = () => {
    fs.copyFileSync('public/index.html', 'dist/index.html')
    fs.copyFileSync('public/player.html', 'dist/player.html')
  }
  copyIndexHtml()
  
  let timer
  const debouncedCopy = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      copyStaticFiles()
      copyIndexHtml()
    }, 50)
  }
  fs.watch('public', { recursive: true }, debouncedCopy)
  fs.watch('api', { recursive: true }, debouncedCopy)

  if(serve) {
    // start server alongside watchers
    await buildJS.serve({
      servedir: './dist',
      port: 8000
    });
  }

  process.on('SIGINT', async () => {
    await buildCSS.dispose()
    await buildJS.dispose()
    await buildAudioWorkletJS.dispose()
    process.exit(0)
  })
}