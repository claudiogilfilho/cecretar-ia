CREATE TABLE `whatsappChannels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`agentId` int NOT NULL,
	`provider` enum('meta_cloud') NOT NULL DEFAULT 'meta_cloud',
	`status` enum('draft','ready','connected','error') NOT NULL DEFAULT 'draft',
	`displayPhoneNumber` varchar(40),
	`phoneNumberId` varchar(80),
	`wabaId` varchar(80),
	`lastError` text,
	`connectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsappChannels_id` PRIMARY KEY(`id`),
	CONSTRAINT `whatsappChannels_phoneNumberId_unique` UNIQUE(`phoneNumberId`)
);
