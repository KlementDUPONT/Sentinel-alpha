import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import PermissionManager from '../../config/permissions.js';
import Models from '../../database/models/index.js';
import { RESPONSE_MESSAGES, MODERATION_ACTIONS } from '../../config/constants.js';
import Validator from '../../utils/validator.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulse un utilisateur du serveur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à expulser')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('La raison de l\'expulsion')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  permissions: ['KickMembers'],
  botPermissions: ['KickMembers'],
  guildOnly: true,
  cooldown: 5,

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

      if (targetUser.id === interaction.client.user.id) {
        return interaction.editReply({
          embeds: [CustomEmbedBuilder.error('Erreur', RESPONSE_MESSAGES.CANNOT_ACTION_BOT)]
        });
      }

      // Récupérer le membre
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      
      if (!targetMember) {
        return interaction.editReply({
          embeds: [CustomEmbedBuilder.error('Erreur', RESPONSE_MESSAGES.INVALID_MEMBER)]
        });
      }

      // Vérifier la hiérarchie
      if (!PermissionManager.canModerate(interaction.member, targetMember)) {
        return interaction.editReply({
          embeds: [CustomEmbedBuilder.error('Erreur', RESPONSE_MESSAGES.USER_HIERARCHY_ERROR)]
        });
      }

      if (!PermissionManager.botCanModerate(interaction.guild.members.me, targetMember)) {
        return interaction.editReply({
          embeds: [CustomEmbedBuilder.error('Erreur', RESPONSE_MESSAGES.HIERARCHY_ERROR)]
        });
      }

      // Expulser l'utilisateur
      await targetMember.kick(`${interaction.user.tag}: ${reason}`);

      // Enregistrer dans la base de données
      const { caseId } = Models.ModLog.create(
        interaction.guildId,
        MODERATION_ACTIONS.KICK,
        targetUser.id,
        interaction.user.id,
        reason
      );

      // Embed de confirmation
      const embed = CustomEmbedBuilder.moderation(
        'Expulsion',
        interaction.user,
        targetUser,
        reason,
        caseId
      );

      await interaction.editReply({ embeds: [embed] });

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
