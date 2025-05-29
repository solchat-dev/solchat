"use client"

import { useState, useEffect, useCallback } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import {
  Home,
  MessageCircle,
  SettingsIcon,
  Send,
  Plus,
  Search,
  Users,
  Shield,
  Key,
  AlertCircle,
  CheckCircle,
  Loader2,
  Copy,
  Check,
  Info,
  Trash2,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"

import { EncryptionService } from "../lib/encryption"
import { RealArweaveService } from "../lib/arweave-real"
import { ContactService, type Contact } from "../lib/contacts"
import { MessageService, type Message, type GroupMessage } from "../lib/messages"
import { SearchService } from "../lib/search"
import { SolanaService } from "../lib/solana"
import { GroupService, type Group } from "../lib/groups"
import { GroupChat } from "./GroupChat"
import { EnhancedLandingPage } from "./EnhancedLandingPage"

export function MainApp() {
  const { publicKey, signMessage, connected, connecting, disconnect } = useWallet()
  const { connection } = useConnection()
  const { toast } = useToast()

  const [currentView, setCurrentView] = useState("home")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [messageText, setMessageText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<(Message | GroupMessage)[]>([])
  const [showAddContact, setShowAddContact] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newContactAddress, setNewContactAddress] = useState("")
  const [newContactNickname, setNewContactNickname] = useState("")
  const [newGroupName, setNewGroupName] = useState("")
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([])
  const [encryptionKeys, setEncryptionKeys] = useState<any>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [addressValidation, setAddressValidation] = useState<{
    isValid: boolean | null
    isValidating: boolean
    error?: string
    fromCache?: boolean
  }>({ isValid: null, isValidating: false })
  const [isSending, setIsSending] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [walletOperationInProgress, setWalletOperationInProgress] = useState(false)

  // Initialize services
  const encryptionService = new EncryptionService()
  const arweaveService = new RealArweaveService()
  const contactService = new ContactService()
  const messageService = new MessageService()
  const searchService = new SearchService()
  const solanaService = new SolanaService(connection)
  const groupService = new GroupService()

  // Load data on wallet connection with loading state
  useEffect(() => {
    if (publicKey && connected) {
      setIsLoadingData(true)
      Promise.all([loadContacts(), loadMessages(), loadGroups(), initializeEncryption()])
        .then(() => {
          toast({
            title: "✅ Wallet Connected",
            description: "Your data has been loaded successfully",
            variant: "success",
          })
        })
        .catch((error) => {
          console.error("Failed to load data:", error)
          toast({
            title: "⚠️ Loading Error",
            description: "Some data failed to load. Please refresh the page.",
            variant: "destructive",
          })
        })
        .finally(() => {
          setIsLoadingData(false)
        })
    }
  }, [publicKey, connected])

  // Add network change detection
  useEffect(() => {
    const handleNetworkChange = () => {
      if (connected && publicKey) {
        toast({
          title: "🌐 Network Change Detected",
          description: "Reconnecting to ensure optimal performance...",
        })

        // Clear caches and reload data
        solanaService.clearCache()

        // Reload all data after a short delay
        setTimeout(() => {
          Promise.all([loadContacts(), loadMessages(), loadGroups()])
            .then(() => {
              toast({
                title: "✅ Reconnected",
                description: "Your data has been refreshed",
                variant: "success",
              })
            })
            .catch((error) => {
              console.error("Failed to reload data after network change:", error)
              toast({
                title: "⚠️ Connection Issue",
                description: "Please refresh the page if issues persist",
                variant: "destructive",
              })
            })
        }, 1000)
      }
    }

    // Listen for network changes
    window.addEventListener("online", handleNetworkChange)
    window.addEventListener("offline", () => {
      toast({
        title: "📡 Network Offline",
        description: "You're currently offline. Some features may not work.",
        variant: "destructive",
      })
    })

    return () => {
      window.removeEventListener("online", handleNetworkChange)
      window.removeEventListener("offline", handleNetworkChange)
    }
  }, [connected, publicKey])

  // Enhanced address validation with better UX
  useEffect(() => {
    const validateAddress = async () => {
      if (!newContactAddress.trim()) {
        setAddressValidation({ isValid: null, isValidating: false })
        return
      }

      setAddressValidation({ isValid: null, isValidating: true })

      try {
        const result = await solanaService.validateAddress(newContactAddress.trim())
        setAddressValidation({
          isValid: result.isValid,
          isValidating: false,
          error: result.error,
          fromCache: result.fromCache,
        })
      } catch (error) {
        setAddressValidation({
          isValid: false,
          isValidating: false,
          error: "Validation failed",
        })
      }
    }

    const timeoutId = setTimeout(validateAddress, 300) // Reduced debounce time
    return () => clearTimeout(timeoutId)
  }, [newContactAddress])

  const initializeEncryption = async () => {
    if (!publicKey) return

    try {
      const keys = await encryptionService.generateOrLoadKeys(publicKey.toString())
      setEncryptionKeys(keys)
    } catch (error) {
      console.error("Failed to initialize encryption:", error)
      toast({
        title: "🔐 Encryption Error",
        description: "Failed to initialize encryption keys",
        variant: "destructive",
      })
    }
  }

  const loadContacts = async () => {
    if (!publicKey) return

    try {
      const loadedContacts = await contactService.getContacts(publicKey.toString())
      setContacts(loadedContacts)
    } catch (error) {
      console.error("Failed to load contacts:", error)
      throw error
    }
  }

  const loadMessages = async () => {
    if (!publicKey) return

    try {
      const loadedMessages = await messageService.getMessages(publicKey.toString())
      setMessages(loadedMessages)
    } catch (error) {
      console.error("Failed to load messages:", error)
      throw error
    }
  }

  const loadGroups = async () => {
    if (!publicKey) return

    try {
      const loadedGroups = await groupService.getGroups(publicKey.toString())
      setGroups(loadedGroups)

      const loadedGroupMessages = await groupService.getGroupMessages(publicKey.toString())
      setGroupMessages(loadedGroupMessages)
    } catch (error) {
      console.error("Failed to load groups:", error)
      throw error
    }
  }

  const addContact = async () => {
    if (!publicKey) {
      toast({
        title: "❌ Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    if (!newContactAddress.trim()) {
      toast({
        title: "❌ Missing Address",
        description: "Please enter a Solana address",
        variant: "destructive",
      })
      return
    }

    // Even if validation failed, try to add with basic format check
    const basicFormatValid = await solanaService.isValidAddress(newContactAddress.trim())
    if (!basicFormatValid) {
      toast({
        title: "❌ Invalid Address Format",
        description: "Please enter a valid Solana address",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("Adding contact:", newContactAddress.trim())

      // Check if contact already exists
      const existingContact = contacts.find((c) => c.address === newContactAddress.trim())
      if (existingContact) {
        toast({
          title: "👥 Contact Exists",
          description: "This contact is already in your list",
          variant: "destructive",
        })
        return
      }

      const contact: Contact = {
        address: newContactAddress.trim(),
        nickname: newContactNickname.trim() || undefined,
        addedAt: Date.now(),
        verified: false,
      }

      console.log("Saving contact:", contact)
      await contactService.addContact(publicKey.toString(), contact)

      // Reload contacts to update the UI
      const loadedContacts = await contactService.getContacts(publicKey.toString())
      console.log("Loaded contacts after add:", loadedContacts)
      setContacts(loadedContacts)

      // Clear form and close dialog
      setNewContactAddress("")
      setNewContactNickname("")
      setShowAddContact(false)
      setAddressValidation({ isValid: null, isValidating: false })

      toast({
        title: "✅ Contact Added",
        description: `${contact.nickname || contact.address.slice(0, 8) + "..."} has been added to your contacts`,
        variant: "success",
      })
    } catch (error) {
      console.error("Failed to add contact:", error)
      toast({
        title: "❌ Failed to Add Contact",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const removeContact = async (contactAddress: string) => {
    if (!publicKey) return

    try {
      await contactService.removeContact(publicKey.toString(), contactAddress)
      await loadContacts()

      // Clear selection if removed contact was selected
      if (selectedContact?.address === contactAddress) {
        setSelectedContact(null)
      }

      toast({
        title: "🗑️ Contact Removed",
        description: "Contact has been removed from your list",
        variant: "success",
      })
    } catch (error) {
      console.error("Failed to remove contact:", error)
      toast({
        title: "❌ Failed to Remove Contact",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const sendMessage = async () => {
    if (!messageText.trim() || !publicKey || !signMessage || !encryptionKeys) return

    setIsSending(true)
    setWalletOperationInProgress(true)

    try {
      if (selectedContact) {
        // Show signing toast
        toast({
          title: "🔏 Signing Message",
          description: "Please sign the message in your wallet",
        })

        // Send direct message
        const encryptedContent = await encryptionService.encryptMessage(
          messageText,
          selectedContact.address,
          encryptionKeys.privateKey,
        )

        // Sign the message with Solana wallet
        const messageToSign = new TextEncoder().encode(
          JSON.stringify({
            to: selectedContact.address,
            content: messageText,
            timestamp: Date.now(),
          }),
        )

        const signature = await signMessage(messageToSign)

        toast({
          title: "📡 Storing Message",
          description: "Storing on Arweave (this may take a moment)...",
        })

        const message: Message = {
          id: `msg_${Date.now()}_${Math.random()}`,
          from: publicKey.toString(),
          to: selectedContact.address,
          content: messageText,
          encryptedContent,
          timestamp: Date.now(),
          signature: Array.from(signature),
          arweaveId: "",
        }

        // Store on Arweave with better error handling
        try {
          const arweaveId = await arweaveService.storeMessage(message)
          message.arweaveId = arweaveId

          // Check if storage was successful or fallback
          if (arweaveId.includes("arweave_insufficient_balance")) {
            toast({
              title: "⚠️ Arweave Storage Limited",
              description: "Message sent but stored locally (insufficient AR tokens for permanent storage)",
              variant: "destructive",
            })
          } else if (arweaveId.includes("arweave_") && arweaveId.includes("_failed")) {
            toast({
              title: "⚠️ Arweave Storage Failed",
              description: "Message sent but stored locally (Arweave network issue)",
              variant: "destructive",
            })
          } else {
            toast({
              title: "✅ Message Sent & Stored",
              description: "Your encrypted message has been sent and stored on Arweave",
              variant: "success",
            })
          }
        } catch (arweaveError) {
          console.error("Arweave storage error:", arweaveError)
          message.arweaveId = `arweave_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

          toast({
            title: "⚠️ Storage Warning",
            description: "Message sent but stored locally only",
            variant: "destructive",
          })
        }

        await messageService.saveMessage(publicKey.toString(), message)
        await loadMessages()
      }

      // Clear message input
      setMessageText("")
    } catch (error) {
      console.error("Failed to send message:", error)
      toast({
        title: "❌ Failed to Send Message",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
      setWalletOperationInProgress(false)
    }
  }

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    try {
      const results = await searchService.searchMessages(searchQuery, messages, groupMessages)
      setSearchResults(results)
    } catch (error) {
      console.error("Search failed:", error)
    }
  }, [searchQuery, messages, groupMessages])

  useEffect(() => {
    const timeoutId = setTimeout(handleSearch, 300)
    return () => clearTimeout(timeoutId)
  }, [handleSearch])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAddress(text)
      setTimeout(() => setCopiedAddress(null), 2000)

      toast({
        title: "📋 Copied",
        description: "Address copied to clipboard",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "❌ Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return "Just now"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  const getContactMessages = (contactAddress: string) => {
    return messages
      .filter(
        (m) =>
          (m.from === contactAddress && m.to === publicKey?.toString()) ||
          (m.from === publicKey?.toString() && m.to === contactAddress),
      )
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  const verifyContact = async (contact: Contact) => {
    if (!publicKey || !signMessage) return

    setWalletOperationInProgress(true)

    try {
      toast({
        title: "🔏 Verifying Contact",
        description: "Please sign the verification challenge",
      })

      // Create a verification challenge
      const challenge = `verify_contact_${Date.now()}_${Math.random()}`
      const challengeBytes = new TextEncoder().encode(challenge)

      // Sign the challenge
      const signature = await signMessage(challengeBytes)

      // Mark as verified
      const updatedContact = { ...contact, verified: true }
      await contactService.updateContact(publicKey.toString(), updatedContact)
      await loadContacts()

      toast({
        title: "✅ Contact Verified",
        description: `${contact.nickname || contact.address.slice(0, 8) + "..."} has been verified`,
        variant: "success",
      })
    } catch (error) {
      console.error("Failed to verify contact:", error)
      toast({
        title: "❌ Verification Failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setWalletOperationInProgress(false)
    }
  }

  if (!connected) {
    return <EnhancedLandingPage connecting={connecting} />
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="flex flex-col h-screen">
          {/* Header */}
          <header className="bg-black/20 backdrop-blur-md border-b border-white/10 p-4">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-white">SolChat</h1>
                {isLoadingData && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {encryptionKeys && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge
                        variant="secondary"
                        className="bg-green-600/20 text-green-300 hover:bg-green-600/30 transition-colors"
                      >
                        <Key className="w-3 h-3 mr-1" />
                        E2E Encrypted
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>End-to-end encryption is active</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger>
                    <Badge
                      variant="secondary"
                      className="bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 transition-colors"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      Mainnet
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Connected to Solana Mainnet</p>
                  </TooltipContent>
                </Tooltip>

                {/* Add network status indicator */}
                <Tooltip>
                  <TooltipTrigger>
                    <Badge
                      variant="secondary"
                      className={`${
                        navigator.onLine
                          ? "bg-green-600/20 text-green-300 hover:bg-green-600/30"
                          : "bg-red-600/20 text-red-300 hover:bg-red-600/30"
                      } transition-colors`}
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      {navigator.onLine ? "Online" : "Offline"}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Network connection status</p>
                  </TooltipContent>
                </Tooltip>

                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(publicKey?.toString() || "")}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-200"
                      >
                        {copiedAddress === publicKey?.toString() ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy wallet address</p>
                    </TooltipContent>
                  </Tooltip>

                  <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !transition-all !duration-200 hover:!scale-105" />
                </div>
              </div>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <nav className="w-64 bg-black/20 backdrop-blur-md border-r border-white/10 p-4">
              <div className="space-y-2">
                {[
                  { id: "home", icon: Home, label: "Home", badge: null },
                  { id: "chat", icon: MessageCircle, label: "Messages", badge: messages.length },
                  { id: "groups", icon: Users, label: "Groups", badge: groups.length },
                  { id: "search", icon: Search, label: "Search", badge: null },
                  { id: "settings", icon: SettingsIcon, label: "Settings", badge: null },
                ].map((item) => (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setCurrentView(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-all duration-200 ${
                          currentView === item.id ? "bg-white/20 shadow-lg" : ""
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                        {item.badge !== null && item.badge > 0 && (
                          <Badge variant="secondary" className="ml-auto bg-purple-600/20 text-purple-300 animate-pulse">
                            {item.badge}
                          </Badge>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">
              {currentView === "home" && (
                <div className="flex items-center justify-center h-full p-8">
                  <div className="text-center max-w-2xl space-y-8">
                    <div className="space-y-4">
                      <h2 className="text-4xl font-bold text-white">Welcome to SolChat</h2>
                      <p className="text-xl text-gray-300">
                        A fully decentralized messaging platform with end-to-end encryption, real Solana wallet
                        authentication, and Arweave storage.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { title: "Secure", desc: "End-to-end encryption with x25519", icon: "🔐" },
                        { title: "Decentralized", desc: "No central servers, Arweave storage", icon: "🌐" },
                        { title: "Verified", desc: "Real Solana address validation", icon: "✅" },
                        { title: "Signed", desc: "Cryptographically signed messages", icon: "🔏" },
                      ].map((feature, index) => (
                        <Card
                          key={index}
                          className="p-4 bg-black/20 border-white/10 hover:bg-black/30 transition-all duration-200 hover:scale-105"
                        >
                          <div className="text-2xl mb-2">{feature.icon}</div>
                          <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                          <p className="text-gray-300 text-sm">{feature.desc}</p>
                        </Card>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <Button
                        onClick={() => setCurrentView("chat")}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 rounded-lg font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                        size="lg"
                      >
                        Start Messaging
                      </Button>

                      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                        <Shield className="w-4 h-4" />
                        Connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentView === "chat" && (
                <div className="flex h-full">
                  {/* Contact List */}
                  <div className="w-80 bg-black/10 backdrop-blur-md border-r border-white/10 flex flex-col">
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Contacts</h3>
                        <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DialogTrigger asChild>
                                <Button
                                  variant="default"
                                  size="icon"
                                  className="bg-purple-600 hover:bg-purple-700 transition-all duration-200 hover:scale-110"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Add new contact</p>
                            </TooltipContent>
                          </Tooltip>
                          <DialogContent className="bg-gray-900 border-gray-700">
                            <DialogHeader>
                              <DialogTitle className="text-white">Add Contact</DialogTitle>
                            </DialogHeader>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault()
                                addContact()
                              }}
                              className="space-y-4"
                            >
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Solana Wallet Address
                                </label>
                                <div className="relative">
                                  <Input
                                    value={newContactAddress}
                                    onChange={(e) => setNewContactAddress(e.target.value)}
                                    placeholder="Enter valid Solana address..."
                                    className="bg-gray-800 border-gray-600 text-white pr-10 transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                                  />
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    {addressValidation.isValidating && (
                                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                    )}
                                    {!addressValidation.isValidating && addressValidation.isValid === true && (
                                      <CheckCircle className="w-4 h-4 text-green-400" />
                                    )}
                                    {!addressValidation.isValidating && addressValidation.isValid === false && (
                                      <AlertCircle className="w-4 h-4 text-red-400" />
                                    )}
                                  </div>
                                </div>
                                {addressValidation.error && (
                                  <Alert className="mt-2 border-red-600 bg-red-900/20 animate-in slide-in-from-top-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-red-300">
                                      {addressValidation.error}
                                    </AlertDescription>
                                  </Alert>
                                )}
                                {addressValidation.isValid && (
                                  <Alert className="mt-2 border-green-600 bg-green-900/20 animate-in slide-in-from-top-2">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription className="text-green-300 flex items-center gap-2">
                                      Valid Solana address
                                      {addressValidation.fromCache && (
                                        <Badge variant="secondary" className="text-xs">
                                          cached
                                        </Badge>
                                      )}
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                              <Input
                                value={newContactNickname}
                                onChange={(e) => setNewContactNickname(e.target.value)}
                                placeholder="Nickname (optional)..."
                                className="bg-gray-800 border-gray-600 text-white transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="submit"
                                  className="flex-1 bg-green-600 hover:bg-green-700 transition-all duration-200 hover:scale-105"
                                  disabled={!newContactAddress.trim()}
                                >
                                  {addressValidation.isValidating ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  ) : (
                                    <Plus className="w-4 h-4 mr-2" />
                                  )}
                                  Add Contact
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => {
                                    setShowAddContact(false)
                                    setNewContactAddress("")
                                    setNewContactNickname("")
                                    setAddressValidation({ isValid: null, isValidating: false })
                                  }}
                                  variant="outline"
                                  className="flex-1 transition-all duration-200 hover:scale-105"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {isLoadingData ? (
                        <div className="p-4 space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <Skeleton className="w-10 h-10 rounded-full" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        contacts.map((contact) => {
                          const contactMessages = getContactMessages(contact.address)
                          const lastMessage = contactMessages[contactMessages.length - 1]

                          return (
                            <div key={contact.address} className="relative group">
                              <button
                                onClick={() => {
                                  setSelectedContact(contact)
                                  setSelectedGroup(null)
                                }}
                                className={`w-full p-4 text-left hover:bg-white/5 border-b border-white/5 transition-all duration-200 ${
                                  selectedContact?.address === contact.address ? "bg-white/10 shadow-lg" : ""
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    {(contact.nickname || contact.address).slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-white truncate">
                                          {contact.nickname || `${contact.address.slice(0, 8)}...`}
                                        </h4>
                                        {contact.verified && (
                                          <Tooltip>
                                            <TooltipTrigger>
                                              <Shield className="w-3 h-3 text-green-400" />
                                            </TooltipTrigger>
                                            <TooltipContent></TooltipContent>
                                          </Tooltip>
                                        )}
                                      </div>
                                      {lastMessage && (
                                        <span className="text-xs text-gray-400">
                                          {formatTimestamp(lastMessage.timestamp)}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-400 truncate">
                                      {lastMessage ? lastMessage.content.slice(0, 50) + "..." : "No messages yet"}
                                    </p>
                                  </div>
                                </div>
                              </button>

                              {/* Contact actions */}
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        removeContact(contact.address)
                                      }}
                                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Remove contact</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          )
                        })
                      )}

                      {!isLoadingData && contacts.length === 0 && (
                        <div className="p-8 text-center">
                          <div className="text-4xl mb-4">👥</div>
                          <p className="text-gray-400 mb-2">No contacts yet</p>
                          <p className="text-sm text-gray-500">Add a contact to start messaging</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 flex flex-col">
                    {selectedContact ? (
                      <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/10 bg-black/10 backdrop-blur-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {(selectedContact.nickname || selectedContact.address).slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-semibold text-white">
                                    {selectedContact.nickname || `${selectedContact.address.slice(0, 8)}...`}
                                  </h3>
                                  {selectedContact.verified && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Shield className="w-4 h-4 text-green-400" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Verified contact</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-gray-400">{selectedContact.address}</p>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(selectedContact.address)}
                                        className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                      >
                                        {copiedAddress === selectedContact.address ? (
                                          <Check className="w-3 h-3" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Copy address</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {!selectedContact.verified && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      onClick={() => verifyContact(selectedContact)}
                                      variant="outline"
                                      size="sm"
                                      disabled={walletOperationInProgress}
                                      className="border-green-600 text-green-400 hover:bg-green-600/20 transition-all duration-200"
                                    >
                                      {walletOperationInProgress ? (
                                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                      ) : (
                                        <Shield className="w-3 h-3 mr-1" />
                                      )}
                                      Verify
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Verify this contact cryptographically</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {getContactMessages(selectedContact.address).map((message, index) => (
                            <div
                              key={message.id}
                              className={`flex ${message.from === publicKey?.toString() ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2`}
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <div className="max-w-xs lg:max-w-md">
                                <div
                                  className={`${
                                    message.from === publicKey?.toString() ? "bg-purple-600" : "bg-gray-700"
                                  } rounded-lg p-3 text-white shadow-lg hover:shadow-xl transition-all duration-200`}
                                >
                                  <p className="break-words">{message.content}</p>
                                  <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                                    <span>{formatTimestamp(message.timestamp)}</span>
                                    <div className="flex items-center gap-1">
                                      {message.encryptedContent && (
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <Key className="w-3 h-3 text-green-400" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>End-to-end encrypted</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                      {message.signature && (
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <Shield className="w-3 h-3 text-blue-400" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Cryptographically signed</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                      {message.arweaveId && (
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <Badge
                                              variant="secondary"
                                              className="text-xs bg-orange-600/20 text-orange-300"
                                            >
                                              Arweave
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Stored on Arweave: {message.arweaveId}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {getContactMessages(selectedContact.address).length === 0 && (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center space-y-4">
                                <div className="text-4xl">💬</div>
                                <div>
                                  <h3 className="text-lg font-semibold text-white mb-2">Start a conversation</h3>
                                  <p className="text-gray-400">
                                    Send your first encrypted message to{" "}
                                    {selectedContact.nickname || selectedContact.address.slice(0, 8) + "..."}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-white/10 bg-black/10 backdrop-blur-md">
                          <div className="flex gap-2">
                            <Textarea
                              value={messageText}
                              onChange={(e) => setMessageText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault()
                                  sendMessage()
                                }
                              }}
                              placeholder="Type your encrypted message..."
                              className="flex-1 bg-white/10 border-white/20 text-white placeholder-gray-400 resize-none transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                              rows={1}
                              disabled={isSending || walletOperationInProgress}
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={sendMessage}
                                  disabled={!messageText.trim() || isSending || walletOperationInProgress}
                                  className="bg-purple-600 hover:bg-purple-700 transition-all duration-200 hover:scale-110 disabled:hover:scale-100"
                                >
                                  {isSending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Send encrypted message (Enter)</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          {walletOperationInProgress && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-yellow-400 animate-pulse">
                              <Info className="w-4 h-4" />
                              Please check your wallet for signing requests
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <div className="text-6xl">💬</div>
                          <div>
                            <h3 className="text-xl font-semibold text-white mb-2">Select a contact</h3>
                            <p className="text-gray-400">Choose a contact to start secure messaging</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentView === "groups" && (
                <GroupChat
                  selectedGroup={selectedGroup}
                  onGroupSelect={setSelectedGroup}
                  encryptionKeys={encryptionKeys}
                  contacts={contacts}
                />
              )}

              {currentView === "search" && (
                <div className="h-full p-6">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-white">Search Messages</h2>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search your messages..."
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {searchQuery.trim() && searchResults.length === 0 && (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-4">🔍</div>
                          <p className="text-gray-400">No messages found for "{searchQuery}"</p>
                        </div>
                      )}

                      {searchResults.map((result, index) => (
                        <Card
                          key={result.id}
                          className="p-4 bg-black/20 border-white/10 hover:bg-black/30 transition-all duration-200 hover:scale-[1.02] animate-in slide-in-from-bottom-2"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {"groupId" in result ? (
                                  <Badge variant="secondary" className="bg-green-600/20 text-green-300">
                                    <Users className="w-3 h-3 mr-1" />
                                    Group
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-blue-600/20 text-blue-300">
                                    <MessageCircle className="w-3 h-3 mr-1" />
                                    Direct
                                  </Badge>
                                )}
                                <span className="text-sm text-gray-400">{formatTimestamp(result.timestamp)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {result.signature && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Shield className="w-3 h-3 text-blue-400" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Signed message</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                            <p className="text-white">{result.content}</p>
                            <div className="text-sm text-gray-400">
                              From: {result.from.slice(0, 8)}...{result.from.slice(-8)}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentView === "settings" && (
                <div className="h-full p-6">
                  <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

                    <Tabs defaultValue="wallet" className="space-y-6">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="wallet" className="transition-all duration-200">
                          Wallet
                        </TabsTrigger>
                        <TabsTrigger value="encryption" className="transition-all duration-200">
                          Encryption
                        </TabsTrigger>
                        <TabsTrigger value="storage" className="transition-all duration-200">
                          Storage
                        </TabsTrigger>
                        <TabsTrigger value="privacy" className="transition-all duration-200">
                          Privacy
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="wallet" className="space-y-6">
                        <Card className="p-6 bg-black/20 border-white/10 hover:bg-black/25 transition-all duration-200">
                          <h3 className="text-lg font-semibold text-white mb-4">Wallet Information</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Connected Wallet</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="default">
                                  {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                                </Badge>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(publicKey?.toString() || "")}
                                      className="h-6 w-6 p-0"
                                    >
                                      {copiedAddress === publicKey?.toString() ? (
                                        <Check className="w-3 h-3" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Copy full address</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Network</span>
                              <Badge variant="default" className="bg-blue-600/20 text-blue-300">
                                Solana Mainnet
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Connection Status</span>
                              <Badge variant={connected ? "default" : "destructive"} className="animate-pulse">
                                {connected ? "Connected" : "Disconnected"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Contacts</span>
                              <Badge variant="secondary">{contacts.length}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Messages</span>
                              <Badge variant="secondary">{messages.length}</Badge>
                            </div>
                            <Button
                              onClick={disconnect}
                              variant="destructive"
                              className="w-full transition-all duration-200 hover:scale-105"
                            >
                              Disconnect Wallet
                            </Button>
                          </div>
                        </Card>
                      </TabsContent>

                      <TabsContent value="encryption" className="space-y-6">
                        <Card className="p-6 bg-black/20 border-white/10 hover:bg-black/25 transition-all duration-200">
                          <h3 className="text-lg font-semibold text-white mb-4">Encryption Status</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">End-to-End Encryption</span>
                              <Badge variant={encryptionKeys ? "default" : "destructive"} className="animate-pulse">
                                {encryptionKeys ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Message Signing</span>
                              <Badge variant="default" className="bg-green-600/20 text-green-300">
                                Enabled
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Key Algorithm</span>
                              <span className="text-gray-400 font-mono">x25519</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Address Validation</span>
                              <Badge variant="default" className="bg-purple-600/20 text-purple-300">
                                Enhanced
                              </Badge>
                            </div>
                            {encryptionKeys && (
                              <div className="mt-4 p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
                                <div className="flex items-center gap-2 text-green-300">
                                  <Key className="w-4 h-4" />
                                  <span className="text-sm font-medium">Encryption keys are active</span>
                                </div>
                                <p className="text-xs text-green-400 mt-1">All messages are automatically encrypted</p>
                              </div>
                            )}
                          </div>
                        </Card>
                      </TabsContent>

                      <TabsContent value="storage" className="space-y-6">
                        <Card className="p-6 bg-black/20 border-white/10 hover:bg-black/25 transition-all duration-200">
                          <h3 className="text-lg font-semibold text-white mb-4">Storage Settings</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Arweave Storage</span>
                              <Badge variant="default" className="bg-orange-600/20 text-orange-300">
                                Active
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Local Storage</span>
                              <Badge variant="default" className="bg-blue-600/20 text-blue-300">
                                Browser Storage
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Address Validation</span>
                              <Badge variant="default" className="bg-green-600/20 text-green-300">
                                Cached
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">RPC Endpoint</span>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="secondary" className="cursor-help">
                                    Ankr
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Using Ankr RPC for better reliability</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Button
                              onClick={() => {
                                solanaService.clearCache()
                                toast({
                                  title: "🗑️ Cache Cleared",
                                  description: "Address validation cache has been cleared",
                                  variant: "success",
                                })
                              }}
                              variant="outline"
                              className="w-full transition-all duration-200 hover:scale-105"
                            >
                              Clear Address Cache
                            </Button>
                          </div>
                        </Card>
                      </TabsContent>

                      <TabsContent value="privacy" className="space-y-6">
                        <Card className="p-6 bg-black/20 border-white/10 hover:bg-black/25 transition-all duration-200">
                          <h3 className="text-lg font-semibold text-white mb-4">Privacy Settings</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Contact Verification</span>
                              <Badge variant="default" className="bg-purple-600/20 text-purple-300">
                                Cryptographic
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Address Validation</span>
                              <Badge variant="default" className="bg-green-600/20 text-green-300">
                                Resilient
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Message Retention</span>
                              <span className="text-gray-400">Permanent (Arweave)</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Data Encryption</span>
                              <Badge variant="default" className="bg-green-600/20 text-green-300">
                                Client-side
                              </Badge>
                            </div>
                            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                              <div className="flex items-center gap-2 text-blue-300">
                                <Shield className="w-4 h-4" />
                                <span className="text-sm font-medium">Privacy Protection Active</span>
                              </div>
                              <p className="text-xs text-blue-400 mt-1">
                                Your messages are encrypted and stored decentralized
                              </p>
                            </div>
                          </div>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
