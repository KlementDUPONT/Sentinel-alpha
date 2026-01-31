import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('⚙️ Advanced configuration panel for Sentinel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    category: 'admin',
    guildOnly: true,

    async execute(interaction) {
        const { guild, client } = interaction;
        const db = client.db;
        const guildData = db.getGuild(guild.id);

        const embed = new EmbedBuilder()
            .setTitle(`Sentinel Management Panel — ${guild.name}`)
            .setDescription('Select a category below to configure the bot settings in real-time.')
            .setColor('#5865F2')
            .addFields(
                { name: '📊 Status', value: `XP: ${guildData.level_system_enabled ? '✅' : '❌'}\nEconomy: ${guildData.economy_enabled ? '✅' : '❌'}`, inline: true },
                { name: '🔔 Channels', value: `Logs: ${guildData.log_channel ? `<#${guildData.log_channel}>` : '❌'}\nWelcome: ${guildData.welcome_channel ? `<#${guildData.welcome_channel}>` : '❌'}`, inline: true }
            )
            .setFooter({ text: 'Hosted on Render.com', iconURL: client.user.displayAvatarURL() });

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('panel_category')
                .setPlaceholder('Choose a category to edit')
                .addOptions([
                    { label: 'Toggle Modules', description: 'Enable/Disable XP or Economy', value: 'panel_toggle', emoji: '🔌' },
                    { label: 'Channel Setup', description: 'Configure Logs and Welcome channels', value: 'panel_channels', emoji: '📍' },
                    { label: 'Bot Info', description: 'View system and hosting stats', value: 'panel_info', emoji: 'ℹ️' }
                ])
        );

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('panel_refresh')
                .setLabel('Refresh')
                .setEmoji('🔄')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setLabel('Render Dashboard')
                .setURL('https://dashboard.render.com/')
                .setStyle(ButtonStyle.Link)
        );

        await interaction.reply({ embeds: [embed], components: [menu, buttons], flags: 64 });
    }
};