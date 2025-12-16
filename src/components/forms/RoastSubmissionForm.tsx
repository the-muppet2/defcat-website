/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Flame,
  Hash,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRoastEligibility } from '@/lib/auth/client'
import { createClient } from '@/lib/supabase/client'
import '../../styles/form.css'

const BRACKET_OPTIONS = [
  {
    value: 'bracket1',
    label: 'Silly Billy Fun 1',
    description: 'Precon level',
  },
  { value: 'bracket2', label: 'Bracket 2', description: 'Focused casual' },
  { value: 'bracket3', label: 'Bracket 3', description: 'Optimized casual' },
  { value: 'bracket4', label: 'Bracket 4', description: 'High power' },
  { value: 'cedh', label: 'cEDH', description: 'Competitive' },
  {
    value: 'wild',
    label: 'Evil EVILLLLLL ahhh hahaha',
    description: 'Absolute chaos',
  },
]

const ART_CHOICES = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'mostly', label: 'Mostly' },
]

interface RoastSubmissionFormProps {
  prefilledDeckUrl?: string | null
}

export default function RoastSubmissionForm({ prefilledDeckUrl }: RoastSubmissionFormProps) {
  const eligibility = useRoastEligibility()
  const [currentStep, setCurrentStep] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeckPrefilled, setIsDeckPrefilled] = useState(!!prefilledDeckUrl)

  const [formData, setFormData] = useState({
    preferredName: '',
    deckDescription: '',
    moxfieldLink: prefilledDeckUrl || '',
    targetBracket: '',
    artChoicesIntentional: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const totalSteps = 2

  const validateStep = (step: number): Record<string, string> => {
    const stepErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.preferredName.trim()) {
        stepErrors.preferredName = 'Please enter your preferred name'
      }
      if (!formData.deckDescription.trim()) {
        stepErrors.deckDescription = 'Please describe your deck'
      } else if (formData.deckDescription.trim().split(/\s+/).length > 100) {
        stepErrors.deckDescription = 'Description must be 3 sentences or less'
      }
      if (!formData.moxfieldLink.trim()) {
        stepErrors.moxfieldLink = 'Please provide your Moxfield deck link'
      } else if (!formData.moxfieldLink.includes('moxfield.com')) {
        stepErrors.moxfieldLink = 'Please enter a valid Moxfield URL'
      }
    }

    if (step === 2) {
      if (!formData.targetBracket) {
        stepErrors.targetBracket = "Please select your deck's target bracket"
      }
      if (!formData.artChoicesIntentional) {
        stepErrors.artChoicesIntentional = 'Please answer this question'
      }
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
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async () => {
    const stepErrors = validateStep(currentStep)
    if (Object.keys(stepErrors).length !== 0) {
      setErrors(stepErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast.error('Session expired. Please log in again.')
        setIsSubmitting(false)
        return
      }

      const response = await fetch('/api/submit-roast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          submissionType: 'roast',
          preferredName: formData.preferredName.trim(),
          deckDescription: formData.deckDescription.trim(),
          moxfieldLink: formData.moxfieldLink.trim(),
          targetBracket: formData.targetBracket,
          artChoicesIntentional: formData.artChoicesIntentional,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        toast.error(data.error?.message || 'Failed to submit roast request')
        setIsSubmitting(false)
        return
      }

      setShowSuccess(true)
      toast.success('Roast request submitted successfully!')
    } catch (error) {
      console.error('Error submitting roast:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2 className="step-title">
              <User className="step-icon" />
              Basic Information
            </h2>
            <p className="step-description">
              Tell us about yourself and your deck so we can roast it properly!
            </p>

            <div className="form-fields">
              <div className="form-group">
                <label htmlFor="preferredName">
                  <Hash className="inline-icon" />
                  Your Preferred Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="preferredName"
                  value={formData.preferredName}
                  onChange={(e) => handleInputChange('preferredName', e.target.value)}
                  className={`form-input ${errors.preferredName ? 'error' : ''}`}
                  placeholder="How should we address you?"
                />
                {errors.preferredName && (
                  <span className="error-message">{errors.preferredName}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="deckDescription">
                  <MessageSquare className="inline-icon" />
                  Please Describe Your Deck in 3 Sentences or Less{' '}
                  <span className="required">*</span>
                </label>
                <textarea
                  id="deckDescription"
                  value={formData.deckDescription}
                  onChange={(e) => handleInputChange('deckDescription', e.target.value)}
                  className={`form-input ${errors.deckDescription ? 'error' : ''}`}
                  placeholder="What's your deck's strategy? What makes it special?"
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
                {errors.deckDescription && (
                  <span className="error-message">{errors.deckDescription}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="moxfieldLink">
                  <LinkIcon className="inline-icon" />
                  Moxfield Link to Deck <span className="required">*</span>
                  {isDeckPrefilled && (
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary font-semibold">
                      Pre-selected from DefCat
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="url"
                    id="moxfieldLink"
                    value={formData.moxfieldLink}
                    onChange={(e) => {
                      handleInputChange('moxfieldLink', e.target.value)
                      if (isDeckPrefilled) setIsDeckPrefilled(false)
                    }}
                    className={`form-input ${errors.moxfieldLink ? 'error' : ''} ${isDeckPrefilled ? 'bg-primary/5' : ''}`}
                    placeholder="https://www.moxfield.com/decks/..."
                    readOnly={isDeckPrefilled}
                  />
                  {isDeckPrefilled && (
                    <button
                      type="button"
                      onClick={() => setIsDeckPrefilled(false)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary hover:brightness-110 underline transition-all"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {errors.moxfieldLink && (
                  <span className="error-message">{errors.moxfieldLink}</span>
                )}
                <p className="step-description" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                  {isDeckPrefilled
                    ? 'This deck was selected from the DefCat collection. Click "Edit" to change it.'
                    : 'Make sure your deck is set to public on Moxfield'}
                </p>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="step-content">
            <h2 className="step-title">
              <Flame className="step-icon" />
              Deck Details
            </h2>
            <p className="step-description">Help us understand your deck better for the roast</p>

            <div className="form-fields">
              <div className="form-group">
                <label>
                  What is Your Deck's Target Bracket? <span className="required">*</span>
                </label>
                <div className="bracket-grid">
                  {BRACKET_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`bracket-option ${formData.targetBracket === option.value ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="targetBracket"
                        value={option.value}
                        checked={formData.targetBracket === option.value}
                        onChange={(e) => handleInputChange('targetBracket', e.target.value)}
                      />
                      <div className="bracket-content">
                        <div className="bracket-label">{option.label}</div>
                        <div className="bracket-description">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.targetBracket && (
                  <span className="error-message">{errors.targetBracket}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  Are the Card Art Choices Intentional? <span className="required">*</span>
                </label>
                <div className="radio-cards">
                  {ART_CHOICES.map((option) => (
                    <label
                      key={option.value}
                      className={`radio-card ${formData.artChoicesIntentional === option.value ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="artChoicesIntentional"
                        value={option.value}
                        checked={formData.artChoicesIntentional === option.value}
                        onChange={(e) => handleInputChange('artChoicesIntentional', e.target.value)}
                      />
                      <div className="radio-content">
                        <div className="radio-title">{option.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.artChoicesIntentional && (
                  <span className="error-message">{errors.artChoicesIntentional}</span>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Loading state
  if (eligibility.isLoading) {
    return (
      <div className="deck-form-container">
        <div className="form-wrapper">
          <div
            className="form-card"
            style={{
              minHeight: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <Loader2
                className="step-icon"
                style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 1rem',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <p className="step-description">Checking eligibility...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (showSuccess) {
    return (
      <div className="success-container">
        <div className="success-card">
          <CheckCircle className="success-icon" />
          <h2>Roast Request Submitted!</h2>
          <p>
            Your deck roast request has been submitted successfully!
            I'll review your deck and get started on it as soon as possible!
          </p>
          {eligibility.roastCredits !== 999 && (
            <p className="success-meta">
              Roast credits remaining this month: {eligibility.roastCredits}
            </p>
          )}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              marginTop: '2rem',
            }}
          >
            <button
              onClick={() => {
                setShowSuccess(false)
                setCurrentStep(1)
                setFormData({
                  preferredName: '',
                  deckDescription: '',
                  moxfieldLink: '',
                  targetBracket: '',
                  artChoicesIntentional: '',
                })
                setCompletedSteps([])
              }}
              className="btn btn-primary"
            >
              Submit Another
            </button>
            <a href="/decks" className="btn btn-secondary">
              Browse Decks
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Main form
  return (
    <div className="deck-form-container">
      <div className="form-wrapper">
        <div className="form-header">
          <div className="header-logo">
            <Flame style={{ width: '32px', height: '32px', color: 'white' }} />
          </div>
          <h1 className="header-title">Get Your Deck Roasted!</h1>
          <p className="header-subtitle">Submit your deck for a hilarious roast by DefCat</p>
          {eligibility.roastCredits !== 999 && (
            <p className="success-meta" style={{ marginTop: '0.5rem' }}>
              Roast credits remaining: {eligibility.roastCredits}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNumber = index + 1
            const isCompleted = completedSteps.includes(stepNumber)
            const isActive = currentStep === stepNumber

            return (
              <div
                key={stepNumber}
                className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                <div className="progress-step-circle">
                  {isCompleted ? (
                    <CheckCircle style={{ width: '20px', height: '20px' }} />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span className="progress-step-label">
                  {stepNumber === 1 ? 'Basic Info' : 'Deck Details'}
                </span>
              </div>
            )
          })}
        </div>

        {/* Form Card */}
        <div className="form-card">
          {renderStepContent()}

          {/* Navigation */}
          <div className="form-actions">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="btn btn-secondary"
            >
              <ChevronLeft style={{ width: '20px', height: '20px' }} />
              Back
            </button>

            {currentStep < totalSteps ? (
              <button onClick={handleNext} className="btn btn-primary">
                Continue
                <ChevronRight style={{ width: '20px', height: '20px' }} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? (
                  <>
                    <Loader2
                      style={{
                        width: '20px',
                        height: '20px',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Flame style={{ width: '20px', height: '20px' }} />
                    Submit Roast Request
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
