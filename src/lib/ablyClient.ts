import Ably from 'ably';

// Create singleton Ably client instance
class AblyClientSingleton {
  private static instance: Ably.Realtime;

  private constructor() {}

  public static getInstance(): Ably.Realtime {
    if (!AblyClientSingleton.instance) {
      try {
        AblyClientSingleton.instance = new Ably.Realtime({
          key: 'zqOS-Q.3Ln0KA:KT7z1oyr6SXRo2-BDY4i852lQp_8JMZTcryej8d3o2g',
          clientId: crypto.randomUUID(),
          echoMessages: false,
          autoConnect: false // Only connect when needed
        });

        // Add connection state change listener
        AblyClientSingleton.instance.connection.on('connected', () => {
          console.log('Connected to Ably');
        });

        AblyClientSingleton.instance.connection.on('failed', () => {
          console.error('Failed to connect to Ably');
        });
      } catch (error) {
        console.error('Failed to initialize Ably client:', error);
        throw error;
      }
    }
    return AblyClientSingleton.instance;
  }

  public static isConfigured(): boolean {
    return true;
  }
}

export const ablyClient = {
  getInstance: () => AblyClientSingleton.getInstance(),
  isConfigured: () => AblyClientSingleton.isConfigured()
};