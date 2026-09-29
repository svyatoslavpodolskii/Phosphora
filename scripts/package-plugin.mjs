import {zipSync,strToU8} from 'fflate';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {join,resolve,relative} from 'node:path';
const source=resolve(process.argv[2]||'plugins/example');const output=resolve(process.argv[3]||'artifacts/quick-idea.phosphored');
const files={};async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const path=join(dir,item.name);if(item.isDirectory())await walk(path);else files[relative(source,path).replaceAll('\\','/')]=new Uint8Array(await readFile(path));}}
await walk(source);if(!files['manifest.json']||!files['main.js'])throw Error('manifest.json and main.js required');JSON.parse(new TextDecoder().decode(files['manifest.json']));await writeFile(output,zipSync(files,{level:6}));console.log(output);
