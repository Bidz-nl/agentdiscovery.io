"use client"

import { useState, useEffect } from "react"
import { Building2, MapPin, Clock, DollarSign, ChevronRight, ChevronLeft, CheckCircle2, Zap, Globe, Phone, Mail, Plus, X, Tag, Package, Briefcase, Shield, Users, TrendingUp, Bot } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

// ============================================
// Types
// ============================================
interface ProviderFormData {
  // Step 1: Basic info
  name: string
  contactName: string
  email: string
  phone: string
  website: string
  // Step 2: What do you offer?
  category: string
  customCategory: string
  serviceTitle: string
  serviceDescription: string
  tags: string[]
  tagInput: string
  // Step 3: Service area
  basePostcode: string
  radiusKm: string
  nationwide: boolean
  // Step 4: Pricing & availability
  priceType: "fixed" | "hourly" | "quote"
  price: string
  currency: string
  negotiable: boolean
  responseTimeHours: string
  availableDays: string[]
}

// ============================================
// Category options
// ============================================
const CATEGORY_OPTIONS = [
  { id: "installation", label: "Installation & Tech", emoji: "🔧", examples: "Solar panels, heat pumps, EV chargers, HVAC" },
  { id: "services", label: "Professional Services", emoji: "🛠️", examples: "Plumber, painter, electrician, cleaning" },
  { id: "food", label: "Food & Beverage", emoji: "🍕", examples: "Restaurant, catering, delivery, bakery" },
  { id: "retail", label: "Retail & Products", emoji: "🛍️", examples: "Electronics, clothing, bike repair" },
  { id: "health", label: "Health & Wellness", emoji: "💆", examples: "Physiotherapy, massage, personal training" },
  { id: "education", label: "Education & Training", emoji: "📚", examples: "Tutoring, courses, coaching" },
  { id: "transport", label: "Transport & Moving", emoji: "🚚", examples: "Moving company, courier, taxi" },
  { id: "creative", label: "Creative & Media", emoji: "🎨", examples: "Photography, web design, graphic design" },
  { id: "software", label: "Software & AI", emoji: "🤖", examples: "SaaS, API services, AI agents, automation" },
  { id: "other", label: "Other", emoji: "✨", examples: "Describe what you offer" },
]

const DAYS = [
  { id: "monday", label: "Mon" },
  { id: "tuesday", label: "Tue" },
  { id: "wednesday", label: "Wed" },
  { id: "thursday", label: "Thu" },
  { id: "friday", label: "Fri" },
  { id: "saturday", label: "Sat" },
  { id: "sunday", label: "Sun" },
]

const API_BASE = typeof window !== 'undefined'
  ? `${window.location.origin}/api/adp`
  : "https://www.bidz.nl/api/adp/v1"

// ============================================
// Main Page Component
// ============================================
export default function RegisterProviderPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [agentDid, setAgentDid] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [liveStats, setLiveStats] = useState<{ agents: number; capabilities: number; transactions: number } | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/dashboard?summary=true`)
      .then(res => res.json())
      .then(json => {
        if (json.stats) {
          setLiveStats({
            agents: json.stats.totalAgents || 0,
            capabilities: json.stats.activeCapabilities || 0,
            transactions: json.stats.completedTransactions || 0,
          })
        }
      })
      .catch(() => {})
  }, [])

  const [form, setForm] = useState<ProviderFormData>({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    category: "",
    customCategory: "",
    serviceTitle: "",
    serviceDescription: "",
    tags: [],
    tagInput: "",
    basePostcode: "",
    radiusKm: "30",
    nationwide: false,
    priceType: "quote",
    price: "",
    currency: "EUR",
    negotiable: true,
    responseTimeHours: "24",
    availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  })

  const updateForm = (updates: Partial<ProviderFormData>) => {
    setForm(prev => ({ ...prev, ...updates }))
  }

  const toggleDay = (day: string) => {
    const days = form.availableDays
    if (days.includes(day)) {
      updateForm({ availableDays: days.filter(d => d !== day) })
    } else {
      updateForm({ availableDays: [...days, day] })
    }
  }

  const addTag = () => {
    const tag = form.tagInput.trim()
    if (tag && !form.tags.includes(tag)) {
      updateForm({ tags: [...form.tags, tag], tagInput: "" })
    }
  }

  const removeTag = (tag: string) => {
    updateForm({ tags: form.tags.filter(t => t !== tag) })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    const effectiveCategory = form.category === "other" ? (form.customCategory || "services") : form.category

    try {
      // Register agent via bidz.nl API (open endpoint, no auth needed)
      const agentRes = await fetch(`${API_BASE}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: `${form.serviceTitle} — ${form.serviceDescription}`.substring(0, 500),
          agentType: "service_provider",
          capability: {
            category: effectiveCategory,
            title: form.serviceTitle,
            pricing: {
              ...(form.price ? { askingPrice: parseInt(form.price) * 100 } : {}),
              currency: form.currency,
              negotiable: form.negotiable,
              priceType: form.priceType,
            },
            specifications: {
              serviceType: effectiveCategory,
              specializations: form.tags,
              responseTimeHours: parseInt(form.responseTimeHours) || 24,
              contactEmail: form.email || undefined,
              contactPhone: form.phone || undefined,
              website: form.website || undefined,
              serviceArea: form.nationwide
                ? { nationwide: true }
                : {
                    basePostcode: form.basePostcode,
                    radiusKm: parseInt(form.radiusKm) || 30,
                  },
            },
            availability: {
              from: new Date().toISOString().split("T")[0],
              until: "2026-12-31",
              timezone: "UTC",
              slots: form.availableDays.map(day => ({
                day,
                startTime: "08:00",
                endTime: "17:00",
                available: true,
              })),
            },
          },
          authorityBoundaries: {
            requireApproval: true,
            allowedCategories: [effectiveCategory],
            maxConcurrentNegotiations: 10,
          },
        }),
      })

      const agentData = await agentRes.json()

      if (!agentRes.ok || agentData.error) {
        const msg = agentData.error?.message || "Registration failed"
        setSubmitError(msg)
        return
      }

      if (agentData.agent?.did) {
        setAgentDid(agentData.agent.did)
        setApiKey(agentData.apiKey || null)
        setIsComplete(true)
      } else {
        setSubmitError("Unexpected error during registration. Please try again.")
      }
    } catch (err: unknown) {
      console.error("Registration failed:", err)
      setSubmitError(err instanceof Error ? err.message : "An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isComplete) {
    return <SuccessView name={form.name} serviceTitle={form.serviceTitle} agentDid={agentDid} apiKey={apiKey} />
  }

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="min-h-screen bg-[#050810] text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white/60 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Open protocol — Free to join
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.1]">
              Get discovered by{" "}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                AI agents
              </span>{" "}
              worldwide
            </h1>
            <p className="text-lg sm:text-xl text-white/45 max-w-2xl leading-relaxed">
              Register your service on the Agent Discovery Protocol and let autonomous AI agents find you, negotiate deals, and bring you customers — 24/7, without lifting a finger.
            </p>
          </div>
        </div>
      </section>

      {/* Main content: form + sidebar */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Form column */}
          <div className="lg:col-span-2">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
              {/* Progress bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between text-sm text-white/40 mb-2">
                  <span>Step {currentStep} of {totalSteps}</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Steps */}
              {currentStep === 1 && <StepBasicInfo form={form} updateForm={updateForm} />}
              {currentStep === 2 && <StepWhatYouOffer form={form} updateForm={updateForm} addTag={addTag} removeTag={removeTag} />}
              {currentStep === 3 && <StepServiceArea form={form} updateForm={updateForm} />}
              {currentStep === 4 && <StepPricing form={form} updateForm={updateForm} toggleDay={toggleDay} />}

              {/* Error message */}
              {submitError && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {submitError}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
                {currentStep > 1 ? (
                  <button
                    onClick={() => setCurrentStep(s => s - 1)}
                    className="flex items-center gap-2 px-5 py-2.5 text-white/50 hover:text-white border border-white/10 rounded-lg hover:border-white/20 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < totalSteps ? (
                  <button
                    onClick={() => setCurrentStep(s => s + 1)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Register on ADP
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Why register */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Why register?</h3>
              <div className="space-y-4">
                {[
                  { icon: Bot, title: "AI agents find you", desc: "Autonomous agents discover your service and initiate deals on behalf of their users." },
                  { icon: TrendingUp, title: "24/7 lead generation", desc: "Your service is always available for matching — even while you sleep." },
                  { icon: Shield, title: "You stay in control", desc: "Set your own prices, service area, and approval rules. Nothing happens without your consent." },
                  { icon: Globe, title: "Global reach", desc: "Get discovered by agents worldwide, or limit to your local area." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="shrink-0 p-2 bg-blue-500/10 rounded-lg h-fit">
                      <item.icon className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-white/35 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white/50 mb-4">Live on the network</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: liveStats ? `${liveStats.agents}+` : "—", label: "Active agents" },
                  { value: liveStats ? `${liveStats.capabilities}` : "—", label: "Services" },
                  { value: liveStats ? `${liveStats.transactions}` : "—", label: "Transactions" },
                  { value: "€0", label: "Cost to join" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-3 bg-white/[0.02] rounded-xl">
                    <p className="text-xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-white/30 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works mini */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white/50 mb-4">How it works</h3>
              <div className="space-y-3">
                {[
                  { step: "1", text: "You register your service (2 min)" },
                  { step: "2", text: "AI agents discover you via ADP" },
                  { step: "3", text: "Agents negotiate on behalf of customers" },
                  { step: "4", text: "You approve the deal & deliver" },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className="shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-400">{item.step}</span>
                    </div>
                    <p className="text-sm text-white/50">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust */}
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 text-xs text-white/20 mb-2">
                <Shield className="h-3 w-3" />
                <span>Open protocol — No vendor lock-in</span>
              </div>
              <p className="text-xs text-white/15">
                ADP is built on open standards. Your data stays yours.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

// ============================================
// Step 1: Basic Info
// ============================================
function StepBasicInfo({ form, updateForm }: { form: ProviderFormData; updateForm: (u: Partial<ProviderFormData>) => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-500/10 rounded-lg">
          <Building2 className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">About you</h2>
          <p className="text-sm text-white/40">Company or individual — both welcome</p>
        </div>
      </div>

      <InputField label="Name / Company name" value={form.name} onChange={v => updateForm({ name: v })} placeholder="e.g. Amsterdam Plumbing Co or Jane's Web Design" icon={Building2} />
      <InputField label="Contact person" value={form.contactName} onChange={v => updateForm({ contactName: v })} placeholder="Full name" required={false} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Email" value={form.email} onChange={v => updateForm({ email: v })} placeholder="info@company.com" icon={Mail} type="email" />
        <InputField label="Phone" value={form.phone} onChange={v => updateForm({ phone: v })} placeholder="+31 6 12345678" icon={Phone} type="tel" required={false} />
      </div>
      <InputField label="Website" value={form.website} onChange={v => updateForm({ website: v })} placeholder="https://www.company.com" icon={Globe} required={false} />
    </div>
  )
}

// ============================================
// Step 2: What do you offer?
// ============================================
function StepWhatYouOffer({ form, updateForm, addTag, removeTag }: { form: ProviderFormData; updateForm: (u: Partial<ProviderFormData>) => void; addTag: () => void; removeTag: (t: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-500/10 rounded-lg">
          <Package className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">What do you offer?</h2>
          <p className="text-sm text-white/40">Pick a category and describe your service</p>
        </div>
      </div>

      {/* Category selection */}
      <div>
        <label className="block text-sm font-medium text-white/60 mb-3">Category</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {CATEGORY_OPTIONS.map(cat => {
            const isSelected = form.category === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => updateForm({ category: cat.id })}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.emoji}</span>
                  <span className={`text-sm font-medium ${isSelected ? "text-white" : "text-white/70"}`}>{cat.label}</span>
                </div>
                <p className="text-xs text-white/30 mt-1 ml-7">{cat.examples}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom category */}
      {form.category === "other" && (
        <InputField label="Describe your category" value={form.customCategory} onChange={v => updateForm({ customCategory: v })} placeholder="e.g. Dog walking service" />
      )}

      {/* Service title */}
      <InputField label="Service title" value={form.serviceTitle} onChange={v => updateForm({ serviceTitle: v })} placeholder="e.g. Professional Painting or Fresh Pizza Delivery" icon={Briefcase} />

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-white/60 mb-1.5">Description</label>
        <textarea
          value={form.serviceDescription}
          onChange={e => updateForm({ serviceDescription: e.target.value })}
          placeholder="Describe what you offer, your experience, and what makes you unique..."
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-white/60 mb-1.5">
          Tags / keywords
          <span className="text-white/30 font-normal ml-1">(optional)</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
            <input
              type="text"
              value={form.tagInput}
              onChange={e => updateForm({ tagInput: e.target.value })}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
              placeholder="e.g. solar, plumbing, pizza, react..."
              className="w-full pl-11 pr-4 py-3 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
          <button onClick={addTag} className="px-4 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl transition-colors">
            <Plus className="h-5 w-5" />
          </button>
        </div>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-sm text-blue-300">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// Step 3: Service Area
// ============================================
function StepServiceArea({ form, updateForm }: { form: ProviderFormData; updateForm: (u: Partial<ProviderFormData>) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-500/10 rounded-lg">
          <MapPin className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Service area</h2>
          <p className="text-sm text-white/40">Where do you operate?</p>
        </div>
      </div>

      {/* Worldwide / Online toggle */}
      <div
        onClick={() => updateForm({ nationwide: !form.nationwide })}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
          form.nationwide
            ? "border-blue-500 bg-blue-500/10"
            : "border-white/10 bg-white/5 hover:border-white/20"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-blue-400" />
            <div>
              <p className="font-medium text-white">Worldwide / Online</p>
              <p className="text-xs text-white/40">I serve customers everywhere or deliver online</p>
            </div>
          </div>
          <div className={`w-10 h-6 rounded-full transition-colors ${form.nationwide ? "bg-blue-500" : "bg-white/10"}`}>
            <div className={`w-4 h-4 rounded-full bg-white mt-1 transition-transform ${form.nationwide ? "translate-x-5" : "translate-x-1"}`} />
          </div>
        </div>
      </div>

      {!form.nationwide && (
        <>
          <InputField
            label="Base postcode / ZIP"
            value={form.basePostcode}
            onChange={v => updateForm({ basePostcode: v })}
            placeholder="e.g. 1012 AB or 10001"
            icon={MapPin}
          />
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Service radius: {form.radiusKm} km</label>
            <input
              type="range"
              min="1"
              max="200"
              value={form.radiusKm}
              onChange={e => updateForm({ radiusKm: e.target.value })}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-white/30 mt-1">
              <span>1 km</span>
              <span>100 km</span>
              <span>200 km</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// Step 4: Pricing & Availability
// ============================================
function StepPricing({ form, updateForm, toggleDay }: { form: ProviderFormData; updateForm: (u: Partial<ProviderFormData>) => void; toggleDay: (d: string) => void }) {
  const selectedCategory = CATEGORY_OPTIONS.find(c => c.id === form.category)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-500/10 rounded-lg">
          <DollarSign className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Pricing & availability</h2>
          <p className="text-sm text-white/40">Last step!</p>
        </div>
      </div>

      {/* Price type */}
      <div>
        <label className="block text-sm font-medium text-white/60 mb-3">How do you charge?</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "quote" as const, label: "On request", desc: "Custom quote" },
            { id: "fixed" as const, label: "Fixed price", desc: "Per job/product" },
            { id: "hourly" as const, label: "Hourly rate", desc: "Per hour" },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => updateForm({ priceType: opt.id })}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                form.priceType === opt.id
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              <p className={`text-sm font-medium ${form.priceType === opt.id ? "text-white" : "text-white/70"}`}>{opt.label}</p>
              <p className="text-xs text-white/30">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Price input (not for quote) */}
      {form.priceType !== "quote" && (
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label={form.priceType === "hourly" ? "Hourly rate" : "Price"}
            value={form.price}
            onChange={v => updateForm({ price: v })}
            placeholder={form.priceType === "hourly" ? "50" : "500"}
            type="number"
            icon={DollarSign}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/60">Currency</label>
            <select
              value={form.currency}
              onChange={e => updateForm({ currency: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>
      )}

      {/* Negotiable toggle */}
      {form.priceType !== "quote" && (
        <button
          onClick={() => updateForm({ negotiable: !form.negotiable })}
          className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all w-full text-left ${
            form.negotiable
              ? "border-blue-500 bg-blue-500/10 text-blue-300"
              : "border-white/10 bg-white/5 text-white/50"
          }`}
        >
          {form.negotiable ? "✓ Price is negotiable" : "Price is not negotiable"}
        </button>
      )}

      {/* Response time */}
      <InputField label="Response time (hours)" value={form.responseTimeHours} onChange={v => updateForm({ responseTimeHours: v })} placeholder="24" type="number" icon={Clock} />

      {/* Available days */}
      <div>
        <label className="block text-sm font-medium text-white/60 mb-3">Available days</label>
        <div className="flex gap-2">
          {DAYS.map(day => {
            const isSelected = form.availableDays.includes(day.id)
            return (
              <button
                key={day.id}
                onClick={() => toggleDay(day.id)}
                className={`w-11 h-11 rounded-lg border-2 text-sm font-medium transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/10 text-blue-300"
                    : "border-white/10 bg-white/5 text-white/30 hover:border-white/20"
                }`}
              >
                {day.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <h3 className="text-sm font-semibold text-white/60 mb-3">Summary</h3>
        <div className="space-y-2 text-sm">
          <SummaryRow label="Name" value={form.name} />
          <SummaryRow label="Category" value={selectedCategory?.label || form.customCategory || "—"} />
          <SummaryRow label="Service" value={form.serviceTitle || "—"} />
          <SummaryRow label="Tags" value={form.tags.length > 0 ? form.tags.join(", ") : "—"} />
          <SummaryRow label="Area" value={form.nationwide ? "Worldwide / Online" : form.basePostcode ? `${form.basePostcode} + ${form.radiusKm}km` : "—"} />
          <SummaryRow label="Price" value={
            form.priceType === "quote" ? "On request" :
            form.price ? `${form.currency === "EUR" ? "€" : form.currency === "GBP" ? "£" : "$"}${form.price}${form.priceType === "hourly" ? "/hr" : ""}` : "—"
          } />
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/40">{label}</span>
      <span className="text-white font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  )
}

// ============================================
// Success View
// ============================================
function SuccessView({ name, serviceTitle, agentDid, apiKey }: { name: string; serviceTitle: string; agentDid: string | null; apiKey: string | null }) {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-[#050810] text-white">
      <Navbar />

      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-500/8 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-20 text-center">
          <div className="inline-flex p-4 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
            <CheckCircle2 className="h-16 w-16 text-green-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Welcome, {name}!</h1>
          <p className="text-lg text-white/50 mb-2">
            You are now registered as a service provider on ADP.
          </p>
          <p className="text-sm text-white/30 mb-8">
            &ldquo;{serviceTitle}&rdquo; is now discoverable by AI agents worldwide.
          </p>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8 text-left space-y-4">
            {agentDid && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-white/30">Your Agent DID</p>
                  <button
                    onClick={() => copyToClipboard(agentDid, "did")}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {copied === "did" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-sm text-blue-400 font-mono break-all">{agentDid}</p>
              </div>
            )}

            {apiKey && (
              <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-yellow-400/70">Your API Key (shown only once!)</p>
                  <button
                    onClick={() => copyToClipboard(apiKey, "key")}
                    className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                  >
                    {copied === "key" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-yellow-400 font-mono break-all">{apiKey}</p>
                <p className="text-xs text-yellow-500/50 mt-2">
                  Save this key securely. Use it as: Authorization: Bearer &lt;key&gt;
                </p>
              </div>
            )}

            <div className="pt-2 space-y-3">
              <a
                href="/dashboard"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                View Live Dashboard
              </a>
              <Link
                href="/docs"
                className="flex items-center justify-center gap-2 w-full py-3 border border-white/10 hover:border-white/20 text-white/60 font-medium rounded-lg transition-colors"
              >
                Read the API Documentation
              </Link>
            </div>
          </div>

          <div className="mt-10 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
            <h3 className="text-sm font-semibold text-white/50 mb-2">What happens next?</h3>
            <div className="space-y-2 text-sm text-white/35 text-left">
              <p>• AI agents can now discover your service via the ADP network</p>
              <p>• When an agent wants to hire you, you&apos;ll receive a negotiation proposal</p>
              <p>• Check your inbox via <code className="text-blue-400/60 text-xs">GET /agents/{'<'}did{'>'}/inbox</code></p>
              <p>• Accept, reject, or counter-offer — you&apos;re always in control</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

// ============================================
// Reusable Input Field
// ============================================
function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
  required = true,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
  icon?: React.ComponentType<{ className?: string }>
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/60 mb-1.5">
        {label}
        {!required && <span className="text-white/25 font-normal ml-1">(optional)</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${Icon ? "pl-11" : "pl-4"} pr-4 py-3 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors`}
        />
      </div>
    </div>
  )
}
