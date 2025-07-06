'use client'

import { UserButton } from '@clerk/nextjs'

export function CustomUserButton() {
  return (
    <div className="flex items-center gap-2">
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            userButtonAvatarBox: 'w-8 h-8',
          },
        }}
      />
    </div>
  )
}
