CREATE TABLE `calendarConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`provider` enum('google') NOT NULL,
	`status` enum('disconnected','connected','needs_reauth') NOT NULL DEFAULT 'disconnected',
	`calendarId` varchar(320),
	`calendarName` varchar(180),
	`accessTokenEncrypted` text,
	`refreshTokenEncrypted` text,
	`grantedScopes` text,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendarConnections_id` PRIMARY KEY(`id`)
);
