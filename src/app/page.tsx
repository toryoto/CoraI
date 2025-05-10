import { SignedIn, SignedOut } from '@clerk/nextjs'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold mb-6">CoraI へようこそ</h1>

      <SignedIn>
        <p className="text-xl mb-8">ログインしました。アプリケーションを利用できます。</p>
      </SignedIn>

      <SignedOut>
        <p className="text-xl mb-8">始めるには、サインインまたはサインアップしてください。</p>

        <div className="space-x-4">
          <Link
            href="/sign-in"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-700"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg text-lg hover:bg-blue-50"
          >
            Sing Up
          </Link>
        </div>
      </SignedOut>
    </div>
  )
}
