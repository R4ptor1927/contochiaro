'use client';
import {useState,useContext} from 'react';
import {DemoContext} from './demo-provider';
import {toast} from 'sonner';
import type {DataSet,Entity,Invoice,Payment} from '@/types';
import {schemas} from '@/lib/validation';
import {round,sum} from '@/services/tax-engine';
export type SaveRecord=(entity:Entity,data:unknown,id?:string)=>Promise<void>;
export type RemoveRecord=(entity:Entity,id:string)=>Promise<void>;
export function useData(initial:DataSet,demo:boolean){
 const[localData,setLocalData]=useState(initial);const demoContext=useContext(DemoContext);const data=demo&&demoContext?demoContext.data:localData;const setData=demo&&demoContext?demoContext.setData:setLocalData;const[busy,setBusy]=useState(false);
 async function remote(entity:Entity,method:string,payload:unknown){const res=await fetch('/api/records/'+entity,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const result=await res.json();if(!res.ok)throw new Error(result.error);const fresh=await fetch('/api/data',{cache:'no-store'});if(!fresh.ok)throw new Error('Dato salvato, ma aggiornamento non riuscito. Ricarica la pagina.');setData(await fresh.json());}
 const save:SaveRecord=async(entity,input,id)=>{setBusy(true);try{
  const parsed=schemas[entity].safeParse(input);if(!parsed.success)throw new Error(parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; '));
  if(!demo){await remote(entity,'POST',{data:parsed.data,id});return;}
  const row={...parsed.data,id:id||crypto.randomUUID()};
  if(entity==='payments'){
   const p=row as Payment;const invoice=data.invoices.find(i=>i.id===p.invoice_id);
   const paid=sum(data.payments.filter(v=>v.invoice_id===p.invoice_id&&v.id!==id).map(v=>v.amount));
   if(!invoice||invoice.state!=='issued'||round(paid+p.amount)>invoice.total)throw new Error('L’incasso supera il residuo o la fattura non è emessa.');
  }
  if(entity==='invoices'){
   const value=parsed.data as {items:{description:string;quantity:number;unit_price:number}[]};const inv=row as unknown as Invoice;
   if(data.invoices.some(v=>v.number===inv.number&&v.id!==id))throw new Error('Numero fattura già presente.');
   const paid=sum(data.payments.filter(v=>v.invoice_id===id).map(v=>v.amount));const total=sum(value.items.map(v=>round(v.quantity*v.unit_price)));
   if(paid>0&&(inv.state!=='issued'||total<paid||data.invoices.find(i=>i.id===id)?.client_id!==inv.client_id))throw new Error('La fattura ha incassi: verifica totale, cliente e stato.');
   setData(prev=>({...prev,invoices:[...prev.invoices.filter(v=>v.id!==id),{...inv,total}],invoice_items:[...prev.invoice_items.filter(v=>v.invoice_id!==id),...value.items.map((v,i)=>({...v,id:crypto.randomUUID(),invoice_id:row.id,position:i}))]}));return;
  }
  setData(prev=>entity==='profiles'?({...prev,profile:row as DataSet['profile']}):({...prev,[entity]:[...(prev[entity as keyof DataSet] as {id:string}[]).filter(v=>v.id!==id),row]}));
 }finally{setBusy(false);}};
 const remove:RemoveRecord=async(entity,id)=>{setBusy(true);try{
  if(!demo){await remote(entity,'DELETE',{id});return;}
  if(entity==='clients'&&data.invoices.some(i=>i.client_id===id))throw new Error('Il cliente ha fatture associate.');
  if(entity==='invoices'&&data.payments.some(p=>p.invoice_id===id))throw new Error('La fattura ha incassi associati.');
  setData(prev=>({...prev,[entity]:(prev[entity as keyof DataSet] as {id:string}[]).filter(v=>v.id!==id),...(entity==='invoices'?{invoice_items:prev.invoice_items.filter(v=>v.invoice_id!==id)}:{})}));
 }finally{setBusy(false);}};
 async function logout(){if(demo){window.location.assign('/login');return;}try{const res=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})});if(!res.ok)throw new Error();window.location.assign('/login');}catch{toast.error('Uscita non riuscita. Riprova.');}}
 return{data,save,remove,busy,logout,setData};
}
