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

async function checkAsistenciaSchema() {
  // Try inserting a dummy row or check column info
  const { data, error } = await supabase.from('asistencia_detalle').select('*').limit(1);
  console.log('Sample asistencia_detalle:', data, error);

  // Check distinct states
  const { data: allD } = await supabase.from('asistencia_detalle').select('estado');
  const states = Array.from(new Set(allD?.map(d => d.estado)));
  console.log('Distinct states currently in DB:', states);

  // Test if 'tarde' or 'permiso' is accepted by DB
  // We can test by inserting and immediately deleting a test record if needed
}

checkAsistenciaSchema();
