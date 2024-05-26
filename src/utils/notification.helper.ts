import Notification from "../modals/notification";
import User from "../modals/user";

interface NotificationProps {
	message: string;
	link: string;
	type: string;
	userId?: string;
	role?: string;
}

export const createNotificationAll = async (data: NotificationProps) => {
	// Props
	const { message, link, type } = data;

	const users = await User.find({});

	users.map((user) => {
		const notification = new Notification({
			userId: user._id,
			message: message,
			link: link,
			type: type,
			createdAt: new Date(),
		});
		notification.save();
	});

	return users;
};

export const createNotification = async (data: NotificationProps) => {
	// Props
	const { message, link, type, userId } = data;

	const notification = new Notification({
		userId: userId,
		message: message,
		link: link,
		type: type,
		createdAt: new Date(),
	});
	notification.save();
};

export const createNotificationByRole = async (data: NotificationProps) => {
	// Props
	const { message, link, type, role } = data;

	const users = await User.find({ role });

	users.map((user) => {
		const notification = new Notification({
			userId: user._id,
			message: message,
			link: link,
			type: type,
			createdAt: new Date(),
		});
		notification.save();
	});
};
