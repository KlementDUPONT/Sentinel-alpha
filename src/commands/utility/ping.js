import { SlashCommandBuilder } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import config from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Vérifie la latence du bot'),

  cooldown: 5,

  async execute(interaction) {
    const sent = await interaction.reply({
      content: '🏓 Calcul de la latence...',
      fetchReply: true,
      ephemeral: true,
    });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);
    const uptime = formatUptime(interaction.client.uptime);

    // Déterminer la qualité de la latence
    let latencyQuality = '🟢 Excellent';
    if (latency > 200 || apiLatency > 200) {
      latencyQuality = '🟡 Moyen';
    }
    if (latency > 500 || apiLatency > 500) {
      latencyQuality = '🔴 Mauvais';
    }

    const embed = CustomEmbedBuilder.create(
      '🏓 Pong!',
      `**Qualité :** ${latencyQuality}`,
      {
        fields: [
          { name: '📡 Latence Bot', value: `\`${latency}ms\``, inline: true },
          { name: '💓 Latence API', value: `\`${apiLatency}ms\``, inline: true },
          { name: '⏱️ Uptime', value: `\`${uptime}\``, inline: true },
        ],
        footer: `${config.bot.name} ${config.bot.version}`,
      }
    );

    await interaction.editReply({
      content: null,
      embeds: [embed],
    });
  },
};

function formatUptime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days}j`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(' ') || '0s';
}
