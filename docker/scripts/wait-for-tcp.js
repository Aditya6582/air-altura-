const net = require('net');

const [host, portArg, timeoutArg] = process.argv.slice(2);

if (!host || !portArg) {
  console.error('Usage: node wait-for-tcp.js <host> <port> [timeoutMs]');
  process.exit(1);
}

const port = Number(portArg);
const timeoutMs = Number(timeoutArg || 120000);
const startedAt = Date.now();

function attempt() {
  const socket = net.connect({ host, port });

  socket.setTimeout(5000);

  socket.on('connect', () => {
    socket.end();
    console.log(`Connected to ${host}:${port}`);
    process.exit(0);
  });

  const retry = () => {
    socket.destroy();
    if (Date.now() - startedAt >= timeoutMs) {
      console.error(`Timed out waiting for ${host}:${port}`);
      process.exit(1);
    }
    setTimeout(attempt, 1000);
  };

  socket.on('error', retry);
  socket.on('timeout', retry);
}

attempt();
