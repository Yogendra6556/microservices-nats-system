import { connect, JSONCodec } from 'nats';

const jsonCodec = JSONCodec();
const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';

async function start() {
  let nc;
  while (true) {
    try {
      nc = await connect({ servers: [NATS_URL] });
      break;
    } catch {
      await new Promise((res) => setTimeout(res, 2000));
    }
  }

  const js = nc.jetstream();
  console.log('Notification Service active. Waiting for events...');

  const sub = await js.subscribe('user.v1.created', { queue: 'notification-group' });
  for await (const msg of sub) {
    const user = jsonCodec.decode(msg.data) as any;
    console.log(`[NOTIFICATION] Welcome email sent to ${user.email} (ID: ${user.id})`);
    msg.ack();
  }
}

start().catch(console.error);
