// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "e50914-dev",
      script: "pnpm",
      args: "dev",
      interpreter: "none",
      cwd: "/home/ubuntu/e50914", // 项目所在路径
      watch: false
    }
  ]
};
