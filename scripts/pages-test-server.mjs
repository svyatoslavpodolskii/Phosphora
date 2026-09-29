// A strict static host: no Vite fallback, COOP/COEP, or custom SW scope headers.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.wasm':'application/wasm','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
createServer(async(req,res)=>{
 try{
  let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/Different-Repo'){res.writeHead(301,{Location:'/Different-Repo/'});res.end();return;}
  if(path.startsWith('/Different-Repo/'))path=path.slice('/Different-Repo'.length);
  let file=resolve(root,'.'+path);
  if(file!==root&&!file.startsWith(root+sep))throw Error('Invalid path');
  if((await stat(file)).isDirectory())file=resolve(file,'index.html');
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(4185,'127.0.0.1');
