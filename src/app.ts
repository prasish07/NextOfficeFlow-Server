import express from "express";
import "express-async-errors";
import { DbConnect } from "./db/DbConnect.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";
import { config } from "./config/config.js";
import helmet from "helmet";
import cors from "cors";
import cron from "node-cron";
import { markAbsentEmployeesForToday } from "./controllers/attendance.controller.js";
import {
	createLeaveDetailEveryYear,
	notifyAdminAndHRAboutEmployeeEndDates,
} from "./controllers/employee.controller.js";
import {
	autoNotifyPMAdminAndAssigneeEmployeeAboutDueProject,
	autoNotifyPMAdminAndAssigneeEmployeeAboutDueProjectOneWeekBefore,
} from "./controllers/project.controller.js";
import {
	autoNotifyAdminAndAssigneeAboutDueTicketsOneWeekBefore,
	autoNotifyAdminAndAssigneeAboutOverdueTickets,
} from "./controllers/ticket.controller.js";

const app = express();

// port
const port = config.server.port;

// security
app.use(helmet());
app.use(
	cors({
		origin: [
			"http://localhost:3000",
			"http://localhost:5001",
			"https://nextofficeflow.onrender.com",
		],
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	})
);

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(config.jwt.secret));

// routes
app.use(router);

// not found
app.use(notFound);

// error handler
app.use(errorHandler);

cron.schedule("0 22 * * *", async () => {
	console.log("Running cron job at 10 pm every day");
	try {
		await markAbsentEmployeesForToday();
	} catch (error) {
		console.log(error);
	}
});

cron.schedule("44 1 * * *", async () => {
	console.log("Running cron job at 1 am on 1st January every year");
	try {
		await createLeaveDetailEveryYear();
	} catch (error) {
		console.log(error);
	}
});

// Cron to notify about project/ticket/employee
cron.schedule("59 23 * * *", async () => {
	console.log("Running cron job to check project/ticket/employee status");
	try {
		await autoNotifyPMAdminAndAssigneeEmployeeAboutDueProject();
		await autoNotifyPMAdminAndAssigneeEmployeeAboutDueProjectOneWeekBefore();
		await notifyAdminAndHRAboutEmployeeEndDates();
		await autoNotifyAdminAndAssigneeAboutOverdueTickets();
		await autoNotifyAdminAndAssigneeAboutDueTicketsOneWeekBefore();
	} catch (error) {
		console.log(error);
	}
});

const start = async () => {
	try {
		// connecting to database
		await DbConnect(config.mongo.url);
	} catch (error) {
		console.log(error);
	}
	app.listen(port, () => {
		console.log(`Server is running on port ${port}`);
	});
};

start();
