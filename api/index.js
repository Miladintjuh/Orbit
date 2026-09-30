const upstreamOrigin='https://orbit-focus-workspace-e6d4mnxpc-mjeremic-9407.vercel.app';
const forwardHeaders=['authorization','content-type','cookie','if-none-match','accept','accept-language','sec-fetch-mode','sec-fetch-dest','user-agent'];

function sameOriginRequest(req){
  const host=String(req.headers.host||'').toLowerCase();
  if(!host)return false;
  const origin=req.headers.origin;
  if(origin){try{return new URL(origin).host.toLowerCase()===host}catch{return false}}
  const referer=req.headers.referer;
  if(referer){try{return new URL(referer).host.toLowerCase()===host}catch{return false}}
  return ['GET','HEAD','OPTIONS'].includes(req.method||'GET');
}

async function requestBody(req){
  if(['GET','HEAD'].includes(req.method||'GET'))return undefined;
  const parts=[];
  for await(const part of req)parts.push(part);
  return parts.length?Buffer.concat(parts):undefined;
}

export default async function handler(req,res){
  const incoming=new URL(req.url||'/api/index','https://orbit.local');
  const action=incoming.searchParams.get('action')||'';
  if(!/^[a-z0-9/_-]+$/i.test(action)){
    res.statusCode=400;
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.end(JSON.stringify({error:'Invalid API route.'}));
    return;
  }
  if(!['GET','HEAD','OPTIONS'].includes(req.method||'GET')&&!sameOriginRequest(req)){
    res.statusCode=403;
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.end(JSON.stringify({error:'This request must come from your Orbit app.'}));
    return;
  }
  const target=new URL('/api/'+action,upstreamOrigin);
  for(const [key,value] of incoming.searchParams)if(key!=='action')target.searchParams.append(key,value);
  const headers={};
  for(const key of forwardHeaders)if(req.headers[key])headers[key]=req.headers[key];
  headers.origin=target.origin;
  let refererPath='/';
  try{const referer=new URL(req.headers.referer||'/',`https://${req.headers.host||'localhost'}`);refererPath=referer.pathname||'/';}catch{}
  headers.referer=new URL(refererPath,target.origin).href;
  headers['sec-fetch-site']='same-origin';
  try{
    const upstream=await fetch(target,{method:req.method,headers,body:await requestBody(req),redirect:'manual'});
    res.statusCode=upstream.status;
    const cookies=typeof upstream.headers.getSetCookie==='function'?upstream.headers.getSetCookie():[];
    if(cookies.length)res.setHeader('Set-Cookie',cookies.map(cookie=>cookie.replace(/;\s*domain=[^;]*/i,'')));
    for(const [key,value] of upstream.headers){
      if(['connection','content-encoding','content-length','set-cookie','transfer-encoding'].includes(key))continue;
      res.setHeader(key,value);
    }
    res.end(Buffer.from(await upstream.arrayBuffer()));
  }catch{
    res.statusCode=502;
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.end(JSON.stringify({error:'Orbit’s existing workspace service is temporarily unavailable.'}));
  }
}
