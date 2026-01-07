CREATE TABLE `product_marketplace_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`channelId` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_marketplace_notes_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_marketplace_notes_productId_channelId_unique` UNIQUE(`productId`,`channelId`)
);
