/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // si tu repo es https://github.com/USER/REPO y Pages queda /REPO
  basePath: process.env.GITHUB_ACTIONS ? '/REPO' : '',
  assetPrefix: process.env.GITHUB_ACTIONS ? '/REPO/' : '',
};

module.exports = nextConfig;
