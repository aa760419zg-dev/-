import {createClient} from './vendor/supabase.js';
import {supabaseUrl,supabaseKey} from './config.js';
export const client=createClient(supabaseUrl,supabaseKey);
export async function rpc(name,args={}){const {data,error}=await client.rpc(name,args);if(error)throw new Error(error.message.includes('schema cache')?'雲端資料表尚未設定，請先執行 Supabase SQL 腳本。':error.message);return data;}
