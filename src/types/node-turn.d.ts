declare module 'node-turn' {
  interface TurnServerConfig {
    authMech?: 'long-term' | 'short-term';
    credentials?: Record<string, string>;
    realm?: string;
    debugLevel?: 'ALL' | 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE';
    listenIps?: string[];
    relayIps?: string[];
    minPort?: number;
    maxPort?: number;
    defaultLifetime?: number;
    cert?: string;
    key?: string;
  }

  interface TurnServer {
    start(callback?: () => void): void;
    stop(): void;
  }

  function createServer(config: TurnServerConfig): TurnServer;
  export = createServer;
}