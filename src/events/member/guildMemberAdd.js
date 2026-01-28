import { Events } from 'discord.js';
import Models from '../../database/models/index.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import logger from '../../utils/logger.js';

export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      logger.info(`👋 ${member.user.tag} joined ${member.guild.name}`);

      // Récupérer la config de la guilde
      const guildConfig = await Models.Guild.getOrCreate(member.guild.id);

      // Vérifier si les messages de bienvenue sont activés
      if (!guildConfig.welcome_enabled || !guildConfig.welcome_channel) return;

      const welcomeChannel = member.guild.channels.cache.get(guildConfig.welcome_channel);
      if (!welcomeChannel) return;

      // Créer le message personnalisé
      const welcomeMessage = guildConfig.welcome_message
        .replace('{user}', `<@${member.id}>`)
        .replace('{username}', member.user.username)
        .replace('{tag}', member.user.tag)
        .replace('{server}', member.guild.name)
        .replace('{memberCount}', member.guild.memberCount);

      const embed = CustomEmbedBuilder.create(
        `👋 Bienvenue sur ${member.guild.name} !`,
        welcomeMessage,
        {
          thumbnail: member.user.displayAvatarURL({ dynamic: true, size: 256 }),
        }
      );

      embed.addFields({
        name: '📊 Informations',
        value: [
          `**Compte créé :** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
          `**Membre n°${member.guild.memberCount}**`,
        ].join('\n'),
        inline: false,
      });

      embed.setFooter({ text: `ID: ${member.id}` });

      await welcomeChannel.send({ embeds: [embed] });

    } catch (error) {
      logger.error('Error in guildMemberAdd event:');
      logger.error(error);
    }
  },
};
