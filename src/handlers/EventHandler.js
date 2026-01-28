import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Gestionnaire d'événements
 */
class EventHandler {
  constructor(client) {
    this.client = client;
    this.eventsPath = join(__dirname, '../events');
    this.loadedEvents = [];
  }

  /**
   * Charge tous les événements
   */
  async loadEvents() {
    try {
      logger.info('📦 Loading events...');
      
      const categories = readdirSync(this.eventsPath);
      let eventCount = 0;

      for (const category of categories) {
        const categoryPath = join(this.eventsPath, category);
        const eventFiles = readdirSync(categoryPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
          try {
            const filePath = join(categoryPath, file);
            const event = await import(`file://${filePath}`);
            const eventData = event.default;

            if (!eventData.name || !eventData.execute) {
              logger.warn(`⚠️  Event ${file} is missing required "name" or "execute" property`);
              continue;
            }

            // Enregistre l'événement
            if (eventData.once) {
              this.client.once(eventData.name, (...args) => {
                this.executeEvent(eventData, ...args);
              });
            } else {
              this.client.on(eventData.name, (...args) => {
                this.executeEvent(eventData, ...args);
              });
            }

            this.loadedEvents.push({
              name: eventData.name,
              category,
              once: eventData.once || false,
              file,
            });

            eventCount++;
            logger.info(`✓ Loaded event: ${eventData.name} [${category}]${eventData.once ? ' (once)' : ''}`);
          } catch (error) {
            logger.error(`❌ Failed to load event ${file}:`);
            logger.error(error);
          }
        }
      }

      logger.info(`✅ Loaded ${eventCount} events successfully`);
      return eventCount;
    } catch (error) {
      logger.error('❌ Failed to load events:');
      logger.error(error);
      throw error;
    }
  }

  /**
   * Execute un événement avec gestion d'erreur
   */
  async executeEvent(eventData, ...args) {
    try {
      await eventData.execute(...args);
    } catch (error) {
      logger.error(`❌ Error executing event ${eventData.name}:`);
      logger.error(error);
      
      // Transmet l'erreur au ErrorHandler
      if (this.client.errorHandler) {
        this.client.errorHandler.handleEventError(eventData.name, error);
      }
    }
  }

  /**
   * Recharge un événement spécifique
   */
  async reloadEvent(eventName) {
    try {
      const event = this.loadedEvents.find(e => e.name === eventName);
      if (!event) {
        throw new Error(`Event ${eventName} not found`);
      }

      // Supprime tous les listeners pour cet événement
      this.client.removeAllListeners(eventName);

      // Recharge l'événement
      const filePath = join(this.eventsPath, event.category, event.file);
      
      // Supprime le cache du module
      delete require.cache[require.resolve(filePath)];
      
      const reloadedEvent = await import(`file://${filePath}?update=${Date.now()}`);
      const eventData = reloadedEvent.default;

      // Réenregistre l'événement
      if (eventData.once) {
        this.client.once(eventData.name, (...args) => {
          this.executeEvent(eventData, ...args);
        });
      } else {
        this.client.on(eventData.name, (...args) => {
          this.executeEvent(eventData, ...args);
        });
      }

      logger.info(`✅ Reloaded event: ${eventName}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to reload event ${eventName}:`);
      logger.error(error);
      throw error;
    }
  }

  /**
   * Recharge tous les événements
   */
  async reloadAll() {
    try {
      logger.info('🔄 Reloading all events...');
      
      // Supprime tous les listeners
      this.client.removeAllListeners();
      
      // Vide la liste
      this.loadedEvents = [];
      
      // Recharge tous les événements
      await this.loadEvents();
      
      logger.info('✅ All events reloaded successfully');
      return true;
    } catch (error) {
      logger.error('❌ Failed to reload events:');
      logger.error(error);
      throw error;
    }
  }

  /**
   * Liste tous les événements chargés
   */
  getLoadedEvents() {
    return this.loadedEvents;
  }

  /**
   * Obtient des statistiques sur les événements
   */
  getStats() {
    const categories = {};
    
    this.loadedEvents.forEach(event => {
      if (!categories[event.category]) {
        categories[event.category] = 0;
      }
      categories[event.category]++;
    });

    return {
      total: this.loadedEvents.length,
      categories,
      once: this.loadedEvents.filter(e => e.once).length,
      recurring: this.loadedEvents.filter(e => !e.once).length,
    };
  }
}

export default EventHandler;
