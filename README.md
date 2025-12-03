## Description

## 项目概览

- 技术栈：NestJS + TypeORM（PostgreSQL�? Redis，使�?Winston 记录日志�?
- 核心模块：`AppModule` 初始�?TypeORM、全局拦截�?过滤器、Winston 日志、Redis、Auth、User、RBAC�?
- 数据模型：用户、刷新令牌、角�?权限，以及商品、SKU、订单、购物车等实体；用户多角色，角色多权限�?
- 认证与会话：JWT Access�?5 分钟�? Refresh�?0 天），刷新令牌入库并哈希存储，登出时�?Redis 黑名单实现单点登录�?
- 横切能力：Trace ID 中间件，统一异常过滤器，统一响应与脱敏拦截器，时间格�?时区拦截器，装饰器可跳过或定制�?
- 业务接口：`/auth` 登录/注册/刷新/登出；`/user` �?`AuthGuard` 保护，返回用户信息并支持登出；RBAC 实体和模块已就绪�?

## Installation

```bash
$ pnpm install
```

## Running the app

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Test

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## License

Nest is [MIT licensed](LICENSE).
