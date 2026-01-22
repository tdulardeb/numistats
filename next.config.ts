/** @type {import('next').NextConfig} */
const isGithubActions = Boolean(process.env.GITHUB_ACTIONS);

const nextConfig = {
  ...(isGithubActions ? { output: 'export' } : {}),
  images: { unoptimized: true },
  // si tu repo es https://github.com/USER/REPO y Pages queda /REPO
  basePath: isGithubActions ? '/REPO' : '',
  assetPrefix: isGithubActions ? '/REPO/' : '',
};

module.exports = nextConfig;
