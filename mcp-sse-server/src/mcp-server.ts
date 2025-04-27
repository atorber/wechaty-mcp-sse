#!/usr/bin/env -S node --no-warnings --loader ts-node/esm

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
// import { getProducts, getInventory, getOrders, createPurchase } from "./services/inventory-service.js";

import 'dotenv/config.js'

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

bot.start()
  .then(() => log.info('StarterBot', 'Starter Bot Started.'))
  .catch((e: any) => log.error('StarterBot', e))

export const server = new McpServer({
  name: "wechaty-mcp-sse",
  version: "1.0.0",
  description: "提供发送消息给用户和聊天室或群组的功能"
});

// 发送消息给好友
server.tool(
  "sendMessageToFriend",
  "发送消息给好友",
  {
    nickname: z.string().describe("好友昵称"),
    message: z.string().describe("消息内容")
  },
  async ({ nickname, message }) => {
    console.log("发送消息");
    const contact = await bot.Contact.find({ name: nickname });
    console.log("contact", contact);
    if (!contact) {
        return {
          content: [
            { type: "text", text: `「${nickname}」用户不存在` }
          ]
        };
    }
    await contact.say(message);
    return {
      content: [
        { type: "text", text: `消息发送消息到「${nickname}」成功，发送时间 ${new Date().toISOString()}` }
      ]
    };
  }
);

// 发送消息给群组
server.tool(
  "sendMessageToRoom",
  "发送消息给群组",
  {
    topic: z.string().describe("群组名称"),
    message: z.string().describe("消息内容")
  },
  async ({ topic, message }) => {
    console.log("发送消息给群组", { topic, message });
    const room = await bot.Room.find({ topic: topic });
    if (!room) {
      return {
        content: [
          { type: "text", text: `「${topic}」群组不存在` }
        ]
      };
    }
    await room.say(message);
    return {
      content: [
        { type: "text", text: `消息发送消息到「${topic}」成功，发送时间 ${new Date().toISOString()}` }
      ]
    };
  }
);

/*

// 获取产品列表工具
server.tool(
  "getProducts", 
  "获取所有产品信息", 
  {}, 
  async () => {
    console.log("获取产品列表");
    const products = await getProducts();
    return { 
      content: [
        { 
          type: "text", 
          text: JSON.stringify(products) 
        }
      ] 
    };
  }
);

// 获取库存信息工具
server.tool(
  "getInventory", 
  "获取所有产品的库存信息", 
  {}, 
  async () => {
    console.log("获取库存信息");
    const inventory = await getInventory();
    return { 
      content: [
        { 
          type: "text", 
          text: JSON.stringify(inventory) 
        }
      ] 
    };
  }
);

// 获取订单列表工具
server.tool(
  "getOrders", 
  "获取所有订单信息", 
  {}, 
  async () => {
    console.log("获取订单列表");
    const orders = await getOrders();
    return { 
      content: [
        { 
          type: "text", 
          text: JSON.stringify(orders) 
        }
      ] 
    };
  }
);

// 购买商品工具
server.tool(
  "purchase",
  "购买商品",
  {
    items: z
      .array(
        z.object({
          productId: z.number().describe("商品ID"),
          quantity: z.number().describe("购买数量")
        })
      )
      .describe("要购买的商品列表"),
    customerName: z.string().describe("客户姓名")
  },
  async ({ items, customerName }) => {
    console.log("处理购买请求", { items, customerName });
    try {
      const order = await createPurchase(customerName, items);
      return { 
        content: [
          { 
            type: "text", 
            text: JSON.stringify(order) 
          }
        ] 
      };
    } catch (error: any) {
      return { 
        content: [
          { 
            type: "text", 
            text: JSON.stringify({ error: error.message }) 
          }
        ] 
      };
    }
  }
); 

*/