import Notification from '../models/notification.model.js';
import Match from '../models/match.model.js';
import User from '../models/user.model.js';
import config from '../config/config.js';
import { sendEmail } from './email.service.js';

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export const notifyUser = async (userId, matchId) => {
  const [user, match] = await Promise.all([
    User.findById(userId).select('name email'),
    Match.findById(matchId)
      .populate('lostItemId', 'title category lastSeenLocation date imageUrl')
      .populate('foundItemId', 'title category lastSeenLocation date imageUrl'),
  ]);

  if (!user) {
    throw new Error('User not found for match notification.');
  }

  if (!match) {
    throw new Error('Match not found for match notification.');
  }

  await Notification.create({
    userId,
    matchId,
    type: 'match_found',
    message: 'A potential match was found for your item.',
  });

  const matchLink = `${String(config.clientBaseUrl || 'http://localhost:5173').replace(/\/$/, '')}/matches/${match._id}`;
  const subject = 'Potential Match Found for Your Item — CampusTrace';
  const text = [
    `Hello ${user.name || 'there'},`,
    '',
    'A potential match was found for your item on CampusTrace.',
    `Review it here: ${matchLink}`,
    '',
    'You can confirm or reject the match on that page.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 640px; margin: 0 auto;">
      <h2 style="margin-bottom: 12px;">Potential Match Found</h2>
      <p>Hello ${escapeHtml(user.name || 'there')},</p>
      <p>A potential match was found for your item on CampusTrace.</p>
      <p>
        <a href="${matchLink}" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">Review Match</a>
      </p>
      <p>You can confirm or reject the match on that page.</p>
      <p style="color:#6b7280;font-size:13px;">If the button does not work, copy and paste this link:<br />${matchLink}</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });

  return true;
};