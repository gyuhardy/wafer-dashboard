import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const fetchAllWafers    = () => api.get('/wafers').then(r => r.data)
export const fetchExpiringWafers = (days = 30) => api.get(`/wafers/expiring?days=${days}`).then(r => r.data)
export const fetchWaferLocations = () => api.get('/wafers/location').then(r => r.data)
