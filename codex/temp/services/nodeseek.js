const {
  URLS,
  PROFILE_DIR,
  runServiceStandalone,
} = require('./common');
const {
  attendanceRequestPlans,
  attendanceSuccess,
  findAttendanceButton,
  runLuckyAttendance,
  runCfApiAttendance,
} = require('./cf-exclusive');

const NODESEEK_SITE = {
  task: 'nodeseek',
  url: URLS.nodeseek,
  origin: 'https://www.nodeseek.com/',
  profileDir: PROFILE_DIR,
};

async function runNodeSeek(context) {
  const r = await runCfApiAttendance(context, NODESEEK_SITE);
  if (r.ok) return r;
  return runLuckyAttendance(context, { ...NODESEEK_SITE, drissionFallback: true });
}

if (require.main === module) {
  runServiceStandalone('nodeseek', runNodeSeek, { alwaysRun: true });
}

module.exports = {
  NODESEEK_SITE,
  attendanceRequestPlans,
  attendanceSuccess,
  findAttendanceButton,
  runLuckyAttendance,
  runNodeSeek,
};
