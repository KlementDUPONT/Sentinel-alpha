import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import Models from '../../database/models/index.js';
import Pagination from '../../utils/pagination.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Affiche les avertissements d\'un utilisateur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à vérifier')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  permissions: ['ModerateMembers'],
  guildOnly: true,
  cooldown: 3,

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser('utilisateur');

    try {
      const warns = Models.Warn.getUserWarns(targetUser.id, interaction.guildId, true);

      if (warns.length === 0) {
        return interaction.editReply({
          embeds: [CustomEmbedBuilder.info(
            'Avertissements',
            `${targetUser.tag} n'a aucun avertissement actif.`
          )]
        });
      }

      // Créer les pages
      const itemsPerPage = 5;
      const pages = Pagination.createPages(warns, itemsPerPage, (pageWarns, page, totalPages) => {
        const embed = CustomEmbedBuilder.create(
          `⚠️ Avertissements de ${targetUser.tag}`,
          `Total : ${warns.length} avertissement(s)`,
          { thumbnail: targetUser.displayAvatarURL({ dynamic: true }) }
        );

        pageWarns.forEach((warn, index) => {
          const globalIndex = (page - 1) * itemsPerPage + index + 1;
          const date = new Date(warn.created_at);
          
          embed.addFields({
            name: `${globalIndex}. Avertissement #${warn.warn_id.slice(0, 8)}`,
            value: [
              `**Raison :** ${warn.reason}`,
              `**Modérateur :** <@${warn.moderator_id}>`,
              `**Date :** <t:${Math.floor(date.getTime() / 1000)}:R>`
            ].join('\n'),
            inline: false
          });
        });

        embed.setFooter({ text: `Page ${page}/${totalPages}` });
        return embed;
      });

      // Envoyer avec pagination
      await Pagination.handlePagination(interaction, pages);

    } catch (error) {
      throw error;
    }
  },
};
