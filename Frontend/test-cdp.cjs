const { spawn } = require('child_process');
const os = require('os');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = os.tmpdir() + '\\edge-profile-' + Date.now();

const browser = spawn(edgePath, [
  '--headless',
  '--disable-gpu',
  '--remote-debugging-port=9223',
  '--user-data-dir=' + userDataDir,
  'about:blank'
]);

async function run() {
  await new Promise(r => setTimeout(r, 1500));
  const tabsRes = await fetch('http://localhost:9223/json');
  const tabs = await tabsRes.json();
  const pageTab = tabs.find(t => t.type === 'page');

  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  let id = 1;

  function send(method, params = {}) {
    const msgId = id++;
    ws.send(JSON.stringify({ id: msgId, method, params }));
    return msgId;
  }

  const logs = [];
  const errors = [];

  ws.addEventListener('open', () => {
    send('Runtime.enable');
    send('Page.enable');
    send('Page.navigate', { url: 'http://localhost:5173/auth/google/success' });
  });

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data.toString());
    if (msg.method === 'Runtime.consoleAPICalled') {
      logs.push(msg.params.type + ': ' + msg.params.args.map(a => a.value ?? a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
    }
  });

  await new Promise(r => setTimeout(r, 4000));

  let evalId = send('Runtime.evaluate', {
    expression: `JSON.stringify({
      location: window.location.href,
      rootHtml: document.getElementById('root') ? document.getElementById('root').innerHTML : 'NO_ROOT',
      bodyText: document.body.innerText
    })`
  });

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data.toString());
    if (msg.id === evalId) {
      const parsed = JSON.parse(msg.result?.result?.value || '{}');
      console.log('CURRENT URL:', parsed.location);
      console.log('BODY TEXT:\n', parsed.bodyText);
      console.log('ROOT HTML LENGTH:', parsed.rootHtml?.length);
      console.log('Console Logs:', logs);
      console.log('Exceptions:', errors);
      browser.kill();
      process.exit(0);
    }
  });

  setTimeout(() => {
    console.log('Timeout. Logs:', logs, 'Errors:', errors);
    browser.kill();
    process.exit(0);
  }, 3000);
}

run().catch(e => {
  console.error(e);
  browser.kill();
});
