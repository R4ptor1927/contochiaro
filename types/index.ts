export type Scheme = 'separata'|'artigiani'|'commercianti'|'custom';
export interface Owned { id:string; user_id?:string; created_at?:string; updated_at?:string }
export interface Profile extends Owned {first_name:string;last_name:string;business_name:string}
export interface FiscalProfile extends Owned {
 tax_year:number;vat_number:string;tax_code:string;ateco:string;activity:string;opened_year:number;
 coefficient:number;tax_rate:number;scheme:Scheme;contribution_rate:number;reduction:number;
 minimum_income:number;ceiling:number;extra_threshold:number;extra_rate:number;fixed_fee:number;active_months:number;
 threshold:number;exit_threshold:number;additional_advance:number;configuration_id?:string|null;configuration_version:string;eligibility_confirmed:boolean;notes:string;
}
export interface Client extends Owned {name:string;vat_number:string;tax_code:string;email:string;pec:string;recipient_code:string;address:string;postal_code:string;city:string;province:string;country:string;notes:string}
export interface InvoiceItem extends Owned {invoice_id?:string;description:string;quantity:number;unit_price:number;position?:number}
export interface Invoice extends Owned {client_id:string;number:string;issue_date:string;due_date:string;state:'draft'|'issued'|'cancelled';description:string;total:number}
export interface Payment extends Owned {invoice_id:string;amount:number;paid_on:string;method:'bank'|'cash'|'card'|'other';notes:string}
export interface TaxPayment extends Owned {kind:'contribution'|'balance'|'first_advance'|'second_advance'|'other';amount:number;paid_on:string;tax_year:number;deductible:boolean;notes:string}
export interface Reserve extends Owned {amount:number;reserved_on:string;tax_year:number;notes:string}
export interface Deadline extends Owned {title:string;due_date:string;amount:number;kind:'official'|'estimated'|'personal';paid:boolean;source_url:string;verified_on:string|null;notes:string}
export interface TaxConfiguration extends Owned {tax_year:number;version:string;valid_from:string;valid_to:string;parameters:Record<string,number|Record<string,number>>;sources:string[];verified_at:string|null;notes:string}
export interface Activity extends Owned {entity:string;entity_id:string;action:string;fiscal_snapshot:Record<string,unknown>|null}
export interface Snapshot extends Owned {tax_year:number;parameters:Record<string,unknown>;result:Record<string,unknown>}
export interface DataSet {profile:Profile|null;fiscal_profiles:FiscalProfile[];clients:Client[];invoices:Invoice[];invoice_items:InvoiceItem[];payments:Payment[];tax_payments:TaxPayment[];savings_reserves:Reserve[];deadlines:Deadline[];tax_configurations:TaxConfiguration[];activity_logs:Activity[];tax_estimates:Snapshot[];email:string}
export type Entity='clients'|'invoices'|'payments'|'tax_payments'|'savings_reserves'|'deadlines'|'profiles'|'fiscal_profiles';
