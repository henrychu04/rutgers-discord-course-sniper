const moment = require('moment-timezone');

(() => {
  let m = moment().tz('America/New_York');
  console.log(m.hour());
})();
