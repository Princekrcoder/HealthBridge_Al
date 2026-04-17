/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    serverExternalPackages: [
        '@genkit-ai/google-genai',
        'google-auth-library',
        'genkit',
        'google-gax',
        'gtoken',
        '@grpc/grpc-js',
        '@grpc/proto-loader'
    ],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'healthbridge-medical-reports.s3.eu-north-1.amazonaws.com',
                pathname: '/**',
            },
        ],
    },
    async rewrites() {
        return [
            {
                // Socket.IO — WebRTC signaling (must be before /api/:path*)
                source: '/socket.io/:path*',
                destination: 'http://127.0.0.1:5000/socket.io/:path*',
            },
            {
                // SSE live endpoint for ASHA — must come before generic /api/:path*
                source: '/api/dashboard/asha/live',
                destination: 'http://127.0.0.1:5000/api/dashboard/asha/live',
            },
            {
                // SSE live endpoint for Citizen — must come before generic /api/:path*
                source: '/api/dashboard/citizen/live',
                destination: 'http://127.0.0.1:5000/api/dashboard/citizen/live',
            },
            {
                source: '/api/:path*',
                destination: 'http://127.0.0.1:5000/api/:path*',
            },
        ];
    },
};

export default nextConfig;
