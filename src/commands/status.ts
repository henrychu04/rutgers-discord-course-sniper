import { Command, CommandMessage, Guard } from '@typeit/discord';
import { NotBot } from '../guards/notABot';
import { admin } from '../guards/admin';

import Settings from '../models/settings';

export default abstract class Add {
  @Command('status')
  @Guard(NotBot)
  @Guard(admin)
  async status(message: CommandMessage) {
    const settingsArray: any[] = await Settings.find();

    if (settingsArray[0].status) {
      await message.channel.send('```Status: On```');
    } else {
      await message.channel.send('```Status: Off```');
    }
  }
}
