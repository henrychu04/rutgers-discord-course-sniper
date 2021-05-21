import Discord from 'discord.js';

export default async (
  user: { d_id: string },
  body:
    | string
    | number
    | bigint
    | boolean
    | symbol
    | readonly any[]
    | (Discord.WebhookMessageOptions & { split?: false })
    | Discord.MessageAdditions,
  client: any
) => {
  try {
    await client.users.fetch(user.d_id);
    client.users.cache
      .get(user.d_id)
      .send(body)
      .then(() => {
        console.log(`User: ${user.d_id}\nSuccessfully sent dm notification\n`);
      });
  } catch (err) {
    console.log(err);
  }
};
