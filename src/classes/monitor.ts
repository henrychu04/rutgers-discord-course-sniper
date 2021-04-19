import fetch from 'node-fetch';
import * as Discord from 'discord.js';
import moment from 'moment-timezone';
import { EventEmitter } from 'events';
import { sleep } from '../scripts/sleep';

import Settings from '../models/settings';
import Users from '../models/users';

const oneSecond = 1000;
const oneHour = 60000;

export class Monitor extends EventEmitter {
  courses: string[] = [];

  constructor() {
    super();
    this.init();
  }

  init = async () => {
    while (1) {
      try {
        let status: Boolean = await checkStatus();

        if (!status) {
          return;
        }

        this.courses = await refresh();
        break;
      } catch (err) {
        console.log(err);

        await sleep(oneSecond);
      }
    }

    this.monitor();
  };

  monitor = async () => {
    while (1) {
      let status: Boolean = await checkStatus();

      if (!status) {
        break;
      }

      const crntDate = moment().tz('America/New_York');

      if (crntDate.hour() < 11 && crntDate.hour() > 6) {
        await sleep(oneHour);
        continue;
      }

      try {
        let newCourses: string[] = await refresh();
        let newOpen: any[] = [];

        newCourses.forEach((course) => {
          if (!this.courses.includes(course)) {
            newOpen.push(course);
          }
        });

        this.courses = newCourses;

        // const users: any[] = [];
        // const users: any[] = await Users.find();
        const users: any[] = await Users.find({ d_id: '504000540804382741' });

        for (let user of users) {
          let changedArray = [];

          user.courses.forEach((course: { time: number; name: any; num: any }) => {
            const now = Date.now();
            const millis = now - course.time;
            const elapsed = Math.floor(millis / 1000); // convert to seconds

            if (newOpen.includes(course) && elapsed > 60) {
              let changed = {
                name: course.name,
                num: course.num,
              };

              changedArray.push(changed);

              Users.updateOne(
                { d_id: user.d_id, 'courses.num': course.num },
                { $set: { 'courses.$.time': now } }
              ).catch((err) => console.log(err));
            }
          });

          if (changedArray.length != 0) {
            let { linkArray, namesArray } = buildArrays(changedArray);

            let embedArray = [];

            for (let i in linkArray) {
              let num = parseInt(i);

              const embed = new Discord.MessageEmbed()
                .setColor('#00FF00')
                .setTitle('Rutgers Course Sniper')
                .setURL('https://sims.rutgers.edu/webreg/')
                .setDescription(`New Open Section(s):\n${namesArray[num]}\n[Click here!](${linkArray[num]})`)
                .setTimestamp();

              embedArray.push(embed);
            }

            this.emit('open', user, embedArray);
          }
        }
      } catch (err) {
        console.log(err);
      }

      await sleep(oneSecond);
    }
  };
}

let checkStatus = async (): Promise<Boolean> => {
  const settingsArray: any[] = await Settings.find();

  if (!settingsArray[0].status) {
    console.log('Course monitor is off, returning ...\n');
    return false;
  }

  return true;
};

let refresh = async (): Promise<string[]> => {
  let success = false;
  let count = 0;
  let courseRes: string[] = [];

  while (!success) {
    try {
      courseRes = await fetch('http://sis.rutgers.edu/soc/api/openSections.gzip?year=2021&term=9&campus=NB', {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.11 Safari/537.36',
        },
      }).then((res) => {
        if (res.status == 200) {
          success = true;
          return res.json();
        } else {
          console.log('Res is', res.status);
          console.trace();
        }
      });
    } catch (err) {
      if (
        !err.message.includes(
          'request to http://sis.rutgers.edu/soc/api/openSections.gzip?year=2021&term=9&campus=NB failed'
        ) &&
        !err.message.includes(
          'https://sorry.rutgers.edu/index.html?sis.rutgers.edu/soc/api/openSections.gzip?year=2021&term=9&campus=NB'
        )
      ) {
        console.log(err);
      }
    }

    count++;

    if (count > 3) {
      throw new Error('Max retries');
    }
  }

  return courseRes;
};

let buildArrays = (changedArray: any[] | string[]) => {
  let linkArray: string[] = [];
  let link = `http://sims.rutgers.edu/webreg/editSchedule.htm?login=cas&semesterSelection=92021&indexList=`;
  let namesArray: string[] = [];
  let names = '';

  for (let i = 0; i < changedArray.length; i++) {
    if (i % 10 == 0 && i != 0) {
      linkArray.push(link);
      namesArray.push(names);
      link = 'http://sims.rutgers.edu/webreg/editSchedule.htm?login=cas&semesterSelection=92021&indexList=';
      names = '';
    }

    link += changedArray[i].num + ',';

    names += `\n${changedArray[i].name}\nSection: ${changedArray[i].num}\n`;
    console.log(`New open section: ${changedArray[i].num}\n`);
  }

  if (link != 'http://sims.rutgers.edu/webreg/editSchedule.htm?login=cas&semesterSelection=92021&indexList=') {
    linkArray.push(link);
    namesArray.push(names);
  }

  return { linkArray, namesArray };
};
