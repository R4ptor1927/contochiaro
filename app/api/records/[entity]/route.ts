import {NextResponse} from 'next/server';
import {z} from 'zod';
import {schemas} from '@/lib/validation';
import {authenticated,assertOrigin,readBody,apiFailure,ApiError,dbFailure} from '@/lib/api';
type Context={params:Promise<{entity:string}>};
async function mutate(request:Request,context:Context){try{
 assertOrigin(request);const{db,user}=await authenticated();const{entity}=await context.params;
 if(!Object.hasOwn(schemas,entity))throw new ApiError(404,'Sezione inesistente.');
 const body=await readBody(request);const id=body.id?z.uuid().parse(body.id):undefined;
 if(request.method==='DELETE'){
  if(!id)throw new ApiError(400,'Record mancante.');
  if(entity==='profiles'||entity==='fiscal_profiles')throw new ApiError(400,'Usa la modifica del profilo o l’eliminazione account.');
  const {error}=entity==='invoices'?await db.rpc('delete_invoice',{invoice_id:id}):await db.from(entity).delete().eq('id',id).eq('user_id',user.id);
  if(error)dbFailure(error.code);return NextResponse.json({ok:true});
 }
 const parsed=schemas[entity as keyof typeof schemas].safeParse(body.data);if(!parsed.success)throw new ApiError(422,parsed.error.issues.map(v=>`${v.path.join('.')}: ${v.message}`).join('; '));
 if(entity==='invoices'){const {data,error}=await db.rpc('save_invoice',{payload:{...parsed.data,id}});if(error)dbFailure(error.code);return NextResponse.json({id:data});}
 const row:Record<string,unknown>={...parsed.data,user_id:user.id};
 const query=id?db.from(entity).update(row).eq('id',id).eq('user_id',user.id):db.from(entity).insert(row);
 const {data,error}=await query.select('id').single();if(error)dbFailure(error.code);return NextResponse.json(data);
}catch(e){if(e instanceof z.ZodError)return NextResponse.json({error:'Identificativo non valido.'},{status:422});return apiFailure(e);}}
export const POST=mutate;export const DELETE=mutate;
