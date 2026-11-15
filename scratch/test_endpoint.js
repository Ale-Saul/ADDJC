const https = require('https');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

async function testEndpoint() {
  const data = JSON.stringify({ query: "SELECT 1;" });
  const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: '/v1/projects/bkieatnermhdmsqxhtih/database/query',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => console.log('Response:', res.statusCode, body));
  });
  req.on('error', e => console.error(e));
  req.write(data);
  req.end();
}

testEndpoint();
