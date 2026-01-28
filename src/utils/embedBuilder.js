import { EmbedBuilder } from 'discord.js';
import config from '../config/config.js';

/**
 * Constructeur d'embeds personnalisés
 */
class CustomEmbedBuilder {
  /**
   * Crée un embed basique avec couleur aléatoire pastel
   */
  static create(title, description, options = {}) {
    const embed = new EmbedBuilder()
      .setColor(options.color || config.getRandomColor())
      .setTimestamp();

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (options.footer) embed.setFooter({ text: options.footer });
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.author) embed.setAuthor(options.author);
    if (options.fields) embed.addFields(options.fields);
    if (options.url) embed.setURL(options.url);

    return embed;
  }

  /**
   * Embed de succès
   */
  static success(title, description) {
    return new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle(`✅ ${title}`)
      .setDescription(description)
      .setFooter({ text: config.bot.name })
      .setTimestamp();
  }

  /**
   * Embed d'erreur
   */
  static error(title, description) {
    return new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle(`❌ ${title}`)
      .setDescription(description)
      .setFooter({ text: config.bot.name })
      .setTimestamp();
  }

  /**
   * Embed d'avertissement
   */
  static warning(title, description) {
    return new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle(`⚠️ ${title}`)
      .setDescription(description)
      .setFooter({ text: config.bot.name })
      .setTimestamp();
  }

  /**
   * Embed d'information
   */
  static info(title, description) {
    return new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle(`ℹ️ ${title}`)
      .setDescription(description)
      .setFooter({ text: config.bot.name })
      .setTimestamp();
  }

  /**
   * Embed de modération
   */
  static moderation(action, moderator, target, reason, caseId = null) {
    const embed = new EmbedBuilder()
      .setColor(config.getRandomColor())
      .setTitle(`🔨 ${action}`)
      .addFields(
        { name: '👤 Utilisateur', value: `${target.tag}\n\`${target.id}\``, inline: true },
        { name: '👮 Modérateur', value: `${moderator.tag}\n\`${moderator.id}\``, inline: true },
        { name: '📝 Raison', value: reason || 'Aucune raison fournie', inline: false }
      )
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: caseId ? `Case #${caseId}` : config.bot.name })
      .setTimestamp();

    return embed;
  }

  /**
   * Embed pour les logs
   */
  static log(emoji, title, description, fields = []) {
    const embed = new EmbedBuilder()
      .setColor(config.getRandomColor())
      .setTitle(`${emoji} ${title}`)
      .setDescription(description)
      .setFooter({ text: config.bot.name })
      .setTimestamp();

    if (fields.length > 0) {
      embed.addFields(fields);
    }

    return embed;
  }

  /**
   * Embed de profil utilisateur
   */
  static userProfile(user, userData) {
    return new EmbedBuilder()
      .setColor(config.getRandomColor())
      .setTitle(`📊 Profil de ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '💰 Argent', value: `${userData.balance || 0} ${userData.currencySymbol || '💰'}`, inline: true },
        { name: '🏦 Banque', value: `${userData.bank || 0} ${userData.currencySymbol || '💰'}`, inline: true },
        { name: '📊 Niveau', value: `${userData.level || 0}`, inline: true },
        { name: '⭐ XP', value: `${userData.xp || 0}`, inline: true },
        { name: '💬 Messages', value: `${userData.messages_count || 0}`, inline: true },
        { name: '📝 Commandes', value: `${userData.commands_used || 0}`, inline: true }
      )
      .setFooter({ text: `ID: ${user.id}` })
      .setTimestamp();
  }

  /**
   * Embed de leaderboard
   */
  static leaderboard(title, entries, type = 'xp') {
    const embed = new EmbedBuilder()
      .setColor(config.getRandomColor())
      .setTitle(`🏆 ${title}`)
      .setFooter({ text: config.bot.name })
      .setTimestamp();

    const medals = ['🥇', '🥈', '🥉'];
    
    const description = entries.map((entry, index) => {
      const medal = medals[index] || `**${index + 1}.**`;
      const value = type === 'xp' 
        ? `${entry.xp} XP (Niveau ${entry.level})`
        : `${entry.total} 💰`;
      
      return `${medal} <@${entry.user_id}> - ${value}`;
    }).join('\n');

    embed.setDescription(description || 'Aucune donnée disponible');

    return embed;
  }

  /**
   * Embed de ticket
   */
  static ticket(ticket, user) {
    return new EmbedBuilder()
      .setColor(config.getRandomColor())
      .setTitle(`🎫 Ticket #${ticket.ticket_id.slice(0, 8)}`)
      .setDescription(`Ticket créé par <@${user.id}>`)
      .addFields(
        { name: '📂 Catégorie', value: ticket.category || 'support', inline: true },
        { name: '📅 Créé le', value: `<t:${Math.floor(new Date(ticket.created_at).getTime() / 1000)}:F>`, inline: true },
        { name: '📝 Statut', value: ticket.status === 'open' ? '🟢 Ouvert' : '🔴 Fermé', inline: true }
      )
      .setFooter({ text: config.bot.name })
      .setTimestamp();
  }

  /**
   * Embed d'économie
   */
  static economy(title, user, balance, bank, currencySymbol = '💰') {
    const total = balance + bank;
    
    return new EmbedBuilder()
      .setColor(config.getRandomColor())
      .setTitle(`💰 ${title}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '💵 Portefeuille', value: `${balance} ${currencySymbol}`, inline: true },
        { name: '🏦 Banque', value: `${bank} ${currencySymbol}`, inline: true },
        { name: '💎 Total', value: `${total} ${currencySymbol}`, inline: true }
      )
      .setFooter({ text: `${user.tag}` })
      .setTimestamp();
  }

  /**
   * Embed de pagination
   */
  static pagination(title, page, totalPages, items, itemFormatter) {
    const embed = new EmbedBuilder()
      .setColor(config.getRandomColor())
      .setTitle(title)
      .setDescription(items.map(itemFormatter).join('\n\n'))
      .setFooter({ text: `Page ${page}/${totalPages} • ${config.bot.name}` })
      .setTimestamp();

    return embed;
  }
}

export default CustomEmbedBuilder;
