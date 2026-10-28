import {createClient} from './vendor/supabase.js';
import {supabaseUrl,supabaseKey} from './config.js';
export const client=createClient(supabaseUrl,supabaseKey);
export async function rpc(name,args={}){const {data,error}=await client.rpc(name,args);if(error){const failure=new Error(error.message.includes('schema cache')?'雲端資料表尚未設定，請先執行 Supabase SQL 腳本。':error.message);failure.code=/資料已更新|revision conflict/i.test(error.message)?'REVISION_CONFLICT':error.code;throw failure;}return data;}
