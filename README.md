# Infinium-tipbot

## About

This is discord tipbot for infinium-8 cryptocurrency. It makes easy payments throut discord with infinium-8 cryptocurrency.

## Running the tipbot on linux
You will firstly need to install nodejs and then you can follow these steps:
## Configuring Tipbot

### edit bot_loop.sh
modify the NODEJS_BIN variable on line 3 of bot_loop.sh to reflect your nodejs bin location
### edit config.jsom
The only thing you really need is to input your discord bot token on line 2 and then you can change your walletd port on line 3

## Create RPC wallet
* You will need to do this in folder where you have your infinium coin binaries, if you don't have binaries you can compile them from [this code](https://github.com/Infinium-dev/Infinium)
* Then you will go to bin folder

### run your infinium daemon
```
$> ./infiniumd
```
## then you need to create BIP39 mnemonics
```
$> ./walletd --create-mnemonic --mnemonic-strength=256
```
## then you can create rpc wallet file
```
$> ./walletd --infiniumd-remote-address=127.0.0.1:27855 --wallet-file=tipbot.wallet --walletd-bind-address=127.0.0.1:27857 --create-wallet
```
and you will need to fill your BIP39 mnemonics and your new prc wallet password
## then you can start your rpc wallet
```
$> echo -e "<wallet_password>\n" | ./walletd --infiniumd-remote-address=127.0.0.1:27855 --wallet-file=tipbot.wallet --walletd-bind-address=127.0.0.1:27857
```
## and after this you can start the tipbot
```
$tipbot_dir> npm update
$tipbot_dir> ./bot_loop.sh
```