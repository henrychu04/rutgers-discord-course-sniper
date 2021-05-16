import { Command, CommandMessage, Guard } from '@typeit/discord';
import { NotBot } from '../guards/notABot';

import Users from '../models/users';

export default abstract class UseWebhook {
  @Command('useWebhook')
  @Guard(NotBot)
  async useWebhook(message: CommandMessage): Promise<void> {
    const d_id = message.author.id;

    await Users.updateOne({ d_id: d_id }, { $set: { useWebhook: true } })
      .then(() => {
        message.channel.send('```Open section notifications changed to webhook notifications```');
        console.log('useWebhook successfully updated\n');
      })
      .catch((err) => {
        throw new Error(err);
      });
  }
}
