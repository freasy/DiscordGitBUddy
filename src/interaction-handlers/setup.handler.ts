import { Repository } from './../database/entities/repository.entity';
import { ActionRowBuilder, ButtonBuilder, TextInputBuilder } from '@discordjs/builders';
import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework';
import type { ButtonInteraction } from 'discord.js';
import { ButtonStyle, TextInputStyle, EmbedBuilder, ModalBuilder, StringSelectMenuBuilder } from 'discord.js';

import db from '../database';

export class SetupButtonHandler extends InteractionHandler {
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button
    });
  }

  public override async parse(interaction: ButtonInteraction) {
    if (!interaction.customId?.endsWith('setup-button')) return this.none();

    return this.some();
  }

  public override async run(interaction: ButtonInteraction) {
    const components = [];
    let buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('back-setup-button')
            .setLabel('Back')
            .setStyle(ButtonStyle.Secondary)
    );

    const embeds = [];

    let repositories: Repository[] = null;

    switch (interaction.customId) {
        case 'list-setup-button':
            await interaction.deferUpdate();

            repositories = await db.manager.find(Repository);

            embeds.push(new EmbedBuilder()
                .setDescription(repositories.length === 0 ? 'empty' : repositories.map(r => `${r.name} (${r.url})`).join('\n'))
            );
            break;
        case 'back-setup-button':
            await interaction.deferUpdate();
            
            buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('list-setup-button')
                    .setLabel('List')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('add-setup-button')
                    .setLabel('Add')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('remove-setup-button')
                    .setLabel('Del')
                    .setStyle(ButtonStyle.Danger),
            );
            break;
        case 'remove-setup-button':

            repositories = await db.manager.find(Repository);

            await interaction.deferReply({ ephemeral: true });

            return interaction.editReply({
                content: 'Select a repository to remove',
                components: repositories.length === 0 ? [] : [
                    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('remove-repository-setup-menu')
                            .setMinValues(1)
                            .setMaxValues(1)
                            .setOptions(repositories.map(r => ({
                                label: r.name,
                                value: r.id.toString()
                            })))
                    )
                ]
            });
        case 'add-setup-button':
            buttonRow.addComponents(
                new ButtonBuilder()
                    .setCustomId('add-repository-setup-button')
                    .setLabel('Add Repository')
            );

            /*{
                custom_id: 'add-repository-setup-modal',
                components: [
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                        new TextInputBuilder()
                            .setLabel('Repository Url')
                            .setCustomId('repository-url-setup-input')
                            .setPlaceholder('URL')
                            .setRequired(true)
                            .setMinLength(1)
                            .setMaxLength(200)
                            .setStyle(TextInputStyle.Short)
                    )
                ]
            } */

            const modal = new ModalBuilder()
                .setCustomId('add-repository-setup-modal')
                .setTitle('Add Repository')
                .addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                        new TextInputBuilder()
                            .setLabel('Repository Name')
                            .setCustomId('repository-name-setup-input')
                            .setPlaceholder('Name')
                            .setRequired(true)
                            .setMinLength(1)
                            .setMaxLength(100)
                            .setStyle(TextInputStyle.Short),
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                        new TextInputBuilder()
                            .setLabel('Repository Url')
                            .setCustomId('repository-url-setup-input')
                            .setPlaceholder('URL')
                            .setRequired(true)
                            .setMinLength(1)
                            .setMaxLength(200)
                            .setStyle(TextInputStyle.Short)
                    )
                )

            return await interaction.showModal(modal);
        default:
            break;
    }

    components.push(buttonRow);

    await interaction.editReply({
        embeds,
        components
    });
  }
}