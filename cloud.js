import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './config.js';
export const cloud={client:null,authListener:null,user:null};
const valid=SUPABASE_URL.startsWith('https://')&&!SUPABASE_URL.includes('SEU-PROJETO')&&SUPABASE_PUBLISHABLE_KEY&&!SUPABASE_PUBLISHABLE_KEY.startsWith('COLE_');
export async function setupCloud(onUser,onInfo){
  if(!valid){document.querySelector('#app').innerHTML='<main class="auth-wrap"><div class="auth-card"><h1>Configuração necessária</h1><p>Preencha config.js com a URL e a chave publicável do Supabase antes de testar o login.</p><p>As instruções estão no README.md.</p></div></main>';return}
  // A biblioteca é importada do CDN em tempo de execução; use HTTPS e não remova a RLS.
  const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.49.10');
  const client=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  cloud.client=client;
  let lastUserId=null,loading=false;
  const apply=async session=>{const user=session?.user||null;cloud.user=user;if(user?.id===lastUserId)return;lastUserId=user?.id||null;if(loading)return;loading=true;try{await onUser(user)}finally{loading=false}};
  client.auth.onAuthStateChange((event,session)=>{
    // Avoid awaiting database queries inside onAuthStateChange's internal lock.
    if(event==='SIGNED_IN'||event==='SIGNED_OUT'||event==='INITIAL_SESSION')setTimeout(()=>void apply(session),0);
    if(event==='PASSWORD_RECOVERY')setTimeout(async()=>{
      const next=prompt('Digite sua nova senha (mínimo 8 caracteres):');if(next?.length>=8){const {error}=await client.auth.updateUser({password:next});alert(error?error.message:'Senha atualizada.')}else alert('Atualização cancelada.');
    },0);
  });
  const {data,error}=await client.auth.getSession();if(error)throw error;
  await apply(data.session);
}
cloud.signIn=async(email,password)=>{const {error}=await cloud.client.auth.signInWithPassword({email,password});if(error)throw error};
cloud.signUp=async(email,password)=>{const {data,error}=await cloud.client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});if(error)throw error;return data};
cloud.resetPassword=async(email)=>{const {error}=await cloud.client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error};
cloud.signOut=async()=>{const {error}=await cloud.client.auth.signOut();if(error)alert(error.message)};
cloud.read=async(userId)=>{if(!cloud.user||cloud.user.id!==userId)throw new Error('Sessão alterada. Entre novamente.');const {data,error}=await cloud.client.from('user_state').select('payload,revision').eq('user_id',userId).maybeSingle();if(error)throw error;return data};
cloud.write=async(payload,expectedRevision,userId)=>{
  if(!cloud.user||cloud.user.id!==userId)throw new Error('Sessão alterada. Entre novamente.');
  const user_id=userId;
  if(expectedRevision===0){
    const {data,error}=await cloud.client.from('user_state').insert({user_id,payload,revision:1}).select('revision').single();
    if(error)throw error;return data.revision;
  }
  const {data,error}=await cloud.client.from('user_state').update({payload,revision:expectedRevision+1}).eq('user_id',user_id).eq('revision',expectedRevision).select('revision');
  if(error)throw error;
  if(data?.length!==1){const err=new Error('VERSION_CONFLICT: outra sessão alterou os dados');err.code='CONFLICT';throw err}
  return data[0].revision;
};
