require('dotenv').config();
const request_json = require('request-json');
const fs = require('fs');
const fileName = './user_list.json';
const p_fileName = './prepaid_addesses.json';
const file = require(fileName);
const p_file = require(p_fileName);
const config_file = fs.readFileSync('config.json');
const config__filejson_parsed = JSON.parse(config_file);
console.log(file);
const Discord = require('discord.js');
//const { config } = require('dotenv/types');
const bot = new Discord.Client();
//const TOKEN = process.env.TOKEN;
const TOKEN = config__filejson_parsed.DiscordToken;
const rpc_wallet_host = config__filejson_parsed.rpc_wallet_host;
const infinium_decimal_places = config__filejson_parsed.decimal_places;
const infinium_fee_per_byte = config__filejson_parsed.fee_per_byte;
const welcome_dm = config__filejson_parsed.welcome_dm;
const welcome_dm_s = config__filejson_parsed.welcome_dm_sorry;
var pp_new_address = "";
var pp_new_status = "";

bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
})

bot.on('message', msg => {
  console.log(msg.content);
  if (msg.content.startsWith('/welcome')) {
    if (msg.mentions.users.size) {
      //msg.reply('Yay!');
      msg.delete(500);
      if (file[msg.mentions.users.first()] == null) {
        if (GiveWalletAddress(msg.mentions.users.first())) {
          msg.mentions.users.first().send(welcome_dm);
        } else {
          msg.mentions.users.first().send(welcome_dm_s);
        }
      } else {
        msg.reply('You already have tipbot address generated!');
      }
    } else {
      msg.reply('Please tag a valid user!');
    }

  } else if (msg.content.startsWith('/tip')) {
    if (msg.mentions.users.size) {
      const taggedUser = msg.mentions.users.first();
      //msg.channel.send(`You wanted to kick: ${taggedUser.username}`);
      var msg_cote = msg.content,
        extracted_amount = "",
        push_to_extraxted_amount = 0;
      for (var i = 0; i < msg_cote.length; i++) {
        if (push_to_extraxted_amount == 1) extracted_amount += msg_cote[i];
        if (msg_cote[i] == ">") push_to_extraxted_amount = 1;
      }
      console.log(extracted_amount);
      extracted_amount = extracted_amount.match(/[\d\.,]+/); //extract ony number value
      console.log("s:" + extracted_amount);
      if (extracted_amount == null) {
        msg.channel.send("Please write valid number! :infinity:")
      } else {
        extracted_amount = extracted_amount.join("");
        SendTip(msg.author.id, taggedUser.id, extracted_amount, msg);
        //msg.channel.send(`your inf amout: ${extracted_amount}`);
      }
    } else {
      msg.reply('Please tag a valid user!');
    }
  } else if (msg.content.startsWith('/generate')) {
    if (file[msg.author.id] == null) {
      GetWalletAddress(msg.author.id, msg);
    } else {
      msg.reply('You already have tipbot address generated!');
    }
  } else if (msg.content.startsWith('/balance')) {
    if (file[msg.author.id] == null) {
      msg.reply("You need to generate tipbot address first with `/generate` !");
    } else {
      GetUserBalance(msg);
    }
  } else if (msg.content.startsWith('/address')) {
    if (file[msg.author.id] == null) {
      msg.reply("You need to generate tipbot address first with `/generate` !");
    } else {
      GetUserAddress(msg);
    }
  } else if (msg.content.startsWith('/help')) {
    msg.reply(config__filejson_parsed.help_message);
  } else if (msg.content.startsWith('/withdraw')) {
    //This is used to withdraw your money
    var msg_cote2 = msg.content,
      extracted_amount2 = "",
      push_to_extraxted_amount2 = 0,
      extracted_address = "";
    for (var i = 0; i < msg_cote2.length; i++) {
      if (push_to_extraxted_amount2 > 1) extracted_amount2 += msg_cote2[i];
      if (push_to_extraxted_amount2 == 1 && msg_cote2[i] != " ") extracted_address += msg_cote2[i];
      if (msg_cote2[i] == " ") push_to_extraxted_amount2++;
    }
    console.log(extracted_amount2);
    extracted_amount2 = extracted_amount2.match(/[\d\.,]+/); //extract ony number value
    console.log("withdrawal amount: " + extracted_amount2);
    if (extracted_address == "") {
      msg.author.send("Please write your wallet address");
    } else {
      SendWithdrawal(msg.author.id, extracted_address, extracted_amount2, msg)
    }
    //
  }
});


function AddFileValue(userid, address) {
  console.log("adresa" + address)
  file[userid] = address;

  fs.writeFile(fileName, JSON.stringify(file), function writeJSON(err) {
    if (err) return console.log(err);
    console.log(JSON.stringify(file));
    console.log('writing to ' + fileName);
  });
}

function p_AddFileValue(num, address) {
  console.log("adresa" + address)
  p_file[num] = address;

  fs.writeFile(p_fileName, JSON.stringify(p_file), function writeJSON(err) {
    if (err) return console.log(err);
    console.log(JSON.stringify(p_file));
    console.log('writing to ' + p_fileName);
  });
}

function GetWalletAddress(discord_id, msg_4_reply) { //get new wallet address
  var client_json_rpc = request_json.createClient(rpc_wallet_host);
  var new_address = "d";
  client_json_rpc.post('/json_rpc', {
    "jsonrpc": "2.0",
    "id": "test",
    "method": "create_addresses",
    "params": {
      "secret_spend_keys": ["", ""]
    }
  }, function (err, res, body) {
    if (err == null) {
      console.log("reading create_addresses from walletd [\x1b[32mOK\x1b[0m]");

      if (body.result.addresses[0]) {
        console.log(body.result.addresses[0]);
        //return body.result.addresses[0];
      }
      setTimeout(function () {
        AddFileValue(discord_id, body.result.addresses[0]);
        msg_4_reply.author.send(" Your wallet has been generated :infinity: \nYour wallet address is: `" + body.result.addresses[0] + "`");
      }, config__filejson_parsed.rpc_wallet_normal_delay);
      //return new_address;
    } else {
      console.log("reading create_addresses from walletd [\x1b[31mERROR\x1b[0m]");
      console.log("error");
    }
  });
}

function GetUserBalance(msg_4_reply) {
  if (file[msg_4_reply.author.id] != null) {
    var client_json_rpc = request_json.createClient(rpc_wallet_host);
    var new_address = "d";
    client_json_rpc.post('/json_rpc', {
      "jsonrpc": "2.0",
      "id": "test",
      "method": "get_balance",
      "params": {
        "height_or_depth": -6,
        "address": file[msg_4_reply.author.id]
      }
    }, function (err, res, body) {
      if (err == null) {
        console.log("reading get_balance from  [\x1b[32mOK\x1b[0m]");

        setTimeout(function () {
          msg_4_reply.author.send("  Your Infinium :moneybag: balance is: \n\nUnlocked:  `" + (body.result.spendable / infinium_decimal_places).toFixed(12) + "` INF \nLocked:      `" + (body.result.locked_or_unconfirmed / infinium_decimal_places).toFixed(12) + "`  INF \n\nYou need 6 confirmations :lock: to unlock your deposit, so if you have locked balance you just need to wait");
        }, config__filejson_parsed.rpc_wallet_normal_delay);
        //return new_address;
      } else {
        console.log("reading get_balance from [\x1b[31mERROR\x1b[0m]");
        console.log("error");
      }
    });
  }
}

function GetUserAddress(msg_4_reply) {
  if (file[msg_4_reply.author.id] != null) {
    msg_4_reply.author.send("Your wallet address is: `" + file[msg_4_reply.author.id] + "`");
  }
}


function SendTip(tiper_boii, tiped_boii, amount, msg_4_reply) {
  if (file[tiper_boii] == null) {
    msg_4_reply.reply("You need to generate tipbot address first with `/generate` !");
    return;
  }
  if (file[tiped_boii] == null) {
    msg_4_reply.reply("The user you are trying to tip didn't generated his wallet yet. User you are trying to tip need to generate tipbot addres with `/generate`");
    return;
  }
  if (tiper_boii == tiped_boii) {
    msg_4_reply.reply("You can't tip yourself");
    return;
  }
  // Create tip tx
  var client_json_rpc = request_json.createClient(rpc_wallet_host);
  client_json_rpc.post('/json_rpc', {
    "jsonrpc": "2.0",
    "id": "test",
    "method": "create_transaction",
    "params": {
      "transaction": {
        "anonymity": 6,
        "payment_id": "",
        "transfers": [{
          "address": file[tiped_boii],
          "amount": amount * infinium_decimal_places
        }]
      },
      "spend_addresses": [
        file[tiper_boii]
      ],
      "change_address": file[tiper_boii],
      "optimization": "minimal",
      "confirmed_height_or_depth": -6,
      "fee_per_byte": infinium_fee_per_byte
    }
  }, function (err, res, body) {
    if (err == null) {
      console.log("reading create_transaction from  [\x1b[32mOK\x1b[0m]");
      console.log(body);

      setTimeout(function () {
        if (body.error) {
          if (body.error.code == -301) {
            msg_4_reply.reply("Not enough unlocker balance");
            return;
          }
          if (body.error.code == -302) {
            msg_4_reply.reply("Transaction too big");
            return;
          }
          if (body.error.code == -303) {
            msg_4_reply.reply("Not enough anonymity, try sending smaller transaction");
            return;
          }
        }
        if (body.result) {
          var tx_template_body = body;

          //send tip tx
          client_json_rpc.post('/json_rpc', {
            "jsonrpc": "2.0",
            "id": "test",
            "method": "send_transaction",
            "params": {
              "binary_transaction": tx_template_body.result.binary_transaction
            }
          }, function (err, res, body) {
            if (err == null) {
              console.log("reading send_transaction from  [\x1b[32mOK\x1b[0m]");

              setTimeout(function () {
                if (body.result) {
                  if (body.result.send_result == "broadcast") {
                    msg_4_reply.reply("Congratulation :tada: You have tiped <@" + tiped_boii + "> with `" + amount + "` INF\nYou can check transaction detaild here: " + config__filejson_parsed.tx_explorer + tx_template_body.result.transaction.hash);
                  }
                }
              }, config__filejson_parsed.rpc_wallet_normal_delay);
            } else {
              console.log("reading send_transaction from [\x1b[31mERROR\x1b[0m]");
              console.log("error");
            }
          });
          //send tip tx

        }
      }, config__filejson_parsed.rpc_wallet_normal_delay);
      //return new_address;
    } else {
      console.log("reading create_transaction from [\x1b[31mERROR\x1b[0m]");
      console.log("error");
    }
  });


  console.log(`tiper boii: ${tiper_boii}`);
  console.log(`tiped boii: ${tiped_boii}`);
  console.log(`final inf amount: ${amount}`);
}

//Withdraw function
function SendWithdrawal(tiper_boii, withdrawal_address, amount, msg_4_reply) {
  if (file[tiper_boii] == null) {
    msg_4_reply.reply("You need to generate tipbot address first with `/generate` !");
    return;
  }
  if (withdrawal_address == null) {
    msg_4_reply.reply("You need to write your infinium wallet address");
    return;
  }
  // Create withdrawal tx
  var client_json_rpc = request_json.createClient(rpc_wallet_host);
  client_json_rpc.post('/json_rpc', {
    "jsonrpc": "2.0",
    "id": "test",
    "method": "create_transaction",
    "params": {
      "transaction": {
        "anonymity": 6,
        "payment_id": "",
        "transfers": [{
          "address": withdrawal_address,
          "amount": amount * infinium_decimal_places
        }]
      },
      "spend_addresses": [
        file[tiper_boii]
      ],
      "change_address": file[tiper_boii],
      "optimization": "minimal",
      "confirmed_height_or_depth": -6,
      "fee_per_byte": infinium_fee_per_byte
    }
  }, function (err, res, body) {
    if (err == null) {
      console.log("reading create_transaction from  [\x1b[32mOK\x1b[0m]");
      console.log(body);

      setTimeout(function () {
        if (body.error) {
          if (body.error.code == -301) {
            msg_4_reply.reply("Not enough unlocker balance");
            return;
          }
          if (body.error.code == -302) {
            msg_4_reply.reply("Transaction too big");
            return;
          }
          if (body.error.code == -303) {
            msg_4_reply.reply("Not enough anonymity, try sending smaller transaction");
            return;
          }
          if (body.error.code == -4) {
            msg_4_reply.reply("Invalid wallet address");
            return;
          }
        }
        if (body.result) {
          var tx_template_body = body;

          //send withrawal tx
          client_json_rpc.post('/json_rpc', {
            "jsonrpc": "2.0",
            "id": "test",
            "method": "send_transaction",
            "params": {
              "binary_transaction": tx_template_body.result.binary_transaction
            }
          }, function (err, res, body) {
            if (err == null) {
              console.log("reading send_transaction from  [\x1b[32mOK\x1b[0m]");

              setTimeout(function () {
                if (body.result) {
                  if (body.result.send_result == "broadcast") {
                    msg_4_reply.reply("Congratulations :tada: , you have withdrawed to " + withdrawal_address + " `" + amount + "` INF\nYou can check transaction detaild here: " + config__filejson_parsed.tx_explorer + tx_template_body.result.transaction.hash);
                  }
                }
              }, config__filejson_parsed.rpc_wallet_normal_delay);
            } else {
              console.log("reading send_transaction from [\x1b[31mERROR\x1b[0m]");
              console.log("error");
            }
          });
          //send withrawal tx

        }
      }, config__filejson_parsed.rpc_wallet_normal_delay);
      //return new_address;
    } else {
      console.log("reading create_transaction from [\x1b[31mERROR\x1b[0m]");
      console.log("error");
    }
  });


  console.log(`withdrawer boii: ${tiper_boii}`);
  console.log(`withdrawal address: ${withdrawal_address}`);
  console.log(`final inf amount: ${amount}`);
}

// Bounty for new users

function GiveWalletAddress(discord_id) { //get new wallet address
  var ii_max = config__filejson_parsed.prepaid_addressed,
    is_sucess = false;
  for (var ii = 0; ii < ii_max; ii++) {
    if (p_file[ii] == false) {

    } else {
      var mod_discord_id = discord_id.toString().replace('<', '');
      mod_discord_id = mod_discord_id.toString().replace('@', '');
      mod_discord_id = mod_discord_id.toString().replace('>', '');
      AddFileValue(mod_discord_id, p_file[ii]);
      p_AddFileValue(ii, false);
      ii = ii_max + 1;
      is_sucess = true;
    }
  }
  if (is_sucess == false) {
    return false;
  } else {
    return true;
  }
}

function GetEmptyPrepaidWallet() {
  var ii_max = config__filejson_parsed.prepaid_addressed,
    is_sucess = false;
  for (var ii = 0; ii < ii_max; ii++) {
    if (p_file[ii] == false) return ii;
  }
  return "r_false";
}

function FillEmptyPrepaidWallet(pp_address,ii_num) {
  p_AddFileValue(ii_num,pp_address);
  pp_new_address="";
  pp_new_status="";
}

function GetPrepaidBalance(pp_address){
  if (pp_address != "") {
    var client_json_rpc2 = request_json.createClient(rpc_wallet_host);
    client_json_rpc2.post('/json_rpc', {
      "jsonrpc": "2.0",
      "id": "test",
      "method": "get_balance",
      "params": {
        "height_or_depth": -6,
        "address": pp_address
      }
    }, function (err, res, body) {
      if (err == null) {
        console.log("reading get_balance from  [\x1b[32mOK\x1b[0m]");

        setTimeout(function () {
          if ((body.result.spendable / infinium_decimal_places) > config__filejson_parsed.give_coins_to_new_users-1){
            FillEmptyPrepaidWallet(pp_address, GetEmptyPrepaidWallet());
          }
          console.log("Wallet don't have prepaid confirmed yet!");
          //msg_4_reply.author.send("  Your Infinium :moneybag: balance is: \n\nUnlocked:  `" + (body.result.spendable / infinium_decimal_places).toFixed(12) + "` INF \nLocked:      `" + (body.result.locked_or_unconfirmed / infinium_decimal_places).toFixed(12) + "`  INF \n\nYou need 6 confirmations :lock: to unlock your deposit, so if you have locked balance you just need to wait");
        }, config__filejson_parsed.rpc_wallet_faucet_delay);
        //return new_address;
      } else {
        console.log("reading get_balance from [\x1b[31mERROR\x1b[0m]");
        console.log("error");
      }
    });
  }
}

function CreatePrepaidAddresses() {
  var client_json_rpc = request_json.createClient(rpc_wallet_host);
  client_json_rpc.post('/json_rpc', {
    "jsonrpc": "2.0",
    "id": "test",
    "method": "get_balance",
    "params": {
      "height_or_depth": -6,
      "address": config__filejson_parsed.prepaid_input_wallet
    }
  }, function (err, res, body) {
    if (err == null) {
      console.log("reading get_balance from airdrop wallet [\x1b[32mOK\x1b[0m]");

      setTimeout(function () {
        if ((body.result.spendable / infinium_decimal_places) > (config__filejson_parsed.give_coins_to_new_users + 1)) {
          var emp = GetEmptyPrepaidWallet();
          console.log("EMP: "+emp);
          if (emp == "r_false") {
            console.log("oh shit!");
            // Do nothing, all wallets are full
          } else {
            console.log("Generating wallet on position: " + emp);

            //Wallet generation sequence
            client_json_rpc.post('/json_rpc', {
              "jsonrpc": "2.0",
              "id": "test",
              "method": "create_addresses",
              "params": {
                "secret_spend_keys": ["", ""]
              }
            }, function (err, res, body) {
              if (err == null) {
                console.log("reading create_addresses from walletd [\x1b[32mOK\x1b[0m]");

                if (body.result.addresses[0]) {
                  console.log("Generated walled: " + body.result.addresses[0]);
                  //return body.result.addresses[0];
                }
                setTimeout(function () {
                  pp_new_address = body.result.addresses[0];

                  // Send tx to pp_new_address
                  client_json_rpc.post('/json_rpc', {
                    "jsonrpc": "2.0",
                    "id": "test",
                    "method": "create_transaction",
                    "params": {
                      "transaction": {
                        "anonymity": 6,
                        "payment_id": "",
                        "transfers": [{
                          "address": pp_new_address,
                          "amount": config__filejson_parsed.give_coins_to_new_users * infinium_decimal_places
                        }]
                      },
                      "spend_addresses": [
                        config__filejson_parsed.prepaid_input_wallet
                      ],
                      "change_address": config__filejson_parsed.prepaid_input_wallet,
                      "optimization": "minimal",
                      "confirmed_height_or_depth": -6,
                      "fee_per_byte": infinium_fee_per_byte
                    }
                  }, function (err, res, body) {
                    if (err == null) {
                      console.log("reading create_transaction from  [\x1b[32mOK\x1b[0m]");
                      console.log(body);

                      setTimeout(function () {
                        if (body.error) {
                          if (body.error.code == -301) {
                            console.log("Not enough unlocker balance");
                            return;
                          }
                          if (body.error.code == -302) {
                            console.log("Transaction too big");
                            return;
                          }
                          if (body.error.code == -303) {
                            console.log("Not enough anonymity, try sending smaller transaction");
                            return;
                          }
                          if (body.error.code == -4) {
                            console.log("Invalid wallet address");
                            return;
                          }
                        }
                        if (body.result) {
                          var tx_template_body = body;

                          //send withrawal tx
                          client_json_rpc.post('/json_rpc', {
                            "jsonrpc": "2.0",
                            "id": "test",
                            "method": "send_transaction",
                            "params": {
                              "binary_transaction": tx_template_body.result.binary_transaction
                            }
                          }, function (err, res, body) {
                            if (err == null) {
                              console.log("reading send_transaction from  [\x1b[32mOK\x1b[0m]");

                              setTimeout(function () {
                                if (body.result) {
                                  if (body.result.send_result == "broadcast") {
                                    pp_new_status="pending";
                                    //msg_4_reply.reply("Congratulations :tada: , you have withdrawed to " + withdrawal_address + " `" + amount + "` INF\nYou can check transaction detaild here: " + config__filejson_parsed.tx_explorer + tx_template_body.result.transaction.hash);
                                  }
                                }
                              }, config__filejson_parsed.rpc_wallet_normal_delay);
                            } else {
                              console.log("reading send_transaction from [\x1b[31mERROR\x1b[0m]");
                              console.log("error");
                            }
                          });
                          //send withrawal tx

                        }
                      }, config__filejson_parsed.rpc_wallet_normal_delay);
                      //return new_address;
                    } else {
                      console.log("reading create_transaction from [\x1b[31mERROR\x1b[0m]");
                      console.log("error");
                    }
                  });
                  // Send tx to pp_new_address

                }, config__filejson_parsed.rpc_wallet_faucet_delay);
                //return new_address;
              } else {
                console.log("reading create_addresses from walletd [\x1b[31mERROR\x1b[0m]");
                return;
              }
            });
            //Wallet generation sequence

          }
        }
      }, config__filejson_parsed.rpc_wallet_faucet_delay);
      //return new_address;
    } else {
      console.log("reading get_balance from [\x1b[31mERROR\x1b[0m]");
      console.log("error");
    }
  });
}
// Start processing prepaid
ProcessPrepaidWallets();

function ProcessPrepaidWallets(){
  if (pp_new_status == "") CreatePrepaidAddresses();
  if (pp_new_status == "pending"){
    GetPrepaidBalance(pp_new_address);
  }
  //loop
  setTimeout(function () {
    ProcessPrepaidWallets();
  }, config__filejson_parsed.wallet_fill_update_interval);
}