import { Command, CommandMessage, Guard } from '@typeit/discord';
import { NotBot } from '../guards/notABot';

import Users from '../models/users';

export default abstract class UseDM {
  @Command('useDM')
  @Guard(NotBot)
  async useDM(message: CommandMessage): Promise<void> {
    const d_id = message.author.id;

    await Users.updateOne({ d_id: d_id }, { $set: { useWebhook: false } })
      .then(() => {
        message.channel.send('```Open section notifications changed to DM notifications```');
        console.log('useDM successfully updated\n');
      })
      .catch((err) => {
        throw new Error(err);
      });
  }
}
