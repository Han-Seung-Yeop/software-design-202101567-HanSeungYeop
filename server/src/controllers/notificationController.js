const Notification = require('../models/Notification');

const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const query = { recipient_id: req.user.userId };

    if (unread === 'true') {
      query.is_read = false;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Notification.countDocuments(query);

    const notifications = await Notification.find(query)
      .populate({ path: 'actor_id', select: 'name role' })
      .skip(skip)
      .limit(Number(limit))
      .sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const unreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient_id: req.user.userId,
      is_read: false,
    });

    return res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      recipient_id: req.user.userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '알림을 찾을 수 없습니다.',
        error: 'NOTIFICATION_NOT_FOUND',
      });
    }

    if (!notification.is_read) {
      notification.is_read = true;
      notification.read_at = new Date();
      await notification.save();
    }

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient_id: req.user.userId, is_read: false },
      { $set: { is_read: true, read_at: new Date() } }
    );

    return res.status(200).json({
      success: true,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient_id: req.user.userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '알림을 찾을 수 없습니다.',
        error: 'NOTIFICATION_NOT_FOUND',
      });
    }

    return res.status(200).json({
      success: true,
      data: { message: '알림이 삭제되었습니다.' },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { list, unreadCount, markRead, markAllRead, remove };
