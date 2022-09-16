import { Command, CommandMessage, Guard } from '@typeit/discord';
import * as Discord from 'discord.js';
import { NotBot } from '../guards/notABot';

import Users from '../models/users';
import Settings from '../models/settings';

export default class Snipe {
  @Command('snipe')
  @Guard(NotBot)
  async snipe(message: CommandMessage) {
    const status = await Settings.find();
    if (!status[0].status) {
      await message.channel.send('```' + `Course monitor is off, exiting` + '```');
      return;
    }

    const d_id = message.author.id;
    const snipeUsers: any[] = await Users.find({ d_id: d_id });

    let embed = new Discord.MessageEmbed()
      .setColor('#FF0000')
      .setTitle('Course Sniper')
      .setURL('https://sims.rutgers.edu/webreg/')
      .setDescription('Current Snipes')
      .setTimestamp();

    let i = 0;

    if (snipeUsers.length != 0) {
      for (let course of snipeUsers[0].courses) {
        let valueString = `Section: ${course.num}`;

        if (course.tag && course.tag.length != 0) {
          valueString += '\nTags: ';
          for (let tag of course.tag) {
            valueString += `<@${tag}> `;
          }
        }

        if (i != 0 && i % 25 == 0) {
          await message.channel.send(embed);

          embed = new Discord.MessageEmbed().setColor('#FF0000').setTimestamp();
        }

        embed.addFields({
          name: course.name,
          value: valueString,
          inline: true,
        });

        ++i;
      }
    }

    if (i != 0) {
      await message.channel.send(embed);
    }

    console.log('!snipe completed\n');
  }
}
