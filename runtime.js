(function(){
class DCLogic{constructor(){this.props={};this.state={};}setState(o){Object.assign(this.state,o);this.__render&&this.__render();}}
function get(path,ctx){let c=ctx;for(const p of path.split('.')){if(c==null)return undefined;c=c[p];}return c;}
const HOLE=/\{\{\s*([\w.$]+)\s*\}\}/g;
function interp(str,ctx){return str.replace(HOLE,(_,p)=>{const v=get(p,ctx);return v==null?'':String(v);});}
function single(str){const m=/^\{\{\s*([\w.$]+)\s*\}\}$/.exec(str.trim());return m?m[1]:null;}
const EV={onclick:'click',onchange:'change',oninput:'input',onsubmit:'submit',onkeydown:'keydown'};
const BOOL=['checked','disabled','readonly','selected','hidden'];
function build(node,ctx,out){
  if(node.nodeType===3){out.appendChild(document.createTextNode(interp(node.nodeValue,ctx)));return;}
  if(node.nodeType!==1)return;
  const tag=node.tagName.toLowerCase();
  if(tag==='sc-if'){const p=single(node.getAttribute('value')||'');const v=p?get(p,ctx):false;if(v)for(const c of node.childNodes)build(c,ctx,out);return;}
  if(tag==='sc-for'){const p=single(node.getAttribute('list')||'');const as=node.getAttribute('as')||'item';const L=(p&&get(p,ctx))||[];L.forEach((it,i)=>{const sc=Object.assign(Object.create(ctx),{[as]:it,$index:i});for(const c of node.childNodes)build(c,sc,out);});return;}
  const el=node.namespaceURI==='http://www.w3.org/1999/xhtml'?document.createElement(tag):document.createElementNS(node.namespaceURI,node.localName);
  let valueProp;
  for(const a of Array.from(node.attributes)){
    const n=a.name.toLowerCase(),raw=a.value;
    if(n.startsWith('hint-'))continue;
    if(EV[n]){const p=single(raw);const fn=p&&get(p,ctx);if(typeof fn==='function')el.addEventListener(EV[n],e=>fn(e));continue;}
    const p=single(raw);
    if(BOOL.includes(n)){const v=p?get(p,ctx):raw!=='false';if(v){el.setAttribute(n,'');}continue;}
    if(n==='value'&&(tag==='input'||tag==='select'||tag==='textarea')){valueProp=p?get(p,ctx):raw;continue;}
    el.setAttribute(a.name,interp(raw,ctx));
  }
  const kids=tag==='template'?node.content.childNodes:node.childNodes;
  for(const c of kids)build(c,ctx,el);
  if(valueProp!==undefined)el.value=valueProp==null?'':String(valueProp);
  out.appendChild(el);
}
window.mountDC=function(root,tplHTML,code,defaults){
  const C=new Function('DCLogic',code+';return Component;')(DCLogic);
  const inst=new C();inst.props=Object.assign({},defaults);inst.state=inst.state||{};
  const tpl=document.createElement('template');tpl.innerHTML=tplHTML;
  inst.__render=function(){const sc=root.scrollTop;const keep=Array.from(root.querySelectorAll('main')).map(m=>m.scrollTop);
    const vals=inst.renderVals();const frag=document.createDocumentFragment();for(const c of tpl.content.childNodes)build(c,vals,frag);
    root.replaceChildren(frag);root.querySelectorAll('main').forEach((m,i)=>{if(keep[i])m.scrollTop=keep[i];});};
  inst.__render();
};
})();
