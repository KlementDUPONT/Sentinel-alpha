import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import PermissionManager from '../../config/permissions.js';
import Models from '../../database/models/index.js';
import { RESPONSE_MESSAGES, MODERATION_ACTIONS, LIMITS } from '../../config/constants.js';
import Validator from '../../utils/validator.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avertit un utilisateur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à avertir')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('La raison de l\'avertissement')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  permissions: ['ModerateMembers'],
  guildOnly: true,
  cooldown: 3,

  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('utilisateur');
    const reason = Validator.validateReason(interaction.options.getString('raison'));

    try {
      // Vérifications
      if (targetUser.id === interaction.user.id) {
        return interaction.editReply({
          embeds: [CustomEmbedBuilder.error('Erreur', RESPONSE_MESSAGES.CANNOT_ACTION_SELF)]
        });
      }

      if (targetUser.bot) {
        return interaction.editReply({
          embeds: [CustomEmbedBuilder.error('Erreur', RESPONSE_MESSAGES.CANNOT_ACTION_BOT)]
        });
      }

      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      
      if (!targetMember) {
        return interaction.editReply({
          embeds: [CustomEmbedBuilder.error('Erreur', RESPONSE_MESSAGES.INVALID_MEMBER)]
        });
      }

      // Vérifier le nombre d'avertissements
      const warnCount = Models.Warn.countUserWarns(targetUser.id, interaction.guildId, true);
      
      if (warnCount >= LIMITS.MAX_WARNS) {
        return interaction.editReply({
          embeds: [CustomEmbedBuilder.error('Erreur', `Cet utilisateur a déjà atteint le nombre maximum d'avertissements (${LIMITS.MAX_WARNS}).`)]
        });
      }

      // Créer l'avertissement
      const { warnId } = Models.Warn.create(
        interaction.guildId,
        targetUser.id,
        interaction.user.id,
        reason
      );

      // Enregistrer dans les logs de modération
      const { caseId } = Models.ModLog.create(
        interaction.guildId,
        MODERATION_ACTIONS.WARN,
        targetUser.id,
        interaction.user.id,
        reason
      );

      const newWarnCount = warnCount + 1;

      // Embed de confirmation
      const embed = CustomEmbedBuilder.moderation(
        'Avertissement',
        interaction.user,
        targetUser,
        reason,
        caseId
      );

      embed.addFields({
        name: '⚠️ Nombre d\'avertissements',
        value: `\`${newWarnCount}/${LIMITS.MAX_WARNS}\``,
        inline: true
      });

      embed.addFields({
        name: '🆔 ID Avertissement',
        value: `\`${warnId}\``,
        inline: true
      });

      await interaction.editReply({ embeds: [embed] });

      // Notifier l'utilisateur
      try {
        const dmEmbed = CustomEmbedBuilder.warning(
          `Avertissement dans ${interaction.guild.name}`,
          `Vous avez reçu un avertissement.\n\n**Raison :** ${reason}\n**Avertissements :** ${newWarnCount}/${LIMITS.MAX_WARNS}`
        );
        await targetUser.send({ embeds: [dmEmbed] });
      } catch (error) {
        // L'utilisateur a désactivé les DMs
      }

      // Log dans le canal de modération
      const guildConfig = await Models.Guild.getOrCreate(interaction.guildId);
      if (guildConfig.mod_log_channel) {
        const logChannel = interaction.guild.channels.cache.get(guildConfig.mod_log_channel);
        if (logChannel) {
          await logChannel.send({ embeds: [embed] });
        }
      }

    } catch (error) {
      throw error;
    }
  },
};
