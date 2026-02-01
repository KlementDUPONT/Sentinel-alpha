import { Events, InteractionType } from 'discord.js';
import logger from '../../utils/logger.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        const { client } = interaction;

        // --- 1. GESTION DES COMMANDES SLASH ---
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                logger.warn(`Commande inconnue tentative: ${interaction.commandName}`);
                return;
            }

            try {
                logger.info(`Commande exécutée: /${interaction.commandName} par ${interaction.user.tag}`);
                await command.execute(interaction);
            } catch (error) {
                logger.error(`Erreur lors de l'exécution de /${interaction.commandName}:`, error);
                
                const errorMessage = { content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.', ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }

        // --- 2. GESTION DES BOUTONS (Vérification) ---
        else if (interaction.isButton()) {
            // Logique pour le bouton "verify_user" défini dans setup-verification
            if (interaction.customId === 'verify_user') {
                try {
                    // Récupération des données du serveur dans la DB
                    const guildData = client.db.getGuild(interaction.guild.id);

                    if (!guildData || !guildData.verification_role) {
                        return interaction.reply({ 
                            content: "❌ Le système de vérification n'est pas configuré sur ce serveur.", 
                            ephemeral: true 
                        });
                    }

                    const role = interaction.guild.roles.cache.get(guildData.verification_role);

                    if (!role) {
                        return interaction.reply({ 
                            content: "❌ Le rôle de vérification est introuvable ou a été supprimé.", 
                            ephemeral: true 
                        });
                    }

                    // Vérification si l'utilisateur a déjà le rôle
                    if (interaction.member.roles.cache.has(role.id)) {
                        return interaction.reply({ 
                            content: "✅ Vous êtes déjà vérifié sur ce serveur.", 
                            ephemeral: true 
                        });
                    }

                    // Attribution du rôle
                    await interaction.member.roles.add(role);
                    
                    logger.info(`Vérification réussie: ${interaction.user.tag} sur ${interaction.guild.name}`);
                    
                    await interaction.reply({ 
                        content: `✅ Vérification réussie ! Vous avez maintenant le rôle **${role.name}**.`, 
                        ephemeral: true 
                    });

                } catch (error) {
                    logger.error(`Erreur bouton vérification [${interaction.guild.id}]:`, error);
                    await interaction.reply({ 
                        content: "❌ Je n'ai pas pu vous donner le rôle. Vérifiez que mon rôle est placé **au-dessus** du rôle à donner dans les paramètres du serveur.", 
                        ephemeral: true 
                    });
                }
            }
        }
    },
};