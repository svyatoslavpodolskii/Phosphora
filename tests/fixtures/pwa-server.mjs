import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('dist');let revision=1;
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.wasm':'application/wasm','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(pathname==='/__revision'&&req.method==='POST'){revision++;res.end('ok');return;}
 const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!path.startsWith(root+'/')&&!path.startsWith(root+'\\')){res.writeHead(403).end();return;}
 try{let bytes=await readFile(path);if(pathname==='/sw.js')bytes=Buffer.concat([Buffer.from('// revision '+revision+'\n'),bytes]);res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);}catch{res.writeHead(404).end();}
});
server.listen(4282,'127.0.0.1',()=>process.stdout.write('ready\n'));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
