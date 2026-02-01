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

// Logger fallback
let logger;
try {
    const loggerModule = await import('./utils/logger.js');
    logger = loggerModule.default;
} catch (error) {
    logger = {
        info: (msg) => console.log('[INFO]', msg),
        error: (msg, err) => console.error('[ERROR]', msg, err || ''),
        warn: (msg) => console.warn('[WARN]', msg),
        debug: (msg) => console.log('[DEBUG]', msg)
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
        const port = config.port || 8000;

        app.set('view engine', 'ejs');
        app.set('views', join(__dirname, 'web/views'));
        app.use(express.static(join(__dirname, 'web/public')));

        // Correction du Warning MemoryStore en utilisant SQLite pour les sessions
        app.use(session({
            store: new SQLiteSessionStore({
                db: 'sessions.db',
                dir: './data' 
            }),
            secret: 'sentinel_v2_secret_key',
            resave: false,
            saveUninitialized: false,
            cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
        }));

        app.get('/', (req, res) => {
            res.render('index', { 
                bot: this.client.user, 
                stats: databaseHandler.getStats() 
            });
        });

        app.listen(port, '0.0.0.0', () => {
            logger.info('🌐 Web Dashboard live on port ' + port);
        });
    }

    async initialize() {
        if (this.isInitialized) return;
        try {
            logger.info('🚀 Initializing Sentinel v2.0.1-beta.1...');
            await databaseHandler.initialize();
            await this.eventHandler.loadEvents(join(__dirname, 'events'));
            await this.commandHandler.loadCommands(join(__dirname, 'commands'));
            await this.client.login(config.token.trim());
            
            this.setupWebPanel();
            this.isInitialized = true;
            logger.info('🎉 Sentinel is fully operational!');
        } catch (error) {
            logger.error('❌ Initialization failed:', error);
            process.exit(1);
        }
    }
}

const bot = new SentinelBot();
bot.initialize();
export default bot;