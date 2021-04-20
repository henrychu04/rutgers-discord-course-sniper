import { Monitor } from '../classes/monitor.js';
import webhook from './webhook.js';

export default async () => {
  let newMonitor = new Monitor();

  console.log('Course monitor started ...\n');

  newMonitor.on('open', (user: { webhook: string; d_id: string }, embedArray: any) => {
    if (user.webhook.length != 0) {
      for (let embed of embedArray) {
        webhook(user, embed);
      }
    }
  });
};
