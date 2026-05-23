import { appConfig } from '../config/appConfig'

export function getPrivateCertCollectionPath(userId) {
  return ['users', userId, 'projects', appConfig.projectNamespace, 'certs']
}

export function getPrivateProfileSettingsPath(userId) {
  return ['users', userId, 'projects', appConfig.projectNamespace, 'settings', 'profile']
}

export function getPublicCertCollectionPath() {
  return ['publicProfiles', appConfig.publicProfileSlug, 'certs']
}

export function getPublicProfileMetaPath() {
  return ['publicProfiles', appConfig.publicProfileSlug, 'meta', 'profile']
}