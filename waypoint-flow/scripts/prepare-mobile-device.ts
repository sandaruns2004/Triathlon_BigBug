import {seedMobileTestData} from "./seed-mobile-test";
import {db} from "../lib/db/firebase";
import {currentPrincipal} from "../lib/auth/credentials";
import {loadStop} from "../lib/mobile/operations";
seedMobileTestData().then(async()=>{
  const loader=currentPrincipal("test-loader",(await db.collection("users").doc("test-loader").get()).data()!);
  await loadStop(loader,"TEST-STOP-1");await loadStop(loader,"TEST-STOP-2");
  process.stdout.write("Isolated demo route released for connected Android verification.\n");process.exit(0);
}).catch(()=>{process.stderr.write("Emulator-only device fixture preparation failed.\n");process.exit(1);});

