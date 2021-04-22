import { Command, CommandMessage, Guard } from '@typeit/discord';
import { NotBot } from '../guards/notABot';
import { admin } from '../guards/admin';

import Users from '../models/users';

export default abstract class RemoveAll {
  @Command('removeAll')
  @Guard(NotBot)
  @Guard(admin)
  async removeAll(message: CommandMessage) {
    await message.channel.send('```' + `Entered command is '!removeall'\nConfirm with 'y' or 'n'` + '```');

    let stopped = false;
    let exit = false;

    const collector = message.channel.createMessageCollector((msg) => msg.author.id == message.author.id, {
      time: 60000,
    });

    for await (const m of collector) {
      if (m.content.toLowerCase() == 'n') {
        collector.stop();
        stopped = true;
        exit = true;
      } else if (m.content.toLowerCase() == 'y') {
        collector.stop();
        stopped = true;
      }
    }

    if (exit) {
      await message.channel.send('```Command canceled```');
      console.log('Canceled\n');
      return;
    } else if (!stopped) {
      await message.channel.send('```Command timed out, stopping```');
      console.log('Timed out\n');
      return;
    }

    try {
      await Users.updateMany({}, { $set: { courses: [] } })
        .then(async () => {
          await message.channel.send('```Successfully removed all sections```');
          console.log('Successfully removed all sections\n');
        })
        .catch((err) => console.log(err));
    } catch (err) {
      console.log(err);
    }
  }
}
