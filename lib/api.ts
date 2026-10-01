import 'server-only';
import {NextResponse} from 'next/server';
import {supabaseServer,isConfigured} from './supabase/server';
export class ApiError extends Error {constructor(public status:number,message:string){super(message);}}
export async function authenticated(){
 if(!isConfigured())throw new ApiError(503,'Collega Supabase per usare un account reale.');
 const db=await supabaseServer();const {data:{user},error}=await db.auth.getUser();
 if(error||!user)throw new ApiError(401,'Sessione scaduta. Accedi nuovamente.');return{db,user};
}
export function assertOrigin(request:Request){const origin=request.headers.get('origin');const expected=new URL(process.env.APP_URL||'http://localhost:3000').origin;if(origin!==expected)throw new ApiError(403,'Richiesta non autorizzata.');}
export async function readBody(request:Request){const raw=await request.text();if(raw.length>200000)throw new ApiError(413,'Richiesta troppo grande.');try{return JSON.parse(raw);}catch{throw new ApiError(400,'Dati non validi.');}}
export function apiFailure(error:unknown){
 if(error instanceof ApiError)return NextResponse.json({error:error.message},{status:error.status});
 // Log only a category. Payloads, personal details and authentication tokens never enter logs.
 console.error('[contochiaro] request_failed');return NextResponse.json({error:'Operazione non riuscita. Riprova tra poco.'},{status:500});
}
export function dbFailure(code?:string):never {if(code==='23503')throw new ApiError(409,'Il record è collegato ad altri dati: rimuovi prima i collegamenti.');if(code==='23505')throw new ApiError(409,'Esiste già un record con questi dati.');if(code==='23514'||code==='P0001')throw new ApiError(422,'Controlla date, importi e stato. Gli incassi non possono superare il residuo.');throw new ApiError(400,'Non è possibile salvare questi dati.');}
