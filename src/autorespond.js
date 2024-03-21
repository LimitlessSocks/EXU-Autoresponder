const { Client, Intents } = require("discord.js");
const fs = require("fs");
const path = require("path");
const simpleGit = require("simple-git");

require("dotenv").config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

let Responses = [];
const RESPONSES_DIRNAME = path.join(__dirname, "responses.json");
const syncResponses = (message = null) => {
    try {
        let parsed = JSON.parse(fs.readFileSync(RESPONSES_DIRNAME));
        Responses = parsed;
        console.log(Responses.map(e => "[" + e.inputs.join("; ") + "]").join(" "));
        return true;
    }
    catch(err) {
        message?.reply("there was an error D:\ncheck logs!!");
        console.error(err);
        return false;
    }
};

syncResponses();

// When the client is ready, run this code (only once)
client.once("ready", c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

const adjustDateBy = (originalDate, timeDelta) => {
    const deltaParts = timeDelta.toLowerCase().split(/\s+/);
    let sign = 1;
    if (deltaParts[0] === "in") {
        deltaParts.shift();
    }
    if (deltaParts.at(-1) === "ago") {
        sign = -1;
        deltaParts.pop();
    }
    const timeUnits = {
        "years": "FullYear",
        "year": "FullYear",
        "months": "Month",
        "month": "Month",
        "days": "Date",
        "day": "Date",
        "weeks": "Week",
        "week": "Week",
        "hours": "Hours",
        "hour": "Hours",
        "minutes": "Minutes",
        "minute": "Minutes",
        "seconds": "Seconds",
        "second": "Seconds"
    };
    let newDate = new Date(originalDate);
    for (let i = 0; i < deltaParts.length; i += 2) {
        let value = deltaParts[i] === "a" ? 1 : parseInt(deltaParts[i]);
        const unit = deltaParts[i + 1];
        if (Number.isNaN(value)) {
            continue;
        }
        if (!(unit in timeUnits)) {
            console.error("Invalid time unit:", unit);
            continue;
        }
        let method = timeUnits[unit];
        if(method === "Week") {
            method = "Date";
            value *= 7;
        }
        newDate[`set${method}`](newDate[`get${method}`]() + sign * value);
    }
    return newDate;
};

const randomChoice = arr => arr[Math.random() * arr.length | 0];

const GITHUB_TOKEN = process.env.GITHUB_PUSH_PULL;
const git = simpleGit(
    path.join(__dirname, ".."), // base of repo: one level above src
);
git.addConfig("remote.origin.url", `https://${GITHUB_TOKEN}@github.com/LimitlessSocks/EXU-Autoresponder.git`);
console.log("Git initialized!");

client.on("messageCreate", async message => {
    let pools = [];
    let { content, channel } = message;
    let original = content.trim();
    let stripped = original.toLowerCase();
    let response = null;
    let match = stripped.match(/^\s*(.+?)\s+(\d+|all)\s*$/);
    if(match) {
        stripped = match[1];
        response = match[2];
    }
    if(message.author.id === "277600188002992129") {
        if(/^auto,?\s*reboot/.test(stripped)) {
            if(syncResponses(channel)) {
                message.reply("okai, rebooted!");
            }
            return;
        }
        if(/^auto,?\s*save/.test(stripped)) {
            message.reply("saving...");
            fs.writeFileSync(RESPONSES_DIRNAME, JSON.stringify(Responses));
            message.reply("saved!");
            return;
        }
        if(/^auto,?\s*push/.test(stripped)) {
            message.reply("pushing to github...");
            await git.add(RESPONSES_DIRNAME);
            await git.commit("auto: update responses.json");
            await git.push();
            message.reply("push success");
            return;
        }
        if(/^auto,?\s*pull/.test(stripped)) {
            message.reply("pulling from github...");
            await git.pull();
            message.reply("done pulling!");
            return;
        }
        let matchInfo;
        if(matchInfo = original.match(/^auto,?\s*add\s*(.+)\s*;\s*(.+)$/)) {
            let [ whole, newInput, newOutput ] = matchInfo;
            let existing = Responses.find(({ inputs }) => inputs.includes(newInput));
            if(existing) {
                existing.outputs.push(newOutput);
                message.reply("added another response for `" + newInput + "`!");
            }
            else {
                Responses.push({ inputs: [ newInput ], outputs: [ newOutput ] });
                message.reply("made new response and output for `" + newInput + "`!");
            }
            return;
        }
        if(matchInfo = original.match(/^auto,?\s*alias\s*(.+)\s*;\s*(.+)$/)) {
            let [ whole, findInput, newAlias ] = matchInfo;
            let existing = Responses.find(({ inputs }) => inputs.includes(findInput));
            if(existing) {
                existing.inputs.push(newAlias);
                message.reply("added another alias for `" + findInput + "`!");
            }
            else {
                message.reply("could not find anything under `" + findInput + "`, sorry");
            }
            return;
        }
        if(matchInfo = original.match(/^auto,?\s*remove\s*(.+)\s*;\s*(.+)$/)) {
            let [ whole, findInput, toRemove ] = matchInfo;
            let existing = Responses.find(({ inputs }) => inputs.includes(findInput));
            if(existing) {
                let idx = parseInt(toRemove);
                
                if(Number.isNaN(idx)) {
                    idx = existing.outputs.findIndex(output =>
                        output.toLowerCase().startsWith(toRemove.toLowerCase()));
                }
                
                if(idx === -1) {
                    message.reply("i couldn't find a response under `" + findInput + "` for `" + toRemove + "`, sorry :c");
                }
                else {
                    existing.outputs.splice(idx, 1);
                    message.reply("removed response `" + idx + "`!");
                }
            }
            else {
                message.reply("sorry, couldn't find anything under `" + findInput + "`");
                // Responses.push({ inputs: [ newInput ], outputs: [ newOutput ] });
                // message.reply("made new response and output for `" + newInput + "`!");
            }
            return;
        }
    }
    
    let matchInfo;
    if(matchInfo = stripped.match(/auto,?\s*(?:now|time)\s*(.+)?/)) {
        let date = new Date();
        if(matchInfo[1]) {
            date = adjustDateBy(date, matchInfo[1]);
        }
        let toFormat = Math.floor(+date / 1000).toString();
        let baseMessage = "t T d D f F R".replace(/\w/g, "<t:" + toFormat + ":$&>");
        let output = baseMessage + "\n```" + baseMessage + "```";
        message.reply(output);
        return;
    }
    
    for(let obj of Responses) {
        let { inputs, outputs } = obj;
        if(inputs.some(input => stripped === input)) {
            pools.push(obj);
        }
    }
    if(pools.length) {
        let outputPool = randomChoice(pools);
        let output;
        if(response === null || outputPool.secret) {
            output = randomChoice(outputPool.outputs);
        }
        else if(response === "all") {
            output = Object.entries(outputPool.outputs);
            let size = output.length.toString().length;
            output = output
                .map(([key, value]) =>
                    `\`${key.toString().padStart(size)}.\` ${value}`
                )
                .join("\n");
        }
        else {
            output = outputPool.outputs[response] || "_I'm sorry, there's no corresponding response :c_";
        }
        // if user shouts at auto, shout back
        if(original === original.toUpperCase() && original !== original.toLowerCase()) {
            output = output.replace(/:\w+:|<:\S+?:\S+?\d+>|https?:\/\/\S+|(.+?)/g, (whole, group) => 
                group?.toUpperCase() ?? whole);
        }
        channel.send(output);
    }
});

client.login(process.env.AUTORESPOND_BOT_TOKEN);
