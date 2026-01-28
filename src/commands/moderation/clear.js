import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import Models from '../../database/models/index.js';
import { MODERATION_ACTIONS, LIMITS } from '../../config/constants.js';
import Validator from '../../utils/validator.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprime des messages dans le salon')
    .addIntegerOption(option =>
      option.setName('nombre')
        .setDescription('Nombre de messages à supprimer (1-100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true))
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('Ne supprimer que les messages de cet utilisateur')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  permissions: ['ManageMessages'],
  botPermissions: ['ManageMessages'],
  guildOnly: true,
  cooldown: 5,

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const amount = interaction.options.getInteger('nombre');
    const targetUser = interaction.options.getUser('utilisateur');

    try {
      // Récupérer les messages
      const messages = await interaction.channel.messages.fetch({ limit: Math.min(amount + 1, 100) });

      // Filtrer si un utilisateur est spécifié
      let messagesToDelete = messages;
      if (targetUser) {
        messagesToDelete = messages.filter(msg => msg.author.id === targetUser.id);
      }

      // Filtrer les messages trop anciens (>14 jours)
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      messagesToDelete = messagesToDelete.filter(msg => msg.createdTimestamp > twoWeeksAgo);

      if (messagesToDelete.size === 0) {
        return interaction.editReply({
          embeds: [CustomEmbedBuilder.error(
            'Erreur',
            'Aucun message à supprimer. Les messages de plus de 14 jours ne peuvent pas être supprimés en masse.'
          )]
        });
      }

      // Supprimer les messages
      const deleted = await interaction.channel.bulkDelete(messagesToDelete, true);

      // Enregistrer dans la base de données
      const { caseId } = Models.ModLog.create(
        interaction.guildId,
        MODERATION_ACTIONS.CLEAR,
        targetUser?.id || 'all',
        interaction.user.id,
        `${deleted.size} message(s) supprimé(s)${targetUser ? ` de ${targetUser.tag}` : ''}`
      );

      // Embed de confirmation
      const embed = CustomEmbedBuilder.success(
        'Messages supprimés',
        `${deleted.size} message(s) supprimé(s)${targetUser ? ` de ${targetUser.tag}` : ''}.`
      );

      embed.setFooter({ text: `Case #${caseId}` });

      const reply = await interaction.editReply({ embeds: [embed] });

      // Supprimer la réponse après 5 secondes
      setTimeout(() => {
        reply.delete().catch(() => {});
      }, 5000);

    } catch (error) {
      throw error;
    }
  },
};
