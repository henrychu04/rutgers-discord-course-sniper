import Discord from 'discord.js';

export default async (
  user: { webhook: string; d_id: string },
  body:
    | string
    | number
    | bigint
    | boolean
    | symbol
    | readonly any[]
    | (Discord.WebhookMessageOptions & { split?: false })
    | Discord.MessageAdditions
) => {
  let split = user.webhook.split('/');
  let id = split[5];
  let token = split[6];

  try {
    let webhook = new Discord.WebhookClient(id, token);

    let success = false;
    let count = 0;

    while (!success) {
      await webhook
        .send(body)
        .then(() => {
          success = true;
          console.log(`User: ${user.d_id}\nSuccessfully sent webhook notification\n`);
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

      count++;

      if (count == 3) {
        throw new Error('Max retries');
      }
    }
  } catch (err) {
    console.log(err);
  }
};
