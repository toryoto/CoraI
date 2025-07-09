import { useUser } from '@clerk/nextjs'

export function useCurrentUser() {
  const { user, isLoaded, isSignedIn } = useUser()

  return {
    user,
    isLoaded,
    isSignedIn,
    imageUrl: user?.imageUrl,
    displayName: user?.fullName || user?.firstName || 'You',
    initials: user?.firstName?.[0] || user?.lastName?.[0] || 'U',
  }
}
