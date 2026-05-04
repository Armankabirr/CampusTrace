import Report from '../models/report.model.js';
import Match from '../models/match.model.js';
import { notifyUser } from './notificationService.js';

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'the',
  'or',
  'of',
  'for',
  'to',
  'in',
  'on',
  'with',
  'my',
  'your',
  'our',
  'his',
  'her',
  'their',
  'is',
  'was',
  'are',
  'be',
  'been',
  'this',
  'that',
  'these',
  'those',
  'item',
  'thing',
]);

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const sameNormalizedText = (firstValue, secondValue) => normalizeText(firstValue) === normalizeText(secondValue);

const tokenize = (value) =>
  normalizeText(value)
    .split(/[^a-z0-9]+/i)
    .map((word) => word.trim())
    .filter((word) => word && !STOPWORDS.has(word));

const sameDate = (firstDate, secondDate) => {
  if (!firstDate || !secondDate) return false;
  const first = new Date(firstDate);
  const second = new Date(secondDate);
  if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime())) return false;
  return first.toDateString() === second.toDateString();
};

const buildScore = (lostItem, foundItem) => {
  let score = 0;
  const reasons = [];

  if (sameNormalizedText(lostItem.category, foundItem.category)) {
    score += 40;
    reasons.push('Same category');
  }

  if (sameNormalizedText(lostItem.lastSeenLocation, foundItem.lastSeenLocation)) {
    score += 25;
    reasons.push('Same location');
  }

  if (sameDate(lostItem.date, foundItem.date)) {
    score += 20;
    reasons.push('Same date');
  }

  const lostWords = new Set([...tokenize(lostItem.title), ...tokenize(lostItem.description)]);
  const foundWords = new Set([...tokenize(foundItem.title), ...tokenize(foundItem.description)]);
  const sharedWords = [...lostWords].filter((word) => foundWords.has(word));

  if (sharedWords.length > 0) {
    score += 15;
    reasons.push('Similar title');
  }

  const titleTokensOnly = [...tokenize(lostItem.title)].filter((word) => !STOPWORDS.has(word));
  const foundTitleTokensOnly = [...tokenize(foundItem.title)].filter((word) => !STOPWORDS.has(word));
  const sharedTitleTokens = titleTokensOnly.filter((word) => foundTitleTokensOnly.includes(word));

  if (sameNormalizedText(lostItem.title, foundItem.title) || sharedTitleTokens.length >= 2) {
    score += 10;
    reasons.push('Strong title match');
  }

  const sharedIdentifierTokens = sharedWords.filter((word) => /\d/.test(word) || word.length >= 4);
  if (sharedIdentifierTokens.length > 0) {
    score += 20;
    reasons.push('Shared identifier');
  }

  const combinedIdentifierText = [lostItem.title, lostItem.description, lostItem.lastSeenLocation]
    .map(normalizeText)
    .join(' ');
  const candidateCombinedText = [foundItem.title, foundItem.description, foundItem.lastSeenLocation]
    .map(normalizeText)
    .join(' ');
  const sharedDigits = combinedIdentifierText.match(/\d+/g) || [];
  const candidateDigits = candidateCombinedText.match(/\d+/g) || [];
  const digitOverlap = sharedDigits.filter((digit) => candidateDigits.includes(digit));

  if (digitOverlap.length > 0) {
    score += 20;
    reasons.push('Matching ID digits');
  }

  return { score, reasons };
};

const getRolePair = (itemA, itemB) => {
  if (itemA.itemType === 'lost') {
    return {
      lostItemId: itemA._id,
      foundItemId: itemB._id,
      lostUserId: itemA.userId,
      foundUserId: itemB.userId,
    };
  }

  return {
    lostItemId: itemB._id,
    foundItemId: itemA._id,
    lostUserId: itemB.userId,
    foundUserId: itemA.userId,
  };
};

export const findMatches = async (newItem) => {
  if (!newItem?._id || !['lost', 'found'].includes(newItem.itemType)) {
    return [];
  }

  const oppositeType = newItem.itemType === 'lost' ? 'found' : 'lost';
  const candidates = await Report.find({
    _id: { $ne: newItem._id },
    itemType: oppositeType,
    status: 'active',
  }).select('userId itemType category title lastSeenLocation date imageUrl description');

  const createdMatches = [];

  for (const candidate of candidates) {
    const { score: rawScore, reasons } = buildScore(newItem, candidate);

    if (rawScore < 50) {
      continue;
    }

    // Ensure the score stored in the DB respects schema limits (0-100)
    let score = Number.isFinite(rawScore) ? Math.round(rawScore) : 0;
    if (score > 100) {
      console.warn(`Match score ${score} exceeded max 100, clamping to 100 for pair ${newItem._id} / ${candidate._id}`);
      score = 100;
    }
    if (score < 0) score = 0;

    const pair = getRolePair(newItem, candidate);
    const existingMatch = await Match.findOne({
      lostItemId: pair.lostItemId,
      foundItemId: pair.foundItemId,
    });

    if (existingMatch) {
      continue;
    }

    let match;
    try {
      match = await Match.create({
        ...pair,
        matchScore: score,
        matchReasons: reasons,
      });
    } catch (error) {
      if (error?.code === 11000) {
        continue;
      }

      throw error;
    }

    try {
      await notifyUser(match.lostUserId, match._id);
      match.notifiedLostUser = true;
      await match.save();
    } catch (error) {
      console.error('Failed to notify lost item owner for match:', error);
    }

    try {
      await notifyUser(match.foundUserId, match._id);
      match.notifiedFoundUser = true;
      await match.save();
    } catch (error) {
      console.error('Failed to notify found item owner for match:', error);
    }

    createdMatches.push(match);
  }

  return createdMatches;
};