function listenWithPortFallback(server, options) {
  const { host, startPort, maxAttempts = 100, onRetry = () => {} } = options;

  return new Promise((resolve, reject) => {
    let port = startPort;
    let attempts = 1;

    const listen = () => {
      const handleListening = () => {
        server.off('error', handleError);
        resolve(port);
      };
      const handleError = (error) => {
        server.off('listening', handleListening);
        if (error.code !== 'EADDRINUSE' || attempts >= maxAttempts) {
          reject(error);
          return;
        }

        const occupiedPort = port;
        port += 1;
        attempts += 1;
        onRetry(occupiedPort, port);
        setImmediate(listen);
      };

      server.once('listening', handleListening);
      server.once('error', handleError);
      server.listen(port, host);
    };

    listen();
  });
}

module.exports = { listenWithPortFallback };
