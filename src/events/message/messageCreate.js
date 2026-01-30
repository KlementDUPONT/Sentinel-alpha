import logger from '../../utils/logger.js';

export default {
  name: 'messageCreate',
  category: 'message',

  async execute(message) {
    // Ignorer les bots
    if (message.author.bot) return;
    
    // Ignorer les MPs
    if (!message.guild) return;

    try {
      const db = message.client.db;
      
      if (!db) {
        logger.warn('Database not available in messageCreate event');
        return;
      }

      // S'assurer que le serveur existe dans la DB
      let guildData = db.getGuild(message.guild.id);
      if (!guildData) {
        db.createGuild(message.guild.id, message.guild.name);
        guildData = db.getGuild(message.guild.id);
      }

      // S'assurer que l'utilisateur existe dans la DB
      let userData = db.getUser(message.author.id, message.guild.id);
      if (!userData) {
        db.createUser(message.author.id, message.guild.id);
        userData = db.getUser(message.author.id, message.guild.id);
      }

      // Système XP (gain entre 15 et 25 XP par message)
      const xpGain = Math.floor(Math.random() * 11) + 15; // 15-25 XP
      const newXp = (userData.xp || 0) + xpGain;
      const currentLevel = userData.level || 0;
      
      // Calculer le niveau (100 XP par niveau)
      const xpPerLevel = 100;
      const newLevel = Math.floor(newXp / xpPerLevel);

      // Mettre à jour l'XP et le niveau
      db.updateUserLevel(message.author.id, message.guild.id, {
        xp: newXp,
        level: newLevel
      });

      // Si level up, envoyer un message
      if (newLevel > currentLevel) {
        const levelUpMessage = `🎉 Congratulations ${message.author}! You've reached **Level ${newLevel}**!`;
        
        try {
          await message.channel.send(levelUpMessage);
        } catch (sendError) {
          logger.error('Failed to send level up message:', sendError);
        }
      }

    } catch (error) {
      logger.error('Error in messageCreate event (XP system):');
      logger.error(error.message, { stack: error.stack });
    }
  }
};
