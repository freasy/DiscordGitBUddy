import { AxiosError } from './../../node_modules/axios/index.d';
import { GithubRelease } from './../../types/github-release.type.d';
import axios from 'axios';
import { SapphireClient } from '@sapphire/framework';
import * as schedule from 'node-schedule';
import { GuildBasedChannel, VoiceChannel, ChannelType, PermissionFlagsBits } from 'discord.js';

import db from '../database';
import { Repository } from '../database/entities/repository.entity';
import readables from '../human-readable';

class DownloadJobs {

    private static _instance: DownloadJobs;

    public static instance() {
        return this._instance;
    }

    public static init(client: SapphireClient) {
        console.log('Initializing jobs...');

        this._instance = new DownloadJobs(client);

        schedule.scheduleJob('*/30 * * * *', () => {
            this._instance.run();
        }).invoke();
    }

    private client: SapphireClient;

    constructor(client: SapphireClient) {
        this.client = client;
    }

    private getRelease(url: string) {
        
        let r = url.replace('https://', '').split('/');
        let rIndex = -1;

        for(let i = 0; i < r.length; i++) {
            if (r[i].includes('github.com')) {
                rIndex = i + 1;
                break;
            }
        }

        if (rIndex < 0) {
            return null;
        }
        return axios
            .get<GithubRelease[]>(
                `https://api.github.com/repos/${r[rIndex]}/${r[rIndex + 1]}/releases`,
            )
            .then(res => res.data)
            .catch((err: AxiosError) => {
                console.error(url, err?.response?.data);
                return null;
            });
    }

    public async run() {

        const guilds = await this.client.guilds.fetch();
        guilds.forEach(async guild => {
            const repos = await db.manager.findBy(Repository, { guildId: guild.id });

            repos.map(async repo => {
                const releases = await this.getRelease(repo.url);
                if (releases?.length > 0) {
                    const total = releases[0].assets.reduce(
                        (sum, currentValue) => {
                            if (
                                currentValue.name.endsWith('.img.xz') ||
                                currentValue.name === 'mainsail.zip'
                            ) {
                                return sum + currentValue.download_count;
                            }

                            return sum;
                        },
                        0,
                    );

                    return guild.fetch().then(async g => {
                        let channel: GuildBasedChannel = null;
                        if (repo.channelId) {
                            channel = await g.channels.fetch(repo.channelId).catch(() => null);
                        }
                        if (!channel) {
                            channel = await g.channels.create<ChannelType.GuildVoice>({
                                name: `${repo.name} ${releases[0].tag_name}`,
                                type: ChannelType.GuildVoice,
                                position: 0,
                                userLimit: 0,
                            });
                            
                            if (channel instanceof VoiceChannel) {
                                await channel.permissionOverwrites.create(
                                    channel.guild.roles.everyone, {
                                        Connect: false,
                                        ViewChannel: true
                                    }
                                );
                            }

                            repo.channelId = channel.id;

                            db.manager.save(repo);
                        }

                        let version: string = releases[0].tag_name;
                        if (version.startsWith('v')) {
                            version = version.substring(1);
                        }

                        channel.setName(`${repo.name} ${version} (${readables(total, 1, false)})`);
                    })
                }
            });
        });
    }
}

export default DownloadJobs;