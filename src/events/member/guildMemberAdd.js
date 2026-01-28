import { EmbedBuilder } from 'discord.js';
import logger from '../../utils/logger.js';

export default {
  name: 'guildMemberAdd',
  category: 'member',

  async execute(member) {
    try {
      const { guild, user } = member;

      // Create user in database
      member.client.db.createUser(user.id, guild.id);

      // Get guild config
      const guildData = member.client.db.getGuild(guild.id);
      
      if (!guildData) {
        return;
      }

      // Auto-role
      if (guildData.auto_role) {
        const autoRole = guild.roles.cache.get(guildData.auto_role);
        if (autoRole) {
          try {
            await member.roles.add(autoRole);
            logger.info(`Added auto-role ${autoRole.name} to ${user.tag}`);
          } catch (error) {
            logger.error(`Failed to add auto-role to ${user.tag}:`, error);
          }
        }
      }

      // Welcome message
      if (guildData.welcome_channel) {
        const welcomeChannel = guild.channels.cache.get(guildData.welcome_channel);
        
        if (welcomeChannel) {
          const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('👋 Bienvenue !')
            .setDescription(`Bienvenue ${user} sur **${guild.name}** !`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
              { name: '👤 Utilisateur', value: user.tag, inline: true },
              { name: '🆔 ID', value: user.id, inline: true },
              { name: '📊 Membres', value: `${guild.memberCount}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: guild.name, iconURL: guild.iconURL() });

          await welcomeChannel.send({ embeds: [embed] });
        }
      }

      logger.info(`👋 ${user.tag} joined ${guild.name}`);

    } catch (error) {
      logger.error('Error in guildMemberAdd event:', error);
    }
  },
};
