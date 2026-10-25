// Offline suites may connect only to loopback HTTP servers created in this process.
import net from 'node:net';
const ports = new Set();
const listen = net.Server.prototype.listen;
net.Server.prototype.listen = function (...args) {
  this.once('listening', () => {
    const address = this.address();
    if (address && typeof address === 'object') ports.add(address.port);
  });
  this.once('close', () => {
    /* closed ports cannot reach the normal database */
  });
  return listen.apply(this, args);
};
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const value = Array.isArray(args[0]) ? args[0][0] : args[0];
  const options =
    typeof value === 'object' && value !== null
      ? value
      : {
          port: value,
          host: typeof args[1] === 'string' ? args[1] : 'localhost',
        };
  const host = options.host || 'localhost';
  if (
    !ports.has(Number(options.port)) ||
    !['127.0.0.1', 'localhost', '::1'].includes(host)
  )
    throw new Error('OFFLINE_NETWORK_BLOCKED');
  return connect.apply(this, args);
};
