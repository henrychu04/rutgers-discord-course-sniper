import { Client } from '@typeit/discord';
const Mongoose = require('mongoose');
import * as dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../.env' });

import monitorCourses from './scripts/monitorCourses';

export class Main {
  private static client: Client;

  static get Client(): Client {
    return this.client;
  }

  static async start() {
    let mongoConnected = false;

    while (!mongoConnected) {
      await Mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .catch((err: string) => {
          throw new Error(err);
        })
        .then(() => {
          mongoConnected = true;
          console.log('Connected to MongoDB');
        });
    }

    this.client = new Client();

    this.client.login(process.env.BOT_TOKEN, `${__dirname}/events/*.ts`, `${__dirname}/events/*.js`).then(() => {
      monitorCourses(this.client);
      console.log('Ready!\n');
      this.client.user.setActivity(`'!help' for all commands`);
    });
  }
}

Main.start();
