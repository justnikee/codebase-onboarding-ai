const { Client } = require('pg');
const client = new Client({
  host: 'db.zruxivmoxhbtrxurkfne.supabase.co',
  port: 5432, database: 'postgres', user: 'postgres',
  password: '@Nikhil@98161', ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();

  // Check trigger exists
  const t = await client.query(`SELECT trigger_name, event_object_schema, event_object_table FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created'`);
  console.log('Trigger:', JSON.stringify(t.rows));

  // Check function exists
  const f = await client.query(`SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_new_user'`);
  console.log('Function exists:', f.rows.length > 0);
  if (f.rows.length) console.log('Function body:\n', f.rows[0].prosrc);

  // Check profiles table
  const p = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' ORDER BY ordinal_position`);
  console.log('Profiles columns:', p.rows.map(r => r.column_name).join(', '));

  await client.end();
}
run().catch(console.error);
