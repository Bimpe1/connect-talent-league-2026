import { createUnsubscribeHandler } from './_lib/reminders.js';

// GET shows a confirm button, POST switches reminders off. The link in each email is signed for one person only.
export default createUnsubscribeHandler();
