import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import Models from '../../database/models/index.js';

export default {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure le bot sur ce serveur')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('Affiche la configuration actuelle'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('prefix')
        .setDescription('Change le préfixe du bot')
        .addStringOption(option =>
          option.setName('nouveau_prefix')
            .setDescription('Le nouveau préfixe (1-5 caractères)')
            .setMinLength(1)
            .setMaxLength(5)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('welcome')
        .setDescription('Configure les messages de bienvenue')
        .addBooleanOption(option =>
          option.setName('activer')
            .setDescription('Activer ou désactiver')
            .setRequired(true))
        .addChannelOption(option =>
          option.setName('salon')
            .setDescription('Le salon pour les messages de bienvenue')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false))
        .addStringOption(option =>
          option.setName('message')
            .setDescription('Message personnalisé ({user}, {server}, {memberCount})')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('goodbye')
        .setDescription('Configure les messages d\'au revoir')
        .addBooleanOption(option =>
          option.setName('activer')
            .setDescription('Activer ou désactiver')
            .setRequired(true))
        .addChannelOption(option =>
          option.setName('salon')
            .setDescription('Le salon pour les messages d\'au revoir')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false))
        .addStringOption(option =>
          option.setName('message')
            .setDescription('Message personnalisé ({user}, {server}, {memberCount})')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('modlogs')
        .setDescription('Configure le salon des logs de modération')
        .addChannelOption(option =>
          option.setName('salon')
            .setDescription('Le salon pour les logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('economy')
        .setDescription('Configure le système d\'économie')
        .addBooleanOption(option =>
          option.setName('activer')
            .setDescription('Activer ou désactiver')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('levels')
        .setDescription('Configure le système de niveaux')
        .addBooleanOption(option =>
          option.setName('activer')
            .setDescription('Activer ou désactiver')
            .setRequired(true))
        .addChannelOption(option =>
          option.setName('salon')
            .setDescription('Salon pour les notifications de level up')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  permissions: ['Administrator'],
  guildOnly: true,
  cooldown: 3,

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const subcommand = interaction.options.getSubcommand();

    try {
      const guildConfig = await Models.Guild.getOrCreate(interaction.guildId);

      switch (subcommand) {
        case 'view':
          await showConfig(interaction, guildConfig);
          break;
        case 'prefix':
          await setPrefix(interaction, guildConfig);
          break;
        case 'welcome':
          await setWelcome(interaction, guildConfig);
          break;
        case 'goodbye':
          await setGoodbye(interaction, guildConfig);
          break;
        case 'modlogs':
          await setModLogs(interaction, guildConfig);
          break;
        case 'economy':
          await setEconomy(interaction, guildConfig);
          break;
        case 'levels':
          await setLevels(interaction, guildConfig);
          break;
      }

    } catch (error) {
      throw error;
    }
  },
};

async function showConfig(interaction, config) {
  const embed = CustomEmbedBuilder.create(
    `⚙️ Configuration de ${interaction.guild.name}`,
    'Voici la configuration actuelle du bot sur ce serveur.'
  );

  embed.addFields(
    {
      name: '🔧 Général',
      value: [
        `**Préfixe :** \`${config.prefix}\``,
        `**Langue :** \`${config.language}\``,
      ].join('\n'),
      inline: false,
    },
    {
      name: '👋 Bienvenue/Départ',
      value: [
        `**Bienvenue :** ${config.welcome_enabled ? '✅' : '❌'}`,
        `**Salon bienvenue :** ${config.welcome_channel ? `<#${config.welcome_channel}>` : 'Non défini'}`,
        `**Au revoir :** ${config.goodbye_enabled ? '✅' : '❌'}`,
        `**Salon départ :** ${config.goodbye_channel ? `<#${config.goodbye_channel}>` : 'Non défini'}`,
      ].join('\n'),
      inline: false,
    },
    {
      name: '🔨 Modération',
      value: [
        `**Logs modération :** ${config.mod_log_channel ? `<#${config.mod_log_channel}>` : 'Non défini'}`,
        `**Auto-mod :** ${config.auto_mod_enabled ? '✅' : '❌'}`,
      ].join('\n'),
      inline: false,
    },
    {
      name: '💰 Économie',
      value: [
        `**Activé :** ${config.economy_enabled ? '✅' : '❌'}`,
        `**Monnaie :** ${config.currency_name} ${config.currency_symbol}`,
        `**Daily :** ${config.daily_amount}`,
        `**Work :** ${config.work_min}-${config.work_max}`,
      ].join('\n'),
      inline: true,
    },
    {
      name: '📊 Niveaux',
      value: [
        `**Activé :** ${config.levels_enabled ? '✅' : '❌'}`,
        `**Salon level up :** ${config.level_up_channel ? `<#${config.level_up_channel}>` : 'Non défini'}`,
      ].join('\n'),
      inline: true,
    }
  );

  await interaction.editReply({ embeds: [embed] });
}

async function setPrefix(interaction, config) {
  const newPrefix = interaction.options.getString('nouveau_prefix');

  Models.Guild.setPrefix(interaction.guildId, newPrefix);

  const embed = CustomEmbedBuilder.success(
    'Préfixe modifié',
    `Le nouveau préfixe est maintenant : \`${newPrefix}\``
  );

  await interaction.editReply({ embeds: [embed] });
}

async function setWelcome(interaction, config) {
  const enabled = interaction.options.getBoolean('activer');
  const channel = interaction.options.getChannel('salon');
  const message = interaction.options.getString('message');

  Models.Guild.setWelcome(
    interaction.guildId,
    enabled,
    channel?.id || config.welcome_channel,
    message || config.welcome_message
  );

  const embed = CustomEmbedBuilder.success(
    'Messages de bienvenue configurés',
    `**Statut :** ${enabled ? '✅ Activé' : '❌ Désactivé'}\n${channel ? `**Salon :** ${channel}` : ''}`
  );

  await interaction.editReply({ embeds: [embed] });
}

async function setGoodbye(interaction, config) {
  const enabled = interaction.options.getBoolean('activer');
  const channel = interaction.options.getChannel('salon');
  const message = interaction.options.getString('message');

  Models.Guild.setGoodbye(
    interaction.guildId,
    enabled,
    channel?.id || config.goodbye_channel,
    message || config.goodbye_message
  );

  const embed = CustomEmbedBuilder.success(
    'Messages d\'au revoir configurés',
    `**Statut :** ${enabled ? '✅ Activé' : '❌ Désactivé'}\n${channel ? `**Salon :** ${channel}` : ''}`
  );

  await interaction.editReply({ embeds: [embed] });
}

async function setModLogs(interaction, config) {
  const channel = interaction.options.getChannel('salon');

  Models.Guild.setModLogChannel(interaction.guildId, channel.id);

  const embed = CustomEmbedBuilder.success(
    'Logs de modération configurés',
    `Les logs de modération seront envoyés dans ${channel}`
  );

  await interaction.editReply({ embeds: [embed] });
}

async function setEconomy(interaction, config) {
  const enabled = interaction.options.getBoolean('activer');

  Models.Guild.setModule(interaction.guildId, 'economy', enabled);

  const embed = CustomEmbedBuilder.success(
    'Système d\'économie configuré',
    `Le système d\'économie est maintenant ${enabled ? '✅ activé' : '❌ désactivé'}`
  );

  await interaction.editReply({ embeds: [embed] });
}

async function setLevels(interaction, config) {
  const enabled = interaction.options.getBoolean('activer');
  const channel = interaction.options.getChannel('salon');

  Models.Guild.update(interaction.guildId, {
    levels_enabled: enabled ? 1 : 0,
    level_up_channel: channel?.id || config.level_up_channel,
  });

  const embed = CustomEmbedBuilder.success(
    'Système de niveaux configuré',
    `**Statut :** ${enabled ? '✅ Activé' : '❌ Désactivé'}\n${channel ? `**Salon level up :** ${channel}` : ''}`
  );

  await interaction.editReply({ embeds: [embed] });
}
