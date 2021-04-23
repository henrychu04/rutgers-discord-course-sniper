import { Command, CommandMessage, Guard } from '@typeit/discord';
import * as Discord from 'discord.js';
import { NotBot } from '../guards/notABot';
import Snipe from './snipe';

import Users from '../models/users';

export default abstract class RemoveTag {
  @Command('removeTag')
  @Guard(NotBot)
  async removeTag(message: CommandMessage): Promise<void> {
    const d_id: string = message.author.id;
    const snipeUsersArray: any[] = await Users.find({ d_id: d_id });

    let allSnipes = new Snipe();
    await allSnipes.snipe(message);

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

    await message.channel.send(
      '```' + `Enter sections(s) to remove tags\n\nExample:\n\t12345 12345\n\nEnter 'n' to cancel` + '```'
    );

    let valid = false;
    let exit = false;
    let stopped = false;
    let split = [];

    const collector1 = message.channel.createMessageCollector((msg) => msg.author.id == message.author.id, {
      time: 60000,
    });

    for await (const m of collector1) {
      split = m.content.split(' ');

      if (m.content.toLowerCase() == 'n') {
        collector1.stop();
        stopped = true;
        exit = true;
      } else {
        valid = true;

        for (let i = 0; i < split.length; i++) {
          if (!checkNum(split[i]) && valid) {
            valid = false;
            message.channel.send(
              '```' +
                'One or more entered section number(s) is not valid or do not exist\nPlease enter new section numbers' +
                '```'
            );
            break;
          }
        }

        if (valid) {
          collector1.stop();
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

    let courseArray: any[] = [];

    for (let course of snipeUsersArray[0].courses) {
      for (let num of split) {
        if (course.num == num) {
          courseArray.push(course);
          break;
        }
      }
    }

    valid = false;
    exit = false;
    stopped = false;

    await message.channel.send(
      '```' +
        `Enter user id(s) to remove tags\n\nExample:\n\t504000540804382741 820061497967247370\n\nLink for more information: https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID\n\nEnter 'n' to cancel` +
        '```'
    );

    const collector2 = message.channel.createMessageCollector((msg) => msg.author.id == message.author.id, {
      time: 60000,
    });

    for await (const m of collector2) {
      split = m.content.split(' ');

      if (m.content.toLowerCase() == 'n') {
        collector2.stop();
        stopped = true;
        exit = true;
      } else {
        valid = true;

        for (let id of split) {
          console.log(id);
          for (let course of courseArray) {
            if (course.tag && course.tag.includes(id)) {
              let tagIndex = course.tag.indexOf(id);
              course.tag.splice(tagIndex, 1);
            }
          }
        }

        if (valid) {
          collector2.stop();
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

    for (let course of courseArray) {
      await Users.updateOne({ 'courses.num': course.num }, { $set: { 'courses.$': course } }).catch((err) =>
        console.log(err)
      );
    }

    await message.channel.send('```Specified tags removed successfully```').then(() => {
      console.log('!removeTag completed\n');
    });
  }
}
