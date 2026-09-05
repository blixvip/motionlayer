"use client";
import { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { graphicsRequest } from '../graphics/GraphicsWorkspace';
import type { GraphicSpec } from '@/packages/graphics/spec';
export type ReferenceSelection={palette:GraphicSpec['style']['palette'];source:string;fallback:boolean};
export function ReferencePicker({value,onChange,onBusy}:{value:ReferenceSelection|null;onChange:(v:ReferenceSelection|null)=>void;onBusy:(v:boolean)=>void}) {
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[name,setName]=useState('');
  async function pick(file?:File){if(!file)return;setError('');if(file.size>3*1024*1024){setError('Choose an image under 3 MB.');return;}setBusy(true);onBusy(true);
    try{const image=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Image could not be read.'));reader.readAsDataURL(file);});const response=await graphicsRequest<ReferenceSelection>('reference','POST',{image});onChange(response);setName(file.name);}
    catch(e){setError(e instanceof Error?e.message:'Could not sample this image. Try a PNG or JPEG.');}finally{setBusy(false);onBusy(false);}}
  return <section className="reference-picker"><div><span>Color reference</span><small>{value?'Sampled from your image':'Studio reference · default'}</small></div><label className="reference-upload"><ImagePlus size={17}/><span>{busy?'Sampling palette…':value?name:'Add a reference image'}<small>PNG, JPG or WebP · up to 3 MB</small></span><input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Color reference image" disabled={busy} onChange={e=>void pick(e.target.files?.[0])}/></label>{value && <div className="reference-result"><div>{Object.entries(value.palette).map(([role,color])=><i key={role} title={`${role}: ${color}`} style={{background:color}}/>)}</div><button type="button" aria-label="Remove color reference" onClick={()=>{onChange(null);setName('');}}><X size={14}/>Remove</button></div>}{value?.fallback && <p role="status">No clear accent found; using the studio reference hue.</p>}{error && <p role="alert">{error}</p>}</section>;
}
