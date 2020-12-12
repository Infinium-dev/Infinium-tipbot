require('dotenv').config();
const request_json = require('request-json');
const fs = require('fs');
const fileName = './user_list.json';
const file = require(fileName);
const config_file = fs.readFileSync('config.json');
const config__filejson_parsed = JSON.parse(config_file);
console.log(file);
const Discord = require('discord.js');
const bot = new Discord.Client();
//const TOKEN = process.env.TOKEN;
const TOKEN = config__filejson_parsed.DiscordToken;
const rpc_wallet_host=config__filejson_parsed.rpc_wallet_host;
const infinium_decimal_places=config__filejson_parsed.decimal_places;
const infinium_fee_per_byte=config__filejson_parsed.fee_per_byte;

bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', msg => {
    console.log(msg.content);
  if (msg.content === '/leaderboard') {
    msg.channel.send('not implemented yet');

  } else if (msg.content.startsWith('/tip')) {
    if (msg.mentions.users.size) {
      const taggedUser = msg.mentions.users.first();
      //msg.channel.send(`You wanted to kick: ${taggedUser.username}`);
      var msg_cote = msg.content, extracted_amount="", push_to_extraxted_amount=0;
      for (var i = 0; i < msg_cote.length; i++) {
          if(push_to_extraxted_amount==1) extracted_amount += msg_cote[i];
          if(msg_cote[i]==">") push_to_extraxted_amount=1;
      }
      console.log(extracted_amount);
      extracted_amount = extracted_amount.match(/[\d\.,]+/);//extract ony number value
      console.log("s:"+extracted_amount);
      if (extracted_amount==null){
        msg.channel.send("Please write valid number! :infinity:")
      }
      else{
        extracted_amount = extracted_amount.join("");
        SendTip(msg.author.id, taggedUser.id, extracted_amount, msg);
        //msg.channel.send(`your inf amout: ${extracted_amount}`);
      }
    } else {
      msg.reply('Please tag a valid user!');
    }
  } else if (msg.content.startsWith('/generate')){
    if(file[msg.author.id]==null){
      GetWalletAddress(msg.author.id,msg);
    }
    else
    {
      msg.reply('You already have tipbot address generated!');
    }
  } else if (msg.content.startsWith('/balance')){
    if(file[msg.author.id]==null){
      msg.reply("You need to generate tipbot address first with `/generate` !");
    }
    else
    {
      GetUserBalance(msg);
    }
  } else if (msg.content.startsWith('/address')){
    if(file[msg.author.id]==null){
      msg.reply("You need to generate tipbot address first with `/generate` !");
    }
    else
    {
      GetUserAddress(msg);
    }
  } else if (msg.content.startsWith('/help')){
    msg.reply(config__filejson_parsed.help_message);
  } else if (msg.content.startsWith('/withdraw')){
    //This is used to withdraw your money
    var msg_cote2 = msg.content, extracted_amount2="", push_to_extraxted_amount2=0, extracted_address="";
      for (var i = 0; i < msg_cote2.length; i++) {
          if(push_to_extraxted_amount2>1) extracted_amount2 += msg_cote2[i];
          if(push_to_extraxted_amount2==1 && msg_cote2[i]!=" ") extracted_address += msg_cote2[i];
          if(msg_cote2[i]==" ") push_to_extraxted_amount2++;
      }
      console.log(extracted_amount2);
      extracted_amount2 = extracted_amount2.match(/[\d\.,]+/);//extract ony number value
      console.log("withdrawal amount: "+extracted_amount2);
    if(extracted_address==""){
      msg.author.send("Please write your wallet address");
    }
    else
    {
      SendWithdrawal(msg.author.id, extracted_address, extracted_amount2, msg)
    }
    //
  }
});


function AddFileValue(userid,address){
  console.log("adresa"+address)
  file[userid] = address;
    
  fs.writeFile(fileName, JSON.stringify(file), function writeJSON(err) {
    if (err) return console.log(err);
    console.log(JSON.stringify(file));
    console.log('writing to ' + fileName);
  });
}

function GetWalletAddress(discord_id, msg_4_reply){ //get new wallet address
  var client_json_rpc = request_json.createClient(rpc_wallet_host);
  var new_address="d";
  client_json_rpc.post('/json_rpc', {"jsonrpc": "2.0", "id": "test", "method": "create_addresses", "params": {"secret_spend_keys": ["", ""]}}, function(err, res, body){
    if (err == null) {
      console.log("reading create_addresses from walletd [\x1b[32mOK\x1b[0m]");
      
      if(body.result.addresses[0]) {
        console.log(body.result.addresses[0]);
        //return body.result.addresses[0];
      }
      setTimeout(function() {
        AddFileValue(discord_id,body.result.addresses[0]);
        msg_4_reply.author.send(" Your wallet has been generated :infinity: \nYour wallet address is: `"+body.result.addresses[0]+"`");
	}, config__filejson_parsed.rpc_wallet_normal_delay);
      //return new_address;
		}
		else {
		 console.log("reading create_addresses from walletd [\x1b[31mERROR\x1b[0m]");
		 console.log("error");
    }
  });
}

function GetUserBalance(msg_4_reply){
  if(file[msg_4_reply.author.id]!=null){
    var client_json_rpc = request_json.createClient(rpc_wallet_host);
    var new_address="d";
    client_json_rpc.post('/json_rpc', {"jsonrpc": "2.0", "id": "test", "method": "get_balance", "params": {"height_or_depth": -6, "address": file[msg_4_reply.author.id]}}, function(err, res, body){
    if (err == null) {
      console.log("reading get_balance from  [\x1b[32mOK\x1b[0m]");
      
      setTimeout(function() {
        msg_4_reply.author.send("  Your Infinium :moneybag: balance is: \n\nUnlocked:  `"+(body.result.spendable/infinium_decimal_places).toFixed(12)+"` INF \nLocked:      `"+(body.result.locked_or_unconfirmed/infinium_decimal_places).toFixed(12)+"`  INF \n\nYou need 6 confirmations :lock: to unlock your deposit, so if you have locked balance you just need to wait");
	  }, config__filejson_parsed.rpc_wallet_normal_delay);
      //return new_address;
		}
		else {
		  console.log("reading get_balance from [\x1b[31mERROR\x1b[0m]");
		  console.log("error");
    }
    });
  }
}

function GetUserAddress(msg_4_reply){
  if(file[msg_4_reply.author.id]!=null){
    msg_4_reply.author.send("Your wallet address is: `"+file[msg_4_reply.author.id]+"`");
  }
}


function SendTip(tiper_boii, tiped_boii, amount, msg_4_reply)
{
  if(file[tiper_boii]==null){
    msg_4_reply.reply("You need to generate tipbot address first with `/generate` !");
    return;
  }
  if(file[tiped_boii]==null){
    msg_4_reply.reply("The user you are trying to tip didn't generated his wallet yet. User you are trying to tip need to generate tipbot addres with `/generate`");
    return;
  }
  if(tiper_boii==tiped_boii){
    msg_4_reply.reply("You can't tip yourself");
    return;
  }
  // Create tip tx
  var client_json_rpc = request_json.createClient(rpc_wallet_host);
    client_json_rpc.post('/json_rpc', {"jsonrpc": "2.0", "id": "test", "method": "create_transaction", "params": {
        "transaction": {
          "anonymity": 6,
          "payment_id": "",
          "transfers": [
            {
              "address": file[tiped_boii],
              "amount": amount*infinium_decimal_places
            }
          ]
        },
        "spend_addresses": [
          file[tiper_boii]
        ],
        "change_address": file[tiper_boii],
        "optimization": "minimal",
        "confirmed_height_or_depth": -6,
        "fee_per_byte": infinium_fee_per_byte
      }}, function(err, res, body){
    if (err == null) {
      console.log("reading create_transaction from  [\x1b[32mOK\x1b[0m]");
      console.log(body);
      
      setTimeout(function() {
        if(body.error){
          if(body.error.code == -301){
            msg_4_reply.reply("Not enough unlocker balance");
            return;
          }
          if(body.error.code == -302){
            msg_4_reply.reply("Transaction too big");
            return;
          }
          if(body.error.code == -303){
            msg_4_reply.reply("Not enough anonymity, try sending smaller transaction");
            return;
          }
        }
        if(body.result)
        {
          var tx_template_body = body;
          
          //send tip tx
          client_json_rpc.post('/json_rpc', {"jsonrpc": "2.0", "id": "test", "method": "send_transaction", "params": {
            "binary_transaction":tx_template_body.result.binary_transaction
          }}, function(err, res, body){
          if (err == null) {
            console.log("reading send_transaction from  [\x1b[32mOK\x1b[0m]");
      
            setTimeout(function() {
            if(body.result){
              if(body.result.send_result=="broadcast"){
                msg_4_reply.reply("Congratulation :tada: You have tiped <@"+tiped_boii+"> with `"+amount+"` INF\nYou can check transaction detaild here: "+config__filejson_parsed.tx_explorer+tx_template_body.result.transaction.hash);
              }
            }
	        }, config__filejson_parsed.rpc_wallet_normal_delay);
		      }
      		else {
		        console.log("reading send_transaction from [\x1b[31mERROR\x1b[0m]");
		        console.log("error");
          }
          });
          //send tip tx

        }
	  }, config__filejson_parsed.rpc_wallet_normal_delay);
      //return new_address;
		}
		else {
		  console.log("reading create_transaction from [\x1b[31mERROR\x1b[0m]");
		  console.log("error");
    }
    });


  console.log(`tiper boii: ${tiper_boii}`);
    console.log(`tiped boii: ${tiped_boii}`);
    console.log(`final inf amount: ${amount}`);
}

//Withdraw function
function SendWithdrawal(tiper_boii, withdrawal_address, amount, msg_4_reply)
{
  if(file[tiper_boii]==null){
    msg_4_reply.reply("You need to generate tipbot address first with `/generate` !");
    return;
  }
  if(withdrawal_address==null){
    msg_4_reply.reply("You need to write your infinium wallet address");
    return;
  }
  // Create withdrawal tx
  var client_json_rpc = request_json.createClient(rpc_wallet_host);
    client_json_rpc.post('/json_rpc', {"jsonrpc": "2.0", "id": "test", "method": "create_transaction", "params": {
        "transaction": {
          "anonymity": 6,
          "payment_id": "",
          "transfers": [
            {
              "address": withdrawal_address,
              "amount": amount*infinium_decimal_places
            }
          ]
        },
        "spend_addresses": [
          file[tiper_boii]
        ],
        "change_address": file[tiper_boii],
        "optimization": "minimal",
        "confirmed_height_or_depth": -6,
        "fee_per_byte": infinium_fee_per_byte
      }}, function(err, res, body){
    if (err == null) {
      console.log("reading create_transaction from  [\x1b[32mOK\x1b[0m]");
      console.log(body);
      
      setTimeout(function() {
        if(body.error){
          if(body.error.code == -301){
            msg_4_reply.reply("Not enough unlocker balance");
            return;
          }
          if(body.error.code == -302){
            msg_4_reply.reply("Transaction too big");
            return;
          }
          if(body.error.code == -303){
            msg_4_reply.reply("Not enough anonymity, try sending smaller transaction");
            return;
          }
          if(body.error.code == -4){
            msg_4_reply.reply("Invalid wallet address");
            return;
          }
        }
        if(body.result)
        {
          var tx_template_body = body;
          
          //send withrawal tx
          client_json_rpc.post('/json_rpc', {"jsonrpc": "2.0", "id": "test", "method": "send_transaction", "params": {
            "binary_transaction":tx_template_body.result.binary_transaction
          }}, function(err, res, body){
          if (err == null) {
            console.log("reading send_transaction from  [\x1b[32mOK\x1b[0m]");
      
            setTimeout(function() {
            if(body.result){
              if(body.result.send_result=="broadcast"){
                msg_4_reply.reply("Congratulations :tada: , you have withdrawed to "+withdrawal_address+" `"+amount+"` INF\nYou can check transaction detaild here: "+config__filejson_parsed.tx_explorer+tx_template_body.result.transaction.hash);
              }
            }
	        }, config__filejson_parsed.rpc_wallet_normal_delay);
		      }
      		else {
		        console.log("reading send_transaction from [\x1b[31mERROR\x1b[0m]");
		        console.log("error");
          }
          });
          //send withrawal tx

        }
	  }, config__filejson_parsed.rpc_wallet_normal_delay);
      //return new_address;
		}
		else {
		  console.log("reading create_transaction from [\x1b[31mERROR\x1b[0m]");
		  console.log("error");
    }
    });


    console.log(`withdrawer boii: ${tiper_boii}`);
    console.log(`withdrawal address: ${withdrawal_address}`);
    console.log(`final inf amount: ${amount}`);
}