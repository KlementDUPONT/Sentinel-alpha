import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import PermissionManager from '../../config/permissions.js';
import Models from '../../database/models/index.js';
import { RESPONSE_MESSAGES, MODERATION_ACTIONS } from '../../config/constants.js';
import Validator from '../../utils/validator.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannit un utilisateur du serveur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à bannir')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('La raison du bannissement')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('delete_days')
        .setDescription('Nombre de jours de messages à supprimer (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  permissions: ['BanMembers'],
  botPermissions: ['BanMembers'],
  guildOnly: true,
  cooldown: 5,

  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('utilisateur');
    const reason = Validator.validateReason(interaction.options.getString('raison'));
    const deleteDays = interaction.options.getInteger('delete_days') || 0;

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

      // Vérifier si l'utilisateur est sur le serveur
      let targetMember;
      try {
        targetMember = await interaction.guild.members.fetch(targetUser.id);
      } catch (error) {
        // L'utilisateur n'est pas sur le serveur, on peut quand même le bannir
      }

      // Si le membre est sur le serveur, vérifier la hiérarchie
      if (targetMember) {
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
      }

      // Vérifier si déjà banni
      try {
        const banInfo = await interaction.guild.bans.fetch(targetUser.id);
        if (banInfo) {
          return interaction.editReply({
            embeds: [CustomEmbedBuilder.error('Erreur', RESPONSE_MESSAGES.ALREADY_BANNED)]
          });
        }
      } catch (error) {
        // L'utilisateur n'est pas banni, on continue
      }

      // Bannir l'utilisateur
      await interaction.guild.members.ban(targetUser.id, {
        deleteMessageSeconds: deleteDays * 24 * 60 * 60,
        reason: `${interaction.user.tag}: ${reason}`
      });

      // Enregistrer dans la base de données
      const { caseId } = Models.ModLog.create(
        interaction.guildId,
        MODERATION_ACTIONS.BAN,
        targetUser.id,
        interaction.user.id,
        reason
      );

      // Embed de confirmation
      const embed = CustomEmbedBuilder.moderation(
        'Bannissement',
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
