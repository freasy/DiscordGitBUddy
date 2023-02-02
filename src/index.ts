import * as dotenv from 'dotenv' ;

dotenv.config();

import { SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits, OAuth2Scopes, PermissionFlagsBits } from 'discord.js';

import db from './database';
import DownloadJobs from './scheduler';

db.initialize();

const client = new SapphireClient({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

async function run() {
    await client.login(process.env.TOKEN);

    DownloadJobs.init(client)

    console.log(client.generateInvite({ scopes: [OAuth2Scopes.Bot], permissions: PermissionFlagsBits.Administrator }));
}

run();
