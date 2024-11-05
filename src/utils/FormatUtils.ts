import { Activity, ActivityType, Emoji, UserFlagsBitField, User } from "discord.js";
import req from '@helperdiscord/centra';

export function formatEmoji(emoji: Emoji): string {
    if (!emoji.id) {
        return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/${emojiUnicode(emoji.name)}.svg`
    } else {
        return `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? 'gif' : 'png'}?size=4096&quality=lossless`
    }
}

export function formatTitle(activity: Activity): string {
    switch (ActivityType[activity.type]) {
        case "Playing":
            return `Playing ${activity.name}`
        case "Listening":
            return `Listening to ${activity.name}`
        case "Watching":
            return `Watching ${activity.name}`
        case "Competing":
            return `Competing in ${activity.name}`
        case "Streaming":
            return `Streaming ${activity.name}`
    }
}

export async function formatAssets(activity: Activity): Promise<{ smallImage: string; smallText: string; largeImage: string; largeText: string} > {
    if (activity.assets) {
        let smallImage = null
        if (activity.assets.smallImage) {
            if (activity.assets.smallImage.startsWith("mp:external")) {
                smallImage = `https://${activity.assets.smallImage.split("https/")[1]}`
            } else {
                smallImage = `https://cdn.discordapp.com/app-assets/${activity.applicationId}/${activity.assets.smallImage}.png?size=4096`
            }
        }

        let largeImage = null
        if (activity.assets.largeImage) {
            switch (true) {
                case activity.assets.largeImage.startsWith("spotify:"):
                    largeImage = `https://i.scdn.co/image/${activity.assets.largeImage.replace("spotify:", "")}`
                    break;
                case activity.assets.largeImage.startsWith("mp:external"):
                    largeImage = `https://${activity.assets.largeImage.split("https/")[1]}`
                    break;
                case activity.assets.largeImage.startsWith("youtube:"):
                    largeImage = `https://i.ytimg.com/vi/${activity.assets.largeImage.split("youtube:")[1]}/hqdefault_live.jpg`
                    break;
                default:
                    largeImage = `https://cdn.discordapp.com/app-assets/${activity.applicationId}/${activity.assets.largeImage}.png?size=4096`
                    break;
            }
        }

        return {
            smallImage,
            largeImage,
            smallText: activity.assets.smallText,
            largeText: activity.assets.largeText,
        }
    } else {
        if (!activity.applicationId) {
            return {
                smallText: null,
                smallImage: null,
                largeImage: 'https://r2.e-z.host/unknown_game.png',
                largeText: null,
            }
        } else {
            let gameData = await (req(`https://discord.com/api/v10/applications/${activity.applicationId}/rpc`)).json()
            return {
                smallText: null,
                smallImage: null,
                largeImage: `${gameData ? `https://cdn.discordapp.com/app-icons/${activity.applicationId}/${gameData.icon}.webp?size=56&keep_aspect_ratio=false` : 'https://r2.e-z.host/unknown_game.png'}`,
                largeText: null,
            }
        }
    }
}

export async function formatBadges(badges: Readonly<UserFlagsBitField>, user: User): Promise<string[] | null> {
    const badgeMappings: { [key: string]: string } = {
        "HypeSquadOnlineHouse1": "HypeSquad Bravery",
        "HypeSquadOnlineHouse2": "HypeSquad Brilliance",
        "HypeSquadOnlineHouse3": "HypeSquad Balance",
        "PremiumEarlySupporter": "Early Supporter",
        "VerifiedDeveloper": "Early Verified Bot Developer",
        "BugHunterLevel1": "Discord Bug Hunter_1",
        "BugHunterLevel2": "Discord Bug Hunter_2",
        "CertifiedModerator": "Discord Certified Moderator",
        "Staff": "Discord Staff",
        "Hypesquad": "HypeSquad Events",
        "Partner": "Partnered Server Owner",
        "ActiveDeveloper": "Active Developer"
    };

    const array = new Array<string>();
    badges?.toArray().forEach((badge) => {
        if (badgeMappings[badge]) array.push(badgeMappings[badge]);
    });

    if (await hasNitro(user)) {
        array.push("Discord Nitro");
    }

    return array.length ? array : null;
}

async function hasNitro(user: User): Promise<boolean> {
    return user.displayAvatarURL({ forceStatic: false }).endsWith('.gif') ||
           (await user.fetch()).bannerURL({ forceStatic: false }) !== null;
}

function emojiUnicode(emoji: string): string {
    if (emoji.length === 1) {
        return emoji.charCodeAt(0).toString(16)
    }
    const first = emoji.charCodeAt(0)
    const second = emoji.charCodeAt(1)
    if (first >= 0xD800 && first <= 0xDBFF && second >= 0xDC00 && second <= 0xDFFF) {
        const codePoint = (first - 0xD800) * 0x400 + (second - 0xDC00) + 0x10000;
        return codePoint.toString(16);
    }
    return first.toString(16);
}
