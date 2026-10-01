import Decimal from 'decimal.js';
import type { FiscalProfile, Scheme } from '@/types';
const D=(v:Decimal.Value)=>new Decimal(v);
export const round=(v:Decimal.Value)=>D(v).toDecimalPlaces(2,Decimal.ROUND_HALF_UP).toNumber();
export const sum=(values:number[])=>round(values.reduce((a,b)=>a.plus(b),D(0)));
export interface TaxInput { receipts:number; deductibleContributions:number; contributionCredits:number; taxCredits:number; reserves:number; cashTaxPayments:number }
export interface TaxStep {label:string;value:number;formula:string}
export interface TaxResult {year:number;version:string;income:number;contributions:number;taxable:number;tax:number;total:number;remaining:number;toReserve:number;available:number;reserveRate:number;creditExcess:number;valid:boolean;steps:TaxStep[];warnings:string[];parameters:FiscalProfile;input:TaxInput}
type Strategy=(income:Decimal,p:FiscalProfile)=>Decimal;
const business:Strategy=(income,p)=>{
 const min=D(p.minimum_income).mul(p.active_months).div(12);
 const base=Decimal.min(Decimal.max(income,min),p.ceiling);
 return base.mul(p.contribution_rate).plus(Decimal.max(0,base.minus(p.extra_threshold)).mul(p.extra_rate)).mul(D(1).minus(p.reduction)).plus(D(p.fixed_fee).mul(p.active_months).div(12));
};
export const strategies:Record<Scheme,Strategy>={
 separata:(income,p)=>Decimal.min(income,p.ceiling).mul(p.contribution_rate).mul(D(1).minus(p.reduction)),
 artigiani:business,commercianti:business,
 custom:(income,p)=>business(income,p),
};
export function estimateTax(p:FiscalProfile,input:TaxInput):TaxResult {
 for(const [key,value] of Object.entries(input))if(!Number.isFinite(value)||(value<0&&key!=='reserves'))throw new Error('Input fiscale non valido: '+key);
 for(const key of ['coefficient','tax_rate','contribution_rate','reduction','extra_rate'] as const)if(!Number.isFinite(p[key])||p[key]<0||p[key]>1)throw new Error('Percentuale non valida');
 for(const key of ['minimum_income','ceiling','extra_threshold','fixed_fee','threshold','exit_threshold','additional_advance'] as const)if(!Number.isFinite(p[key])||p[key]<0)throw new Error('Parametro non valido');
 if(!strategies[p.scheme]||p.coefficient<=0||p.ceiling<=0||p.ceiling<p.minimum_income||p.active_months<1||p.active_months>12||!Number.isInteger(p.active_months))throw new Error('Configurazione previdenziale non valida');
 const income=round(D(input.receipts).mul(p.coefficient));
 const contributions=round(strategies[p.scheme](D(income),p));
 const taxable=round(Decimal.max(0,D(income).minus(input.deductibleContributions)));
 const tax=round(D(taxable).mul(p.tax_rate));
 const total=sum([contributions,tax]);
 const cLeft=Decimal.max(0,D(contributions).minus(input.contributionCredits));
 const tLeft=Decimal.max(0,D(tax).minus(input.taxCredits));
 const remaining=round(cLeft.plus(tLeft).plus(p.additional_advance));
 const toReserve=round(Decimal.max(0,D(remaining).minus(input.reserves)));
 const available=round(D(input.receipts).minus(input.cashTaxPayments).minus(Decimal.max(remaining,input.reserves)));
 const warnings=['Stima orientativa, non consulenza fiscale. Non include spese personali o aziendali e non rappresenta il saldo bancario.','Gli acconti futuri sono inclusi solo se configurati esplicitamente; non è una liquidazione F24.'];
 if(p.tax_rate===0.05)warnings.push('Aliquota al 5%: verificare requisiti e durata del beneficio.');
 if(p.scheme==='custom'||p.reduction>0||p.active_months<12)warnings.push('Configurazione personalizzata o agevolata: verificare basi, riduzioni, maternità e frazionamento con il professionista.');
 if(input.receipts>p.threshold)warnings.push('Soglia di permanenza superata: verifica le conseguenze sul regime con il professionista.');
 if(input.receipts>p.exit_threshold)warnings.push('Soglia di uscita immediata superata: questa proiezione forfettaria non è utilizzabile come stima delle imposte dovute.');
 if(!p.eligibility_confirmed)warnings.push('Parametri e requisiti non ancora confermati.');
 return {year:p.tax_year,version:p.configuration_version,income,contributions,taxable,tax,total,remaining,toReserve,available,
 reserveRate:input.receipts?round(D(total).div(input.receipts).mul(100)):0,
 creditExcess:round(Decimal.max(0,D(input.contributionCredits).minus(contributions)).plus(Decimal.max(0,D(input.taxCredits).minus(tax)))),valid:input.receipts<=p.exit_threshold&&p.eligibility_confirmed,
 steps:[{label:'Incassi rilevanti',value:input.receipts,formula:'Somma degli incassi per data di pagamento nell’anno selezionato'},
 {label:'Reddito forfettario',value:income,formula:`Incassi × ${round(p.coefficient*100)}%`},
 {label:'Contributi stimati',value:contributions,formula:p.scheme==='separata'?`min(reddito, ${p.ceiling}) × ${round(p.contribution_rate*100)}% × (1 − riduzione)`:`[min(max(reddito, minimale × mesi / 12), massimale) × aliquota + eccedenza scaglione × aliquota aggiuntiva] × (1 − riduzione) + quota fissa × mesi / 12`},
 {label:'Contributi dedotti per cassa',value:input.deductibleContributions,formula:'Contributi deducibili effettivamente versati nell’anno, anche di competenza precedente'},
 {label:'Base imponibile',value:taxable,formula:'max(0, reddito forfettario − contributi deducibili versati)'},
 {label:'Imposta sostitutiva',value:tax,formula:`Base imponibile × ${round(p.tax_rate*100)}%`},
 {label:'Residuo da coprire',value:remaining,formula:'max(0, contributi − versamenti di competenza) + max(0, imposta − versamenti di competenza) + acconti aggiuntivi configurati'}],warnings,parameters:{...p},input:{...input}};
}
