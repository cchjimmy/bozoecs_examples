export function setUpTime() {
  return { dtMilli: 0, timeMilli: 0, dtSeconds: 0, timeSeconds: 0 };
}

export function updateTime(time: {
  dtMilli: number;
  timeMilli: number;
  dtSeconds: number;
  timeSeconds: number;
}) {
  time.dtMilli = performance.now() - time.timeMilli;
  time.timeMilli += time.dtMilli;
  time.dtSeconds = time.dtMilli / 1000;
  time.timeSeconds = time.timeMilli / 1000;
}
