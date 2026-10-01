import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {DataSet} from '@/types';
const tables=['profiles','fiscal_profiles','clients','invoices','invoice_items','payments','tax_payments','savings_reserves','deadlines','tax_configurations','activity_logs','tax_estimates'] as const;
export async function loadData(db:SupabaseClient,email:string):Promise<DataSet>{
 const results=await Promise.all(tables.map(async table=>{
  const all:unknown[]=[];let offset=0;
  // Explicit pagination prevents silently truncated annual totals at Supabase's default row limit.
  while(true){const {data,error}=await db.from(table).select('*').order('id').range(offset,offset+499);if(error)throw new Error('Database read failed');all.push(...data);if(data.length<500)break;offset+=500;}
  return[table,all] as const;
 }));
 const rows=Object.fromEntries(results);return{...rows,profile:rows.profiles[0]||null,email} as unknown as DataSet;
}
