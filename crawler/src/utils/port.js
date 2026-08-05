import net from 'node:net';

/**
 * @param {number} port
 * @returns {Promise<boolean>}
 */
export function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.close(() => resolve(true));
      })
      .listen(port, '0.0.0.0');
  });
}

/**
 * Listen on preferred port; if EADDRINUSE, try next ports.
 * @param {import('express').Express} app
 * @param {number} preferredPort
 * @param {number} [maxTries=50]
 * @returns {Promise<{ server: import('node:http').Server, port: number }>}
 */
export function listenWithFallback(app, preferredPort, maxTries = 50) {
  const start = Math.max(1, Math.min(65535, Number(preferredPort) || 3780));
  const tries = Math.max(1, Number(maxTries) || 50);

  return new Promise((resolve, reject) => {
    let attempt = 0;

    const tryListen = (port) => {
      if (attempt >= tries || port > 65535) {
        reject(
          new Error(
            `无法绑定端口：从 ${start} 起尝试 ${tries} 次均失败（可能都被占用）`
          )
        );
        return;
      }
      attempt += 1;
      const server = app.listen(port, '127.0.0.1');

      const onError = (err) => {
        server.removeListener('listening', onListening);
        if (err && err.code === 'EADDRINUSE') {
          // close just in case, then try next
          try {
            server.close();
          } catch {
            /* ignore */
          }
          tryListen(port + 1);
          return;
        }
        reject(err);
      };

      const onListening = () => {
        server.removeListener('error', onError);
        resolve({ server, port });
      };

      server.once('error', onError);
      server.once('listening', onListening);
    };

    tryListen(start);
  });
}
