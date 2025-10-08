# 安全措施文档

## 频率限制

### 短期限制
- **窗口**: 60秒
- **请求数**: 3次
- **目的**: 防止快速刷新攻击

### 每日限制
- **窗口**: 24小时
- **请求数**: 50次
- **目的**: 防止长期滥用

### 响应
- 超出限制返回 `429 Too Many Requests`
- 包含 `retryAfter` 字段（秒）

## CORS 保护

### 允许的来源
- `https://color.pages.dev` (生产环境)
- `http://localhost:5173` (开发环境 - Vite)
- `http://localhost:4173` (预览环境 - Vite)

### 配置
- 仅允许 `POST` 和 `OPTIONS` 方法
- 仅允许 `Content-Type` 头
- 预检请求缓存 24 小时

## 输入验证

### Payload 大小
- 最大: 10KB
- 超出返回 `413 Payload Too Large`

### 数据验证
- **userId**: 必须匹配格式 `user_\d+_[a-z0-9]+`，最长100字符
- **deviceType**: 必须是 `mobile`、`tablet` 或 `desktop`
- **colors**: JSON数组，1-50个有效hex颜色
- **positions**: JSON数组，1-50个有效位置对象

### 请求头验证
- 必须有有效的 `CF-Connecting-IP`
- 必须有有效的 `User-Agent`
- 拒绝 `unknown` 值

## 数据库安全

### 索引优化
- `idx_client_ip_created_at`: 复合索引用于快速频率限制查询
- 使用 `COUNT(*)` 而非 `SELECT *` 减少数据传输

### SQL 注入防护
- 使用参数化查询（`.bind()`）
- 所有用户输入都经过验证

## 建议的额外措施

### 生产环境
1. 配置 Cloudflare WAF 规则
2. 启用 Bot Fight Mode
3. 设置 IP 黑名单
4. 监控异常流量模式

### 环境变量
建议将 `ALLOWED_ORIGINS` 移到环境变量：
```toml
[vars]
ALLOWED_ORIGINS = "https://color.pages.dev,http://localhost:5173"
```

### 日志和监控
- 记录所有 429 响应
- 监控单个 IP 的请求模式
- 设置告警阈值
