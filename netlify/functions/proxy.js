// Netlify Function — proxy dla API FireTMS
// Rozwiązuje problem CORS: przeglądarka → ta funkcja → FireTMS API
// Wywoływana przez frontend jako: POST /.netlify/functions/proxy

exports.handler = async function (event) {

  // Obsługa preflight CORS (browser OPTIONS request)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { apiKey, allowDuplicates, payload } = body;

  if (!apiKey) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Missing apiKey' }) };
  }
  if (!payload) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Missing payload' }) };
  }

  const url = `https://app.firetms.com/api/loads?allowClientOrderNumberDuplicates=${allowDuplicates === true}`;

  let ftmsResponse;
  try {
    ftmsResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    return {
      statusCode: 502,
      headers: corsHeaders(),
      body: JSON.stringify({ error: `Nie można połączyć się z FireTMS: ${err.message}` })
    };
  }

  const responseText = await ftmsResponse.text();

  return {
    statusCode: ftmsResponse.status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders()
    },
    body: responseText
  };
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
