# **BotForge: Multi-Bot Management Framework**

**BotForge** is a modular framework for building and managing multiple Telegram bots in a single repository. It promotes scalability, code reusability, and consistency by leveraging shared libraries, centralized configurations, and environment-specific setups.

---

## Table of Contents

1. [About the Project](#about-the-project)
2. [Features](#features)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Deployment Instructions](#deployment-instructions)
6. [Adding a New Bot](#adding-a-new-bot)
7. [License](#license)

---

## About the Project

**BotForge** provides a unified structure for managing multiple bots, enabling developers to share functionality across bots through reusable libraries and services. With TypeScript and Prisma integration, the framework ensures reliability, scalability, and easy maintenance for both new and existing bots.

---

## Features

- **Multi-Bot Support**: Manage multiple Telegram bots within a single repository.
- **Shared Libraries**: Reuse code across bots to reduce duplication.
- **Scalable Architecture**: Easily add new bots without impacting existing ones.
- **TypeScript Integration**: Type safety for better maintainability.
- **Environment-Based Configurations**: Isolated configurations for each bot.
- **Prisma ORM**: Simplified database interaction and migrations.

---

## Project Structure

```
.git/                # Git repository tracking
commander-bot/       # Implementation of the Commander Bot
shared-lib/          # Shared libraries and utilities
.gitignore           # Git ignore rules
README.md            # Project documentation
```

### Key Directories

- **`commander-bot/`**: Contains all files and logic specific to the Commander Bot. Each bot will follow a similar structure within its own directory.
- **`shared-lib/`**: Contains reusable utilities, database services, and configurations shared across all bots.

---

## Getting Started

### Prerequisites

Before deploying the project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [TypeScript](https://www.typescriptlang.org/)
- [Prisma CLI](https://www.prisma.io/)
- A configured database (e.g., MySQL, PostgreSQL)
- Telegram Bot API tokens for your bots

---

## Deployment Instructions

Follow these steps to deploy a bot (e.g., `commander-bot`):

1. **Install Dependencies:**
   Install the global dependencies required for the project:
   ```bash
   npm i -g dotenv-cli
   ```

2. **Navigate to the Bot Directory:**
   Move to the directory of the bot you want to deploy (e.g., `commander-bot`):
   ```bash
   cd commander-bot
   ```

3. **Generate Prisma Client:**
   If your bot uses a database, generate the Prisma client:
   ```bash
   npx prisma generate
   ```

4. **Run Prisma Migrations:**
   Reset the database schema using the bot-specific `.env` file:
   ```bash
   dotenv -e ../.env_commanderBot -- npx prisma migrate reset
   ```

5. **Start the Bot:**
   Start the bot application:
   ```bash
   npm start
   ```

---

## Adding a New Bot

To add a new bot to the repository:

1. **Create a New Directory:**
   Create a directory at the root of the project for the new bot. For example:
   ```
   mkdir new-bot
   ```

2. **Implement Bot Logic:**
   Add all files, commands, and services required for the bot within the directory.

3. **Create a `.env_newBot` File:**
   Use the `commander-bot/.env_commanderBot.example` file as a reference to define environment variables for your new bot. For example:

   **`.env_newBot` (Example):**
   ```plaintext
   # MongoDB Configuration (if applicable)
   MONGO_HOST=
   MONGO_DB=

   # Bot-Specific Database Configuration
   DB_HOST=
   DB_USER=
   DB_PORT=
   DB_PASSWORD=
   DB_DATABASE_NAME=

   # Telegram Bot Token
   BOT_TOKEN=

   # Prisma Database URL
   DATABASE_URL=
   ```

4. **Generate Prisma Client:**
   If your new bot interacts with a database through Prisma, generate the Prisma client:
   ```bash
   npx prisma generate
   ```

5. **Run Migrations:**
   Use the `.env` file for the new bot to run migrations:
   ```bash
   dotenv -e ../.env_newBot -- npx prisma migrate reset
   ```

6. **Start the Bot:**
   Navigate to the bot directory and start the application:
   ```bash
   npm start
   ```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Contributions are welcome! If you'd like to add features, report bugs, or improve the project, feel free to open a pull request or issue.
