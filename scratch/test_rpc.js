const path = require('path');
const fs = require('fs');

const envPath = path.resolve(process.cwd(), '.env');
const env = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
  const match = env.match(new RegExp(`^${key}=(.*)$`, 'm'));
  if (!match) return null;
  return match[1].trim().replace(/^['"]|['"]$/g, '');
};
const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const { createClient } = require(path.resolve(process.cwd(), 'node_modules/@supabase/supabase-js'));
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
  const rpcs = ['exec_sql', 'execute_sql', 'run_sql', 'sql', 'query'];
  for (const r of rpcs) {
    const { data, error } = await supabase.rpc(r, { query: 'SELECT 1;' });
    console.log(`RPC ${r}:`, error?.message);
  }
}

testRpc();
