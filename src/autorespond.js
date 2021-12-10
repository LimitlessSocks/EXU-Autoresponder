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
    for(let { inputs, outputs } of Responses) {
        if(inputs.some(input => stripped === input)) {
            pools.push(outputs);
        }
    }
    if(pools.length) {
        let output = randomChoice(randomChoice(pools));
        channel.send(output);
    }
});

client.login(token);