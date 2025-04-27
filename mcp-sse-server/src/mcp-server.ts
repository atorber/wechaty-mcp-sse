#!/usr/bin/env -S node --no-warnings --loader ts-node/esm

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
// import { getProducts, getInventory, getOrders, createPurchase } from "./services/inventory-service.js";

import 'dotenv/config.js'

import { bot, log } from "./bot.js";

bot.start()
  .then(() => log.info('StarterBot', 'Starter Bot Started.'))
  .catch((e: any) => log.error('StarterBot', e))

export const server = new McpServer({
  name: "wechaty-mcp-sse",
  version: "1.0.0",
  description: "提供发送消息给用户和聊天室或群组的功能"
});

// 查找好友
server.tool(
  "findFriend",
  "查找好友",
  {
    nickname: z.string().describe("好友昵称")
  },
  async ({ nickname }) => {
    console.log("查找好友", { nickname });
    const contact = await bot.Contact.findAll({ name: nickname });
    console.log("contact", contact);
    if (!contact) {
      return {
        content: [
          { type: "text", text: `「${nickname}」用户不存在` }
        ]
      };
    }
    const contactList = contact.map((c) => ({
      wxid: c.id,
      name: c.name()
    }));
    
    return {
      content: [
        { type: "text", text: JSON.stringify(contactList) }
      ]
    };
  }
);

// 发送消息给好友
server.tool(
  "sendMessageToFriendByWxId",
  "发送消息给好友",
  {
    wxid: z.string().describe("微信ID"),
    message: z.string().describe("消息内容")
  },
  async ({ wxid, message }) => {
    console.log("发送消息给好友", { wxid, message });
    const contact = await bot.Contact.find({ id: wxid });
    console.log("contact", contact);
    if (!contact) {
      return {
        content: [
          { type: "text", text: `「${wxid}」用户不存在` }
        ]
      };
    }
    await contact.say(message);
    return {
      content: [
        { type: "text", text: `消息发送消息到「${wxid}」成功，发送时间 ${new Date().toISOString()}` }
      ]
    };
  }
);

// 发送消息给好友
server.tool(
  "sendMessageToFriendByNickname",
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

// 查找群组
server.tool(
  "findRoom",
  "查找群组",
  {
    topic: z.string().describe("群组名称")
  },
  async ({ topic }) => {
    console.log("查找群组", { topic });
    const room = await bot.Room.findAll({ topic: topic });
    console.log("room", room);
    const roomList = room.map((r) => ({
      wxid: r.id,
      name: r.topic()
    }));
    return {
      content: [
        { type: "text", text: JSON.stringify(roomList) }
      ]
    };
  }
);

// 发送消息给群组
server.tool(
  "sendMessageToRoomByWxId",
  "发送消息给群组",
  {
    wxid: z.string().describe("微信ID"),
    message: z.string().describe("消息内容")
  },
  async ({ wxid, message }) => {
    console.log("发送消息给群组", { wxid, message });
    const room = await bot.Room.find({ id: wxid });
    if (!room) {
      return {
        content: [
          { type: "text", text: `「${wxid}」群组不存在` }
        ]
      };
    }
    await room.say(message);
    return {
      content: [
        { type: "text", text: `消息发送消息到「${wxid}」成功，发送时间 ${new Date().toISOString()}` }
      ]
    };
  }
);

// 发送消息给群组
server.tool(
  "sendMessageToRoomByTopic",
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