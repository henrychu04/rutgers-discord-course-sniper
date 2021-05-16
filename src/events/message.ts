import { Discord, Client, On, ArgsOf } from '@typeit/discord';
import * as Path from 'path';

@Discord('!', {
  import: [Path.join(__dirname, '..', 'commands', '*.js')],
})
export class DiscordApp {
  @On('message')
  onMessage([message]: ArgsOf<'message'>, client: Client) {
    if (message.content.startsWith('!')) {
      console.log(`User: ${message.author.id}`);
      console.log(`Command: ${message.content}`);
    }
  }
}
