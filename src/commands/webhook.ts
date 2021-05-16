import * as Discord from 'discord.js';
import { Command, CommandMessage, Guard } from '@typeit/discord';
import { NotBot } from '../guards/notABot';

import Users from '../models/users';

export default abstract class Webhook {
  @Command('webhook')
  @Guard(NotBot)
  async webhook(message: CommandMessage): Promise<void> {
    let input: string = message.content.slice(9);

    let webhook: string = '';
    const d_id: string = message.author.id;
    const usersArray: any[] = await Users.find({ d_id: d_id });

    if (input.length != 0) {
      webhook = input;

      if (webhook.includes('test') && usersArray.length != 0) {
        let user = usersArray[0];
        let split = user.webhook.split('/');
        let id = split[5];
        let token = split[6];
        let webhook = new Discord.WebhookClient(id, token);

        try {
          if (user.webhook.length == 0) {
            await message.channel.send(
              '```' + `No webhook detected\nInput a webhook with the command '!webhook'` + '```'
            );
            console.log('Empty webhook message sent\n');
          } else {
            await webhook
              .send('```' + 'Test Success' + '```')
              .then(() => {
                console.log('Webhook tested successfully\n');
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
          }
        } catch (err) {
          if (usersArray.length != 0) {
            let user = usersArray[0];

            await message.channel
              .send(
                '```' +
                  `User webhook link not valid, current user webhook is '${user.webhook}'\nInput a new webhook link with the command'!webhook'` +
                  '```'
              )
              .then(() => {
                console.log('Invalid webhook message sent');
              });
          }

          console.log(err);
        }

        return;
      }
    } else {
      await message.channel.send('```' + `Enter webhook link\nEnter 'n' to cancel` + '```');

      let exit = false;
      let stopped = false;

      const collector = message.channel.createMessageCollector((msg) => msg.author.id == message.author.id, {
        time: 60000,
      });

      for await (const m of collector) {
        if (m.content.toLowerCase() == 'n') {
          collector.stop();
          stopped = true;
          exit = true;
        } else {
          collector.stop();
          stopped = true;
          webhook = m.content;
          console.log('Webhook is', webhook);
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
    }

    try {
      if (usersArray.length == 0) {
        const newUser = new Users({
          d_id: d_id,
          useWebhook: false,
          webhook: webhook,
          courses: [],
        });

        await newUser
          .save()
          .then(() => {
            console.log(`Successfully created new user ${d_id} from webhook\n`);
            message.channel.send('```Webhook successfully added```');
          })
          .catch((err) => {
            throw new Error(err);
          });
      } else {
        await Users.updateOne({ d_id: d_id }, { $set: { webhook: webhook } })
          .then(() => {
            message.channel.send('```Webhook successfully added```');
            console.log('New webhook successfully added\n');
          })
          .catch((err) => {
            throw new Error(err);
          });
      }
    } catch (err) {
      console.log(err);

      message.channel.send('```Unexpected error!```');
    }
  }
}
