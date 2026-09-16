const {
  URLS,
  PROFILE_DIR,
  runServiceStandalone,
} = require('./common');
const {
  runLuckyAttendance,
  runCfApiAttendance,
} = require('./cf-exclusive');

const DEEPFLOOD_SITE = {
  task: 'deepflood',
  url: URLS.deepflood,
  origin: 'https://www.deepflood.com/',
  profileDir: PROFILE_DIR,
};

async function runDeepFlood(context) {
  const r = await runCfApiAttendance(context, DEEPFLOOD_SITE);
  if (r.ok) return r;
  return runLuckyAttendance(context, { ...DEEPFLOOD_SITE, drissionFallback: true });
}

if (require.main === module) {
  runServiceStandalone('deepflood', runDeepFlood, { alwaysRun: true });
}

module.exports = {
  DEEPFLOOD_SITE,
  runDeepFlood,
};
