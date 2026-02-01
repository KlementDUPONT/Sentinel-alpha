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
import passport from 'passport';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import logger avec fallback
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
            partials: [
                Partials.Message, 
                Partials.Channel, 
                Partials.User
            ],
        });

        // Attachement des handlers et config
        this.client.config = config;
        this.client.commands = new Collection();
        this.client.cooldowns = new Map();
        this.client.db = databaseHandler;

        this.errorHandler = new ErrorHandler(this.client);
        this.client.errorHandler = this.errorHandler;

        this.eventHandler = new EventHandler(this.client);
        this.commandHandler = new CommandHandler(this.client);

        this.isInitialized = false;
        this.webApp = express();
    }

    /**
     * Configuration du Panel Web (Dashboard)
     */
    setupWebPanel() {
        const app = this.webApp;
        const port = config.port || 8000;

        // Configuration du moteur de rendu (EJS)
        app.set('view engine', 'ejs');
        app.set('views', join(__dirname, 'web/views'));
        app.use(express.static(join(__dirname, 'web/public')));

        // Middleware de session pour Passport
        app.use(session({
            secret: 'sentinel_v2_secret_key',
            resave: false,
            saveUninitialized: false
        }));

        app.use(passport.initialize());
        app.use(passport.session());

        // Routes basiques
        app.get('/', (req, res) => {
            if (!this.client.isReady()) {
                return res.status(503).send('Bot is starting, please refresh in a few seconds.');
            }
            res.render('index', { 
                bot: this.client.user, 
                stats: databaseHandler.getStats() 
            });
        });

        app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                botReady: this.client.isReady(),
                uptime: process.uptime()
            });
        });

        app.listen(port, '0.0.0.0', () => {
            logger.info('🌐 Web Dashboard live on port ' + port);
        });
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            logger.info('🚀 Starting Sentinel Bot v2.0.1-beta.1...');

            // 1. Initialisation de la DB d'abord (très important pour Railway)
            logger.info('📦 Step 1/4: Database initialization');
            await databaseHandler.initialize();

            // 2. Chargement des Events et Commandes
            logger.info('📦 Step 2/4: Loading events');
            await this.eventHandler.loadEvents(join(__dirname, 'events'));

            logger.info('📦 Step 3/4: Loading commands');
            await this.commandHandler.loadCommands(join(__dirname, 'commands'));

            // 3. Connexion Discord
            logger.info('📦 Step 4/4: Connecting to Discord...');
            await this.client.login(config.token.trim());

            // 4. Lancement du Web Panel une fois que tout est prêt
            this.setupWebPanel();

            this.isInitialized = true;
            logger.info('🎉 Sentinel is fully operational!');
        } catch (error) {
            logger.error('❌ Failed to initialize bot:', error);
            process.exit(1);
        }
    }
}

const bot = new SentinelBot();
bot.initialize();

export default bot;