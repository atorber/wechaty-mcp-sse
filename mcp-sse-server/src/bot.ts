import {
    Contact,
    Message,
    ScanStatus,
    WechatyBuilder,
    log,
  } from 'wechaty'
  
  import qrcodeTerminal from 'qrcode-terminal'
  
  function onScan (qrcode: string, status: ScanStatus) {
    if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
      const qrcodeImageUrl = [
        'https://wechaty.js.org/qrcode/',
        encodeURIComponent(qrcode),
      ].join('')
      log.info('StarterBot', 'onScan: %s(%s) - %s', ScanStatus[status], status, qrcodeImageUrl)
  
      qrcodeTerminal.generate(qrcode, { small: true })  // show qrcode on console
  
    } else {
      log.info('StarterBot', 'onScan: %s(%s)', ScanStatus[status], status)
    }
  }
  
  function onLogin (user: Contact) {
    log.info('StarterBot', '%s login', user)
  }
  
  function onLogout (user: Contact) {
    log.info('StarterBot', '%s logout', user)
  }
  
  async function onMessage (msg: Message) {
    log.info('StarterBot', msg.toString())
  
    if (msg.text() === 'ding') {
      await msg.say('dong')
    }
  }
  
  const bot = WechatyBuilder.build({
    name: 'ding-dong-bot',
    puppet: 'wechaty-puppet-padlocal',
    puppetOptions: {
      token: process.env.WECHATY_PUPPET_TOKEN,
    },
    /**
     * You can specific `puppet` and `puppetOptions` here with hard coding:
     *
    puppet: 'wechaty-puppet-wechat',
    puppetOptions: {
      uos: true,
    },
     */
    /**
     * How to set Wechaty Puppet Provider:
     *
     *  1. Specify a `puppet` option when instantiating Wechaty. (like `{ puppet: 'wechaty-puppet-whatsapp' }`, see below)
     *  1. Set the `WECHATY_PUPPET` environment variable to the puppet NPM module name. (like `wechaty-puppet-whatsapp`)
     *
     * You can use the following providers locally:
     *  - wechaty-puppet-wechat (web protocol, no token required)
     *  - wechaty-puppet-whatsapp (web protocol, no token required)
     *  - wechaty-puppet-padlocal (pad protocol, token required)
     *  - etc. see: <https://wechaty.js.org/docs/puppet-providers/>
     */
    // puppet: 'wechaty-puppet-whatsapp'
  
    /**
     * You can use wechaty puppet provider 'wechaty-puppet-service'
     *   which can connect to remote Wechaty Puppet Services
     *   for using more powerful protocol.
     * Learn more about services (and TOKEN) from https://wechaty.js.org/docs/puppet-services/
     */
    // puppet: 'wechaty-puppet-service'
    // puppetOptions: {
    //   token: 'xxx',
    // }
  })
  
  bot.on('scan',    onScan)
  bot.on('login',   onLogin)
  bot.on('logout',  onLogout)
  // bot.on('message', onMessage)

  export default bot;
  export { bot, log };