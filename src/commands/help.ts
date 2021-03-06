import { Command, CommandMessage, Guard } from '@typeit/discord';
import * as Discord from 'discord.js';
import { NotBot } from '../guards/notABot';

export default abstract class Help {
  @Command('help')
  @Guard(NotBot)
  async help(message: CommandMessage): Promise<void> {
    const embed = new Discord.MessageEmbed()
      .setColor('#FF0000')
      .setTitle('Rutgers Course Sniper')
      .setDescription('!snipe commands')
      .addFields(
        { name: '!snipe', value: 'Current courses being monitored', inline: false },
        { name: '!add', value: 'Add a course', inline: false },
        { name: '!remove', value: 'Remove a course being monitored', inline: false },
        {
          name: '!webhook <webhook link> OR !webhook',
          value: 'Add a webhook to receive notifications of open courses',
          inline: false,
        },
        { name: '!webhook test', value: `Test the user's webhook link to receive notifications`, inline: false },
        { name: '!tag', value: 'Tag a user when a specified section opens up', inline: false },
        { name: '!tagremove', value: 'Remove a user tag when a specified section opens up', inline: false },
        { name: '!usedm', value: 'Change the open section notification setting to DMs', inline: false },
        { name: '!usewebhook', value: 'Change the open section notification setting to webhook', inline: false }
      )
      .setTimestamp();

    await message.channel.send(embed).then(() => {
      console.log('!help completed\n');
    });
  }
}
