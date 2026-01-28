import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

/**
 * Système de pagination pour les embeds
 */
class Pagination {
  /**
   * Crée des boutons de pagination
   */
  static createButtons(currentPage, totalPages, disabled = false) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('pagination_first')
        .setEmoji('⏮️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled || currentPage === 1),
      
      new ButtonBuilder()
        .setCustomId('pagination_previous')
        .setEmoji('◀️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled || currentPage === 1),
      
      new ButtonBuilder()
        .setCustomId('pagination_page')
        .setLabel(`${currentPage}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      
      new ButtonBuilder()
        .setCustomId('pagination_next')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled || currentPage === totalPages),
      
      new ButtonBuilder()
        .setCustomId('pagination_last')
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled || currentPage === totalPages)
    );

    return row;
  }

  /**
   * Pagine un tableau d'éléments
   */
  static paginate(items, page, itemsPerPage = 10) {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = items.slice(start, end);

    return {
      items: pageItems,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
      total: items.length,
    };
  }

  /**
   * Collecteur d'interactions pour la pagination
   */
  static async createCollector(message, authorId, timeout = 120000) {
    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === authorId && i.customId.startsWith('pagination_'),
      time: timeout,
    });

    return collector;
  }

  /**
   * Gère automatiquement la pagination
   */
  static async handlePagination(interaction, embeds, timeout = 120000) {
    if (embeds.length === 0) {
      return interaction.reply({ content: 'Aucune donnée à afficher.', ephemeral: true });
    }

    let currentPage = 0;
    const totalPages = embeds.length;

    const getRow = (page) => this.createButtons(page + 1, totalPages);

    const message = await interaction.reply({
      embeds: [embeds[currentPage]],
      components: totalPages > 1 ? [getRow(currentPage)] : [],
      fetchReply: true,
    });

    if (totalPages === 1) return;

    const collector = await this.createCollector(message, interaction.user.id, timeout);

    collector.on('collect', async (i) => {
      if (i.customId === 'pagination_first') {
        currentPage = 0;
      } else if (i.customId === 'pagination_previous') {
        currentPage = Math.max(0, currentPage - 1);
      } else if (i.customId === 'pagination_next') {
        currentPage = Math.min(totalPages - 1, currentPage + 1);
      } else if (i.customId === 'pagination_last') {
        currentPage = totalPages - 1;
      }

      await i.update({
        embeds: [embeds[currentPage]],
        components: [getRow(currentPage)],
      });
    });

    collector.on('end', async () => {
      try {
        await message.edit({
          components: [this.createButtons(currentPage + 1, totalPages, true)],
        });
      } catch (error) {
        // Message supprimé ou erreur
      }
    });
  }

  /**
   * Crée des pages d'embed à partir d'un tableau
   */
  static createPages(items, itemsPerPage, embedBuilder) {
    const pages = [];
    const totalPages = Math.ceil(items.length / itemsPerPage);

    for (let i = 0; i < totalPages; i++) {
      const start = i * itemsPerPage;
      const end = start + itemsPerPage;
      const pageItems = items.slice(start, end);
      
      const embed = embedBuilder(pageItems, i + 1, totalPages);
      pages.push(embed);
    }

    return pages;
  }
}

export default Pagination;
