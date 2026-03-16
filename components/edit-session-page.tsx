"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Configuration, SessionsApi, UsersApi, type SessionCreateResponse } from "@/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, CalendarDays, DollarSign, Loader2, MapPin, Pencil, Users } from "lucide-react"
import { Navbar } from "@/components/navbar"

const categoryOptions = [
  "Career",
  "Study Skills",
  "Tech",
  "Design",
  "Wellness",
  "Languages",
  "Creative",
]

interface EditForm {
  title: string
  description: string
  skill_category: string
  location: string
  date: string
  start_time: string
  end_time: string
  capacity: number
  price: number
}

function parseLocalDate(isoString: string) {
  const d = new Date(isoString)
  if (Number.isNaN(d.getTime())) return { date: "", time: "" }
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` }
}

function toDateTime(date: string, time: string) {
  if (!date || !time) return time
  const normalizedTime = /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : time
  const localDate = new Date(`${date}T${normalizedTime}`)
  if (Number.isNaN(localDate.getTime())) return `${date}T${normalizedTime}`
  const offsetMinutes = -localDate.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? "+" : "-"
  const abs = Math.abs(offsetMinutes)
  return `${date}T${normalizedTime}${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`
}

interface EditSessionPageProps {
  sessionId: string
}

export function EditSessionPage({ sessionId }: EditSessionPageProps) {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [session, setSession] = useState<SessionCreateResponse | null>(null)

  const [form, setForm] = useState<EditForm>({
    title: "",
    description: "",
    skill_category: "",
    location: "",
    date: "",
    start_time: "",
    end_time: "",
    capacity: 12,
    price: 0,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusTone, setStatusTone] = useState<"success" | "error">("success")

  useEffect(() => {
    let isActive = true

    const load = async () => {
      const token = localStorage.getItem("skillshare_jwt")
      if (!token) {
        if (isActive) {
          setErrorMessage("Please sign in to edit sessions.")
          setIsLoading(false)
        }
        return
      }

      try {
        const config = new Configuration({ accessToken: token })
        const [sessionRes, userRes] = await Promise.all([
          new SessionsApi().getSession(sessionId),
          new UsersApi(config).getUser(),
        ])

        if (!isActive) return

        const s = sessionRes.data
        if (s.host_id !== userRes.data.id) {
          setErrorMessage("You don't have permission to edit this session.")
          setIsLoading(false)
          return
        }

        setSession(s)
        const startParsed = parseLocalDate(s.start_time)
        const endParsed = parseLocalDate(s.end_time)
        setForm({
          title: s.title,
          description: s.description,
          skill_category: s.skill_category,
          location: s.location,
          date: startParsed.date,
          start_time: startParsed.time,
          end_time: endParsed.time,
          capacity: s.capacity,
          price: s.price,
        })
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            (error as any)?.response?.data?.detail?.[0]?.msg ??
              (error as any)?.response?.data?.message ??
              "Unable to load this session."
          )
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    load()
    return () => {
      isActive = false
    }
  }, [sessionId])

  const updateField = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const extractError = (error: unknown) => {
    const e = error as any
    const data = e?.response?.data
    if (typeof data === "string") return data
    if (Array.isArray(data?.detail)) {
      const msgs = data.detail.map((d: any) => d?.msg).filter(Boolean)
      if (msgs.length) return msgs.join(" ")
    }
    if (typeof data?.message === "string") return data.message
    if (typeof e?.message === "string") return e.message
    return "Unable to save changes. Please try again."
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatusMessage(null)

    if (!form.skill_category) {
      setStatusTone("error")
      setStatusMessage("Please choose a skill category.")
      return
    }

    const token = localStorage.getItem("skillshare_jwt")
    if (!token) {
      setStatusTone("error")
      setStatusMessage("Please sign in before saving changes.")
      return
    }

    setIsSubmitting(true)
    try {
      await new SessionsApi(new Configuration({ accessToken: token })).updateSession(sessionId, {
        title: form.title,
        description: form.description,
        skill_category: form.skill_category,
        location: form.location,
        start_time: toDateTime(form.date, form.start_time),
        end_time: toDateTime(form.date, form.end_time),
        capacity: form.capacity,
        price: form.price,
      })
      setStatusTone("success")
      setStatusMessage("Session updated.")
      setTimeout(() => router.push(`/sessions/${sessionId}`), 1200)
    } catch (error) {
      setStatusTone("error")
      setStatusMessage(extractError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-svh bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading session...</p>
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="min-h-svh bg-background">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-32">
          <Card className="w-full max-w-md border-border/60">
            <CardHeader>
              <CardTitle className="text-xl">Unavailable</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/sessions">Back to sessions</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-svh bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-8 h-96 w-96 rounded-full bg-primary/10" />
        <div className="absolute -bottom-48 right-0 h-[30rem] w-[30rem] rounded-full bg-accent/60" />
      </div>

      <Navbar />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href={`/sessions/${sessionId}`}
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to session
        </Link>

        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Edit session</p>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                {session?.title}
              </h1>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
          <Card className="border-border/60 shadow-lg shadow-primary/5">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Session details</CardTitle>
              <CardDescription>Update the details and save when ready.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="title">Session title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="category">Skill category</Label>
                    <Select
                      value={form.skill_category}
                      onValueChange={(v) => updateField("skill_category", v)}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Pick a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={form.location}
                      onChange={(e) => updateField("location", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) => updateField("date", e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="start_time">Start time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={form.start_time}
                      onChange={(e) => updateField("start_time", e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="end_time">End time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={form.end_time}
                      onChange={(e) => updateField("end_time", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min={1}
                      value={form.capacity}
                      onChange={(e) => updateField("capacity", Number(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="price">Price (USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.price}
                      onChange={(e) => updateField("price", Number(e.target.value) || 0)}
                      required
                    />
                    <span className="text-xs text-muted-foreground">Set 0 for free sessions.</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="submit"
                    className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save changes
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                  {statusMessage && (
                    <span
                      className={`text-sm ${statusTone === "success" ? "text-primary" : "text-destructive"}`}
                    >
                      {statusMessage}
                    </span>
                  )}
                </div>
              </form>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              All times shown in local campus time.
            </CardFooter>
          </Card>

          {/* Live preview */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-xl">Preview</CardTitle>
              <CardDescription>What attendees will see.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p className="text-lg font-semibold text-foreground">
                  {form.title || "Untitled session"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{form.skill_category || "Category"}</Badge>
                <Badge variant="outline">
                  {form.price > 0 ? `$${form.price.toFixed(2)}` : "Free"}
                </Badge>
              </div>
              <div className="grid gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>{form.date || "Date"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{form.capacity} seats</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{form.location || "Location"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>{form.price > 0 ? `$${form.price} per seat` : "No cost"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
