import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';
import logger from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('🔧 Configuration automatique du serveur')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  category: 'admin',
  cooldown: 10,
  userPermissions: [PermissionFlagsBits.Administrator],
  botPermissions: [
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ManageRoles,
  ],

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 }); // EPHEMERAL

    try {
      const { guild } = interaction;
      const db = interaction.client.db;

      // Create or get guild in database
      let guildData = db.getGuild(guild.id);
      if (!guildData) {
        db.createGuild(guild.id, guild.name);
        guildData = db.getGuild(guild.id);
      }

      const setupEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('⚙️ Configuration automatique')
        .setDescription('Configuration du bot en cours...')
        .setTimestamp();

      await interaction.editReply({ embeds: [setupEmbed] });

      // Create roles
      logger.info('Creating roles...');
      let muteRole = guild.roles.cache.find(r => r.name === 'Muted');
      
      if (!muteRole) {
        muteRole = await guild.roles.create({
          name: 'Muted',
          color: '#818386',
          permissions: [],
          reason: 'Setup automatique - Rôle de mute',
        });

        // Update permissions for all channels
        for (const channel of guild.channels.cache.values()) {
          try {
            await channel.permissionOverwrites.create(muteRole, {
              SendMessages: false,
              AddReactions: false,
              Speak: false,
            });
          } catch (error) {
            logger.error(`Failed to update permissions for ${channel.name}:`, error);
          }
        }
      }

      // Create log channel
      logger.info('Creating log channel...');
      let logChannel = guild.channels.cache.find(c => c.name === 'sentinel-logs');
      
      if (!logChannel) {
        logChannel = await guild.channels.create({
          name: 'sentinel-logs',
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: interaction.client.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks,
              ],
            },
          ],
          reason: 'Setup automatique - Logs du bot',
        });
      }

      // Create welcome channel
      logger.info('Creating welcome channel...');
      let welcomeChannel = guild.channels.cache.find(c => c.name === 'bienvenue');
      
      if (!welcomeChannel) {
        welcomeChannel = await guild.channels.create({
          name: 'bienvenue',
          type: ChannelType.GuildText,
          reason: 'Setup automatique - Messages de bienvenue',
        });
      }

      // Update guild config in database
      db.updateGuildConfig(guild.id, {
        muteRole: muteRole.id,
        logChannel: logChannel.id,
        welcomeChannel: welcomeChannel.id,
      });

      // Send success embed
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Configuration terminée !')
        .setDescription('Le bot a été configuré avec succès.')
        .addFields(
          { name: '🔇 Rôle Muted', value: `${muteRole}`, inline: true },
          { name: '📋 Salon de logs', value: `${logChannel}`, inline: true },
          { name: '👋 Salon de bienvenue', value: `${welcomeChannel}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `Configuré par ${interaction.user.tag}` });

      await interaction.editReply({ embeds: [successEmbed] });

      // Send log message
      const logEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('⚙️ Configuration du serveur')
        .setDescription(`Configuration effectuée par ${interaction.user}`)
        .addFields(
          { name: 'Rôle Muted', value: `${muteRole}` },
          { name: 'Salon de logs', value: `${logChannel}` },
          { name: 'Salon de bienvenue', value: `${welcomeChannel}` }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });

      logger.info(`✅ Setup completed for ${guild.name} by ${interaction.user.tag}`);

    } catch (error) {
      logger.error('Error executing command setup:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erreur')
        .setDescription('Une erreur est survenue lors de la configuration.')
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
