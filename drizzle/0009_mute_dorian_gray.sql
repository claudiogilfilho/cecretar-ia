ALTER TABLE `agents` ADD `behaviorMode` enum('objective','balanced','consultative') DEFAULT 'balanced' NOT NULL;--> statement-breakpoint
ALTER TABLE `agents` ADD `behaviorMode` enum('objective','balanced','consultative') DEFAULT 'balanced' NOT NULL;--> statement-breakpoint
ALTER TABLE `conversations` ADD `automationPaused` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `mediaAssets` ADD `usage` enum('outbound','instruction') DEFAULT 'outbound' NOT NULL;--> statement-breakpoint
ALTER TABLE `mediaAssets` ADD `extractedText` text;
