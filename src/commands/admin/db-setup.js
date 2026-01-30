import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('db-setup')
    .setDescription('Setup missing database columns (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  category: 'admin',

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const db = interaction.client.db;

      if (!db || !db.db) {
        return interaction.editReply('❌ Database is not available.');
      }

      // Vérifier les colonnes existantes
      const tableInfo = db.db.prepare('PRAGMA table_info(guilds)').all();
      const columnNames = tableInfo.map(col => col.name);

      let changes = [];

      // Ajouter verification_channel si elle n'existe pas
      if (!columnNames.includes('verification_channel')) {
        db.db.prepare('ALTER TABLE guilds ADD COLUMN verification_channel TEXT').run();
        changes.push('✅ Added `verification_channel`');
      } else {
        changes.push('ℹ️ `verification_channel` already exists');
      }

      // Ajouter verification_role si elle n'existe pas
      if (!columnNames.includes('verification_role')) {
        db.db.prepare('ALTER TABLE guilds ADD COLUMN verification_role TEXT').run();
        changes.push('✅ Added `verification_role`');
      } else {
        changes.push('ℹ️ `verification_role` already exists');
      }

      await interaction.editReply({
        content: '**Database Setup Complete**\n\n' + changes.join('\n')
      });

    } catch (error) {
      console.error('Error in db-setup:', error);
      
      if (interaction.deferred) {
        await interaction.editReply('❌ An error occurred during database setup.');
      }
    }
  }
};
