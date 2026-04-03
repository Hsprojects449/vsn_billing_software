"use client"

import { useCallback, useMemo } from "react"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { cn } from "@/lib/utils"

interface Client {
  id: string
  name: string
}

interface ClientSelectorProps {
  clients: Client[]
  selectedClientId: string | null
  onClientChange: (clientId: string | null) => void
  className?: string
  triggerClassName?: string
}

export function ClientSelector({
  clients,
  selectedClientId,
  onClientChange,
  className,
  triggerClassName,
}: ClientSelectorProps) {
  const options = useMemo(
    () => [
      { value: "all", label: "All Clients" },
      ...clients.map((client) => ({ value: client.id, label: client.name })),
    ],
    [clients],
  )

  const handleValueChange = useCallback(
    (value: string) => onClientChange(value === "all" ? null : value),
    [onClientChange],
  )

  return (
    <div className={cn("w-full md:w-64", className)}>
      <SearchableSelect
        value={selectedClientId || "all"}
        onValueChange={handleValueChange}
        options={options}
        placeholder="Select a client..."
        searchPlaceholder="Type client name..."
        triggerClassName={triggerClassName}
      />
    </div>
  )
}
