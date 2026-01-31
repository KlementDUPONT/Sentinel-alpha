import { InteractionType, ComponentType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import logger from '../../utils/logger.js';

export default {
    name: 'interactionCreate',
    category: 'client',

    async execute(interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                await handleSlashCommand(interaction);
            } else if (interaction.isStringSelectMenu()) {
                await handleSelectMenu(interaction);
            } else if (interaction.isButton()) {
                await handleButton(interaction);
            } else if (interaction.isModalSubmit()) {
                await handleModal(interaction);
            }
        } catch (error) {
            logger.error('❌ Interaction Error:', error);
            const errorPayload = { content: '⚠️ An error occurred while processing this interaction.', flags: 64 };

            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(errorPayload);
            } else {
                await interaction.reply(errorPayload);
            }
        }
    }
};

/**
 * Handle Slash Commands (/)
 */
async function handleSlashCommand(interaction) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    // Cooldown management
    const { cooldowns } = interaction.client;
    if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Map());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return interaction.reply({
                content: `⏱️ Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.data.name}\` command.`,
                flags: 64
            });
        }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    try {
        await command.execute(interaction);
        logger.info(`Command executed: /${interaction.commandName} by ${interaction.user.tag}`);
    } catch (error) {
        throw error;
    }
}

/**
 * Handle Select Menus
 */
async function handleSelectMenu(interaction) {
    const { customId, values, guild, client } = interaction;
    const db = client.db;

    if (customId === 'panel_category') {
        const choice = values[0];
        const guildData = db.getGuild(guild.id);

        if (choice === 'panel_toggle') {
            const currentXP = guildData.level_system_enabled ?? 1;
            const newXPState = currentXP === 1 ? 0 : 1;

            db.updateGuildConfig(guild.id, { level_system_enabled: newXPState });

            await interaction.update({
                content: `✅ Level system is now **${newXPState ? 'ENABLED' : 'DISABLED'}**.`,
                embeds: [], components: []
            });
        }

        if (choice === 'panel_info') {
            const infoEmbed = new EmbedBuilder()
                .setTitle('🚀 System Information')
                .setColor('#00FF00')
                .addFields(
                    { name: 'Hosting', value: 'Render.com (Frankfurt)', inline: true },
                    { name: 'Node.js', value: process.version, inline: true },
                    { name: 'Uptime', value: `${Math.floor(process.uptime() / 3600)}h`, inline: true }
                )
                .setTimestamp();

            await interaction.update({ embeds: [infoEmbed], components: [] });
        }
    }
}

/**
 * Handle Buttons
 */
async function handleButton(interaction) {
    const { customId, guild, client } = interaction;

    if (customId === 'panel_refresh') {
        const command = client.commands.get('panel');
        if (command) await command.execute(interaction);
    }

    // Ajout de la logique existante pour les warnings ou les tickets ici si nécessaire
}

/**
 * Handle Modals
 */
async function handleModal(interaction) {
    // Logique pour les futurs formulaires (ex: report, suggestion)
    await interaction.reply({ content: 'Modal received!', flags: 64 });
}