import {NextResponse} from 'next/server';
import {authenticated,apiFailure} from '@/lib/api';
import {loadData} from '@/lib/data';
export async function GET(){try{const{db,user}=await authenticated();return NextResponse.json(await loadData(db,user.email||''),{headers:{'Cache-Control':'private, no-store'}});}catch(e){return apiFailure(e);}}
