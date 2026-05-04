import Claim from '../models/claim.model.js';
import Report from '../models/report.model.js';
import Notification from '../models/notification.model.js';

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

      // Create notification for report owner if identifier matches (lost item found!)
      if (isVerified) {
        await Notification.create({
          userId: report.userId._id,
          type: 'claim_received',
          claimId: claim._id,
          reportId,
          message: `${req.user.name} found your lost item "${report.title}"! They provided the correct identifier. You can now contact them to retrieve your item.`,
          relatedUserId: userId,
        });
      }

      return res.status(201).json({
        message: isVerified
          ? 'Claim verified successfully! Item owner has been notified.'
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

      // Create claim with pending status - reporter will manually verify
      const claim = await Claim.create({
        reportId,
        claimerId: userId,
        claimerEmail: req.user.email,
        claimerPhone: req.user.phone,
        claimerName: req.user.name,
        answersProvided,
        isVerified: allCorrect, // This tracks if answers are correct, but reporter makes final decision
        status: 'pending', // Always pending initially for found items - reporter manually verifies
        verificationMessage: allCorrect
          ? 'Your answers are correct! Item owner has been notified to verify.'
          : 'Some answers may be incorrect. Item owner will review your claim.',
      });

      // Create notification for report owner (found item claim)
      await Notification.create({
        userId: report.userId._id,
        type: 'claim_pending_approval',
        claimId: claim._id,
        reportId,
        message: `${req.user.name} has claimed your found item "${report.title}". ${allCorrect ? 'Their answers to your verification questions are correct.' : 'Their answers may not match your verification answers.'} Please review the claim.`,
        relatedUserId: userId,
      });

      return res.status(201).json({
        message: 'Claim created successfully! The item owner has been notified and will review your claim.',
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
    const claim = await Claim.findById(claimId).populate('reportId').populate('claimerId', 'name email phone');
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

    // Create notification for claimer
    const notificationType = approved ? 'claim_accepted' : 'claim_rejected';
    const message = approved
      ? `Your claim for "${claim.reportId.title}" has been accepted! You can now contact the person who found your item.`
      : `Your claim for "${claim.reportId.title}" has been rejected. ${notes ? `Reason: ${notes}` : ''}`;

    await Notification.create({
      userId: claim.claimerId,
      type: notificationType,
      claimId: claim._id,
      reportId: claim.reportId._id,
      message,
      relatedUserId: userId,
    });

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

// Get claimer contact info - reporter can view when claim is pending/verified
export const getClaimerContactInfo = async (req, res) => {
  try {
    const { claimId } = req.params;
    const userId = req.user._id;

    const claim = await Claim.findById(claimId)
      .populate('reportId')
      .populate('claimerId', 'name email phone');

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found.' });
    }

    // Verify that user owns the report
    if (claim.reportId.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You do not have permission to view this contact information.' });
    }

    // Only allow viewing contact if claim is pending or verified (not completed or rejected)
    if (!['pending', 'verified'].includes(claim.status)) {
      return res.status(400).json({ message: 'Contact information is not available for this claim status.' });
    }

    return res.status(200).json({
      claimerName: claim.claimerId.name,
      claimerEmail: claim.claimerId.email,
      claimerPhone: claim.claimerId.phone,
      claimStatus: claim.status,
    });
  } catch (error) {
    console.error('Error fetching claimer contact info:', error);
    return res.status(500).json({ message: 'Failed to fetch contact information.' });
  }
};

// Get reporter contact info - claimer can view when claim is completed (accepted)
export const getReporterContactInfo = async (req, res) => {
  try {
    const { claimId } = req.params;
    const userId = req.user._id;

    const claim = await Claim.findById(claimId)
      .populate({
        path: 'reportId',
        populate: { path: 'userId', select: 'name email phone' }
      });

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found.' });
    }

    // Verify that user is the claimer
    if (claim.claimerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You do not have permission to view this contact information.' });
    }

    // Allow viewing contact after acceptance and even after final returned state
    if (!['completed', 'returned'].includes(claim.status)) {
      return res.status(400).json({ message: 'Contact information is only available after your claim is accepted.' });
    }

    const reporter = claim.reportId.userId;
    return res.status(200).json({
      reporterName: reporter.name,
      reporterEmail: reporter.email,
      reporterPhone: reporter.phone,
      itemTitle: claim.reportId.title,
      claimStatus: claim.status,
    });
  } catch (error) {
    console.error('Error fetching reporter contact info:', error);
    return res.status(500).json({ message: 'Failed to fetch contact information.' });
  }
};

const maybeMarkReturned = async (claim) => {
  if (claim.claimerConfirmedReturned && claim.reporterConfirmedReturned) {
    claim.status = 'returned';
    await claim.save();
    await Report.findByIdAndUpdate(claim.reportId, { status: 'resolved' });
  }
};

export const submitClaimerFeedback = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { returned, rating, comment } = req.body;
    const userId = req.user._id;

    const claim = await Claim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found.' });
    }

    if (claim.claimerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You do not have permission to review this claim.' });
    }

    if (!['completed', 'returned'].includes(claim.status)) {
      return res.status(400).json({ message: 'You can review only after claim acceptance.' });
    }

    if (typeof returned === 'boolean') {
      claim.claimerConfirmedReturned = returned;
    }

    if (rating || comment) {
      claim.claimerReview = {
        rating: rating ? Number(rating) : null,
        comment: comment ? String(comment).trim() : null,
        createdAt: new Date(),
      };
    }

    await claim.save();
    await maybeMarkReturned(claim);

    return res.status(200).json({
      message: 'Your feedback has been saved.',
      claim,
    });
  } catch (error) {
    console.error('Error submitting claimer feedback:', error);
    return res.status(500).json({ message: 'Failed to submit feedback.' });
  }
};

export const submitReporterFeedback = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { isRealOwner, returned, rating, comment } = req.body;
    const userId = req.user._id;

    const claim = await Claim.findById(claimId).populate('reportId');
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found.' });
    }

    if (claim.reportId.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You do not have permission to review this claim.' });
    }

    if (!['completed', 'returned'].includes(claim.status)) {
      return res.status(400).json({ message: 'You can review only after claim acceptance.' });
    }

    if (typeof isRealOwner === 'boolean') {
      claim.reporterVerifiedRealOwner = isRealOwner;
    }

    if (typeof returned === 'boolean') {
      claim.reporterConfirmedReturned = returned;
    }

    if (rating || comment) {
      claim.reporterReview = {
        rating: rating ? Number(rating) : null,
        comment: comment ? String(comment).trim() : null,
        createdAt: new Date(),
      };
    }

    await claim.save();
    await maybeMarkReturned(claim);

    return res.status(200).json({
      message: 'Your review has been saved.',
      claim,
    });
  } catch (error) {
    console.error('Error submitting reporter feedback:', error);
    return res.status(500).json({ message: 'Failed to submit review.' });
  }
};
