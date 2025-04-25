import chalk from 'chalk';
import ora from 'ora';
import readlineSync from 'readline-sync';
import { config } from './config.js';
import { formatToolResult } from './utils.js';
import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { createAnthropicClient } from './utils.js';


async function main() {
  console.log(chalk.cyan('================================================'));
  console.log(chalk.cyan('         欢迎使用智能商城 MCP 客户端           '));
  console.log(chalk.cyan('================================================'));
  
  // 初始化OpenAI客户端
  const aiClient = createAnthropicClient(config);
  
  // 连接MCP服务器
  const spinner = ora('正在连接到MCP服务器...').start();
  try {
    // 创建MCP客户端
    const mcpClient = new McpClient({
      name: 'mcp-sse-demo',
      version: '1.0.0',
    });

    const transport = new SSEClientTransport(
      new URL(config.mcp.serverUrl)
    );
    
    await mcpClient.connect(transport);

    // 获取可用工具
    const { tools } = await mcpClient.listTools();
    const toolset = tools.reduce((acc: Record<string, any>, tool: any) => {
      acc[tool.name] = {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema?.properties || {}
      };
      return acc;
    }, {});
    spinner.succeed('已连接到MCP服务器并获取工具列表');
    console.log(chalk.green('工具列表:'), toolset);
    // 转换为Anthropic工具格式
    const anthropicTools = tools.map((tool: any) => {
      return {
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
      };
    });
    
    // 交互式命令行循环
    while (true) {
      const question = readlineSync.question(chalk.green('请输入您的问题 (输入 "exit" 结束): '), {
        hideEchoBack: false,  // 显示输入内容
      });
      if (question.toLowerCase() === 'exit') {
        break;
      }
      
      // 调用AI
      const aiSpinner = ora('AI正在思考中...\n').start();

      try {
        const response = await aiClient.messages.create({
          model: config.ai.defaultModel,
          messages: [
            { role: 'user', content: question }
          ],
          tools: anthropicTools,
          max_tokens: 1000,
        });
        
        // 获取AI回复
        // console.log(chalk.gray('AI回复:'), response);
        aiSpinner.succeed('AI回复已就绪');
        
        // 处理AI回复
        for (const content of response.content) {
          if (content.type === 'text') {
            // 打印文本内容
            console.log(chalk.blue('AI回答:'), content.text);
          } else if (content.type === 'tool_use') {
            // 处理工具调用
            console.log(chalk.yellow('\n工具调用:'));
            
            // 获取工具调用信息
            const toolName = content.name;
            const toolInput = content.input as { [x: string]: unknown } | undefined;
            
            console.log(chalk.blue(`调用工具: ${toolName}`));
            console.log(chalk.gray(`参数: ${JSON.stringify(toolInput, null, 2)}`));
            
            // 调用MCP工具
            const toolSpinner = ora(`正在执行 ${toolName}...`).start();
            try {
              const result = await mcpClient.callTool({
                name: toolName,
                arguments: toolInput
              });
              toolSpinner.succeed(`${toolName} 执行完成`);
              
              // 格式化并显示结果
              const formattedResult = formatToolResult(result);
              
              // 发送工具结果给AI
              const followUpResponse = await aiClient.messages.create({
                model: config.ai.defaultModel,
                messages: [
                  { role: 'user', content: question },
                  // { role: 'assistant', content: response.content },
                  { role: 'user', content: formattedResult }
                ],
                max_tokens: 1000
              });
              
              // 打印最终回复
              if (followUpResponse.content) {
                followUpResponse.content.forEach((content: any) => {
                  if (content.type === 'text') {
                    console.log(chalk.blue('最终回答:'), content.text);
                  }
                });
              }
            } catch (error: any) {
              toolSpinner.fail(`${toolName} 执行失败: ${error.message}`);
            }
          }
        }
    
      } catch (error: any) {
        aiSpinner.fail(`调用AI失败: ${error.message}`);
      }
      
      console.log('\n' + chalk.cyan('-----------------------------------------------') + '\n');
    }
    
    console.log(chalk.cyan('感谢使用，再见！'));
    process.exit(0);
  } catch (error: any) {
    spinner.fail(`连接MCP服务器失败: ${error.message}`);
    process.exit(1);
  }
}


main().catch(error => {
  console.error(chalk.red('程序运行出错:'), error);
  process.exit(1);
}); 