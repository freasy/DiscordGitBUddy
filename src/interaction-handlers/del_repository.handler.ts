import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework';
import type { StringSelectMenuInteraction } from 'discord.js';

import db from '../database';
import { Repository } from '../database/entities/repository.entity';

export class DelRepositoryModalHandler extends InteractionHandler {
  public constructor(ctx: PieceContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.SelectMenu
    });
  }

  public override async parse(interaction: StringSelectMenuInteraction) {
    if (interaction.customId !== 'remove-repository-setup-menu') return this.none();

    await interaction.deferUpdate();

    return this.some();
  }

  public override async run(interaction: StringSelectMenuInteraction) {
    const id = interaction.values[0];

    const find = await db.manager.findOneBy(Repository, { id: parseInt(id) });

    if (find) {
        db.manager.remove(find);

        return await interaction.editReply({
            content: `Repository '${find.name}' removed!`,
            components: []
        });
    }

    await interaction.editReply({
      content: `Repository '${id}' unknown!`,
    });
  }
}