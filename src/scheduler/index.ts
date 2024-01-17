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
        if (!this._instance) {
            throw new Error('DownloadJobs instance not set!');
        }
        return this._instance;
    }

    public static init(client: SapphireClient, token?: string) {
        console.log('Initializing jobs...');

        this._instance = new DownloadJobs(client, token);

        schedule.scheduleJob('*/30 * * * *', () => {
            this._instance.run();
        }).invoke();
    }

    private client: SapphireClient;
    private github_token?: string;

    constructor(client: SapphireClient, token?: string) {
        this.client = client;
        this.github_token = token;
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
                {
                    headers: {
                        Authorization: this.github_token ? `token ${this.github_token}` : null
                    }
                }
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
                if (releases && releases.length > 0) {
                    const total = releases[0].assets.reduce(
                        (sum, currentValue) => {
                            if (
                                currentValue.name.endsWith('.img.xz') ||
                                currentValue.name.endsWith('.zip')
                            ) {
                                return sum + currentValue.download_count;
                            }

                            return sum;
                        },
                        0,
                    );

                    return guild.fetch().then(async g => {
                        let channel: GuildBasedChannel | null = null;
                        if (repo.channelId) {
                            channel = await g.channels.fetch(repo.channelId).catch(() => null);
                        }
                        let version: string = releases[0].tag_name;
                        if (version.startsWith('v')) {
                            version = version.substring(1);
                        }

                        if (!channel) {
                            channel = await g.channels.create<ChannelType.GuildVoice>({
                                name: `${repo.name} ${version}`,
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

                            await db.manager.save(repo);
                        }

                        await channel.setName(`${repo.name} ${version} (${readables(total, 1, false)})`);
                    })
                }
            });
        });
    }
}

export default DownloadJobs;