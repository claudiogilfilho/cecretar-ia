CREATE TABLE `instagramChannels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`agentId` int NOT NULL,
	`status` enum('draft','ready','connected','error') NOT NULL DEFAULT 'draft',
	`instagramBusinessAccountId` varchar(80),
	`pageId` varchar(80),
	`profileHandle` varchar(120),
	`lastError` text,
	`connectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `instagramChannels_id` PRIMARY KEY(`id`),
	CONSTRAINT `instagramChannels_instagramBusinessAccountId_unique` UNIQUE(`instagramBusinessAccountId`)
);
--> statement-breakpoint
ALTER TABLE `agents` MODIFY COLUMN `transferKeyword` varchar(80) NOT NULL DEFAULT '#gente';--> statement-breakpoint
ALTER TABLE `agents` ADD `ownerTakeoverCommand` varchar(80) DEFAULT '#assumir' NOT NULL;--> statement-breakpoint
ALTER TABLE `agents` ADD `templateKey` varchar(80) DEFAULT 'real_estate_rental' NOT NULL;--> statement-breakpoint
ALTER TABLE `agents` ADD `websiteUrl` varchar(512);--> statement-breakpoint
ALTER TABLE `agents` ADD `instagramHandle` varchar(120);--> statement-breakpoint
ALTER TABLE `agents` ADD `onboardingSources` json;
