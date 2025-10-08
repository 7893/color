# 数据库迁移说明

## 修复内容
1. 修复了速率限制逻辑错误，需要添加 `client_ip` 字段
2. 优化索引结构，移除不支持的部分索引
3. 添加数据库层面的约束检查

## 迁移步骤

### 对于新部署
直接使用 `schema.sql` 创建数据库。

### 对于已有数据库
执行以下 SQL 语句：

```sql
-- 1. 添加 client_ip 字段（如果还没有）
ALTER TABLE color_snapshots ADD COLUMN client_ip TEXT;

-- 2. 为已有数据填充默认值
UPDATE color_snapshots SET client_ip = 'unknown' WHERE client_ip IS NULL;

-- 3. 删除旧索引
DROP INDEX IF EXISTS idx_client_ip;
DROP INDEX IF EXISTS idx_unknown_ip_ua;

-- 4. 创建新索引
CREATE INDEX IF NOT EXISTS idx_client_ip_created_at ON color_snapshots(client_ip, created_at);
CREATE INDEX IF NOT EXISTS idx_client_ip_ua_created_at ON color_snapshots(client_ip, user_agent, created_at);
CREATE INDEX IF NOT EXISTS idx_created_at ON color_snapshots(created_at);
```

## 注意事项
- 已有数据的 `client_ip` 将被设置为 'unknown'
- user_agent 现在存储前50字符以保持一致性
- 新的复合索引优化所有查询场景
- 数据库约束在新记录上生效，旧记录不受影响


