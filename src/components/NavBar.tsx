import Link from 'next/link'
import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs'

export default function NavBar() {
  return (
    <nav className="bg-white p-4 shadow">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          CoraI
        </Link>

        <div>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <div className="space-x-4">
              <Link href="/sign-in" className="text-blue-600 hover:text-blue-800">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800"
              >
                Sign Up
              </Link>
            </div>
          </SignedOut>
        </div>
      </div>
    </nav>
  )
}
