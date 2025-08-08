const Calendar = tui.Calendar;
 
const calendar = new Calendar('#calendar', {
  defaultView: 'week',
  taskView: false,
  scheduleView: ['time'],
});
 
calendar.createSchedules([
  {
    id: '1',
    calendarId: '1',
    title: 'Monday — 2 PM',
    category: 'time',
    start: '2025-08-11T14:00:00',
    end: '2025-08-11T15:00:00',
  },
  {
    id: '2',
    calendarId: '1',
    title: 'Tuesday — 5 PM',
    category: 'time',
    start: '2025-08-12T17:00:00',
    end: '2025-08-12T18:00:00',
  }
]);
 
// Register PWA Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => console.log("Service worker registered:", reg))
      .catch(err => console.error("Service worker registration failed:", err));
  });
}