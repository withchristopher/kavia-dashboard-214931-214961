'use strict';

/**
 * Next.js configuration for the Kavia Dashboard frontend.
 * - Enables React strict mode for highlighting potential problems.
 * - Configures images for common domains used in GitHub avatars and raw content.
 * - Sets up swcMinify and experimental options if needed in the future.
 */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: 'githubusercontent.com' }
    ]
  }
};

module.exports = nextConfig;
