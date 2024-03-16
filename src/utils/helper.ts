export const dateFormatter = (date: Date) => {
	const options = { year: "numeric", month: "long", day: "numeric" };
	return new Date(date).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};
