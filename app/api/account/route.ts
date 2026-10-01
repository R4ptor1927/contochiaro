import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {authenticated,assertOrigin,readBody,apiFailure,ApiError} from '@/lib/api';
import {loadData} from '@/lib/data';
export async function GET(){try{const{db,user}=await authenticated();return NextResponse.json(await loadData(db,user.email||''),{headers:{'Content-Disposition':'attachment; filename="contochiaro-dati.json"','Cache-Control':'no-store'}});}catch(e){return apiFailure(e);}}
export async function DELETE(request:Request){try{
 assertOrigin(request);const{db,user}=await authenticated();const body=await readBody(request);
 if(body.confirmation!=='ELIMINA'||typeof body.password!=='string'||body.password.length>128)throw new ApiError(422,'Conferma con ELIMINA e la password attuale.');
 if(!process.env.SUPABASE_SECRET_KEY)throw new ApiError(503,'Eliminazione non disponibile: il gestore deve configurare la chiave server.');
 const{error}=await db.auth.signInWithPassword({email:user.email!,password:body.password});if(error)throw new ApiError(401,'Password non corretta.');
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 // Identity comes only from validated auth, never request body.
 const{error:deletionError}=await admin.auth.admin.deleteUser(user.id);if(deletionError)throw new ApiError(500,'Eliminazione non riuscita. Riprova.');await db.auth.signOut();return NextResponse.json({ok:true});
}catch(e){return apiFailure(e);}}
