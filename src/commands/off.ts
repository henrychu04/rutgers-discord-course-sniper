import { Command, CommandMessage, Guard } from '@typeit/discord';
import * as Discord from 'discord.js';
import { NotBot } from '../guards/notABot';
import { admin } from '../guards/admin';

import Settings from '../models/settings';
import Users from '../models/users';

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

      const snipeUsersArray: any[] = await Users.find();

      const embed = new Discord.MessageEmbed()
        .setColor('#FF0000')
        .setTitle('Rutgers Course Sniper')
        .setDescription('Course Sniper Status - OFF 🔴')
        .setTimestamp();

      for (let user of snipeUsersArray) {
        if (user.webhook.length != 0 && user.courses.length != 0) {
          let split = user.webhook.split('/');
          let id = split[5];
          let token = split[6];
          let webhook = new Discord.WebhookClient(id, token);

          try {
            await webhook
              .send(embed)
              .then(() => {
                console.log('Webhook successfully sent\n');
              })
              .catch((err) => {
                if (err.message == 'Unknown Webhook') {
                  throw new Error('Unknown webhook');
                } else if (err.message == 'Invalid Webhook Token') {
                  throw new Error('Invalid webhook token');
                } else {
                  throw new Error(err);
                }
              });
          } catch (err) {
            console.log(err);
          }
        }
      }
    } else {
      await message.channel.send('```Snipe is already off```');
      console.log('!snipe off completed\n');
    }
  }
}
