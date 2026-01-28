import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import CustomEmbedBuilder from '../../utils/embedBuilder.js';
import config from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('[DEV] Recharge une commande ou un événement')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type à recharger')
        .addChoices(
          { name: 'Commande', value: 'command' },
          { name: 'Événement', value: 'event' },
          { name: 'Tout', value: 'all' }
        )
        .setRequired(true))
    .addStringOption(option =>
      option.setName('nom')
        .setDescription('Nom de la commande ou de l\'événement')
        .setRequired(false)
        .setAutocomplete(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  permissions: ['Administrator'],
  cooldown: 5,

  async execute(interaction) {
    // Vérifier si l'utilisateur est développeur
    if (!config.bot.developers.includes(interaction.user.id)) {
      return interaction.reply({
        embeds: [CustomEmbedBuilder.error(
          'Accès refusé',
          'Cette commande est réservée aux développeurs.'
        )],
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const type = interaction.options.getString('type');
    const name = interaction.options.getString('nom');

    try {
      if (type === 'command') {
        if (!name) {
          return interaction.editReply({
            embeds: [CustomEmbedBuilder.error(
              'Erreur',
              'Veuillez spécifier le nom de la commande à recharger.'
            )],
          });
        }

        await interaction.client.commandHandler.reloadCommand(name);

        return interaction.editReply({
          embeds: [CustomEmbedBuilder.success(
            'Commande rechargée',
            `La commande \`${name}\` a été rechargée avec succès.`
          )],
        });

      } else if (type === 'event') {
        if (!name) {
          return interaction.editReply({
            embeds: [CustomEmbedBuilder.error(
              'Erreur',
              'Veuillez spécifier le nom de l\'événement à recharger.'
            )],
          });
        }

        await interaction.client.eventHandler.reloadEvent(name);

        return interaction.editReply({
          embeds: [CustomEmbedBuilder.success(
            'Événement rechargé',
            `L'événement \`${name}\` a été rechargé avec succès.`
          )],
        });

      } else if (type === 'all') {
        await interaction.client.commandHandler.loadCommands();
        await interaction.client.eventHandler.reloadAll();

        return interaction.editReply({
          embeds: [CustomEmbedBuilder.success(
            'Rechargement complet',
            'Toutes les commandes et événements ont été rechargés avec succès.'
          )],
        });
      }

    } catch (error) {
      return interaction.editReply({
        embeds: [CustomEmbedBuilder.error(
          'Erreur de rechargement',
          `\`\`\`js\n${error.message}\n\`\`\``
        )],
      });
    }
  },

  async autocomplete(interaction) {
    const type = interaction.options.getString('type');
    const focusedValue = interaction.options.getFocused().toLowerCase();

    if (type === 'command') {
      const commands = interaction.client.commands
        .filter(cmd => cmd.data.name.toLowerCase().includes(focusedValue))
        .map(cmd => ({ name: cmd.data.name, value: cmd.data.name }))
        .slice(0, 25);

      await interaction.respond(commands);

    } else if (type === 'event') {
      const events = interaction.client.eventHandler.getLoadedEvents()
        .filter(evt => evt.name.toLowerCase().includes(focusedValue))
        .map(evt => ({ name: evt.name, value: evt.name }))
        .slice(0, 25);

      await interaction.respond(events);
    }
  },
};
