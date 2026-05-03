import Claim from '../models/claim.model.js';
import Report from '../models/report.model.js';

export const createClaim = async (req, res) => {
  try {
    const { reportId, secretIdentifierProvided, answersProvided } = req.body;
    const userId = req.user._id;

    // Validate reportId
    if (!reportId) {
      return res.status(400).json({ message: 'Report ID is required.' });
    }

    // Fetch the report
    const report = await Report.findById(reportId).populate('userId', 'email phone name');
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    // Check if user is trying to claim their own item
    if (report.userId._id.toString() === userId.toString()) {
      return res.status(400).json({ message: 'You cannot claim your own item.' });
    }

    // Check if user already has a pending claim for this report
    const existingClaim = await Claim.findOne({
      reportId,
      claimerId: userId,
      status: { $in: ['pending', 'verified'] },
    });

    if (existingClaim) {
      return res
        .status(400)
        .json({ message: 'You already have a pending claim for this item.' });
    }

    // Validate claim data based on item type
    if (report.itemType === 'lost') {
      if (!secretIdentifierProvided) {
        return res.status(400).json({ message: 'Secret identifier is required.' });
      }

      // Verify the secret identifier
      const correctIdentifier = report.verificationDetails?.privateIdentifier?.toLowerCase();
      const providedIdentifier = secretIdentifierProvided.trim().toLowerCase();

      const isVerified = correctIdentifier === providedIdentifier;

      // Create claim
      const claim = await Claim.create({
        reportId,
        claimerId: userId,
        claimerEmail: req.user.email,
        claimerPhone: req.user.phone,
        claimerName: req.user.name,
        secretIdentifierProvided,
        isVerified,
        status: isVerified ? 'verified' : 'rejected',
        verificationMessage: isVerified
          ? 'Your secret identifier matches! Item owner has been notified.'
          : 'The secret identifier does not match. Please check and try again.',
      });

      return res.status(201).json({
        message: isVerified
          ? 'Claim verified successfully!'
          : 'The provided identifier does not match.',
        claim,
      });
    } else if (report.itemType === 'found') {
      if (!Array.isArray(answersProvided) || answersProvided.length === 0) {
        return res.status(400).json({ message: 'Answers are required.' });
      }

      const proofQuestions = report.verificationDetails?.proofQuestions || [];
      if (answersProvided.length !== proofQuestions.length) {
        return res
          .status(400)
          .json({
            message: `Please answer all ${proofQuestions.length} verification question(s).`,
          });
      }

      // Verify answers
      let allCorrect = true;
      for (let i = 0; i < proofQuestions.length; i++) {
        const correctAnswer = proofQuestions[i].answer?.toLowerCase() || '';
        const providedAnswer = (answersProvided[i] || '').trim().toLowerCase();

        if (correctAnswer !== providedAnswer) {
          allCorrect = false;
          break;
        }
      }

      // Create claim
      const claim = await Claim.create({
        reportId,
        claimerId: userId,
        claimerEmail: req.user.email,
        claimerPhone: req.user.phone,
        claimerName: req.user.name,
        answersProvided,
        isVerified: allCorrect,
        status: allCorrect ? 'verified' : 'rejected',
        verificationMessage: allCorrect
          ? 'Your answers are correct! Item owner has been notified.'
          : 'One or more answers are incorrect. Please check and try again.',
      });

      return res.status(201).json({
        message: allCorrect
          ? 'Claim verified successfully!'
          : 'One or more verification answers are incorrect.',
        claim,
      });
    }

    return res.status(400).json({ message: 'Invalid item type.' });
  } catch (error) {
    console.error('Claim creation error:', error);
    return res
      .status(500)
      .json({ message: error.message || 'Failed to create claim.' });
  }
};

export const getMyClaimsAsClaimant = async (req, res) => {
  try {
    const userId = req.user._id;

    const claims = await Claim.find({ claimerId: userId })
      .populate('reportId', 'title itemType category imageUrl')
      .sort({ createdAt: -1 });

    return res.status(200).json({ claims });
  } catch (error) {
    console.error('Error fetching claims:', error);
    return res.status(500).json({ message: 'Failed to fetch claims.' });
  }
};

export const getPendingClaimsForReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user._id;

    // Verify that user owns this report
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    if (report.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: 'You do not have permission to view claims for this report.' });
    }

    // Get all claims for this report
    const claims = await Claim.find({ reportId }).sort({ createdAt: -1 });

    return res.status(200).json({ claims });
  } catch (error) {
    console.error('Error fetching report claims:', error);
    return res.status(500).json({ message: 'Failed to fetch claims.' });
  }
};

export const verifyClaim = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { approved, notes } = req.body;
    const userId = req.user._id;

    // Find the claim
    const claim = await Claim.findById(claimId).populate('reportId');
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found.' });
    }

    // Verify ownership of report
    if (claim.reportId.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: 'You do not have permission to update this claim.' });
    }

    // Update claim status
    claim.status = approved ? 'completed' : 'rejected';
    claim.notes = notes || null;

    await claim.save();

    // If approved, update report status
    if (approved) {
      await Report.findByIdAndUpdate(claim.reportId._id, {
        status: 'matched',
      });
    }

    return res.status(200).json({
      message: approved
        ? 'Claim approved! Item has been marked as matched.'
        : 'Claim rejected.',
      claim,
    });
  } catch (error) {
    console.error('Error updating claim:', error);
    return res.status(500).json({ message: 'Failed to update claim.' });
  }
};

export const getClaimById = async (req, res) => {
  try {
    const { claimId } = req.params;

    const claim = await Claim.findById(claimId)
      .populate('reportId')
      .populate('claimerId', 'name email phone');

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found.' });
    }

    return res.status(200).json({ claim });
  } catch (error) {
    console.error('Error fetching claim:', error);
    return res.status(500).json({ message: 'Failed to fetch claim.' });
  }
};
