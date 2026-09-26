import { send } from '../lib/http.js';
import { channels } from '../lib/notify.js';
import { THRESHOLDS } from '../lib/alerts.js';

export default function handler(req, res) {
  send(res, 200, { channels: channels(), thresholds: THRESHOLDS });
}
