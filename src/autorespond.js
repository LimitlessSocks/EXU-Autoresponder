const { Client, Intents } = require("discord.js");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

let Responses = [];
const RESPONSES_DIRNAME = path.join(__dirname, "responses.json");
const syncResponses = (channel = null) => {
    try {
        let parsed = JSON.parse(fs.readFileSync(RESPONSES_DIRNAME));
        Responses = parsed;
        console.log(Responses.map(e => "[" + e.inputs.join("; ") + "]").join(" "));
        return true;
    }
    catch(err) {
        channel?.send("there was an error D:\ncheck logs!!");
        console.error(err);
        return false;
    }
};

syncResponses();

// When the client is ready, run this code (only once)
client.once("ready", c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

const randomChoice = arr => arr[Math.random() * arr.length | 0];

client.on("messageCreate", message => {
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
    if(message.author.id === "277600188002992129" && stripped === "reboot") {
        if(syncResponses(channel)) {
            channel.send("okai, rebooted!");
        }
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
