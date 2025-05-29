"use client"

import { WalletProvider } from "./components/WalletProvider"
import { MainApp } from "./components/MainApp"

export default function SolChat() {
  return (
    <WalletProvider>
      <MainApp />
    </WalletProvider>
  )
}
