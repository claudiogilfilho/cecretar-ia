CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`persona` text NOT NULL,
	`companyInfo` text NOT NULL,
	`services` text NOT NULL,
	`pricing` text NOT NULL,
	`businessHours` text NOT NULL,
	`transferKeyword` varchar(80) NOT NULL DEFAULT 'gente',
	`provider` enum('embedded','openai') NOT NULL DEFAULT 'embedded',
	`modelPreference` varchar(120) NOT NULL DEFAULT 'automático',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`conversationId` int,
	`visitorName` varchar(160) NOT NULL,
	`visitorPhone` varchar(40),
	`scheduledFor` timestamp NOT NULL,
	`status` enum('scheduled','rescheduled','canceled','pending') NOT NULL DEFAULT 'scheduled',
	`calendarProvider` enum('google','manual') NOT NULL DEFAULT 'manual',
	`externalEventId` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`industry` varchar(120) NOT NULL,
	`brandColor` varchar(20) NOT NULL DEFAULT '#007E45',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `companies_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`contactName` varchar(160) NOT NULL DEFAULT 'Contato de teste',
	`contactPhone` varchar(40),
	`channel` enum('simulator','whatsapp','instagram') NOT NULL DEFAULT 'simulator',
	`status` enum('bot','human','closed') NOT NULL DEFAULT 'bot',
	`leadStatus` enum('new','qualified','scheduled','lost') NOT NULL DEFAULT 'new',
		`qualification` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mediaAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`kind` enum('image','audio','video','document') NOT NULL,
	`url` text NOT NULL,
	`storageKey` varchar(512),
	`intent` varchar(120) NOT NULL,
	`flowStage` varchar(120) NOT NULL DEFAULT 'Atendimento',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mediaAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('lead','agent','human','system') NOT NULL,
	`body` text NOT NULL,
	`mediaIntent` varchar(120),
		`metadata` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qualificationFields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`key` varchar(60) NOT NULL,
	`label` varchar(120) NOT NULL,
	`prompt` varchar(260) NOT NULL,
	`required` boolean NOT NULL DEFAULT true,
	`position` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `qualificationFields_id` PRIMARY KEY(`id`)
);
