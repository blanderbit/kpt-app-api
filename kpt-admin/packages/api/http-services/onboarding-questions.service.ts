import axios from '../axios.config'
import { ApiBaseUrl } from '../enums'

export interface OnboardingAnswer {
  id: string
  text: string
  subtitle: string
  icon: string
}

export interface OnboardingStep {
  stepName: string
  stepQuestion: string
  answers: OnboardingAnswer[]
  inputType: string
  required: boolean
}

export interface OnboardingQuestionsStats {
  totalSteps: number
  totalAnswers: number
  averageAnswersPerStep: number
  requiredSteps: number
  optionalSteps: number
}

export class OnboardingQuestionsService {
  static getAll(): Promise<OnboardingStep[]> {
    return axios.get(ApiBaseUrl.OnboardingQuestions)
  }

  static getByStepName(stepName: string): Promise<OnboardingStep | undefined> {
    return axios.get(`${ApiBaseUrl.OnboardingQuestions}/by-step`, {
      params: { stepName },
    })
  }

  static getRequired(): Promise<OnboardingStep[]> {
    return axios.get(`${ApiBaseUrl.OnboardingQuestions}/required`)
  }

  static getOptional(): Promise<OnboardingStep[]> {
    return axios.get(`${ApiBaseUrl.OnboardingQuestions}/optional`)
  }

  static getStats(): Promise<OnboardingQuestionsStats> {
    return axios.get(`${ApiBaseUrl.OnboardingQuestions}/stats`)
  }

  static syncWithDrive(): Promise<{ message: string }> {
    return axios.post(`${ApiBaseUrl.OnboardingQuestions}/sync-with-drive`)
  }
}
