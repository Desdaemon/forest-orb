#!/usr/bin/env node

const { readdir, writeFile, mkdirSync } = require('fs')
const path = require('path')

readdir(path.resolve(__dirname, '../lang'), (err, files) => {
  if (err) throw err;

  for (const file of files) {
    const data = require(`../lang/${file}`)
    const lang = path.basename(file, '.json')
    const clazz = lang === 'en' ? 'BaseTranslation' : 'Translation'
    const contents = `
      import type { ${clazz} } from '../i18n-types';

      const ${lang} = ${JSON.stringify(data, undefined, 2)} satisfies ${clazz};
      export default ${lang};
    `
    mkdirSync(path.resolve(__dirname, `../svelte-frontend/src/i18n/${lang}`), { recursive: true });
    writeFile(path.resolve(__dirname, `../svelte-frontend/src/i18n/${lang}/index.ts`), contents, () => {
      console.log(`Wrote ${lang}/index.ts`)
    });
  }
})