// src/commands/admin/setup-verification.js
import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('setup-verification')
    .setDescription('Configure le système de vérification')
    .addChannelOption(option => option.setName('channel').setDescription('Salon de vérification').setRequired(true))
    .addRoleOption(option => option.setName('role').setDescription('Rôle à donner').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const role = interaction.options.getRole('role');

    // Sauvegarde en DB
    interaction.client.db.updateVerification(interaction.guild.id, channel.id, role.id);

    const embed = new EmbedBuilder()
        .setTitle('Vérification Requise')
        .setDescription('Cliquez sur le bouton ci-dessous pour accéder au serveur.')
        .setColor('#3b82f6');

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('verify_user')
            .setLabel('Se vérifier')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅')
    );

    await channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Système configuré dans ${channel}`, ephemeral: true });
}