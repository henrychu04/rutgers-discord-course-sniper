import { Monitor } from '../classes/monitor.js';
import webhook from './webhook.js';
import sendDM from './sendDM.js';

export default async (client: any) => {
  let newMonitor = new Monitor(client);

  console.log('Course monitor started ...\n');

  newMonitor.on('open', (obj) => {
    let { user, embedArray, tag, client } = obj;

    if (user.useWebhook && user.webhook.length != 0) {
      for (let embed of embedArray) {
        webhook(user, embed, tag);
      }
    } else if (!user.useWebhook) {
      for (let embed of embedArray) {
        sendDM(user, embed, client);
      }
    }
  });
};
