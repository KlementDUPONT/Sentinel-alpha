import { REGEX, LIMITS } from '../config/constants.js';

/**
 * Utilitaires de validation
 */
class Validator {
  /**
   * Valide un ID Discord
   */
  static isValidSnowflake(id) {
    return /^\d{17,19}$/.test(id);
  }

  /**
   * Valide une URL
   */
  static isValidURL(string) {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Vérifie si le texte contient des invitations Discord
   */
  static hasDiscordInvite(text) {
    return REGEX.DISCORD_INVITE.test(text);
  }

  /**
   * Vérifie si le texte contient des URLs
   */
  static hasURL(text) {
    return REGEX.URL.test(text);
  }

  /**
   * Valide un montant d'argent
   */
  static isValidAmount(amount) {
    return !isNaN(amount) && amount > 0 && amount <= LIMITS.MAX_BALANCE;
  }

  /**
   * Valide une durée (format: 1d, 2h, 30m, 45s)
   */
  static parseDuration(duration) {
    const regex = /^(\d+)([dhms])$/i;
    const match = duration.match(regex);
    
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    const multipliers = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000,
    };

    return value * multipliers[unit];
  }

  /**
   * Formate une durée en texte lisible
   */
  static formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days}j`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.join(' ') || '0s';
  }

  /**
   * Valide une raison de modération
   */
  static validateReason(reason, maxLength = 512) {
    if (!reason) return 'Aucune raison fournie';
    return reason.length > maxLength 
      ? reason.substring(0, maxLength - 3) + '...'
      : reason;
  }

  /**
   * Nettoie et valide un nom
   */
  static sanitizeName(name, maxLength = 100) {
    if (!name) return null;
    
    // Supprime les caractères spéciaux
    const cleaned = name.replace(/[^\w\s-]/gi, '').trim();
    
    return cleaned.length > maxLength
      ? cleaned.substring(0, maxLength)
      : cleaned;
  }

  /**
   * Valide un prix
   */
  static isValidPrice(price) {
    return !isNaN(price) && price >= 0 && price <= 999999999;
  }

  /**
   * Valide un nombre de gagnants
   */
  static isValidWinnersCount(count) {
    return !isNaN(count) && count > 0 && count <= LIMITS.MAX_GIVEAWAY_WINNERS;
  }

  /**
   * Valide un nombre de messages à supprimer
   */
  static isValidMessageCount(count) {
    return !isNaN(count) && count > 0 && count <= LIMITS.MAX_CLEAR_MESSAGES;
  }

  /**
   * Vérifie si une date est dans le futur
   */
  static isFutureDate(date) {
    return new Date(date) > new Date();
  }

  /**
   * Parse un utilisateur mentionné
   */
  static parseUserMention(mention) {
    const match = mention.match(REGEX.MENTION);
    return match ? match[1] : null;
  }

  /**
   * Parse un rôle mentionné
   */
  static parseRoleMention(mention) {
    const match = mention.match(REGEX.ROLE_MENTION);
    return match ? match[1] : null;
  }

  /**
   * Parse un salon mentionné
   */
  static parseChannelMention(mention) {
    const match = mention.match(REGEX.CHANNEL_MENTION);
    return match ? match[1] : null;
  }

  /**
   * Formate un nombre avec séparateurs
   */
  static formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  /**
   * Tronque un texte
   */
  static truncate(text, maxLength = 100, suffix = '...') {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Échappe les caractères markdown
   */
  static escapeMarkdown(text) {
    return text.replace(/([*_`~|\\])/g, '\\$1');
  }

  /**
   * Valide un préfixe
   */
  static isValidPrefix(prefix) {
    return prefix && prefix.length >= 1 && prefix.length <= 5;
  }

  /**
   * Génère un code aléatoire
   */
  static generateCode(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

export default Validator;
