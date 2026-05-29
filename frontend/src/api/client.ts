import axios from 'axios'
import { useQuery, useMutation } from '@tanstack/react-query'
import type { QuoteResponse, ChainResponse, AnalyseRequest, AnalyseResponse, StrategiesResponse } from '../types/options'

const api = axios.create({ baseURL: '/api' })

export const useQuote = (ticker: string | null) =>
  useQuery<QuoteResponse>({
    queryKey: ['quote', ticker],
    queryFn: () => api.get(`/quote/${ticker}`).then(r => r.data),
    enabled: !!ticker, retry: 2, staleTime: 30_000,
  })

export const useChain = (ticker: string | null, expiry: string | null) =>
  useQuery<ChainResponse>({
    queryKey: ['chain', ticker, expiry],
    queryFn: () => api.get(`/chain/${ticker}`, { params: expiry ? { expiry } : {} }).then(r => r.data),
    enabled: !!ticker, retry: 2, staleTime: 30_000,
  })

export const useAnalyse = () =>
  useMutation<AnalyseResponse, Error, AnalyseRequest>({
    mutationFn: (req) => api.post('/analyse', req).then(r => r.data),
  })

export const useStrategies = () =>
  useQuery<StrategiesResponse>({
    queryKey: ['strategies'],
    queryFn: () => api.get('/strategies').then(r => r.data),
    staleTime: Infinity,
  })
