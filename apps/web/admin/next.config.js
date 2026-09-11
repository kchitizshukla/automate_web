/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@automate/shared-api',
    '@automate/shared-types',
    '@automate/shared-utils',
  ],
};

module.exports = nextConfig;
