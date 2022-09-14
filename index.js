const { MessageEmbed, Client, Intents } = require('discord.js');
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
    ]
});

// Bot Prefix
const prefix = "+";

// Logging when the bot is online
client.on("ready", () => {
    console.log(`Ready as > ${client.user.username}`);
});


// Questions file
let questions = require("./questions.json")

// for Cooldown, allowing 1 round at the moment 
let cooldown = new Set()

client.on("messageCreate", async message => {
    if (message.content.startsWith(prefix + "game")) {
        let { channel, guild } = message;

        // funtion for replying to message 
        function returnMsg(content) {
            message.reply({ content }).catch(e => console.log("ERR: " + e))
        }

        // return if there's a round playing now
        if (cooldown.has(channel?.id)) return returnMsg("عذرًا, يجب إنهاء الجولة السابقة");

        // return if message is not in the guild, or is writtin by a bot
        if (!guild || message.author.bot) return;

        // get random question from questions file
        let randomQu = questions[Math.floor(Math.random() * questions.length)];

        // the time for the round in seconds
        let time = 15;

        // Embed for the question
        let embed = new MessageEmbed()
            .setTitle(randomQu.question)
            .setDescription(randomQu.options)
            .setFooter({ text: `لديك ${time} ثانية للإجابة` })
            .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
            .setTimestamp();

        // button, the options
        let btns = new MessageActionRow();

        for (let x = 1; x < 5; x++) {
            btns.addComponents(
                new MessageButton()
                    .setCustomId(`${x}`)
                    .setLabel(x.toString())
                    .setStyle("SECONDARY")
            );
        }

        let msg = await message.reply({ embeds: [embed], components: [btns] }).catch(e => { return console.log(e) })
        cooldown.add(channel?.id)

        // important filter for await message component
        const filter = i => {
            return randomQu.answer.some(a => `${a}` == `${i.customId}`);
        };

        msg.awaitMessageComponent({
            filter,
            time: 1000 * time,
            errors: ['time']
        }).then(res => {
            cooldown.delete(channel?.id)

            res.reply({ content: `أحسنت ${res.user}, الإجابة هي: ${randomQu.answer[0]}` })
            let btn = res.message.components[0];
            btn?.components.forEach(e => e.setDisabled(true))
            msg?.edit({ components: [btn] }).catch(() => { })
        }).catch(() => {
            cooldown.delete(channel?.id)

            msg?.reply({ content: "لم يتمكن أحد من الإجابة !" }).catch(() => { })
            let btn = msg.components[0];
            btn?.components.forEach(e => e.setDisabled(true))
            msg?.edit({ components: [btn] }).catch(() => { })
        })
    }
});


client.login("Your Token");
