ALTER TABLE `product_listing_links` ADD `suggestedPrice` int;--> statement-breakpoint
ALTER TABLE `product_listing_links` ADD `marketplacePrice` int;--> statement-breakpoint
ALTER TABLE `product_listing_links` ADD `discount` int;--> statement-breakpoint
ALTER TABLE `product_listing_links` ADD `available` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `product_listing_links` ADD `lastPriceCheck` timestamp;