import type { DataSet, Invoice } from '@/types';
import { estimateTax,round,sum } from './tax-engine';
export function invoicePaid(data:Pick<DataSet,'payments'>,id:string){return sum(data.payments.filter(p=>p.invoice_id===id).map(p=>Number(p.amount)));}
export function invoiceStatus(inv:Invoice,data:Pick<DataSet,'payments'>,today:string){
 if(inv.state==='draft')return 'Bozza';if(inv.state==='cancelled')return 'Annullata';
 const paid=invoicePaid(data,inv.id);if(paid>=Number(inv.total)&&Number(inv.total)>0)return 'Incassata';
 if(inv.due_date<today)return paid>0?'Scaduta · parziale':'Scaduta';if(paid>0)return 'Parziale';return 'Da incassare';
}
export function summarize(data:DataSet,year:number){
 const inYear=(d:string)=>d.startsWith(String(year)+'-');
 const invoices=data.invoices.filter(i=>inYear(i.issue_date)&&i.state==='issued');
 const receipts=sum(data.payments.filter(p=>inYear(p.paid_on)).map(p=>Number(p.amount)));
 const taxPaid=data.tax_payments.filter(p=>p.tax_year===year);
 const reserves=sum(data.savings_reserves.filter(r=>r.tax_year===year).map(r=>Number(r.amount)));
 const profile=data.fiscal_profiles.find(p=>p.tax_year===year);
 const estimate=profile?estimateTax(profile,{receipts,reserves,
 deductibleContributions:sum(data.tax_payments.filter(p=>inYear(p.paid_on)&&p.kind==='contribution'&&p.deductible).map(p=>Number(p.amount))),
 contributionCredits:sum(taxPaid.filter(p=>p.kind==='contribution').map(p=>Number(p.amount))),
 taxCredits:sum(taxPaid.filter(p=>['balance','first_advance','second_advance'].includes(p.kind)).map(p=>Number(p.amount))),
 cashTaxPayments:sum(data.tax_payments.filter(p=>inYear(p.paid_on)).map(p=>Number(p.amount))) }):null;
 const months=Array.from({length:12},(_,i)=>{const prefix=`${year}-${String(i+1).padStart(2,'0')}`;return{
 name:['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'][i],
 fatturato:sum(invoices.filter(v=>v.issue_date.startsWith(prefix)).map(v=>Number(v.total))),
 incassi:sum(data.payments.filter(v=>v.paid_on.startsWith(prefix)).map(v=>Number(v.amount))),
 accantonato:sum(data.savings_reserves.filter(v=>v.tax_year===year&&v.reserved_on<=`${prefix}-31`).map(v=>Number(v.amount)))
 };});
 const trend=months.map((m,i)=>({...m,fatturatoCumulativo:sum(months.slice(0,i+1).map(v=>v.fatturato)),incassiCumulativi:sum(months.slice(0,i+1).map(v=>v.incassi))}));
 return {profile,estimate,months,trend,receipts,reserves,invoiced:sum(invoices.map(i=>Number(i.total))),outstanding:sum(invoices.map(i=>Math.max(0,round(Number(i.total)-invoicePaid(data,i.id)))))};
}
