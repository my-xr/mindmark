const fs=require('fs');
let p='docs/10_AI能力与人工审核规范.md';
let s=fs.readFileSync(p,'utf8');
s=s.replace('Provider 配置字段：`providerCode`、`baseUrl`、`model`、`encryptedApiKey`、`enabled`、`ownerScope`。', 'Provider 配置字段：`providerCode`、`baseUrl`、`model`、`encryptedApiKey`、`enabled`、`ownerScope`。AI 出题页面只选择 Provider，服务器地址、模型和 Key 在教师个人配置中维护。');
fs.writeFileSync(p,s,'utf8');

p='docs/08_API设计规范.md';
s=fs.readFileSync(p,'utf8');
s=s.replace('- `PUT` | `/ai/provider-settings` | 保存当前教师的 Provider API Key', '- `PUT` | `/ai/provider-settings` | 保存当前教师的 Provider 连接参数（baseUrl / model / apiKey）');
fs.writeFileSync(p,s,'utf8');
