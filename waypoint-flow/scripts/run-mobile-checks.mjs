import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
if(process.env.MOBILE_TEST_MODE!=='emulator'||process.env.FIREBASE_PROJECT_ID!=='demo-waypoint-mobile'){
  throw new Error('Use only the isolated mobile demo emulators.');
}
const origin='http://127.0.0.1:3175';
const environment={...process.env,HOSTNAME:'127.0.0.1',PORT:'3175',NEXTAUTH_URL:origin,
  MOBILE_TEST_DIST_DIR:'.next-mobile-ci',
  NEXTAUTH_SECRET:randomBytes(32).toString('hex'),MOBILE_HTTP_ORIGIN:origin};
async function run(args){
  await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,args,{env:environment,stdio:'inherit'});
    child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error('Mobile checks failed.')));
  });
}
await run(['node_modules/tsx/dist/cli.mjs','--test','tests/mobile-service.test.ts']);
const server=spawn(process.execPath,['server.js'],{env:environment,stdio:'inherit'});
try{
  let ready=false;
  for(let i=0;i<90;i++){
    if(server.exitCode!==null)throw new Error('Test API exited.');
    try{ready=(await fetch(origin+'/api/mobile/v1/me')).status===401;}catch{}
    if(ready)break;await new Promise(resolve=>setTimeout(resolve,1000));
  }
  if(!ready)throw new Error('Test API did not become ready.');
  await run(['node_modules/tsx/dist/cli.mjs','--test','tests/mobile-http.test.ts']);
}finally{server.kill('SIGTERM');}
