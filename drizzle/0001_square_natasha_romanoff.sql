CREATE TABLE `channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`dailyGoal` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channels_id` PRIMARY KEY(`id`),
	CONSTRAINT `channels_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `daily_sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`channelId` int NOT NULL,
	`saleDate` date NOT NULL,
	`quantity` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `imported_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileDate` date NOT NULL,
	`s3Key` varchar(500) NOT NULL,
	`s3Url` varchar(1000) NOT NULL,
	`recordsImported` int NOT NULL DEFAULT 0,
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	`importedBy` int,
	CONSTRAINT `imported_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_channel_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`channelId` int NOT NULL,
	`dailyGoal` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_channel_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` int NOT NULL,
	`internalCode` varchar(20) NOT NULL,
	`description` varchar(255) NOT NULL,
	`dailyGoal` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_internalCode_unique` UNIQUE(`internalCode`)
);
