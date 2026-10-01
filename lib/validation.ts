import { z } from 'zod';
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const dateSchema=z.string().regex(/^\d{4}-\d{2}-\d{2}$/,'Data non valida').refine(v=>{const d=new Date(v+'T12:00:00Z');return !isNaN(d.valueOf())&&d.toISOString().slice(0,10)===v;},'Data non valida');
export const money=z.coerce.number().finite().min(0).max(100000000).refine(v=>Math.abs(v*100-Math.round(v*100))<0.000001,'Massimo due decimali');
const percent=z.coerce.number().finite().min(0).max(1);
const short=z.string().trim().max(200);
const notes=z.string().trim().max(4000).default('');
const email=z.union([z.literal(''),z.email().max(254)]).default('');
export function validVat(s:string){ if(!/^\d{11}$/.test(s)||/^0+$/.test(s))return false;let sum=0;for(let i=0;i<10;i++){let n=Number(s[i]);if(i%2){n*=2;if(n>9)n-=9;}sum+=n;}return(10-sum%10)%10===Number(s[10]); }
export function validTaxCode(s:string){
 if(!/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(s))return false;
 const odd=[1,0,5,7,9,13,15,17,19,21,2,4,18,20,11,3,6,8,12,14,16,10,22,25,24,23];let sum=0;
 for(let i=0;i<15;i++){const n=/\d/.test(s[i])?Number(s[i]):s.charCodeAt(i)-65;sum+=i%2?n:odd[n];}
 return String.fromCharCode(65+sum%26)===s[15];
}
export const profileSchema=z.object({first_name:short.min(1).max(100),last_name:short.min(1).max(100),business_name:short.default('')}).strict();
export const fiscalSchema=z.object({
 tax_year:z.coerce.number().int().min(2000).max(2100),vat_number:z.string().refine(validVat,'Partita IVA non valida'),tax_code:z.string().toUpperCase().refine(validTaxCode,'Codice fiscale non valido'),
 ateco:z.string().regex(/^\d{2}\.\d{2}\.\d{2}$/,'Formato ATECO: 00.00.00'),activity:z.string().trim().min(1).max(500),opened_year:z.coerce.number().int().min(1900).max(2100),
 coefficient:percent.refine(v=>v>0),tax_rate:percent,scheme:z.enum(['separata','artigiani','commercianti','custom']),contribution_rate:percent,reduction:percent,
 minimum_income:money,ceiling:money.refine(v=>v>0),extra_threshold:money,extra_rate:percent,fixed_fee:money,active_months:z.coerce.number().int().min(1).max(12),threshold:money.refine(v=>v>0),exit_threshold:money,
 additional_advance:money,configuration_id:z.uuid().nullable().optional(),configuration_version:short.min(1),eligibility_confirmed:z.boolean().refine(v=>v,'Conferma la verifica dei parametri e dei requisiti'),notes,
}).strict().refine(v=>v.opened_year<=v.tax_year,'Anno di apertura successivo all’anno fiscale').refine(v=>v.ceiling>=v.minimum_income,'Massimale inferiore al minimale').refine(v=>v.exit_threshold>=v.threshold,'Soglie non coerenti');
export const clientSchema=z.object({name:short.min(1),vat_number:z.string().max(30).default(''),tax_code:z.string().max(30).default(''),email,pec:email,recipient_code:z.string().max(7).default(''),address:short.default(''),postal_code:z.string().max(12).default(''),city:short.default(''),province:z.string().max(30).default(''),country:z.string().length(2).default('IT'),notes}).strict().superRefine((v,ctx)=>{
 if(v.country==='IT'&&v.vat_number&&!validVat(v.vat_number))ctx.addIssue({code:'custom',path:['vat_number'],message:'Partita IVA non valida'});
 if(v.country==='IT'&&v.tax_code&&!validTaxCode(v.tax_code)&&!validVat(v.tax_code))ctx.addIssue({code:'custom',path:['tax_code'],message:'Codice fiscale non valido'});
});
export const invoiceSchema=z.object({client_id:z.uuid(),number:z.string().trim().min(1).max(50),issue_date:dateSchema,due_date:dateSchema,state:z.enum(['draft','issued','cancelled']),description:notes,
 items:z.array(z.object({description:z.string().trim().min(1).max(500),quantity:z.coerce.number().finite().positive().max(1000000).multipleOf(0.001),unit_price:money}).strict()).min(1).max(100)
}).strict().refine(v=>v.due_date>=v.issue_date,'La scadenza precede l’emissione');
export const paymentSchema=z.object({invoice_id:z.uuid(),amount:money.refine(v=>v>0),paid_on:dateSchema.refine(v=>v<=today(),'Un incasso non può avere una data futura'),method:z.enum(['bank','cash','card','other']),notes}).strict();
export const taxPaymentSchema=z.object({kind:z.enum(['contribution','balance','first_advance','second_advance','other']),amount:money.refine(v=>v>0),paid_on:dateSchema.refine(v=>v<=today(),'Data futura non ammessa'),tax_year:z.coerce.number().int().min(2000).max(2100),deductible:z.boolean(),notes}).strict().refine(v=>!v.deductible||v.kind==='contribution','Solo i contributi possono essere deducibili');
export const reserveSchema=z.object({amount:z.coerce.number().finite().min(-100000000).max(100000000).refine(v=>v!==0&&Math.abs(v*100-Math.round(v*100))<0.000001,'Importo non valido'),reserved_on:dateSchema.refine(v=>v<=today(),'Data futura non ammessa'),tax_year:z.coerce.number().int().min(2000).max(2100),notes}).strict();
export const deadlineSchema=z.object({title:short.min(1),due_date:dateSchema,amount:money,kind:z.enum(['official','estimated','personal']),paid:z.boolean(),source_url:z.union([z.literal(''),z.url().startsWith('https://')]),verified_on:dateSchema.nullable(),notes}).strict().refine(v=>v.kind!=='official'||!!(v.source_url&&v.verified_on),'Una scadenza ufficiale richiede fonte e data di verifica');
export const schemas={profiles:profileSchema,fiscal_profiles:fiscalSchema,clients:clientSchema,invoices:invoiceSchema,payments:paymentSchema,tax_payments:taxPaymentSchema,savings_reserves:reserveSchema,deadlines:deadlineSchema};
export const credentialsSchema=z.object({email:z.email().max(254),password:z.string().min(12,'Usa almeno 12 caratteri').max(128)}).strict();
