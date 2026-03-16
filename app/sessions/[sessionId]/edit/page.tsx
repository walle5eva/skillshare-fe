"use client"

import { use } from "react"
import { EditSessionPage } from "@/components/edit-session-page"

interface PageProps {
  params: Promise<{ sessionId: string }>
}

export default function Page({ params }: PageProps) {
  const { sessionId } = use(params)
  return <EditSessionPage sessionId={sessionId} />
}
