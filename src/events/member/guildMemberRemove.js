import { EmbedBuilder } from 'discord.js';
import logger from '../../utils/logger.js';

export default {
  name: 'guildMemberRemove',
  category: 'member',

  async execute(member) {
    try {
      const { guild, user } = member;

      // Get guild config from database
      const guildData = member.client.db.getGuild(guild.id);
      
      if (!guildData || !guildData.welcome_channel) {
        return;
      }

      // Get welcome channel
      const welcomeChannel = guild.channels.cache.get(guildData.welcome_channel);
      
      if (!welcomeChannel) {
        return;
      }

      // Create goodbye embed
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('👋 Au revoir !')
        .setDescription(`**${user.tag}** a quitté le serveur.`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          { name: '👤 Utilisateur', value: user.tag, inline: true },
          { name: '🆔 ID', value: user.id, inline: true },
          { name: '📊 Membres', value: `${guild.memberCount}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: guild.name, iconURL: guild.iconURL() });

      await welcomeChannel.send({ embeds: [embed] });

      logger.info(`👋 ${user.tag} left ${guild.name}`);

    } catch (error) {
      logger.error('Error in guildMemberRemove event:', error);
    }
  },
};
