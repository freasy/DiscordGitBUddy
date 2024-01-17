import { InteractionHandler, InteractionHandlerTypes, PieceContext } from '@sapphire/framework';
import type { ModalSubmitInteraction } from 'discord.js';

import db from '../database';
import { Repository } from '../database/entities/repository.entity';
import DownloadJobs from '../scheduler';

export class AddRepositoryModalHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.ModalSubmit
    });
  }

  public override parse(interaction: ModalSubmitInteraction) {
    if (interaction.customId !== 'add-repository-setup-modal') return this.none();

    return this.some();
  }

  public async run(interaction: ModalSubmitInteraction) {
    const name = interaction.fields.getTextInputValue('repository-name-setup-input');
    const url = interaction.fields.getTextInputValue('repository-url-setup-input');

    const find = await db.manager.findOneBy(Repository, { url });

    if (find) {
        return await interaction.reply({
            content: 'Repository with url already exists!',
            ephemeral: true
        });
    }

    const repo = new Repository();
    
    repo.name = name;
    repo.url = url;
    repo.guildId = interaction.guildId;

    db.manager.save(repo);

    await interaction.reply({
      content: 'Repository added!',
      ephemeral: true
    });

    DownloadJobs.instance().run();
  }
}