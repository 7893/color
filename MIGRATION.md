# 数据库迁移说明

## 修复内容
1. 修复了速率限制逻辑错误，需要添加 `client_ip` 字段
2. 添加 unknown IP 的 user_agent 索引以优化查询性能

## 迁移步骤

### 对于新部署
直接使用 `schema.sql` 创建数据库。

### 对于已有数据库
执行以下 SQL 语句：

```sql
-- 添加 client_ip 字段（如果还没有）
ALTER TABLE color_snapshots ADD COLUMN client_ip TEXT;

-- 为已有数据填充默认值
UPDATE color_snapshots SET client_ip = 'unknown' WHERE client_ip IS NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_client_ip ON color_snapshots(client_ip);
CREATE INDEX IF NOT EXISTS idx_client_ip_created_at ON color_snapshots(client_ip, created_at);
CREATE INDEX IF NOT EXISTS idx_unknown_ip_ua ON color_snapshots(client_ip, user_agent, created_at) WHERE client_ip = 'unknown';
```

## 注意事项
- 已有数据的 `client_ip` 将被设置为 'unknown'
- user_agent 现在存储前50字符以保持一致性
- 新增的部分索引优化 unknown IP 的查询性能

