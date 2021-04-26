import { Command, CommandMessage, Guard } from '@typeit/discord';
import fetch from 'node-fetch';
import { NotBot } from '../guards/notABot';

import Course from '../classes/course';

import Users from '../models/users';

export default abstract class Add {
  @Command('add')
  @Guard(NotBot)
  async add(message: CommandMessage) {
    const d_id: string = message.author.id;
    let usersArray: any[] = await Users.find({ d_id: d_id });

    if (usersArray.length == 0) {
      const newUser = new Users({
        d_id: d_id,
        webhook: '',
        courses: [],
      });

      await newUser
        .save()
        .then(() => {
          console.log(`Successfully added new user ${d_id}`);
        })
        .catch((err) => {
          throw new Error(err);
        });

      usersArray = await Users.find({ d_id: d_id });
    }

    function checkNum(num: string) {
      if (isNaN(+num) || num.length != 5) {
        return false;
      }

      let exist = false;

      for (let course of usersArray[0].courses) {
        if (course.num == num) {
          exist = true;
          break;
        }
      }

      if (exist) {
        return false;
      } else {
        return true;
      }
    }

    await message.channel.send(
      '```' +
        `Enter section number(s) to add\n\nFormat:\n\t<section number> <section number>\n\nExample: \n\t12345 12345\n\nEnter 'n' to cancel` +
        '```'
    );

    let valid = false;
    let exit = false;
    let stopped = false;
    let split = [];

    const collector = message.channel.createMessageCollector((msg) => msg.author.id == message.author.id, {
      time: 60000,
    });

    for await (const m of collector) {
      split = m.content.split(' ');
      console.log('Sections is', split);

      if (m.content.toLowerCase() == 'n') {
        collector.stop();
        stopped = true;
        exit = true;
      } else {
        valid = true;

        for (let i = 0; i < split.length; i++) {
          for (let j = i + 1; j < split.length; j++) {
            if (split[i] == split[j]) {
              valid = false;
              m.channel.send(
                '```' + `Do not enter duplicate sections at once\nPlease enter new section numbers` + '```'
              );
              break;
            }

            if (!valid) {
              break;
            }
          }

          if (!checkNum(split[i]) && valid) {
            valid = false;
            m.channel.send(
              '```' +
                'One or more entered section number(s) is not valid or is already being sniped\nPlease enter new section numbers' +
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

    let all: string[];

    try {
      all = await getCourses();
    } catch (err) {
      console.log(err);

      if (err.message == 'Max retries') {
        await message.channel.send('```Rutgers server error - max retries reached\nPlease try again```');
      } else {
        await message.channel.send('```Rutgers server error - max retries reached\nPlease try again```');
      }
      return;
    }

    let i = 0;
    let sectionString = '';

    for (i = 0; i < split.length; i++) {
      let s = split[i];

      if (i != split.length - 1) {
        sectionString += `${s}, `;
      } else {
        sectionString += `${s}`;
      }

      try {
        let [course, section] = findSection(all, s);

        let title = course.title;
        let courseString = course.courseString;
        let instructor = section.instructorsText;
        let timeString = parseSectionTime(section);

        let newCourse = new Course(s);

        if (timeString != null) {
          newCourse.setName(`${courseString} ${title} ${instructor == '' ? '' : instructor + ' - '}\n${timeString}`);
        } else {
          newCourse.setName(`${courseString} ${title} ${instructor == '' ? '' : instructor}`);
        }

        await Users.updateOne({ d_id: d_id }, { $push: { courses: newCourse } })
          .then(() => {
            console.log(`Successfully added ${s}`);
          })
          .catch((err: any) => console.log(err));
      } catch (err) {
        console.log(err);

        if (err.message == 'Invalid section') {
          message.channel.send('```One or more sections does not exist```');
        } else {
          message.channel.send('```Unexpected error!```');
        }
        return;
      }
    }

    if (i == split.length) {
      await message.channel.send('```' + `Successfully added ${sectionString}` + '```').then(() => {
        console.log('!add completed\n');
      });
    }

    if (usersArray[0].webhook.length == 0) {
      await message.channel.send(
        '```' +
          `To receive notifications, add a webhook with the command '!webhook'\nFor more information about webhooks, read instructions in the Snipe Server` +
          '```'
      );
      await message.channel.send('```' + `Test webhook with the command '!webhook test'` + '```');
    }
  }
}

function findSection(json: any[], num: any): any[] {
  let course = {};
  let section = {};
  let valid = false;

  for (let c of json) {
    for (let s of c.sections) {
      if (s.index == num) {
        valid = true;
        course = c;
        section = s;
        break;
      }
    }

    if (valid) {
      break;
    }
  }

  if (!valid) {
    throw new Error('Invalid section');
  }

  return [course, section];
}

async function getCourses(): Promise<string[]> {
  let date = new Date(Date.now());
  let year = String(date.getFullYear());
  let month = date.getMonth() + 1;
  let term = '';

  if (month > 3 && month < 11) {
    term = String(9);
  } else if (month > 11 && month < 4) {
    term = String(1);
  }

  let success = false;
  let count = 0;
  let res = null;

  while (!success) {
    try {
      res = await fetch(`http://sis.rutgers.edu/soc/api/courses.gzip?year=${year}&term=${term}&campus=NB`).then(
        (res) => {
          if (res.status == 200) {
            success = true;
            return res.json();
          }
        }
      );
    } catch (err) {
      if (!err.message.includes(`failed`) && !err.message.includes(`sorry`)) {
        console.log(err);
      }
    }

    count++;

    if (count > 3) {
      throw new Error('Max retries');
    }
  }

  return res;
}

function parseSectionTime(section: { meetingTimes: any[] }): string {
  let timeString = '';

  let arr = [];

  section.meetingTimes.forEach((t: { meetingDay: any; startTimeMilitary: any; endTimeMilitary: any }) => {
    if (t.meetingDay != null && t.meetingDay != '') {
      let start = t.startTimeMilitary;
      let end = t.endTimeMilitary;

      start = start.substring(0, 2) + ':' + start.substring(2, 4);
      end = end.substring(0, 2) + ':' + end.substring(2, 4);

      let timeExist = false;

      arr.forEach((e) => {
        if (e.time == `${start} to ${end}`) {
          timeExist = true;
          e.day += `/${t.meetingDay}`;
        }
      });

      if (!timeExist) {
        let obj = {
          day: t.meetingDay,
          time: `${start} to ${end}`,
        };

        arr.push(obj);
      }
    }
  });

  for (let i = 0; i < arr.length; i++) {
    let e = arr[i];

    if (i == arr.length - 1) {
      timeString += `${e.day} - ${e.time}`;
    } else {
      timeString += `${e.day} - ${e.time}\n`;
    }
  }

  if (arr.length != 0) {
    return timeString;
  } else {
    return null;
  }
}
