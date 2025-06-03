"use client";
import '@rainbow-me/rainbowkit/styles.css';
import {
    getDefaultConfig,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
} from 'wagmi/chains';
import {
    QueryClientProvider,
    QueryClient,
} from "@tanstack/react-query";
import { GetSiweMessageOptions, RainbowKitSiweNextAuthProvider } from '@rainbow-me/rainbowkit-siwe-next-auth';
import { SessionProvider } from 'next-auth/react';
import { publicActions } from 'viem';


const config = getDefaultConfig({
    appName: 'My RainbowKit App',
    projectId: 'YOUR_PROJECT_ID',
    chains: [mainnet, polygon, optimism, arbitrum, base],
    ssr: true, // If your dApp uses server side rendering (SSR)
})

const getSiweMessageOptions: GetSiweMessageOptions = () => ({
    statement: 'Sign in to the RainbowKit + SIWE example app',
});

const queryClient = new QueryClient();

const WalletProvider = ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    return (
        <SessionProvider refetchInterval={0}>
            <WagmiProvider config={config}>
                <QueryClientProvider client={queryClient}>
                    <RainbowKitSiweNextAuthProvider getSiweMessageOptions={getSiweMessageOptions}>
                        <RainbowKitProvider>
                            {children}
                        </RainbowKitProvider>
                    </RainbowKitSiweNextAuthProvider>
                </QueryClientProvider>
            </WagmiProvider>
        </SessionProvider>
    );
};

export const publicClient = config.getClient().extend(publicActions);
export default WalletProvider