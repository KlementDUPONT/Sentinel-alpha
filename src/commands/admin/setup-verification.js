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
      await interaction.deferReply({ ephemeral: true });

      const channel = interaction.options.getChannel('channel');
      const role = interaction.options.getRole('role');

      // Vérifier que le bot peut gérer le rôle
      if (role.position >= interaction.guild.members.me.roles.highest.position) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Error')
          .setDescription('I cannot manage this role as it is higher than my highest role.')
          .setTimestamp();
        
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      // Vérifier que le rôle n'est pas @everyone
      if (role.id === interaction.guild.id) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Error')
          .setDescription('You cannot use @everyone as verification role.')
          .setTimestamp();
        
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      const db = interaction.client.db;
      
      if (!db) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Error')
          .setDescription('Database is not available.')
          .setTimestamp();
        
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      // S'assurer que la guild existe dans la DB
      let guildData = db.getGuild(interaction.guildId);
      if (!guildData) {
        db.createGuild(interaction.guildId, interaction.guild.name);
      }

      // Mettre à jour la configuration via DatabaseHandler
      const success = db.updateVerification(interaction.guildId, channel.id, role.id);

      if (!success) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Error')
          .setDescription('Failed to update verification settings.\n\n**Try running `/db-setup` first**, then retry this command.')
          .setTimestamp();
        
        return interaction.editReply({ embeds: [errorEmbed] });
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

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in setup-verification:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('An error occurred while setting up verification.')
        .addFields({ name: 'Error Details', value: error.message || 'Unknown error' })
        .setTimestamp();
      
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      }
    }
  }
};
