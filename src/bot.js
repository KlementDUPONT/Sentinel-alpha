import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from './config/config.js';
import databaseHandler from './handlers/DatabaseHandler.js';
import EventHandler from './handlers/EventHandler.js';
import CommandHandler from './handlers/CommandHandler.js';
import ErrorHandler from './handlers/ErrorHandler.js';
import express from 'express';
import session from 'express-session';
import SQLiteStore from 'connect-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SQLiteSessionStore = SQLiteStore(session);

let logger;
try {
    const loggerModule = await import('./utils/logger.js');
    logger = loggerModule.default;
} catch (error) {
    logger = {
        info: (msg) => console.log('[INFO]', msg),
        error: (msg, err) => console.error('[ERROR]', msg, err || ''),
        warn: (msg) => console.warn('[WARN]', msg)
    };
}

class SentinelBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
            partials: [Partials.Message, Partials.Channel, Partials.User],
        });

        this.client.config = config;
        this.client.commands = new Collection();
        this.client.db = databaseHandler;

        this.errorHandler = new ErrorHandler(this.client);
        this.client.errorHandler = this.errorHandler;

        this.eventHandler = new EventHandler(this.client);
        this.commandHandler = new CommandHandler(this.client);

        this.isInitialized = false;
        this.webApp = express();
    }

    setupWebPanel() {
        const app = this.webApp;
        app.set('view engine', 'ejs');
        app.set('views', join(__dirname, 'web/views'));

        // Utilisation de SQLite pour les sessions (évite le warning mémoire sur Railway)
        app.use(session({
            store: new SQLiteSessionStore({ db: 'sessions.db', dir: './data' }),
            secret: 'sentinel_beta_v2',
            resave: false,
            saveUninitialized: false
        }));

        app.get('/', (req, res) => {
            res.render('index', { 
                bot: this.client.user, 
                stats: databaseHandler.getStats() 
            });
        });

        app.listen(config.port || 8000, '0.0.0.0', () => {
            logger.info(`🌐 Dashboard en ligne sur le port ${config.port || 8000}`);
        });
    }

    async initialize() {
        if (this.isInitialized) return;
        try {
            await databaseHandler.initialize();
            await this.eventHandler.loadEvents(join(__dirname, 'events'));
            await this.commandHandler.loadCommands(join(__dirname, 'commands'));
            await this.client.login(config.token.trim());
            
            this.setupWebPanel();
            this.isInitialized = true;
            logger.info('🚀 Sentinel v2.0.1-beta.1 est prêt !');
        } catch (error) {
            logger.error('❌ Échec du démarrage :', error);
            process.exit(1);
        }
    }
}

const bot = new SentinelBot();
bot.initialize();
export default bot;