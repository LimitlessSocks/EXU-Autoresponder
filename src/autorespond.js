const { Client, Intents } = require('discord.js');

require('dotenv').config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const Responses = require("./responses.json");

// When the client is ready, run this code (only once)
client.once('ready', c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
    console.log(Responses.map(e => "[" + e.inputs.join("; ") + "]").join(" "));
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
    for(let obj of Responses) {
        let { inputs, outputs } = obj;
        if(inputs.some(input => stripped === input)) {
            pools.push(obj);
        }
    }
    if(pools.length) {
        let outputPool = randomChoice(pools);
        let output;
        if(response === null) {
            output = randomChoice(outputPool.outputs);
        }
        else if(response === "all" && !outputPool.secret) {
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
