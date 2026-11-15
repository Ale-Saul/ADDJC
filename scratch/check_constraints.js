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

async function checkConstraints() {
  // Let's test if updating a test row to 'tarde' throws an error
  const { data: testRow } = await supabase.from('asistencia_detalle').select('id, estado').limit(1).single();
  console.log('Original test row:', testRow);

  const { error: errTarde } = await supabase.from('asistencia_detalle').update({ estado: 'tarde' }).eq('id', testRow.id);
  console.log('Update to "tarde" error:', errTarde);

  const { error: errPermiso } = await supabase.from('asistencia_detalle').update({ estado: 'permiso' }).eq('id', testRow.id);
  console.log('Update to "permiso" error:', errPermiso);

  // Restore original
  await supabase.from('asistencia_detalle').update({ estado: testRow.estado }).eq('id', testRow.id);
  console.log('Restored original state:', testRow.estado);
}

checkConstraints();
