export interface Message {
  id: string
  from: string
  to: string
  content: string
  encryptedContent?: string
  timestamp: number
  signature?: number[]
  arweaveId: string
}

export interface GroupMessage {
  id: string
  groupId: string
  from: string
  content: string
  timestamp: number
  signature?: number[]
  arweaveId: string
}

export interface Group {
  id: string
  name: string
  members: string[]
  createdBy: string
  createdAt: number
}

export class MessageService {
  private getMessagesKey(walletAddress: string): string {
    return `messages_${walletAddress}`
  }

  private getGroupsKey(walletAddress: string): string {
    return `groups_${walletAddress}`
  }

  private getGroupMessagesKey(walletAddress: string): string {
    return `group_messages_${walletAddress}`
  }

  async getMessages(walletAddress: string): Promise<Message[]> {
    try {
      const stored = localStorage.getItem(this.getMessagesKey(walletAddress))
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Failed to load messages:", error)
      return []
    }
  }

  async saveMessage(walletAddress: string, message: Message): Promise<void> {
    try {
      const messages = await this.getMessages(walletAddress)
      messages.push(message)
      localStorage.setItem(this.getMessagesKey(walletAddress), JSON.stringify(messages))
    } catch (error) {
      console.error("Failed to save message:", error)
      throw error
    }
  }

  async getGroups(walletAddress: string): Promise<Group[]> {
    try {
      const stored = localStorage.getItem(this.getGroupsKey(walletAddress))
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Failed to load groups:", error)
      return []
    }
  }

  async createGroup(walletAddress: string, name: string, members: string[]): Promise<string> {
    try {
      const groups = await this.getGroups(walletAddress)
      const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const group: Group = {
        id: groupId,
        name,
        members: [walletAddress, ...members],
        createdBy: walletAddress,
        createdAt: Date.now(),
      }

      groups.push(group)
      localStorage.setItem(this.getGroupsKey(walletAddress), JSON.stringify(groups))

      return groupId
    } catch (error) {
      console.error("Failed to create group:", error)
      throw error
    }
  }

  async getGroupMessages(walletAddress: string): Promise<GroupMessage[]> {
    try {
      const stored = localStorage.getItem(this.getGroupMessagesKey(walletAddress))
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Failed to load group messages:", error)
      return []
    }
  }

  async saveGroupMessage(walletAddress: string, message: GroupMessage): Promise<void> {
    try {
      const messages = await this.getGroupMessages(walletAddress)
      messages.push(message)
      localStorage.setItem(this.getGroupMessagesKey(walletAddress), JSON.stringify(messages))
    } catch (error) {
      console.error("Failed to save group message:", error)
      throw error
    }
  }
}
