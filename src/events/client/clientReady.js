import { Events } from 'discord.js';
import logger from '../../utils/logger.js';

export default {
    /**
     * L'événement 'ready' est renommé 'clientReady' dans les versions récentes de discord.js
     * pour éviter les conflits avec le gateway de Discord.
     */
    name: Events.ClientReady, 
    once: true,
    async execute(client) {
        logger.info(`🎉 Connecté en tant que ${client.user.tag} !`);
        logger.info(`🌐 Sentinel est présent sur ${client.guilds.cache.size} serveurs.`);

        // Synchronisation de la base de données avec les serveurs actuels
        logger.info('🔄 Synchronisation des serveurs avec la base de données...');
        
        let successCount = 0;
        let failCount = 0;

        for (const guild of client.guilds.cache.values()) {
            try {
                // On utilise la méthode createGuild pour enregistrer le serveur s'il n'existe pas
                await client.db.createGuild(guild.id, guild.name);
                successCount++;
            } catch (error) {
                logger.error(`❌ Échec de l'initialisation pour le serveur ${guild.name} (${guild.id}):`, error.message);
                failCount++;
            }
        }

        if (failCount === 0) {
            logger.info(`✅ Synchronisation terminée : ${successCount} serveurs opérationnels.`);
        } else {
            logger.warn(`⚠️ Synchronisation partielle : ${successCount} succès, ${failCount} échecs.`);
        }

        // Configuration de l'activité du bot (Status)
        client.user.setActivity({
            name: `Sentinel v2.0.1-beta.1 | ${client.guilds.cache.size} serveurs`,
            type: 3 // Watching
        });

        logger.info('🎉 Sentinel est prêt et totalement opérationnel !');
    },
};