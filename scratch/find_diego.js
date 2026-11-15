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

async function findDiegoRecords() {
  const { data: senseis, error: errS } = await supabase
    .from('senseis')
    .select('id, usuario_id, usuarios(id, nombre, apellido_paterno, apellido_materno)');

  if (errS) {
    console.error('Error fetching senseis:', errS);
    return;
  }

  const matches = (senseis || []).filter(s => {
    const u = s.usuarios;
    const fullName = `${u?.nombre || ''} ${u?.apellido_paterno || ''} ${u?.apellido_materno || ''}`.toLowerCase();
    return fullName.includes('diego') || fullName.includes('gonzales');
  });

  console.log('Matches:', JSON.stringify(matches, null, 2));

  const trainerIds = matches.map(m => m.id);

  // Check asistencia_entrenadores
  const { data: asistEntrenador, error: errAE } = await supabase
    .from('asistencia_entrenadores')
    .select('*')
    .in('entrenador_id', trainerIds)
    .order('created_at', { ascending: false });

  console.log('Asistencias Entrenador:', JSON.stringify(asistEntrenador, null, 2));

  // Also check if any asistencia general (sesion de clase) was created with him
  const { data: sesiones, error: errSes } = await supabase
    .from('asistencias')
    .select('*')
    .in('sensei_id', trainerIds)
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('Sesiones creadas como sensei:', JSON.stringify(sesiones, null, 2));
}

findDiegoRecords();
