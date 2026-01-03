CREATE TABLE `product_listing_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`channelId` int NOT NULL,
	`listingUrl` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_listing_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_listing_links_productId_channelId_unique` UNIQUE(`productId`,`channelId`)
);
