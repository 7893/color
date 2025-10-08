# 数据库迁移说明

## 修复内容
修复了速率限制逻辑错误，需要添加 `client_ip` 字段。

## 迁移步骤

### 对于新部署
直接使用 `schema.sql` 创建数据库。

### 对于已有数据库
执行以下 SQL 语句：

```sql
-- 添加 client_ip 字段
ALTER TABLE color_snapshots ADD COLUMN client_ip TEXT;

-- 为已有数据填充默认值
UPDATE color_snapshots SET client_ip = 'unknown' WHERE client_ip IS NULL;

-- 创建索引
CREATE INDEX idx_client_ip ON color_snapshots(client_ip);
CREATE INDEX idx_client_ip_created_at ON color_snapshots(client_ip, created_at);
```

## 注意事项
- 已有数据的 `client_ip` 将被设置为 'unknown'
- 速率限制将从迁移后开始正常工作
