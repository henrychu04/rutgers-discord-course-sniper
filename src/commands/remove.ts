import { Command, CommandMessage, Guard } from '@typeit/discord';
import { NotBot } from '../guards/notABot';
import Snipe from './snipe';

import Users from '../models/users';

export default abstract class Remove {
  @Command('remove')
  @Guard(NotBot)
  async remove(message: CommandMessage) {
    const d_id: string = message.author.id;
    const snipeUsersArray: any[] = await Users.find({ d_id: d_id });

    let allSnipes = new Snipe();
    await allSnipes.snipe(message);

    await message.channel.send(
      '```' +
        `Enter section number(s) to remove\n\nFormat:\n\t<section number> <section number>\n\nExample: \n\t12345 12345\n\nEnter 'all' to remove all\nEnter 'n' to cancel` +
        '```'
    );

    let exit = false;
    let stopped = false;

    function checkNum(num: string) {
      if (isNaN(+num) || num.length != 5) {
        return false;
      }

      let exist = false;

      for (let course of snipeUsersArray[0].courses) {
        if (course.num == num) {
          exist = true;
          break;
        }
      }

      if (exist) {
        return true;
      } else {
        return false;
      }
    }

    let valid = false;
    let split: string[] = [];
    let all = false;

    const collector = message.channel.createMessageCollector((msg) => msg.author.id == message.author.id, {
      time: 60000,
    });

    for await (const message of collector) {
      split = message.content.split(' ');

      if (message.content.toLowerCase() == 'n') {
        collector.stop();
        stopped = true;
        exit = true;
      } else if (message.content.toLowerCase() == 'all') {
        collector.stop();
        stopped = true;
        all = true;
      } else {
        valid = true;

        for (let i = 0; i < split.length; i++) {
          for (let j = i + 1; j < split.length; j++) {
            if (split[i] == split[j]) {
              valid = false;
              message.channel.send(
                '```' + `Please do not enter duplicate sections at once\nPlease enter new section numbers` + '```'
              );
              break;
            }
          }

          if (!checkNum(split[i]) && valid) {
            valid = false;
            message.channel.send(
              '```' +
                'One or more entered section number(s) is not valid or do not exist\nPlease enter new section numbers' +
                '```'
            );
            break;
          }

          if (!valid) {
            break;
          }
        }

        if (valid) {
          collector.stop();
          stopped = true;
        }
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

    if (all) {
      await Users.updateOne({ d_id: d_id }, { $set: { courses: [] } })
        .catch((err) => console.log(err))
        .then(async () => {
          console.log(`Successfully removed all sections\n`);
          await message.channel.send('```' + 'Successfully removed all sections' + '```');
        });
    } else {
      let sectionString = '';
      let i = 0;

      for (i = 0; i < split.length; i++) {
        let section = split[i];

        await Users.updateOne({ d_id: d_id }, { $pull: { courses: { num: section } } })
          .then(() => {
            console.log(`Successfully removed ${section}`);
          })
          .catch((err) => console.log(err));

        if (i != split.length - 1) {
          sectionString += `${section}, `;
        } else {
          sectionString += `${section}`;
        }
      }

      if (i == split.length) {
        await message.channel.send('```' + `Successfully removed ${sectionString}` + '```').then(() => {
          console.log('!remove completed\n');
        });
      }
    }
  }
}
