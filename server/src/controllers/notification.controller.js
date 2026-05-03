import Notification from '../models/notification.model.js';

export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ userId })
      .populate('claimId')
      .populate('reportId', 'title itemType category imageUrl')
      .populate('relatedUserId', 'name email phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    return res.status(200).json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return res.status(500).json({ message: 'Failed to fetch unread count.' });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    // Verify ownership
    if (notification.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You do not have permission to update this notification.' });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({ message: 'Notification marked as read.', notification });
  } catch (error) {
    console.error('Error updating notification:', error);
    return res.status(500).json({ message: 'Failed to update notification.' });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany({ userId, isRead: false }, { isRead: true });

    return res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return res.status(500).json({ message: 'Failed to update notifications.' });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    // Verify ownership
    if (notification.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You do not have permission to delete this notification.' });
    }

    await Notification.findByIdAndDelete(notificationId);

    return res.status(200).json({ message: 'Notification deleted.' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ message: 'Failed to delete notification.' });
  }
};
