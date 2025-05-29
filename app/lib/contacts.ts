export interface Contact {
  address: string
  nickname?: string
  avatar?: string
  addedAt: number
  verified: boolean
  publicKey?: string
}

export class ContactService {
  private getStorageKey(walletAddress: string): string {
    return `contacts_${walletAddress}`
  }

  async getContacts(walletAddress: string): Promise<Contact[]> {
    try {
      const stored = localStorage.getItem(this.getStorageKey(walletAddress))
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Failed to load contacts:", error)
      return []
    }
  }

  async addContact(walletAddress: string, contact: Contact): Promise<void> {
    try {
      console.log(`Adding contact for wallet ${walletAddress}:`, contact)

      // Get current contacts
      const contacts = await this.getContacts(walletAddress)
      console.log("Current contacts:", contacts)

      // Check if contact already exists
      const existingIndex = contacts.findIndex((c) => c.address === contact.address)
      if (existingIndex >= 0) {
        console.log("Contact already exists, updating:", existingIndex)
        contacts[existingIndex] = contact
      } else {
        console.log("Adding new contact")
        contacts.push(contact)
      }

      // Save to localStorage
      const storageKey = this.getStorageKey(walletAddress)
      console.log("Saving to storage key:", storageKey)
      localStorage.setItem(storageKey, JSON.stringify(contacts))

      // Verify the save worked
      const savedContacts = localStorage.getItem(storageKey)
      console.log("Saved contacts:", savedContacts ? JSON.parse(savedContacts) : "none")
    } catch (error) {
      console.error("Failed to add contact:", error)
      throw error
    }
  }

  async updateContact(walletAddress: string, contact: Contact): Promise<void> {
    try {
      const contacts = await this.getContacts(walletAddress)
      const index = contacts.findIndex((c) => c.address === contact.address)

      if (index >= 0) {
        contacts[index] = contact
        localStorage.setItem(this.getStorageKey(walletAddress), JSON.stringify(contacts))
      }
    } catch (error) {
      console.error("Failed to update contact:", error)
      throw error
    }
  }

  async removeContact(walletAddress: string, contactAddress: string): Promise<void> {
    try {
      const contacts = await this.getContacts(walletAddress)
      const filtered = contacts.filter((c) => c.address !== contactAddress)
      localStorage.setItem(this.getStorageKey(walletAddress), JSON.stringify(filtered))
    } catch (error) {
      console.error("Failed to remove contact:", error)
      throw error
    }
  }
}
