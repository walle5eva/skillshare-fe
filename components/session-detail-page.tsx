"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Configuration,
  EnrollmentsApi,
  RatingsApi,
  SessionsApi,
  UsersApi,
  type SessionCreateResponse,
  type SessionRatingsResponse,
} from "@/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
  Pencil,
  Star,
  Trash2,
  Users,
  UserRound,
} from "lucide-react"
import { Navbar } from "@/components/navbar"

interface SessionDetailPageProps {
  sessionId: string
  initialSession?: SessionCreateResponse | null
  initialError?: string | null
}

export function SessionDetailPage({
  sessionId,
  initialSession = null,
  initialError = null,
}: SessionDetailPageProps) {
  const router = useRouter()

  const [session, setSession] = useState<SessionCreateResponse | null>(initialSession)
  const [isLoading, setIsLoading] = useState(!initialSession && !initialError)
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError)

  // Enrollment state
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [enrollmentMessage, setEnrollmentMessage] = useState<string | null>(null)
  const [enrollmentTone, setEnrollmentTone] = useState<"success" | "error" | "info">("info")
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(false)

  // Current user
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Host
  const [hostName, setHostName] = useState<string | null>(null)

  // Enrollees
  const [enrolleeNames, setEnrolleeNames] = useState<string[]>([])

  // Ratings
  const [ratings, setRatings] = useState<SessionRatingsResponse | null>(null)
  const [ratingValue, setRatingValue] = useState(5)
  const [ratingComment, setRatingComment] = useState("")
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)
  const [ratingMessage, setRatingMessage] = useState<string | null>(null)

  // Host controls
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Load session (only if not server-side prefetched)
  useEffect(() => {
    let isActive = true
    if (initialSession || initialError || !sessionId) return

    const fetchSession = async () => {
      setIsLoading(true)
      try {
        const response = await new SessionsApi().getSession(sessionId)
        if (isActive) setSession(response.data)
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

    fetchSession()
    return () => {
      isActive = false
    }
  }, [sessionId, initialSession, initialError])

  // Check enrollment status + load current user
  useEffect(() => {
    let isActive = true
    const token = localStorage.getItem("skillshare_jwt")
    if (!token || !sessionId) return

    const run = async () => {
      setIsCheckingEnrollment(true)
      try {
        const config = new Configuration({ accessToken: token })
        const [enrollmentRes, userRes] = await Promise.all([
          new EnrollmentsApi(
            config
          ).checkEnrollmentStatusEnrollmentsSessionsSessionIdCheckEnrollmentGet(sessionId),
          new UsersApi(config).getUser(),
        ])
        if (isActive) {
          setIsEnrolled(Boolean(enrollmentRes.data?.enrolled))
          setCurrentUserId(userRes.data.id)
        }
      } catch {
        // non-fatal
      } finally {
        if (isActive) setIsCheckingEnrollment(false)
      }
    }

    run()
    return () => {
      isActive = false
    }
  }, [sessionId])

  // Load host name
  useEffect(() => {
    if (!session?.host_id) return
    new UsersApi()
      .getUserById(session.host_id)
      .then((r) => setHostName(`${r.data.first_name} ${r.data.last_name}`))
      .catch(() => {})
  }, [session?.host_id])

  // Load enrollees
  useEffect(() => {
    if (!sessionId) return
    new EnrollmentsApi()
      .getSessionEnrolleesEnrollmentsSessionsSessionIdEnrolleesGet(sessionId)
      .then((r) => {
        const names = ((r.data as any).enrollees ?? []).map(
          (e: any) => e.user_name ?? e.username ?? "Student"
        )
        setEnrolleeNames(names)
      })
      .catch(() => {})
  }, [sessionId])

  // Load ratings
  const loadRatings = () => {
    if (!sessionId) return
    new RatingsApi()
      .getRatingsForSessionRatingsSessionSessionIdRatingsGet(sessionId)
      .then((r) => setRatings(r.data))
      .catch(() => {})
  }

  useEffect(() => {
    loadRatings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

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

  if (errorMessage || !session) {
    return (
      <div className="min-h-svh bg-background">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-32">
        <Card className="w-full max-w-md border-border/60">
          <CardHeader>
            <CardTitle className="text-xl">Session unavailable</CardTitle>
            <CardDescription>{errorMessage ?? "We could not find that session."}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild variant="outline" className="w-full">
              <Link href="/sessions">Back to sessions</Link>
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>
    )
  }

  const seatsLeft = Math.max(session.capacity - session.enrolled_count, 0)
  const fillPercent = Math.min(
    100,
    Math.round((session.enrolled_count / session.capacity) * 100)
  )
  const isFull = session.enrolled_count >= session.capacity
  const startTimestamp = new Date(session.start_time).getTime()
  const hasStarted = Number.isNaN(startTimestamp) ? false : startTimestamp <= Date.now()
  const normalizedStatus = session.status?.toLowerCase?.() ?? ""
  const enrollmentClosed =
    normalizedStatus.length > 0 && !["active", "open"].includes(normalizedStatus)
  const isHost = currentUserId !== null && currentUserId === session.host_id
  const alreadyRated =
    ratings?.ratings?.some((r: any) => r.reviewer_id === currentUserId) ?? false
  const canRate = isEnrolled && hasStarted && !alreadyRated && !ratingSubmitted

  const formatDate = (value: string) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(parsed)
  }

  const formatTime = (value: string) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(parsed)
  }

  const extractError = (error: unknown, fallback: string) => {
    const e = error as any
    const detail = e?.response?.data?.detail
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg as string
    if (typeof detail === "string") return detail
    if (typeof e?.response?.data?.message === "string") return e.response.data.message
    if (typeof e?.message === "string") return e.message
    return fallback
  }

  const handleEnroll = async () => {
    setEnrollmentMessage(null)
    const token = localStorage.getItem("skillshare_jwt")
    if (!token) {
      setEnrollmentTone("error")
      setEnrollmentMessage("Please sign in before enrolling in a session.")
      return
    }
    setIsEnrolling(true)
    try {
      await new EnrollmentsApi(
        new Configuration({ accessToken: token })
      ).enrollInSessionEnrollmentsSessionsSessionIdEnrollPost(sessionId)
      setIsEnrolled(true)
      setEnrollmentTone("success")
      setEnrollmentMessage("You're enrolled! We'll see you there.")
      setSession((prev) =>
        prev ? { ...prev, enrolled_count: prev.enrolled_count + 1 } : prev
      )
    } catch (error) {
      setEnrollmentTone("error")
      setEnrollmentMessage(extractError(error, "Unable to enroll in this session."))
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleCancelEnrollment = async () => {
    const token = localStorage.getItem("skillshare_jwt")
    if (!token) return
    setIsCancelling(true)
    setEnrollmentMessage(null)
    try {
      await new EnrollmentsApi(
        new Configuration({ accessToken: token })
      ).cancelEnrollmentEnrollmentsSessionsSessionIdEnrollDelete(sessionId)
      setIsEnrolled(false)
      setEnrollmentTone("info")
      setEnrollmentMessage("Your enrollment has been cancelled.")
      setSession((prev) =>
        prev ? { ...prev, enrolled_count: Math.max(prev.enrolled_count - 1, 0) } : prev
      )
    } catch (error) {
      setEnrollmentTone("error")
      setEnrollmentMessage(extractError(error, "Unable to cancel enrollment."))
    } finally {
      setIsCancelling(false)
    }
  }

  const handleDeleteSession = async () => {
    const token = localStorage.getItem("skillshare_jwt")
    if (!token) return
    setIsDeleting(true)
    try {
      await new SessionsApi(new Configuration({ accessToken: token })).deleteSession(sessionId)
      router.push("/sessions")
    } catch (error) {
      setEnrollmentTone("error")
      setEnrollmentMessage(extractError(error, "Unable to delete this session."))
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  const handleSubmitRating = async () => {
    const token = localStorage.getItem("skillshare_jwt")
    if (!token) return
    setIsSubmittingRating(true)
    setRatingMessage(null)
    try {
      await new RatingsApi(
        new Configuration({ accessToken: token })
      ).createRatingRatingsCreateRatingPost({
        session_id: sessionId,
        rating: ratingValue,
        comment: ratingComment.trim() || undefined,
      })
      setRatingSubmitted(true)
      setRatingMessage("Rating submitted. Thanks for the feedback!")
      loadRatings()
    } catch (error) {
      setRatingMessage(extractError(error, "Unable to submit rating."))
    } finally {
      setIsSubmittingRating(false)
    }
  }

  const enrollButtonLabel = () => {
    if (isEnrolling) return "Enrolling..."
    if (isCheckingEnrollment) return "Checking..."
    if (isFull) return "Session full"
    if (hasStarted) return "Session started"
    if (enrollmentClosed) return "Enrollment closed"
    return "Enroll in session"
  }

  const enrollButtonDisabled =
    isEnrolling || isCheckingEnrollment || isFull || hasStarted || enrollmentClosed

  const enrollmentMessageClass =
    enrollmentTone === "error"
      ? "border-destructive/40 text-destructive"
      : enrollmentTone === "success"
        ? "border-emerald-200 bg-emerald-50/60 text-emerald-700"
        : "border-border/60 text-muted-foreground"

  return (
    <div className="relative min-h-svh bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-20 h-80 w-80 rounded-full bg-primary/10" />
        <div className="absolute -bottom-48 right-0 h-[28rem] w-[28rem] rounded-full bg-accent/60" />
      </div>

      <Navbar />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/sessions"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All sessions
        </Link>

        {/* Header */}
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{session.skill_category}</Badge>
              <Badge variant={session.status === "Open" ? "default" : "outline"}>
                {session.status}
              </Badge>
            </div>

            {/* Host controls */}
            {isHost && (
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/sessions/${sessionId}/edit`}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                </Button>
                {!confirmDelete ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Are you sure?</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteSession}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Confirm"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            {session.title}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">{session.description}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            <Card className="border-border/60 shadow-lg shadow-primary/5">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">Session details</CardTitle>
                <CardDescription>Everything you need to know at a glance.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Date</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(session.start_time)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Time</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(session.start_time)} – {formatTime(session.end_time)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Location</p>
                      <p className="text-sm text-muted-foreground">{session.location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DollarSign className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Price</p>
                      <p className="text-sm text-muted-foreground">
                        {session.price > 0 ? `$${session.price}` : "Free"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Capacity</p>
                      <p className="text-sm text-muted-foreground">
                        {session.enrolled_count}/{session.capacity} enrolled
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <UserRound className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Host</p>
                      <Link
                        href={`/users/${session.host_id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {hostName ?? "View profile"}
                      </Link>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Seats left</span>
                    <span className="font-medium text-foreground">{seatsLeft}</span>
                  </div>
                  <Progress value={fillPercent} />
                </div>
              </CardContent>
            </Card>

            {/* Who's attending */}
            {enrolleeNames.length > 0 && (
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Who&apos;s attending ({enrolleeNames.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {enrolleeNames.map((name, i) => (
                      <Badge key={i} variant="secondary">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ratings */}
            {ratings && ratings.total_ratings > 0 && (
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-lg">Ratings</CardTitle>
                  <CardDescription>
                    {ratings.average_rating.toFixed(1)} / 5 &middot; {ratings.total_ratings}{" "}
                    {ratings.total_ratings === 1 ? "rating" : "ratings"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {(ratings.ratings as any[]).map((r: any) => (
                    <div key={r.id} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {r.reviewer_name}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < r.rating
                                  ? "fill-primary text-primary"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {r.comment && (
                        <p className="text-sm text-muted-foreground">{r.comment}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-xl">
                  {isHost ? "You're hosting" : "Ready to join?"}
                </CardTitle>
                {!isHost && !isEnrolled && (
                  <CardDescription>Secure your spot before it fills up.</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {isHost ? (
                  <p className="text-sm text-muted-foreground">
                    Use the edit and delete controls above to manage this session.
                  </p>
                ) : isEnrolled ? (
                  <Button
                    variant="outline"
                    className="h-11 border-destructive/40 text-destructive hover:bg-destructive/10"
                    onClick={handleCancelEnrollment}
                    disabled={isCancelling || hasStarted}
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : hasStarted ? (
                      "Session already started"
                    ) : (
                      "Cancel enrollment"
                    )}
                  </Button>
                ) : (
                  <Button
                    className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleEnroll}
                    disabled={enrollButtonDisabled}
                  >
                    <span>{enrollButtonLabel()}</span>
                    {isEnrolling || isCheckingEnrollment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </Button>
                )}

                {enrollmentMessage && (
                  <div
                    className={`rounded-md border px-3 py-2 text-xs ${enrollmentMessageClass}`}
                  >
                    {enrollmentMessage}
                  </div>
                )}

                {!isHost && (
                  <p className="text-xs text-muted-foreground">
                    {isEnrolled
                      ? "You can cancel up until the session starts."
                      : "Enrollment closes once capacity is reached."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Rate this session */}
            {canRate && (
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-xl">Leave a rating</CardTitle>
                  <CardDescription>How was this session?</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRatingValue(n)}
                        className="rounded p-0.5 transition-colors"
                        aria-label={`Rate ${n}`}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            n <= ratingValue
                              ? "fill-primary text-primary"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">{ratingValue} / 5</span>
                  </div>
                  <Textarea
                    placeholder="Add a comment (optional)"
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    className="min-h-[80px] border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                  />
                  <Button
                    onClick={handleSubmitRating}
                    disabled={isSubmittingRating}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isSubmittingRating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit rating"
                    )}
                  </Button>
                  {ratingMessage && (
                    <p className="text-xs text-muted-foreground">{ratingMessage}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {ratingSubmitted && !canRate && ratingMessage && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-700">
                {ratingMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
