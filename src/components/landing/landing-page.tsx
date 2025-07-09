'use client'

import { Button } from '@/components/ui/button'
import { ChevronRight, GitBranch, MessageSquare, Network, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

export function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 珊瑚礁のような分岐する線を描画
    const branches: Array<{
      x: number
      y: number
      angle: number
      length: number
      generation: number
      opacity: number
    }> = []

    const createBranch = (
      x: number,
      y: number,
      angle: number,
      length: number,
      generation: number
    ) => {
      if (generation > 4 || length < 20) return

      branches.push({ x, y, angle, length, generation, opacity: 1 - generation * 0.15 })

      const endX = x + Math.cos(angle) * length
      const endY = y + Math.sin(angle) * length

      // 2-3本の子ブランチを作成
      const numChildren = Math.random() > 0.7 ? 3 : 2
      for (let i = 0; i < numChildren; i++) {
        const angleOffset = (Math.random() - 0.5) * 0.8
        const newAngle = angle + angleOffset
        const newLength = length * (1.0 + Math.random() * 0.2)
        setTimeout(
          () => {
            createBranch(endX, endY, newAngle, newLength, generation + 1)
          },
          generation * 200 + Math.random() * 300
        )
      }
    }

    // 複数の初期ブランチを作成
    const centerX = canvas.width / 2
    const centerY = canvas.height * 0.8

    setTimeout(() => createBranch(centerX - 200, centerY, -Math.PI / 6, 80, 0), 0)
    setTimeout(() => createBranch(centerX, centerY, -Math.PI / 3, 90, 0), 200)
    setTimeout(() => createBranch(centerX + 200, centerY, -Math.PI / 2.5, 75, 0), 400)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      branches.forEach((branch, index) => {
        const progress = Math.min((Date.now() - index * 50) / 1000, 1)
        if (progress <= 0) return

        ctx.save()
        ctx.strokeStyle = `rgba(42, 127, 183, ${branch.opacity * progress})`
        ctx.lineWidth = Math.max(6 - branch.generation * 1.2, 1.5)
        ctx.lineCap = 'round'

        ctx.beginPath()
        ctx.moveTo(branch.x, branch.y)
        const currentLength = branch.length * progress
        const endX = branch.x + Math.cos(branch.angle) * currentLength
        const endY = branch.y + Math.sin(branch.angle) * currentLength
        ctx.lineTo(endX, endY)
        ctx.stroke()

        // ノード（分岐点）を描画
        if (progress > 0.8 && branch.generation < 3) {
          ctx.fillStyle = `rgba(16, 185, 129, ${branch.opacity * 0.8})`
          ctx.beginPath()
          ctx.arc(endX, endY, 4 - branch.generation * 0.5, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-teal-50/50 relative overflow-hidden">
      {/* 背景のアニメーション */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{ zIndex: 1 }}
      />

      {/* ヘッダー */}
      <header className="relative z-10 px-6 py-6">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/corai-icon.png"
              alt="CoraI"
              width={40}
              height={40}
              style={{ width: 'auto', height: 'auto' }}
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              CoraI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                ログイン
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
                無料で始める
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* メインコンテンツ */}
      <main className="relative z-10 px-6 pt-16 pb-24">
        <div className="max-w-7xl mx-auto">
          {/* ヒーローセクション */}
          <div className="text-center max-w-4xl mx-auto mb-24">
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-teal-700 bg-clip-text text-transparent">
                CoraI
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                並列AIチャットツール
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
              AIとの会話がブランチで広がる。
              <br />
              複数の観点を同時に探索し、深い洞察を得る新しい体験。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white text-lg px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  今すぐ始める
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-4 rounded-xl border-2 border-blue-200 text-blue-700 hover:bg-blue-50 transition-all duration-300"
                >
                  デモを見る
                </Button>
              </Link>
            </div>
          </div>

          {/* 特徴セクション */}
          <div className="grid md:grid-cols-3 gap-8 mb-24">
            <div className="group p-8 rounded-2xl bg-white/70 backdrop-blur-sm border border-blue-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <GitBranch className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">思考の分岐</h3>
              <p className="text-gray-600 leading-relaxed">
                会話の任意の時点から新しい議論を分岐。複数の可能性を同時に探索し、より豊かな思考プロセスを実現します。
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-white/70 backdrop-blur-sm border border-teal-100 hover:border-teal-200 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Network className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">視覚的な構造</h3>
              <p className="text-gray-600 leading-relaxed">
                会話の流れを美しいツリー構造で可視化。複雑な議論も直感的に理解でき、迷子になることはありません。
              </p>
            </div>

            <div className="group p-8 rounded-2xl bg-white/70 backdrop-blur-sm border border-green-100 hover:border-green-200 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">並列思考</h3>
              <p className="text-gray-600 leading-relaxed">
                複数の観点から同時にアプローチ。従来の直線的な会話を超越し、真の知的生産性を実現します。
              </p>
            </div>
          </div>

          {/* 使用例セクション */}
          <div className="max-w-5xl mx-auto mb-24">
            <h2 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
              こんな方におすすめ
            </h2>
            <p className="text-xl text-gray-600 text-center mb-16">
              知的生産性を高めたいプロフェッショナルのために
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
                <MessageSquare className="h-8 w-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3">コンサルタント・研究者</h3>
                <p className="text-gray-700 mb-4">
                  複雑な問題を多角的に分析。仮説を並行して検証し、包括的な解決策を導き出せます。
                </p>
                <div className="text-sm text-blue-700 font-medium">
                  例：市場分析、競合分析、リスク評価を同時進行
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100/50 border border-teal-200">
                <Network className="h-8 w-8 text-teal-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-3">エンジニア・マーケター</h3>
                <p className="text-gray-700 mb-4">
                  複数のアプローチを同時に検討。技術的な選択肢やマーケティング戦略を効率的に比較できます。
                </p>
                <div className="text-sm text-teal-700 font-medium">
                  例：アーキテクチャ設計、A/Bテスト設計、施策立案
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="relative z-10 border-t border-gray-200 bg-white/80 backdrop-blur-sm py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/corai-icon.png"
              alt="CoraI"
              width={32}
              height={32}
              style={{ width: 'auto', height: 'auto' }}
            />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              CoraI
            </span>
          </div>
          <p className="text-gray-600">© 2025 CoraI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
