import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import Models from '../../database/models/index.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configuration automatique complète du bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  permissions: ['Administrator'],
  botPermissions: ['ManageChannels', 'ManageRoles'],
  guildOnly: true,
  cooldown: 60,

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const embed = CustomEmbedBuilder.info(
        '⚙️ Configuration automatique',
        'Configuration du bot en cours...'
      );

      const reply = await interaction.editReply({ embeds: [embed] });

      // Créer/récupérer la catégorie Sentinel
      let category = interaction.guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name === '📊 SENTINEL'
      );

      if (!category) {
        category = await interaction.guild.channels.create({
          name: '📊 SENTINEL',
          type: ChannelType.GuildCategory,
        });
      }

      // Créer le salon de logs de modération
      let modLogChannel = interaction.guild.channels.cache.find(
        c => c.name === 'mod-logs' && c.parentId === category.id
      );

      if (!modLogChannel) {
        modLogChannel = await interaction.guild.channels.create({
          name: '🔨-mod-logs',
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: ['ViewChannel'],
            },
            {
              id: interaction.guild.members.me.id,
              allow: ['ViewChannel', 'SendMessages'],
            },
          ],
        });
      }

      // Créer le salon de bienvenue
      let welcomeChannel = interaction.guild.channels.cache.find(
        c => c.name === 'bienvenue' && c.parentId === category.id
      );

      if (!welcomeChannel) {
        welcomeChannel = await interaction.guild.channels.create({
          name: '👋-bienvenue',
          type: ChannelType.GuildText,
          parent: category.id,
        });
      }

      // Créer le salon de level up
      let levelChannel = interaction.guild.channels.cache.find(
        c => c.name === 'level-up' && c.parentId === category.id
      );

      if (!levelChannel) {
        levelChannel = await interaction.guild.channels.create({
          name: '🎉-level-up',
          type: ChannelType.GuildText,
          parent: category.id,
        });
      }

      // Configurer la base de données
      await Models.Guild.getOrCreate(interaction.guildId);

      Models.Guild.update(interaction.guildId, {
        mod_log_channel: modLogChannel.id,
        welcome_enabled: 1,
        welcome_channel: welcomeChannel.id,
        goodbye_enabled: 1,
        goodbye_channel: welcomeChannel.id,
        levels_enabled: 1,
        level_up_channel: levelChannel.id,
        economy_enabled: 1,
      });

      // Embed de confirmation
      const successEmbed = CustomEmbedBuilder.success(
        '✅ Configuration terminée !',
        'Le bot a été configuré avec succès sur ce serveur.'
      );

      successEmbed.addFields(
        {
          name: '📁 Catégorie créée',
          value: category.toString(),
          inline: false,
        },
        {
          name: '🔨 Logs de modération',
          value: modLogChannel.toString(),
          inline: true,
        },
        {
          name: '👋 Bienvenue/Départ',
          value: welcomeChannel.toString(),
          inline: true,
        },
        {
          name: '🎉 Level Up',
          value: levelChannel.toString(),
          inline: true,
        },
        {
          name: '⚙️ Modules activés',
          value: '✅ Économie\n✅ Niveaux\n✅ Bienvenue',
          inline: false,
        }
      );

      successEmbed.setFooter({ 
        text: 'Utilisez /config view pour voir toute la configuration' 
      });

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      throw error;
    }
  },
};
