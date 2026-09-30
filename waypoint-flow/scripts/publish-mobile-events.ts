import {publishPendingEvents} from "../lib/mobile/service";
async function loop(){
  const once=process.argv.includes("--once");
  do{
    try{await publishPendingEvents(100);}
    catch{process.stderr.write("Notification publishing will retry durable pending events.\n");}
    if(!once)await new Promise(resolve=>setTimeout(resolve,10000));
  }while(!once);
}
loop().then(()=>process.exit(0));

