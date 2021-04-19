import { Command, CommandMessage, Guard } from '@typeit/discord';
import { NotBot } from '../guards/notABot';
import { admin } from '../guards/admin';

import Settings from '../models/settings';

export default abstract class off {
  @Command('off')
  @Guard(NotBot)
  @Guard(admin)
  async off(message: CommandMessage) {
    await message.channel.send('```' + `Entered command is '!snipe off'\nConfirm with 'y' or 'n'` + '```');

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

    const settingsArray: any[] = await Settings.find();

    if (settingsArray[0].status) {
      await Settings.updateOne({ _id: settingsArray[0]._id }, { $set: { status: false } })
        .then(async () => {
          await message.channel.send('```' + `Successfully turned off` + '```');
          console.log('Successfully turned off\n');
        })
        .catch((err) => console.log(err));
    } else {
      await message.channel.send('```Snipe is already off```');
      console.log('!snipe off completed\n');
    }
  }
}
