import Report from '../models/report.model.js';
import { uploadImageToImageKit, deleteImageFromImageKit } from '../services/imagekit.service.js';

export const createReport = async (req, res) => {
  try {
    let { itemType, category, title, description, lastSeenLocation, date, contactName, contactEmail, contactPhone, verificationDetails } = req.body;
    const userId = req.user._id;
    const imageFile = req.file;
    const normalizedTitle = String(title || '').trim();
    const normalizedDescription = String(description || '').trim();
    const normalizedLastSeenLocation = String(lastSeenLocation || '').trim();
    const normalizedContactName = String(contactName || '').trim();
    const normalizedContactEmail = String(contactEmail || '').trim().toLowerCase();
    const normalizedContactPhone = String(contactPhone || '').trim();

    // Parse verificationDetails if it's a JSON string
    if (typeof verificationDetails === 'string') {
      try {
        verificationDetails = JSON.parse(verificationDetails);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid verification details format.' });
      }
    }

    // Validate required fields
    if (!itemType || !category || !normalizedTitle || !normalizedDescription || !normalizedLastSeenLocation) {
      return res.status(400).json({ message: 'All required fields must be provided.' });
    }

    if (normalizedTitle.length < 3) {
      return res.status(400).json({ message: 'Title must be at least 3 characters long.' });
    }

    if (normalizedDescription.length < 10) {
      return res.status(400).json({ message: 'Description must be at least 10 characters long.' });
    }

    if (!normalizedContactName || !normalizedContactEmail || !normalizedContactPhone) {
      return res.status(400).json({ message: 'Contact information is required.' });
    }

    if (!verificationDetails || !verificationDetails.privateIdentifier || !verificationDetails.proofQuestion || !verificationDetails.proofAnswer) {
      return res.status(400).json({ message: 'Verification details are required.' });
    }

    let imageUrl = null;
    let imageFileId = null;

    // Upload image to ImageKit if provided
    if (imageFile) {
      try {
        const uploadResult = await uploadImageToImageKit(imageFile, `${itemType}-${Date.now()}`);
        imageUrl = uploadResult.url;
        imageFileId = uploadResult.fileId;
      } catch (error) {
        console.error('Image upload error:', error);
        return res.status(500).json({ message: `Failed to upload image: ${error.message}` });
      }
    }

    // Create report
    const report = await Report.create({
      userId,
      itemType,
      category,
      title: normalizedTitle,
      description: normalizedDescription,
      lastSeenLocation: normalizedLastSeenLocation,
      date: date ? new Date(date) : new Date(),
      imageUrl,
      imageFileId,
      contactName: normalizedContactName,
      contactEmail: normalizedContactEmail,
      contactPhone: normalizedContactPhone,
      verificationDetails: {
        privateIdentifier: String(verificationDetails.privateIdentifier).trim(),
        proofQuestion: String(verificationDetails.proofQuestion).trim(),
        proofAnswer: String(verificationDetails.proofAnswer).trim(),
      },
    });

    return res.status(201).json({
      message: 'Report created successfully.',
      report: {
        id: report._id,
        itemType: report.itemType,
        title: report.title,
        imageUrl: report.imageUrl,
        status: report.status,
      },
    });
  } catch (error) {
    if (error?.name === 'ValidationError') {
      const firstError = Object.values(error.errors || {})[0];
      const message = firstError?.message || 'Invalid report data.';
      return res.status(400).json({ message });
    }

    console.error('Create report error:', error);
    return res.status(500).json({ message: error.message || 'Failed to create report.' });
  }
};

export const getReports = async (req, res) => {
  try {
    const { itemType, category, status } = req.query;
    const filter = {};

    if (itemType) {
      filter.itemType = itemType;
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    } else {
      filter.status = 'active';
    }

    const reports = await Report.find(filter)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      message: 'Reports retrieved successfully.',
      reports,
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return res.status(500).json({ message: error.message || 'Failed to retrieve reports.' });
  }
};

export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).populate('userId', 'name email phone');

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    return res.status(200).json({
      message: 'Report retrieved successfully.',
      report,
    });
  } catch (error) {
    console.error('Get report error:', error);
    return res.status(500).json({ message: error.message || 'Failed to retrieve report.' });
  }
};

export const getUserReports = async (req, res) => {
  try {
    const userId = req.user._id;

    const reports = await Report.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: 'User reports retrieved successfully.',
      reports,
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    return res.status(500).json({ message: error.message || 'Failed to retrieve user reports.' });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (!['active', 'matched', 'resolved', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    if (report.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You do not have permission to update this report.' });
    }

    report.status = status;
    await report.save();

    return res.status(200).json({
      message: 'Report status updated successfully.',
      report,
    });
  } catch (error) {
    console.error('Update report error:', error);
    return res.status(500).json({ message: error.message || 'Failed to update report.' });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    if (report.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You do not have permission to delete this report.' });
    }

    // Delete image from ImageKit if it exists
    if (report.imageFileId) {
      try {
        await deleteImageFromImageKit(report.imageFileId);
      } catch (error) {
        console.error('Error deleting image from ImageKit:', error);
      }
    }

    await Report.findByIdAndDelete(id);

    return res.status(200).json({
      message: 'Report deleted successfully.',
    });
  } catch (error) {
    console.error('Delete report error:', error);
    return res.status(500).json({ message: error.message || 'Failed to delete report.' });
  }
};
