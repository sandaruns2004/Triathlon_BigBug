const {createServer}=require("http");
const {parse}=require("url");
const next=require("next");
const dev=process.env.NODE_ENV!=="production";
const hostname=process.env.HOSTNAME||"127.0.0.1";
const port=Number(process.env.PORT||3000);
const app=next({dev,hostname,port}),handle=app.getRequestHandler();
app.prepare().then(()=>{
  // MVP uses authorized API polling. No anonymous rooms or client-forwarded events.
  const server=createServer(async(req,res)=>{
    try{await handle(req,res,parse(req.url,true));}
    catch{res.statusCode=500;res.end("Server unavailable");}
  });
  server.once("error",()=>{console.error("HTTP server could not start.");process.exit(1);});
  server.listen(port,hostname,()=>console.log("Waypoint HTTP server ready on port "+port));
});
