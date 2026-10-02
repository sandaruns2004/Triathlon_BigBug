import {db} from "../lib/db/firebase";
import {getAuth} from "firebase-admin/auth";
import bcrypt from "bcrypt";
import {identifier} from "../lib/mobile/errors";
import {firebaseUidFor} from "../lib/auth/credentials";
/** Operations-only process: IAM/admin credentials control execution. Never exposed as a public reset API. */
export async function manageAccount(userId:string,action:"reset"|"disable"|"activate",password?:string){
  const ref=db.collection("users").doc(identifier(userId));
  if(action!=="disable"&&(!password||password.length<12||password.length>128))throw Error("A 12–128 character operations-supplied password is required.");
  const passwordHash=password?await bcrypt.hash(password,12):undefined;
  let uid="";
  await db.runTransaction(async tx=>{
    const user=await tx.get(ref);if(!user.exists)throw Error("Provision the role and outlet/depot before activation.");
    uid=user.data()!.firebaseUid??firebaseUidFor(userId);
    tx.update(ref,{authVersion:(user.data()!.authVersion??0)+1,enabled:action!=="disable",
      accountStatus:action==="disable"?"disabled":"active",firebaseUid:uid,
      ...(passwordHash?{passwordHash}:{}),credentialsChangedAt:new Date().toISOString()});
  });
  // Version enforcement takes effect even if provider revocation must be retried.
  try {await getAuth().revokeRefreshTokens(uid);}
  catch(error:any){if(error.code!=="auth/user-not-found")throw Error("Account version updated; retry provider revocation before closing the support ticket.");}
  return {status:"accepted"};
}
if(process.argv[1]?.endsWith("manage-mobile-account.ts")){
  const [action,userId]=process.argv.slice(2);
  if(!["reset","disable","activate"].includes(action??"")||!userId)throw Error("Use reset|disable|activate and a stable provisioned user ID.");
  manageAccount(userId,action as "reset"|"disable"|"activate",process.env.WAYPOINT_NEW_PASSWORD)
    .then(()=>{process.stdout.write("Account updated; old application sessions are rejected.\n");process.exit(0);})
    .catch(()=>{process.stderr.write("Account change requires operations review; no credentials are printed.\n");process.exit(1);});
}

