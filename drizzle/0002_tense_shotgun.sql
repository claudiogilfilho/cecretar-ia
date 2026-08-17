ALTER TABLE `conversations` MODIFY COLUMN `qualification` json NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` MODIFY COLUMN `metadata` json NOT NULL;