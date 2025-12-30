CREATE TABLE `marketplace_stock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`channelId` int NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`lastUpdated` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplace_stock_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketplace_stock_productId_channelId_unique` UNIQUE(`productId`,`channelId`)
);
--> statement-breakpoint
CREATE TABLE `product_stock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`crossdockingStock` int NOT NULL DEFAULT 0,
	`lastUpdated` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_stock_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_stock_productId_unique` UNIQUE(`productId`)
);
