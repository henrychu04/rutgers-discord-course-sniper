import { Client } from '@typeit/discord';
const Mongoose = require('mongoose');
import * as dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../.env' });

import monitorCourses from './scripts/monitorCourses';
import monitorUsers from './scripts/monitorUsers';

export class Main {
  private static _client: Client;

  static get Client(): Client {
    return this._client;
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

    this._client = new Client();

    this._client.login(process.env.BOT_TOKEN, `${__dirname}/events/*.ts`, `${__dirname}/events/*.js`).then(() => {
      monitorCourses();
      monitorUsers(this._client);
      console.log('Ready!');
    });
  }
}

Main.start();
