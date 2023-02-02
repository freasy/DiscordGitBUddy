import { isMessageInstance } from '@sapphire/discord.js-utilities';
import { ChatInputCommand, Command } from '@sapphire/framework';
import { PermissionFlagsBits, ButtonBuilder, ButtonStyle } from 'discord.js';
import { ActionRowBuilder } from '@discordjs/builders';

export class GitSetupCommand extends Command {
    
    public constructor(context: Command.Context, options: Command.Options) {
        
        super(context, {
            ...options,
            name: 'gb_setup',
            description: 'Setups the gitbuddy bot'
        });
    }

    public override registerApplicationCommands(registry: ChatInputCommand.Registry) {
        registry.registerChatInputCommand((builder) =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        );
    }

    public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const msg = await interaction.reply({ content: `Setup is loading ...`, ephemeral: true, fetchReply: true });
    
        if (isMessageInstance(msg)) {
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
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

            return interaction.editReply({
                content: 'Setup',
                components: [row]
            });
        }
    
        return interaction.editReply('Failed to retrieve ping :(');
    }
}