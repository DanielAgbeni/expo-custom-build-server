module.exports = {
  apps: [
    {
      name: 'api',
      script: 'src/index.ts',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'worker',
      script: 'src/worker.ts',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};