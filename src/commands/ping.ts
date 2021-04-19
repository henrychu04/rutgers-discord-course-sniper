import { Command, CommandMessage, Guard } from '@typeit/discord';
import { NotBot } from '../guards/notABot';

export default abstract class Ping {
  @Command('ping')
  @Guard(NotBot)
  ping(message: CommandMessage): void {
    message.channel
      .send('Pinging ...')
      .then((sent) => {
        sent.edit(`Pong! Took ${sent.createdTimestamp - message.createdTimestamp}ms`);
        console.log('!ping completed\n');
      })
      .catch(console.error);
  }
}
