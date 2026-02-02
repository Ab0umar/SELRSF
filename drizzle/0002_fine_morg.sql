CREATE TABLE `khazina` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`date` date NOT NULL,
	`income` float NOT NULL DEFAULT 0,
	`expense` float NOT NULL DEFAULT 0,
	`total` float NOT NULL DEFAULT 0,
	`balance` float NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `khazina_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qard` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`amount` float NOT NULL,
	`date` date NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qard_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sulf` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`loanAmount` float NOT NULL,
	`paidAmount` float NOT NULL DEFAULT 0,
	`date` date NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sulf_id` PRIMARY KEY(`id`)
);
