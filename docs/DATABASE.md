# 数据库配置说明

## 表结构

### color_snapshots

存储用户的颜色快照数据。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | TEXT | PRIMARY KEY | UUID |
| user_id | TEXT | NOT NULL | 用户ID，格式：user_\d+_[a-z0-9]+ |
| client_ip | TEXT | NOT NULL | 客户端IP或'unknown' |
| colors | TEXT | NOT NULL, ≤2000字符 | JSON数组，颜色列表 |
| positions | TEXT | NOT NULL, ≤5000字符 | JSON数组，位置信息 |
| device_type | TEXT | NOT NULL, IN(...) | mobile/tablet/desktop |
| created_at | TEXT | NOT NULL | ISO 8601时间戳 |
| user_agent | TEXT | ≤50字符 | User-Agent前50字符 |
| referer | TEXT | ≤500字符 | Referer头 |

## 索引策略

### idx_user_id
- **字段**: user_id
- **用途**: 按用户查询历史记录

### idx_client_ip_created_at
- **字段**: (client_ip, created_at)
- **用途**: 频率限制查询（真实IP）
- **查询**: `WHERE client_ip = ? AND created_at > ?`

### idx_client_ip_ua_created_at
- **字段**: (client_ip, user_agent, created_at)
- **用途**: 频率限制查询（unknown IP）
- **查询**: `WHERE client_ip = 'unknown' AND user_agent = ? AND created_at > ?`

### idx_created_at
- **字段**: created_at
- **用途**: 时间范围查询、数据清理

## 性能优化

### 查询优化
- 所有频率限制查询使用 `COUNT(*)` 而非 `SELECT *`
- 使用复合索引覆盖查询条件
- 并行执行短期和每日限制检查

### 存储优化
- user_agent 截断到50字符
- 使用 CHECK 约束限制字段长度
- JSON 数据存储为 TEXT（D1 兼容性）

## 数据清理建议

虽然当前未实现自动清理，但建议定期清理旧数据：

```sql
-- 删除30天前的数据
DELETE FROM color_snapshots 
WHERE created_at < datetime('now', '-30 days');

-- 重建索引优化性能
REINDEX;

-- 回收空间
VACUUM;
```

## Cloudflare D1 限制

- 单个数据库最大 2GB
- 单次查询最大 1MB 结果
- 不支持某些高级 SQLite 特性（如部分索引）
- 读操作免费，写操作有配额限制

## 监控指标

建议监控：
- 数据库大小增长率
- 查询响应时间
- 写入失败率
- 频率限制触发次数
