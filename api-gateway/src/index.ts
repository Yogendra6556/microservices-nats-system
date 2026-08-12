import express, { Request, Response } from 'express';
import { connect, NatsConnection, JSONCodec } from 'nats';

const app = express();
app.use(express.json());

const jsonCodec = JSONCodec();
let nc: NatsConnection;

const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';

async function initNats() {
  let connected = false;
  while (!connected) {
    try {
      nc = await connect({ servers: [NATS_URL] });
      connected = true;
      console.log('API Gateway connected to NATS');
    } catch (err) {
      console.log('Retrying NATS connection in 2s...');
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
}

app.post('/api/v1/users', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    const msg = await nc.request(
      'user.v1.create',
      jsonCodec.encode({ email, name }),
      { timeout: 5000 }
    );

    const response = jsonCodec.decode(msg.data);
    res.status(201).json(response);
  } catch (err: any) {
    res.status(500).json({ error: 'User service error', details: err.message });
  }
});

app.listen(3000, async () => {
  await initNats();
  console.log('API Gateway running on port 3000');
});
