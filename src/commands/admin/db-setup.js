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

      if (!db) {
        return interaction.editReply('❌ Database handler is not available.');
      }

      // Tester différentes façons d'accéder à la DB
      let database = db.db || db.database || db.connection || db;

      if (!database) {
        return interaction.editReply('❌ Database connection is not available. Please contact an administrator.');
      }

      // Vérifier les colonnes existantes
      let tableInfo;
      try {
        tableInfo = database.prepare('PRAGMA table_info(guilds)').all();
      } catch (error) {
        console.error('Error accessing database:', error);
        return interaction.editReply('❌ Cannot access database. Error: ' + error.message);
      }

      const columnNames = tableInfo.map(col => col.name);

      let changes = [];

      // Ajouter verification_channel si elle n'existe pas
      if (!columnNames.includes('verification_channel')) {
        try {
          database.prepare('ALTER TABLE guilds ADD COLUMN verification_channel TEXT').run();
          changes.push('✅ Added `verification_channel`');
        } catch (error) {
          changes.push('❌ Failed to add `verification_channel`: ' + error.message);
        }
      } else {
        changes.push('ℹ️ `verification_channel` already exists');
      }

      // Ajouter verification_role si elle n'existe pas
      if (!columnNames.includes('verification_role')) {
        try {
          database.prepare('ALTER TABLE guilds ADD COLUMN verification_role TEXT').run();
          changes.push('✅ Added `verification_role`');
        } catch (error) {
          changes.push('❌ Failed to add `verification_role`: ' + error.message);
        }
      } else {
        changes.push('ℹ️ `verification_role` already exists');
      }

      await interaction.editReply({
        content: '**🔧 Database Setup Complete**\n\n' + changes.join('\n') + '\n\n**Next step:** Use `/setup-verification` to configure the system.'
      });

    } catch (error) {
      console.error('Error in db-setup:', error);
      
      if (interaction.deferred) {
        await interaction.editReply('❌ An error occurred during database setup: ' + error.message);
      }
    }
  }
};
