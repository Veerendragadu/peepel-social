import createServer from 'node-turn';

class TurnServer {
  private server: ReturnType<typeof createServer>;

  constructor() {
    this.server = createServer({
      authMech: 'long-term',
      credentials: {
        username: process.env.TURN_USERNAME || 'default_user',
        password: process.env.TURN_PASSWORD || 'default_password'
      },
      realm: process.env.TURN_REALM || 'peepel.com',
      debugLevel: 'INFO',
      listenIps: ['0.0.0.0'],
      relayIps: ['0.0.0.0'],
      minPort: 49152,
      maxPort: 65535,
      defaultLifetime: 600
    });
  }

  start(port: number = 3478) {
    this.server.start(() => {
      console.log(`TURN server running on port ${port}`);
    });
  }

  stop() {
    this.server.stop();
  }
}

export default TurnServer;