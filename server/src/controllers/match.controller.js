import Match from '../models/match.model.js';
import Report from '../models/report.model.js';
import { findMatches } from '../services/matchingService.js';

const buildItemResponse = (item, includeContacts = false) => {
  if (!item) return null;

  const response = {
    _id: item._id,
    itemType: item.itemType,
    category: item.category,
    title: item.title,
    description: item.description,
    lastSeenLocation: item.lastSeenLocation,
    date: item.date,
    imageUrl: item.imageUrl,
  };

  if (includeContacts) {
    response.contactName = item.contactName;
    response.contactEmail = item.contactEmail;
    response.contactPhone = item.contactPhone;
  }

  return response;
};

const buildMatchResponse = (match, includeContacts = false, userId = null) => {
  const lostItemOwnedByCurrentUser = userId
    ? match.lostUserId.toString() === userId.toString()
    : false;
  const foundItemOwnedByCurrentUser = userId
    ? match.foundUserId.toString() === userId.toString()
    : false;

  return {
    _id: match._id,
    lostItem: buildItemResponse(match.lostItemId, includeContacts),
    foundItem: buildItemResponse(match.foundItemId, includeContacts),
    lostItemOwnedByCurrentUser,
    foundItemOwnedByCurrentUser,
    matchScore: match.matchScore,
    matchReasons: match.matchReasons || [],
    status: match.status,
    notifiedLostUser: match.notifiedLostUser,
    notifiedFoundUser: match.notifiedFoundUser,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
  };
};

const canAccessMatch = (match, userId) =>
  match.lostUserId.toString() === userId.toString() || match.foundUserId.toString() === userId.toString();

export const getMyMatches = async (req, res) => {
  try {
    const userId = req.user._id;

    // Load full report documents (not just _id/itemType) so backfill matching
    // has access to title, description, location, date and userId fields.
    const myReports = await Report.find({ userId, status: 'active' }).select(
      '_id itemType category title description lastSeenLocation date imageUrl userId'
    );

    for (const report of myReports) {
      await findMatches(report).catch((error) => {
        console.error('Backfill matching error:', error);
      });
    }

    const matches = await Match.find({
      $or: [{ lostUserId: userId }, { foundUserId: userId }],
    })
      .populate('lostItemId', 'itemType category title description lastSeenLocation date imageUrl contactName contactEmail contactPhone')
      .populate('foundItemId', 'itemType category title description lastSeenLocation date imageUrl contactName contactEmail contactPhone')
      .sort({ createdAt: -1 });

    return res.status(200).json({ matches: matches.map((match) => buildMatchResponse(match, false, userId)) });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return res.status(500).json({ message: 'Failed to fetch matches.' });
  }
};

export const getMatchById = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;

    const match = await Match.findById(matchId)
      .populate('lostItemId', 'itemType category title description lastSeenLocation date imageUrl contactName contactEmail contactPhone')
      .populate('foundItemId', 'itemType category title description lastSeenLocation date imageUrl contactName contactEmail contactPhone');

    if (!match) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    if (!canAccessMatch(match, userId)) {
      return res.status(403).json({ message: 'You do not have permission to view this match.' });
    }

    return res.status(200).json({
      match: buildMatchResponse(match, match.status === 'confirmed', userId),
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    return res.status(500).json({ message: 'Failed to fetch match.' });
  }
};

export const updateMatchStatus = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid match status.' });
    }

    const match = await Match.findById(matchId)
      .populate('lostItemId', 'itemType category title description lastSeenLocation date imageUrl contactName contactEmail contactPhone')
      .populate('foundItemId', 'itemType category title description lastSeenLocation date imageUrl contactName contactEmail contactPhone');

    if (!match) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    if (!canAccessMatch(match, userId)) {
      return res.status(403).json({ message: 'You do not have permission to update this match.' });
    }

    match.status = status;
    await match.save();

    return res.status(200).json({
      message: `Match ${status} successfully.`,
      match: buildMatchResponse(match, match.status === 'confirmed', userId),
    });
  } catch (error) {
    console.error('Error updating match:', error);
    return res.status(500).json({ message: 'Failed to update match.' });
  }
};