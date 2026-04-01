"use client"

import { SearchableSelect } from "@/components/ui/searchable-select"

interface Client {
  id: string
  name: string
}

interface ClientSelectorProps {
  clients: Client[]
  selectedClientId: string | null
  onClientChange: (clientId: string | null) => void
}

export function ClientSelector({ clients, selectedClientId, onClientChange }: ClientSelectorProps) {
  const options = [
    { value: "all", label: "All Clients" },
    ...clients.map((client) => ({ value: client.id, label: client.name })),
  ]

  return (
    <div className="w-full md:w-64">
      <SearchableSelect
        value={selectedClientId || "all"}
        onValueChange={(value) => onClientChange(value === "all" ? null : value)}
        options={options}
        placeholder="Select a client..."
        searchPlaceholder="Type client name..."
      />
    </div>
  )
}
