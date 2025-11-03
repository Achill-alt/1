```markdown
# AI 图像生成器（前端 + 后端代理）

说明
- 本项目包含一个前端页面（index.html + main.js）用于 UI 与交互，以及一个可选的后端代理（server.js）用于安全地保存 API Key 并向上游（Hugging Face 或 OpenAI）发起图像生成请求。
- 这样做的好处：不会在浏览器中暴露 API Key，避免 CORS/权限问题，同时后端可以对请求做标准化与错误处理，返回统一 data:image/png;base64,... 格式，前端直接展示。

运行步骤（本地开发）
1. 克隆或下载本仓库
2. 安装依赖（在项目根目录）：
   npm install
3. 复制 .env.example 为 .env，并在其中配置你的 API Key 与 PROVIDER：
   PROVIDER=huggingface
   HUGGINGFACE_API_KEY=hf_xxx
   # 或使用 OpenAI:
   # PROVIDER=openai
   # OPENAI_API_KEY=sk-...
4. 启动后端：
   npm start
5. 打开浏览器访问：
   http://localhost:3000

使用说明
- 在“设置”->“API密钥”输入框保存你的 API Key（前端会发送到后端 /api/save-key 接口用于演示；也可直接在 .env 中配置）。
- 点击“测试连接”可检测后端是否正确配置并能访问模型。
- 输入提示词并点击“开始生成”，前端会把请求发送到后端 /api/generate，后端代理请求上游模型并返回 dataURI，前端展示并可保存至历史。

注意
- 请勿在生产环境中直接把 API Key 保存在前端或把 /api/save-key 这样的未加认证的接口暴露给未授权用户。生产中应使用安全的密钥管理方案（Vault、服务端环境变量、RBAC）。
- 如果你使用 Hugging Face，请根据模型的特性调整请求的参数（某些模型不支持 width/height 或需要不同的 payload 格式）。本后端示例采用通用 payload（inputs + parameters），能兼容大多数 HF 模型。
```
