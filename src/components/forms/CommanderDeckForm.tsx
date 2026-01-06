import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Coffee,
  DollarSign,
  Hash,
  Hourglass,
  Loader2,
  Mail,
  MessageSquare,
  Palette,
  Sparkles,
  Swords,
  Trophy,
  User,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth, useSubmissionEligibility } from '@/lib/auth/client'
import { useDeckSubmission } from '@/lib/hooks/useDeckSubmission'
import { createClient } from '@/lib/supabase/client'
import { ColorIdentity } from '@/types/colors'
import { defCatBracketOptions } from '@/types/core'

const MAX_QUEUED = 3

export default function PagedDeckForm() {
  const auth = useAuth()
  const { isEligible, remainingSubmissions } = useSubmissionEligibility()
  const { submitDeck, error: submissionError } = useDeckSubmission()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [tierError, setTierError] = useState<string | null>(null)
  const [willBeQueued, setWillBeQueued] = useState(false)
  const [queuedSubmissions, setQueuedSubmissions] = useState(0)
  const [formData, setFormData] = useState({
    email: '',
    moxfieldUsername: '',
    discordUsername: '',
    mysteryDeck: '',
    commander: '',
    colorPreference: [] as string[],
    backupColorPreference: [] as string[],
    theme: '',
    bracket: '',
    budget: '',
    coffee: '',
    idealDate: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [showBackupColors, setShowBackupColors] = useState(false)

  const totalSteps = 5

  useEffect(() => {
    const checkEligibility = async () => {
      try {
        if (auth.isLoading) {
          return
        }

        if (!auth.isAuthenticated || !auth.user) {
          setTierError('Please log in to submit a deck request.')
          setIsLoading(false)
          return
        }

        if (!isEligible) {
          const eligibleTiers = ['Duke', 'Wizard', 'ArchMage']
          if (!eligibleTiers.includes(auth.profile.tier)) {
            setTierError('Deck submissions require Duke, Wizard, or ArchMage tier.')
            setIsLoading(false)
            return
          }
        }

        const supabase = createClient()
        const { data: submissions, error: countError } = await supabase
          .from('deck_submissions')
          .select('status')
          .eq('user_id', auth.user.id)
          .gte(
            'created_at',
            new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
          )

        if (countError) {
          console.error('Error checking submissions:', countError)
        }

        const queuedCount = submissions?.filter((s) => s.status === 'queued').length || 0
        setQueuedSubmissions(queuedCount)

        if (queuedCount >= MAX_QUEUED) {
          setTierError(
            `You have ${MAX_QUEUED} requests waiting to be built. Once one is completed, you can submit another.`
          )
          setIsLoading(false)
          return
        }

        if (remainingSubmissions <= 0) {
          setWillBeQueued(true)
        }

        if (auth.user?.email) {
          setFormData((prev) => ({ ...prev, email: auth.user?.email || '' }))
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Eligibility check error:', err)
        setTierError('An error occurred while checking your eligibility.')
        setIsLoading(false)
      }
    }

    checkEligibility()
  }, [auth.isLoading, auth.isAuthenticated])

  const steps = [
    { id: 1, name: 'Basic Info', icon: User },
    { id: 2, name: 'Deck Type', icon: Sparkles },
    { id: 3, name: 'Colors & Theme', icon: Palette },
    { id: 4, name: 'Power Level', icon: Trophy },
    { id: 5, name: 'Final Details', icon: Coffee },
  ]

  const validateStep = (step: number) => {
    const stepErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.email.trim()) {
          stepErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          stepErrors.email = 'Email is invalid'
        }
        if (!formData.moxfieldUsername.trim()) {
          stepErrors.moxfieldUsername = 'Moxfield username is required'
        }
        break
      case 2:
        if (!formData.mysteryDeck) {
          stepErrors.mysteryDeck = 'Please select an option'
        }
        break
      case 3:
        if (
          formData.mysteryDeck === 'no' &&
          !formData.commander &&
          formData.colorPreference.length === 0
        ) {
          stepErrors.colorPreference = 'Please select at least one color or specify a commander'
        }
        break
      case 4:
        if (!formData.bracket) {
          stepErrors.bracket = 'Bracket selection is required'
        }
        if (!formData.budget.trim()) {
          stepErrors.budget = 'Budget information is required'
        }
        break
      case 5:
        if (!formData.coffee.trim()) {
          stepErrors.coffee = 'Coffee preference is required'
        }
        break
      default:
        break
    }

    return stepErrors
  }

  const handleNext = () => {
    const stepErrors = validateStep(currentStep)
    if (Object.keys(stepErrors).length === 0) {
      setCompletedSteps([...completedSteps, currentStep])
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
      }
    } else {
      setErrors(stepErrors)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === 'colorPreference') {
      setFormData((prev) => {
        const currentColors = prev.colorPreference as string[]
        let newColors: string[]

        if (currentColors.includes(value)) {
          newColors = currentColors.filter((c) => c !== value)
        } else if (currentColors.length < 3) {
          newColors = [...currentColors, value]
        } else {
          return prev
        }

        return { ...prev, colorPreference: newColors }
      })
    } else if (field === 'backupColorPreference') {
      setFormData((prev) => {
        const currentColors = Array.isArray(prev.backupColorPreference)
          ? prev.backupColorPreference
          : []
        let newColors: string[]

        if (currentColors.includes(value)) {
          newColors = currentColors.filter((c) => c !== value)
        } else if (currentColors.length < 3) {
          newColors = [...currentColors, value]
        } else {
          return prev
        }

        return { ...prev, backupColorPreference: newColors }
      })
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (isDraft = false) => {
    const stepErrors = isDraft ? {} : validateStep(currentStep)
    if (Object.keys(stepErrors).length === 0) {
      setIsLoading(true)

      try {
        if (!auth.user) {
          console.error('User not authenticated')
          setErrors({ submit: 'Please log in to submit a deck request' })
          setIsLoading(false)
          return
        }

        // Map form data to API format (API expects mysteryDeck as 'yes'/'no' string)
        const submissionData = {
          submissionType: 'deck' as const,
          patreonUsername: auth.user.email?.split('@')[0] || '',
          email: formData.email || '',
          discordUsername: formData.discordUsername || '',
          mysteryDeck: formData.mysteryDeck || 'no',
          commander: formData.commander || undefined,
          colorPreference: formData.colorPreference.length > 0
            ? JSON.stringify(formData.colorPreference)
            : '',
          theme: formData.theme || undefined,
          bracket: formData.bracket || '',
          budget: formData.budget || '',
          coffee: formData.coffee || '',
          idealDate: formData.idealDate || undefined,
        }

        const success = await submitDeck(submissionData, isDraft)

        if (!success) {
          console.error('Submission error:', submissionError)
          let errorMessage = submissionError || 'Failed to submit deck request. Please try again.'

          if (errorMessage.includes('Draft limit reached')) {
            // Keep as is
          } else if (errorMessage.includes('Monthly submission limit')) {
            // Keep as is
          }

          setErrors({ submit: errorMessage })
          setIsLoading(false)
          return
        }

        setIsLoading(false)

        if (isDraft) {
          toast.success('Draft saved!', {
            description: 'You can continue editing from your profile.',
            duration: 5000,
          })
        } else {
          setQueuedSubmissions((prev) => (willBeQueued ? prev + 1 : prev))
          setShowSuccess(true)
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setErrors({ submit: 'An unexpected error occurred. Please try again.' })
        setIsLoading(false)
      }
    } else {
      setErrors(stepErrors)
    }
  }

  const resetForm = () => {
    setShowSuccess(false)
    setCurrentStep(1)
    setFormData({
      email: auth.user?.email || '',
      moxfieldUsername: '',
      discordUsername: '',
      mysteryDeck: '',
      commander: '',
      colorPreference: [],
      backupColorPreference: [],
      theme: '',
      bracket: '',
      budget: '',
      coffee: '',
      idealDate: '',
    })
    setCompletedSteps([])
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2 className="step-title">
              <User className="step-icon" />
              Let's start with the basics
            </h2>
            <p className="step-description">
              We need some information to get in touch with you about your custom deck.
            </p>

            <div className="form-fields">
              <div className="form-group">
                <label htmlFor="email">
                  <Mail className="inline-icon" />
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="your.email@example.com"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="moxfieldUsername">
                  Moxfield Username <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="moxfieldUsername"
                  value={formData.moxfieldUsername}
                  onChange={(e) => handleInputChange('moxfieldUsername', e.target.value)}
                  className={`form-input ${errors.moxfieldUsername ? 'error' : ''}`}
                  placeholder="Enter your Moxfield username"
                />
                {errors.moxfieldUsername && (
                  <span className="error-message">{errors.moxfieldUsername}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="discordUsername">
                  <Hash className="inline-icon" />
                  Discord Username <span className="text-muted-foreground text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  id="discordUsername"
                  value={formData.discordUsername}
                  onChange={(e) => handleInputChange('discordUsername', e.target.value)}
                  className={`form-input ${errors.discordUsername ? 'error' : ''}`}
                  placeholder="YourDiscord#1234"
                />
                {errors.discordUsername && (
                  <span className="error-message">{errors.discordUsername}</span>
                )}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="step-content">
            <h2 className="step-title">
              <Sparkles className="step-icon" />
              Mystery Deck or Custom Build?
            </h2>
            <p className="step-description">
              Would you like me to surprise you or do you have something specific in mind?
            </p>

            <div className="radio-cards">
              <label className={`radio-card ${formData.mysteryDeck === 'yes' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="mysteryDeck"
                  value="yes"
                  checked={formData.mysteryDeck === 'yes'}
                  onChange={(e) => handleInputChange('mysteryDeck', e.target.value)}
                />
                <div className="radio-content">
                  <div className="radio-header">
                    <Sparkles className="radio-icon" />
                    <span className="radio-title">Mystery Deck</span>
                  </div>
                  <p className="radio-description">
                    Yes, just make something fun, I trust you! Let the creativity flow.
                  </p>
                </div>
              </label>

              <label className={`radio-card ${formData.mysteryDeck === 'no' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="mysteryDeck"
                  value="no"
                  checked={formData.mysteryDeck === 'no'}
                  onChange={(e) => handleInputChange('mysteryDeck', e.target.value)}
                />
                <div className="radio-content">
                  <div className="radio-header">
                    <Swords className="radio-icon" />
                    <span className="radio-title">Custom Build</span>
                  </div>
                  <p className="radio-description">
                    No, I have an idea I'm cool like that. I'll specify what I want.
                  </p>
                </div>
              </label>
            </div>
            {errors.mysteryDeck && (
              <span className="error-message center">{errors.mysteryDeck}</span>
            )}

            {formData.mysteryDeck === 'no' && (
              <div className="form-group mt-4">
                <label htmlFor="commander">Commander (Optional)</label>
                <input
                  type="text"
                  id="commander"
                  value={formData.commander}
                  onChange={(e) => handleInputChange('commander', e.target.value)}
                  className="form-input"
                  placeholder="e.g., Atraxa, Praetors' Voice"
                />
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="step-content">
            <h2 className="step-title">
              <Palette className="step-icon" />
              Colors & Theme
            </h2>
            <p className="step-description">
              {formData.mysteryDeck === 'yes'
                ? 'Even for a mystery deck, any color preferences?'
                : 'Select your preferred color combination and theme.'}
            </p>

            <div className="form-group">
              <label>
                Primary Color Preference{' '}
                {formData.mysteryDeck === 'no' && !formData.commander && (
                  <span className="required">*</span>
                )}
              </label>
              <div className="grid grid-cols-5 gap-x-6 gap-y-4 justify-items-center">
                {['W', 'U', 'B', 'R', 'G'].map((colorId) => {
                  const colorInfo = ColorIdentity.getColorInfo(colorId)
                  return (
                    <label
                      key={colorId}
                      className="cursor-pointer flex flex-col items-center gap-2 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--mana-color)] rounded-lg"
                      title={colorInfo.name}
                    >
                      <input
                        type="checkbox"
                        name="colorPreference"
                        checked={formData.colorPreference.includes(colorId)}
                        onChange={() => handleInputChange('colorPreference', colorId)}
                        className="sr-only"
                      />
                      <div
                        className={`inline-flex gap-0.5 items-center p-2 rounded-lg transition-all hover:bg-accent-tinted ${formData.colorPreference.includes(colorId) ? 'bg-accent-tinted' : ''}`}
                      >
                        <i
                          className={`${colorInfo.className} ms-3x transition-all duration-200 hover:scale-110`}
                          aria-label={`${colorInfo.name} mana`}
                        />
                      </div>
                      <span className="text-xs text-center">{colorInfo.name}</span>
                    </label>
                  )
                })}
                <div className="col-span-5 flex justify-center gap-6">
                  <label
                    className="cursor-pointer flex flex-col items-center gap-2 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--mana-color)] rounded-lg"
                    title={ColorIdentity.getColorInfo('C').name}
                  >
                    <input
                      type="checkbox"
                      name="colorPreference"
                      checked={formData.colorPreference.includes('C')}
                      onChange={() => handleInputChange('colorPreference', 'C')}
                      className="sr-only"
                    />
                    <div
                      className={`inline-flex gap-0.5 items-center p-2 rounded-lg transition-all hover:bg-accent-tinted ${formData.colorPreference.includes('C') ? 'bg-accent-tinted ' : ''}`}
                    >
                      <i
                        className={`${ColorIdentity.getColorInfo('C').className} ms-3x transition-all duration-200 hover:scale-110`}
                        aria-label={`${ColorIdentity.getColorInfo('C').name} mana`}
                      />
                    </div>
                    <span className="text-xs text-center">
                      {ColorIdentity.getColorInfo('C').name}
                    </span>
                  </label>
                  <label
                    className="cursor-pointer flex flex-col items-center gap-2 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--mana-color)] rounded-lg"
                    title="5-Color"
                  >
                    <input
                      type="checkbox"
                      name="colorPreference"
                      checked={formData.colorPreference.includes('WUBRG')}
                      onChange={() => handleInputChange('colorPreference', 'WUBRG')}
                      className="sr-only"
                    />
                    <div
                      className={`inline-flex gap-0.5 items-center p-2 rounded-lg transition-all hover:bg-accent-tinted ${formData.colorPreference.includes('WUBRG') ? 'bg-accent-tinted ' : ''}`}
                    >
                      {['W', 'U', 'B', 'R', 'G'].map((color) => (
                        <i
                          key={color}
                          className={`${ColorIdentity.getColorInfo(color).className} ms-2x transition-all duration-200`}
                          aria-label={`${color} mana`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-center">5-Color</span>
                  </label>
                </div>
              </div>
              {errors.colorPreference && (
                <span className="error-message">{errors.colorPreference}</span>
              )}

              {!showBackupColors && (
                <button
                  type="button"
                  onClick={() => setShowBackupColors(true)}
                  className="mt-4 flex items-center gap-2 text-sm text-[var(--mana-color)] hover:brightness-110 transition-all"
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--mana-color)] text-white text-xs">
                    +
                  </span>
                  Add backup color preference
                </button>
              )}

              {showBackupColors && (
                <div className="mt-6 p-4 bg-accent-tinted/30 rounded-lg border border-tinted">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium">
                      Backup Color Preference (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBackupColors(false)
                        setFormData({ ...formData, backupColorPreference: [] })
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-x-6 gap-y-4 justify-items-center">
                    {['W', 'U', 'B', 'R', 'G'].map((colorId) => {
                      const colorInfo = ColorIdentity.getColorInfo(colorId)
                      return (
                        <label
                          key={colorId}
                          className="cursor-pointer flex flex-col items-center gap-2 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--mana-color)] rounded-lg"
                          title={colorInfo.name}
                        >
                          <input
                            type="checkbox"
                            name="backupColorPreference"
                            checked={formData.backupColorPreference.includes(colorId)}
                            onChange={() => handleInputChange('backupColorPreference', colorId)}
                            className="sr-only"
                          />
                          <div
                            className={`inline-flex gap-0.5 items-center p-2 rounded-lg transition-all hover:bg-accent-tinted ${formData.backupColorPreference.includes(colorId) ? 'bg-accent-tinted ' : ''}`}
                          >
                            <i
                              className={`${colorInfo.className} ms-3x transition-all duration-200 hover:scale-110`}
                              aria-label={`${colorInfo.name} mana`}
                            />
                          </div>
                          <span className="text-xs text-center">{colorInfo.name}</span>
                        </label>
                      )
                    })}
                    <div className="col-span-5 flex justify-center gap-6">
                      <label
                        className="cursor-pointer flex flex-col items-center gap-2 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--mana-color)] rounded-lg"
                        title={ColorIdentity.getColorInfo('C').name}
                      >
                        <input
                          type="checkbox"
                          name="backupColorPreference"
                          checked={formData.backupColorPreference.includes('C')}
                          onChange={() => handleInputChange('backupColorPreference', 'C')}
                          className="sr-only"
                        />
                        <div
                          className={`inline-flex gap-0.5 items-center p-2 rounded-lg transition-all hover:bg-accent-tinted ${formData.backupColorPreference.includes('C') ? 'bg-accent-tinted ' : ''}`}
                        >
                          <i
                            className={`${ColorIdentity.getColorInfo('C').className} ms-3x transition-all duration-200 hover:scale-110`}
                            aria-label={`${ColorIdentity.getColorInfo('C').name} mana`}
                          />
                        </div>
                        <span className="text-xs text-center">
                          {ColorIdentity.getColorInfo('C').name}
                        </span>
                      </label>
                      <label
                        className="cursor-pointer flex flex-col items-center gap-2 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--mana-color)] rounded-lg"
                        title="5-Color"
                      >
                        <input
                          type="checkbox"
                          name="backupColorPreference"
                          checked={formData.backupColorPreference.includes('WUBRG')}
                          onChange={() => handleInputChange('backupColorPreference', 'WUBRG')}
                          className="sr-only"
                        />
                        <div
                          className={`inline-flex gap-0.5 items-center p-2 rounded-lg transition-all hover:bg-accent-tinted ${formData.backupColorPreference.includes('WUBRG') ? 'bg-accent-tinted ' : ''}`}
                        >
                          {['W', 'U', 'B', 'R', 'G'].map((color) => (
                            <i
                              key={color}
                              className={`${ColorIdentity.getColorInfo(color).className} ms-2x transition-all duration-200`}
                              aria-label={`${color} mana`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-center">5-Color</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="theme">
                <MessageSquare className="inline-icon" />
                Theme (Optional)
              </label>
              <input
                type="text"
                id="theme"
                value={formData.theme}
                onChange={(e) => handleInputChange('theme', e.target.value)}
                className="form-input"
                placeholder="e.g., Tribal, Artifacts, Spellslinger, Voltron"
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="step-content">
            <h2 className="step-title">
              <Trophy className="step-icon" />
              Power Level & Budget
            </h2>
            <p className="step-description">
              Let's determine the competitive level and budget for your deck.
            </p>

            <div className="form-group">
              <label>
                Bracket Selection <span className="required">*</span>
              </label>
              <div className="bracket-grid">
                {defCatBracketOptions.map((bracket) => (
                  <label
                    key={bracket.value}
                    className={`bracket-option ${formData.bracket === bracket.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="bracket"
                      value={bracket.value}
                      checked={formData.bracket === bracket.value}
                      onChange={(e) => handleInputChange('bracket', e.target.value)}
                    />
                    <div className="bracket-content">
                      <span className="bracket-label">{bracket.label}</span>
                      <span className="bracket-description">{bracket.description}</span>
                    </div>
                  </label>
                ))}
              </div>
              {errors.bracket && <span className="error-message">{errors.bracket}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="budget">
                <DollarSign className="inline-icon" />
                Budget <span className="required">*</span>
              </label>
              <input
                type="text"
                id="budget"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                className={`form-input ${errors.budget ? 'error' : ''}`}
                placeholder="e.g., $100, No budget, Under $500"
              />
              {errors.budget && <span className="error-message">{errors.budget}</span>}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="step-content">
            <h2 className="step-title">
              <Coffee className="step-icon" />
              Final Details
            </h2>
            <p className="step-description">Almost done! Just a couple more fun questions.</p>

            <div className="form-fields">
              <div className="form-group">
                <label htmlFor="coffee">
                  <Coffee className="inline-icon" />
                  Coffee Preference <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="coffee"
                  value={formData.coffee}
                  onChange={(e) => handleInputChange('coffee', e.target.value)}
                  className={`form-input ${errors.coffee ? 'error' : ''}`}
                  placeholder="e.g., Black coffee, French press / Latte with oat milk"
                />
                {errors.coffee && <span className="error-message">{errors.coffee}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="idealDate">
                  <Calendar className="inline-icon" />
                  Ideal Date (Optional)
                </label>
                <input
                  type="text"
                  id="idealDate"
                  value={formData.idealDate}
                  onChange={(e) => handleInputChange('idealDate', e.target.value)}
                  className="form-input"
                  placeholder="Your answer"
                />
              </div>
            </div>

            <div className="review-section">
              <h3>Review Your Submission</h3>
              <div className="review-grid">
                <div className="review-item">
                  <span className="review-label">Email:</span>
                  <span className="review-value">{formData.email}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Moxfield:</span>
                  <span className="review-value">{formData.moxfieldUsername}</span>
                </div>
                {formData.discordUsername && (
                  <div className="review-item">
                    <span className="review-label">Discord:</span>
                    <span className="review-value">{formData.discordUsername}</span>
                  </div>
                )}
                <div className="review-item">
                  <span className="review-label">Type:</span>
                  <span className="review-value">
                    {formData.mysteryDeck === 'yes' ? 'Mystery Deck' : 'Custom Build'}
                  </span>
                </div>
                {formData.commander && (
                  <div className="review-item">
                    <span className="review-label">Commander:</span>
                    <span className="review-value">{formData.commander}</span>
                  </div>
                )}
                {formData.colorPreference.length > 0 && (
                  <div className="review-item">
                    <span className="review-label">Primary Colors:</span>
                    <span className="review-value">
                      <div className="flex gap-4 flex-wrap">
                        {formData.colorPreference.map((colorId) => {
                          const colorInfo = ColorIdentity.getColorInfo(colorId)
                          const is5Color = colorId === 'WUBRG'
                          return (
                            <div key={colorId} className="flex items-center gap-2">
                              {is5Color ? (
                                <div className="inline-flex gap-0.5 items-center">
                                  {['W', 'U', 'B', 'R', 'G'].map((color) => (
                                    <i
                                      key={color}
                                      className={`${ColorIdentity.getColorInfo(color).className} text-base`}
                                      aria-label={`${color} mana`}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <i
                                  className={`${colorInfo.className} text-base`}
                                  aria-label={`${colorInfo.name} mana`}
                                />
                              )}
                              <span className="text-xs text-muted-foreground">
                                {is5Color ? '5-Color' : colorInfo.name}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </span>
                  </div>
                )}
                {Array.isArray(formData.backupColorPreference) &&
                  formData.backupColorPreference.length > 0 && (
                    <div className="review-item">
                      <span className="review-label">Backup Colors:</span>
                      <span className="review-value">
                        <div className="flex gap-4 flex-wrap">
                          {formData.backupColorPreference.map((colorId) => {
                            const colorInfo = ColorIdentity.getColorInfo(colorId)
                            const is5Color = colorId === 'WUBRG'
                            return (
                              <div key={colorId} className="flex items-center gap-2">
                                {is5Color ? (
                                  <div className="inline-flex gap-0.5 items-center">
                                    {['W', 'U', 'B', 'R', 'G'].map((color) => (
                                      <i
                                        key={color}
                                        className={`${ColorIdentity.getColorInfo(color).className} text-base`}
                                        aria-label={`${color} mana`}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <i
                                    className={`${colorInfo.className} text-base`}
                                    aria-label={`${colorInfo.name} mana`}
                                  />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {is5Color ? '5-Color' : colorInfo.name}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </span>
                    </div>
                  )}
                {formData.theme && (
                  <div className="review-item">
                    <span className="review-label">Theme:</span>
                    <span className="review-value">{formData.theme}</span>
                  </div>
                )}
                <div className="review-item">
                  <span className="review-label">Bracket:</span>
                  <span className="review-value">
                    {defCatBracketOptions.find((b) => b.value === formData.bracket)?.label ||
                      'Not selected'}
                  </span>
                </div>
                <div className="review-item">
                  <span className="review-label">Budget:</span>
                  <span className="review-value">{formData.budget}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Coffee:</span>
                  <span className="review-value">{formData.coffee}</span>
                </div>
                {formData.idealDate && (
                  <div className="review-item">
                    <span className="review-label">Ideal Date:</span>
                    <span className="review-value">{formData.idealDate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="deck-form-container">
        <div className="form-wrapper">
          <div className="success-container">
            <div className="success-card">
              <Loader2 className="animate-spin success-icon" />
              <h2>Checking Eligibility...</h2>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (tierError) {
    return (
      <div className="deck-form-container">
        <div className="form-wrapper">
          <div className="success-container">
            <div className="success-card">
              <AlertCircle className="success-icon" style={{ color: '#ef4444' }} />
              <h2>Unable to Submit</h2>
              <p>{tierError}</p>
              </div>
          </div>
        </div>
      </div>
    )
  }

  if (showSuccess) {
    const canSubmitAnother = queuedSubmissions < MAX_QUEUED

    return (
      <div className="success-container">
        <div className="success-card">
          <CheckCircle className="success-icon" />
          <h2>Request Received!</h2>
          <p>
            {willBeQueued
              ? "Your deck submission has been added to your queue!"
              : "Your deck is in the build queue and will be started soon!"}
          </p>
          {!willBeQueued && remainingSubmissions > 0 && (
            <p className="success-meta">
              You have {remainingSubmissions} credit
              {remainingSubmissions !== 1 && 's'} remaining this month.
            </p>
          )}
          <button className="btn btn-primary" onClick={resetForm}>
            {canSubmitAnother ? 'Submit Another' : 'View My Submissions'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="deck-form-container">
      <div className="form-wrapper">
        <div className="form-header">
          <div className="header-logo">
            <Swords style={{ width: 32, height: 32, color: 'white' }} />
          </div>
          <h1 className="header-title">Deck Submission Form</h1>
          <p className="header-subtitle">Customized Commander Creations</p>
          {auth.profile.tier && (
            <div
              className="tier-info"
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background:
                  remainingSubmissions > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                border:
                  remainingSubmissions > 0
                    ? '1px solid rgba(34, 197, 94, 0.3)'
                    : '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '0.5rem',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                {remainingSubmissions > 0 ? (
                  <>
                    You have <strong>{remainingSubmissions}</strong> deck credit
                    {remainingSubmissions !== 1 && 's'} remaining this month.
                  </>
                ) : queuedSubmissions < MAX_QUEUED ? (
                  <>
                    You've used your deck credits for this month. You can still submit — your
                    request will be added to your personal queue.
                  </>
                ) : (
                  <>
                    You have {MAX_QUEUED} requests in your queue. Once one is completed, you can
                    submit another.
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="progress-bar">
          {steps.map((step) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = completedSteps.includes(step.id)

            return (
              <div
                key={step.id}
                className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => {
                  if (isCompleted || step.id < currentStep) {
                    setCurrentStep(step.id)
                  }
                }}
              >
                <div className="progress-step-circle">
                  {isCompleted ? (
                    <CheckCircle style={{ width: 20, height: 20 }} />
                  ) : (
                    <Icon style={{ width: 20, height: 20 }} />
                  )}
                </div>
                <span className="progress-step-label">{step.name}</span>
              </div>
            )
          })}
        </div>

        <div className="form-card">
          {renderStepContent()}

          <div className="form-actions">
            <button
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                borderColor: '#eab308',
                visibility: currentStep === 1 ? 'hidden' : 'visible',
              }}
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft style={{ width: 20, height: 20 }} />
              Previous
            </button>

            {currentStep < totalSteps ? (
              <button className="btn btn-primary" onClick={handleNext}>
                Next
                <ChevronRight style={{ width: 20, height: 20 }} />
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    borderColor: '#3b82f6',
                  }}
                  onClick={() => handleSubmit(true)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" style={{ width: 20, height: 20 }} />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save Draft
                      <Hourglass style={{ width: 20, height: 20 }} />
                    </>
                  )}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleSubmit(false)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" style={{ width: 20, height: 20 }} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit
                      <CheckCircle style={{ width: 20, height: 20 }} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}