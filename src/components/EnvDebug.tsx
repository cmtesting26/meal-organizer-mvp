/**
 * Debug Component - Test Environment Variables
 */

export function EnvDebug() {
  const proxyUrl = import.meta.env.VITE_CORS_PROXY_URL;
  
  console.log('=== ENV DEBUG ===');
  console.log('VITE_CORS_PROXY_URL:', proxyUrl);
  console.log('Type:', typeof proxyUrl);
  console.log('All env vars:', import.meta.env);
  console.log('================');

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 10, 
      left: 10, 
      background: 'black', 
      color: 'lime', 
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '400px',
      wordBreak: 'break-all'
    }}>
      <div><strong>ENV DEBUG:</strong></div>
      <div>VITE_CORS_PROXY_URL: {proxyUrl || '❌ NOT SET'}</div>
      <div>Type: {typeof proxyUrl}</div>
      <div>{proxyUrl ? '✅ Proxy configured' : '❌ No proxy found'}</div>
    </div>
  );
}
