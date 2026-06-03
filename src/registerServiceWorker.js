import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('A new version of the app is available.')
  },
  onOfflineReady() {
    console.log('App is ready to work offline.')
  }
})

export { updateSW }