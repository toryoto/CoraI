import { UserProfile } from '@clerk/nextjs'

export default function UserProfilePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950 dark:via-cyan-950 dark:to-teal-950">
      <div className="w-full max-w-2xl mx-auto p-6">
        <UserProfile
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm',
            },
          }}
        />
      </div>
    </div>
  )
}
