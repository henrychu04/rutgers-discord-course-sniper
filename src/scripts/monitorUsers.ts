import { sleep } from '../scripts/sleep';

import Users from '../models/users';

const sixHours = 21600000;

export default (client: any) => {
  console.log('Monitoring users ...\n');
  monitorUsers(client);
};

async function monitorUsers(client: { guilds: { cache: { get: (arg0: string) => any } } }) {
  while (1) {
    try {
      let snipeUsers: any[] = await Users.find();
      const guild = client.guilds.cache.get('785625320648605696'); // snipe server
      // const guild = client.guilds.cache.get('553953061861720065'); // 04 server

      let map = null;

      try {
        map = await guild.members.fetch();
      } catch (err) {
        console.log(err);
        return;
      }

      snipeUsers.forEach(async (snipeUser: { d_id: string }) => {
        let exist = false;

        map.forEach((member: { user: { id: string } }) => {
          if (snipeUser.d_id == member.user.id) {
            exist = true;
          }
        });

        if (!exist) {
          await Users.deleteOne({ d_id: snipeUser.d_id })
            .then(() => {
              console.log(`Successfully removed ${snipeUser.d_id} from Users\n`);
            })
            .catch((err) => console.log(err));
        }
      });
    } catch (err) {
      console.log(err);
    }

    await sleep(sixHours);
  }
}
