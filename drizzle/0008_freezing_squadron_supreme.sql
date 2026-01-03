CREATE TABLE `product_channel_stock_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`channelId` int NOT NULL,
	`fullStock` int NOT NULL DEFAULT 0,
	`crossStock` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_channel_stock_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_channel_stock_types_productId_channelId_unique` UNIQUE(`productId`,`channelId`)
);
