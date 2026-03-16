"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Configuration, UsersApi, type UserCreateResponse } from "@/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, CalendarDays, Loader2, LogOut, Mail, UserRound } from "lucide-react"

export function ProfilePage() {
  const [user, setUser] = useState<UserCreateResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    const loadProfile = async () => {
      const token = localStorage.getItem("skillshare_jwt")
      if (!token) {
        if (isActive) {
          setErrorMessage("Please sign in to view your profile.")
          setIsLoading(false)
        }
        return
      }

      try {
        const api = new UsersApi(
          new Configuration({
            accessToken: token,
          })
        )
        const response = await api.getUser()
        if (isActive) {
          setUser(response.data)
        }
      } catch (error) {
        console.error("[SkillShare Local] Failed to load profile", error)
        if (isActive) {
          const message =
            (error as any)?.response?.data?.detail?.[0]?.msg ??
            (error as any)?.response?.data?.message ??
            "Unable to load your profile."
          setErrorMessage(message)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      isActive = false
    }
  }, [])

  const formatDate = (value?: string | null) => {
    if (!value) return "—"
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(parsed)
  }

  const handleSignOut = () => {
    localStorage.removeItem("skillshare_jwt")
    window.location.href = "/"
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (errorMessage || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md border-border/60">
          <CardHeader>
            <CardTitle className="text-xl">Profile unavailable</CardTitle>
            <CardDescription>{errorMessage ?? "We couldn't load your profile."}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/">
                <span>Sign in</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/sessions">Browse sessions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-svh bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-12 h-96 w-96 rounded-full bg-primary/10" />
        <div className="absolute -bottom-52 right-0 h-[32rem] w-[32rem] rounded-full bg-accent/60" />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Badge variant="secondary" className="w-fit">
            Profile
          </Badge>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserRound className="h-7 w-7" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                {user.first_name} {user.last_name}
              </h1>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/60 shadow-lg shadow-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl font-heading">Account details</CardTitle>
              <CardDescription>Manage your SkillShare Local profile.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Member since</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(user.date_joined)}
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-foreground">Bio</p>
                <p className="text-sm text-muted-foreground">
                  {user.bio?.trim() ? user.bio : "No bio added yet."}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-xl">Quick actions</CardTitle>
                <CardDescription>Keep exploring the community.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button asChild className="h-11 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/sessions">
                    <span>Browse sessions</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="h-11" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
