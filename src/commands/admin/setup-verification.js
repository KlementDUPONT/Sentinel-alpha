import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup-verification')
    .setDescription('Configure the verification system')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Verification channel')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('Role to give after verification')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  category: 'admin',

  async execute(interaction) {
    try {
      const channel = interaction.options.getChannel('channel');
      const role = interaction.options.getRole('role');

      // Vérifier que le bot peut gérer le rôle
      if (role.position >= interaction.guild.members.me.roles.highest.position) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Error')
          .setDescription('I cannot manage this role as it is higher than my highest role.')
          .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      // Vérifier que le rôle n'est pas @everyone
      if (role.id === interaction.guild.id) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Error')
          .setDescription('You cannot use @everyone as verification role.')
          .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      const db = interaction.client.db;
      
      if (!db) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Error')
          .setDescription('Database is not available.')
          .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      // S'assurer que la guild existe dans la DB
      let guildData = db.getGuild(interaction.guildId);
      if (!guildData) {
        db.createGuild(interaction.guildId, interaction.guild.name);
        guildData = db.getGuild(interaction.guildId);
      }

      // Essayer d'abord avec updateGuildConfig
      try {
        db.updateGuildConfig(interaction.guildId, {
          verification_channel: channel.id,
          verification_role: role.id
        });
      } catch (sqlError) {
        // Si ça échoue, c'est que les colonnes n'existent pas
        // On va les créer manuellement
        if (sqlError.message.includes('WHERE') || sqlError.message.includes('no such column')) {
          try {
            // Accéder à la DB brute si possible
            const rawDb = db.db || db.database || db.connection;
            
            if (rawDb && rawDb.prepare) {
              // Ajouter les colonnes
              try {
                rawDb.prepare('ALTER TABLE guilds ADD COLUMN verification_channel TEXT').run();
              } catch (e) {
                // Colonne existe déjà
              }
              
              try {
                rawDb.prepare('ALTER TABLE guilds ADD COLUMN verification_role TEXT').run();
              } catch (e) {
                // Colonne existe déjà
              }

              // Réessayer l'update
              rawDb.prepare(`
                UPDATE guilds 
                SET verification_channel = ?, verification_role = ? 
                WHERE guild_id = ?
              `).run(channel.id, role.id, interaction.guildId);
            } else {
              throw new Error('Cannot access database to create columns. Please contact the developer.');
            }
          } catch (createError) {
            throw new Error('Failed to create verification columns: ' + createError.message);
          }
        } else {
          throw sqlError;
        }
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Verification System Configured')
        .setDescription('The verification system has been set up successfully!')
        .addFields(
          { name: '📌 Verification Channel', value: `${channel}`, inline: true },
          { name: '🎭 Verification Role', value: `${role}`, inline: true }
        )
        .setFooter({ text: `Configured by ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Error in setup-verification:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('An error occurred while setting up verification.')
        .addFields({ name: 'Error', value: error.message })
        .setTimestamp();
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
};
