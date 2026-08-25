CREATE TABLE `voiceProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`provider` enum('google_chirp','elevenlabs','disabled') NOT NULL DEFAULT 'google_chirp',
	`replyMode` enum('automatic','text_only','audio_only') NOT NULL DEFAULT 'automatic',
	`googleVoice` varchar(120) NOT NULL DEFAULT 'pt-BR-Chirp3-HD-Aoede',
	`elevenLabsVoiceId` varchar(120),
	`speechRatePercent` int NOT NULL DEFAULT 100,
	`maxAudioCharacters` int NOT NULL DEFAULT 900,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `voiceProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `voiceProfiles_agentId_unique` UNIQUE(`agentId`)
);
