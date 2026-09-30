const upstreamOrigin='https://orbit-focus-workspace-e6d4mnxpc-mjeremic-9407.vercel.app';
const forwardHeaders=['authorization','content-type','cookie','if-none-match','user-agent'];

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
  const target=new URL('/api/'+action,upstreamOrigin);
  for(const [key,value] of incoming.searchParams)if(key!=='action')target.searchParams.append(key,value);
  const headers={};
  for(const key of forwardHeaders)if(req.headers[key])headers[key]=req.headers[key];
  try{
    const upstream=await fetch(target,{method:req.method,headers,body:await requestBody(req),redirect:'manual'});
    res.statusCode=upstream.status;
    const cookies=typeof upstream.headers.getSetCookie==='function'?upstream.headers.getSetCookie():[];
    if(cookies.length)res.setHeader('Set-Cookie',cookies);
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
