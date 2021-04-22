import { Command, CommandMessage, Guard } from '@typeit/discord';
import { NotBot } from '../guards/notABot';
import { admin } from '../guards/admin';

import Users from '../models/users';

export default abstract class Stats {
  @Command('stats')
  @Guard(NotBot)
  @Guard(admin)
  async stats(message: CommandMessage) {
    const snipeUsersArray: any[] = await Users.find();

    let noWebhook = 0;

    snipeUsersArray.forEach((user) => {
      if (user.webhook.length == 0) {
        noWebhook++;
      }
    });

    let courses = 0;

    snipeUsersArray.forEach((user) => {
      courses += user.courses.length;
    });

    await message.channel
      .send('```' + `Users: ${snipeUsersArray.length}\nCourses: ${courses}\nNo webhook: ${noWebhook}` + '```')
      .then(() => {
        console.log('!stats completed\n');
      });
  }
}
