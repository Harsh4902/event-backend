import axios from 'axios';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:8080/events';
const API_KEY = process.env.API_KEY || 'test-api-key'; // fallback

const ORG_ID = 'org1';
const PROJECT_ID = 'proj1';

async function seedEvents(batchSize = 100) {
  const events = [];

  for (let i = 0; i < batchSize; i++) {
    const userId = "user"+faker.number.int({min: 1, max: 50});
    const numEvents = faker.number.int({ min: 2, max: 6 });
    const baseTime = faker.date.recent({ days: 7 });

    for (let j = 0; j < numEvents; j++) {
      events.push({
        userId,
        event: faker.helpers.arrayElement(['signup', 'login', 'view_page', 'purchase']),
        properties: {
          device: faker.helpers.arrayElement(['mobile','web']),
          browser: faker.internet.userAgent(),
        },
        timestamp: new Date(baseTime.getTime() + j * 1000 * 60), // add 1 min per event
        orgId: ORG_ID,
        projectId: PROJECT_ID,
      });
    }
  }

  try {
    const res = await axios.post(API_URL, { events }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });
    console.log(`✅ Seeded ${events.length} events`);
  } catch (err) {
    console.error('❌ Failed to send events', err.response?.data || err.message);
  }
}

seedEvents(50); // batch of 50 users (approx 200–300 events)
