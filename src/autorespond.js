const { Client, Intents } = require('discord.js');
const { token } = require("./config.json");

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
    let stripped = content.toLowerCase().trim();
    let response = null;
    let match = stripped.match(/(.+) (\d+)/);
    if(match) {
        stripped = match[1];
        response = match[2];
    }
    for(let { inputs, outputs } of Responses) {
        if(inputs.some(input => stripped === input)) {
            pools.push(outputs);
        }
    }
    if(pools.length) {
        let outputPool = randomChoice(pools);
        let output;
        if(response === null) {
            output = randomChoice(outputPool);
        }
        else {
            output = outputPool[response] || "_I'm sorry, there's no corresponding repsonse :c_";
        }
        channel.send(output);
    }
});

client.login(token);