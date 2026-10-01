import {NextResponse} from 'next/server';
import {z} from 'zod';
import {assertOrigin,readBody,apiFailure,ApiError} from '@/lib/api';
import {supabaseServer,isConfigured} from '@/lib/supabase/server';
const input=z.object({action:z.enum(['login','register','recover','logout','password','resend']),email:z.email().max(254).optional(),password:z.string().min(12).max(128).optional(),current_password:z.string().max(128).optional()}).strict();
export async function POST(request:Request){try{
 assertOrigin(request);if(!isConfigured())throw new ApiError(503,'Supabase non è ancora configurato. Puoi esplorare la demo.');
 const parsed=input.safeParse(await readBody(request));if(!parsed.success)throw new ApiError(422,'Controlla email e password (almeno 12 caratteri).');
 const{action,email,password,current_password}=parsed.data;const db=await supabaseServer();const origin=new URL(process.env.APP_URL||'http://localhost:3000').origin;
 if(action==='logout'){await db.auth.signOut();return NextResponse.json({ok:true});}
 if(action==='password'){
  const{data:{user}}=await db.auth.getUser();if(!user||!password)throw new ApiError(401,'Accedi prima di modificare la password.');
  if(current_password){const{error}=await db.auth.signInWithPassword({email:user.email!,password:current_password});if(error)throw new ApiError(401,'Password attuale non corretta.');}
  const{error}=await db.auth.updateUser({password});if(error)throw new ApiError(400,'Impossibile aggiornare la password. Richiedi un nuovo link di recupero.');
  await db.auth.signOut({scope:'global'});return NextResponse.json({ok:true,message:'Password aggiornata. Accedi con la nuova password.'});
 }
 if(!email)throw new ApiError(422,'Inserisci l’email.');
 if(action==='recover'){await db.auth.resetPasswordForEmail(email,{redirectTo:origin+'/auth/callback?recovery=1'});return NextResponse.json({message:'Se l’indirizzo è registrato, riceverai il link di recupero.'});}
 if(action==='resend'){await db.auth.resend({type:'signup',email,options:{emailRedirectTo:origin+'/auth/callback'}});return NextResponse.json({message:'Se necessario, riceverai un nuovo link di conferma.'});}
 if(!password)throw new ApiError(422,'Inserisci la password.');
 if(action==='register'){const{error}=await db.auth.signUp({email,password,options:{emailRedirectTo:origin+'/auth/callback'}});if(error)throw new ApiError(400,'Registrazione non riuscita. Controlla i dati o riprova più tardi.');return NextResponse.json({message:'Controlla la tua email e conferma l’indirizzo prima di accedere.'});}
 const{error}=await db.auth.signInWithPassword({email,password});if(error)throw new ApiError(401,'Credenziali non valide o email non ancora confermata.');
 return NextResponse.json({ok:true});
}catch(e){return apiFailure(e);}}
