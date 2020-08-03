const Discord = require("discord.js");
const fs = require('fs');
const Enmap = require('enmap');
const client = new Discord.Client();
const jsonstring = fs.readFileSync('./botconfig.json');
const botconfig = JSON.parse(jsonstring);
let status;
let chan;
let user;
let userId;
let memberTBM;
let userTBM;
let guildTBM;
let globalGuildConf;
let guildId;
let a;
let b;
let c;
let d;
function getUser(c) { //this function gets the user to be moved(userTBM)
    chan = client.channels.cache.find(channel => channel.name === c); /*gets channel on which to
    automatically move users from to their game */
    userId = chan.members.map(user => user.id); /*parses the collection of members in the
    channel to get the id */
    userId = userId.toString(); //changes to id into a string
    console.log("getUser performed successfully.")
}
function getStatus() { //this function gets the status of the user
userTBM = client.users.cache.get(userId);
if (userTBM === undefined) {
  console.log("No user in channel, or unable to retrieve userId")
}
else {
  status = userTBM.presence.activities;
  console.log("userId received:" + userId);
  if (status.length === 0) {
    console.log("no status, user is not playing a game")
    memberTBM = client.guilds.cache.get()
  }
  else {
    console.log("status received, moving to: " + status);
    moveUser();
  }
  
}

}
function moveUser(guildTBM) {
  currentGuild = client.guilds.cache.get(guildTBM);
  memberTBM = currentGuild.members.cache.get(userId);
  if (client.channels.cache.find(channel => channel.name === status) === undefined) {
    console.log("user not playing game");
    return;
  }
  if (memberTBM === undefined) {
    return;
  }
  memberTBM.voice.setChannel(client.channels.cache.find(channel => channel.name === status));
}
function main(b, d) { //starts process to move user
  getUser(b);
  getStatus();
  moveUser(d);
}
//enmap per server config
client.settings = new Enmap({
  name: "settings",
  fetchAll: false,
  autoFetch: true,
  cloneLevel: 'deep'
});

const defaultSettings = {
  prefix: "!",
  adminRole: "admin",
  channel: "General",
}
client.on("guildDelete", guild => {
  client.settings.delete(guild.id);
});
client.on("message", async (message) => {
  console.log("message event");
  if(!message.guild || message.author.bot) { 
    return; 
  }
  
  const guildConf = client.settings.ensure(message.guild.id, defaultSettings);
  if(message.content.indexOf(guildConf.prefix) !== 0) {
    return;
  }
  const args = message.content.split(/\s+/g);
  const command = args.shift().slice(guildConf.prefix.length).toLowerCase();
  // Commands Go Here
  if(command === "setconf") {
    const adminRole = message.guild.roles.cache.find(guildConf => guildConf.adminRole === 'name');
    if(!adminRole && message.member.id !== message.guild.ownerID) {
      return message.reply("Administrator Role Not Found"); 
    }
    else if(message.member.id !== message.guild.ownerID && !message.member.roles.cache.has(adminRole)) {
      return;
    }
    const [prop, ...value] = args;

    if(!client.settings.has(message.guild.id, prop)) {
      return message.reply("This key is not in the configuration.");
    }
    if(prop === undefined || value === undefined) {
      return;
    }
    client.settings.set(message.guild.id, value.join(" "), prop);

    message.channel.send(`Guild configuration item ${prop} has been changed to:\n\`${value.join(" ")}\``);
  }
  if(command === "showconf") {
    let configProps = Object.keys(guildConf).map(prop => {
      return `${prop}  :  ${guildConf[prop]}`;
    });
    message.channel.send(`The following are the server's current configuration:
    \`\`\`${configProps.join("\n")}\`\`\``);
  }
});
//voiceStateUpdate
client.on('voiceStateUpdate', (oldMember, newMember) => {
  console.log("voiceStateUpdate triggered");
  if(newMember.guild.id === undefined) {
    return;
  }
  globalGuildConf = client.settings.ensure(newMember.guild.id, defaultSettings);
  guildId = newMember.guild.id;
  a = globalGuildConf.channel;
  main(a, guildId);
})
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
client.login(botconfig.token);