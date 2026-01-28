import { Events } from 'discord.js';
import Models from '../../database/models/index.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import logger from '../../utils/logger.js';

export default {
  name: Events.GuildMemberRemove,
  async execute(member) {
    try {
      logger.info(`👋 ${member.user.tag} left ${member.guild.name}`);

      // Récupérer la config de la guilde
      const guildConfig = await Models.Guild.getOrCreate(member.guild.id);

      // Vérifier si les messages d'au revoir sont activés
      if (!guildConfig.goodbye_enabled || !guildConfig.goodbye_channel) return;

      const goodbyeChannel = member.guild.channels.cache.get(guildConfig.goodbye_channel);
      if (!goodbyeChannel) return;

      // Créer le message personnalisé
      const goodbyeMessage = guildConfig.goodbye_message
        .replace('{user}', member.user.tag)
        .replace('{username}', member.user.username)
        .replace('{tag}', member.user.tag)
        .replace('{server}', member.guild.name)
        .replace('{memberCount}', member.guild.memberCount);

      const embed = CustomEmbedBuilder.create(
        `👋 Au revoir...`,
        goodbyeMessage,
        {
          thumbnail: member.user.displayAvatarURL({ dynamic: true, size: 256 }),
        }
      );

      // Calculer le temps passé sur le serveur
      const joinedAt = member.joinedTimestamp;
      if (joinedAt) {
        const timeOnServer = Date.now() - joinedAt;
        const days = Math.floor(timeOnServer / (1000 * 60 * 60 * 24));

        embed.addFields({
          name: '⏱️ Temps sur le serveur',
          value: `${days} jour(s)`,
          inline: true,
        });
      }

      embed.addFields({
        name: '👥 Membres restants',
        value: `${member.guild.memberCount}`,
        inline: true,
      });

      embed.setFooter({ text: `ID: ${member.id}` });

      await goodbyeChannel.send({ embeds: [embed] });

    } catch (error) {
      logger.error('Error in guildMemberRemove event:');
      logger.error(error);
    }
  },
};
