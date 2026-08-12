import { connect, JSONCodec, NatsConnection } from 'nats';

const jsonCodec = JSONCodec();
const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';
const usersDB = new Map<string, any>();

async function start() {
  let nc: NatsConnection;
  while (true) {
    try {
      nc = await connect({ servers: [NATS_URL] });
      break;
    } catch {
      await new Promise((res) => setTimeout(res, 2000));
    }
  }

  const js = nc.jetstream();
  const jsm = await nc.jetstreamManager();

  await jsm.streams.add({
    name: 'USER_EVENTS',
    subjects: ['user.v1.created'],
  });

  console.log('User Service initialized.');

  const createSub = nc.subscribe('user.v1.create');
  (async () => {
    for await (const msg of createSub) {
      const { email, name } = jsonCodec.decode(msg.data) as any;
      const newUser = { id: Date.now().toString(), email, name, createdAt: new Date().toISOString() };
      usersDB.set(newUser.id, newUser);

      await js.publish('user.v1.created', jsonCodec.encode(newUser));
      msg.respond(jsonCodec.encode({ status: 'SUCCESS', data: newUser }));
    }
  })();
}

start().catch(console.error);
