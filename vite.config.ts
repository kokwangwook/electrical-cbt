import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // ngrok 및 외부 접근 허용
    allowedHosts: [
      'localhost',
      '.ngrok-free.app',
      '.ngrok.io',
      '.ngrok.app',
    ],
    // 캐시 방지 헤더 추가
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
    },
  },
  build: {
    // 파일 해시를 사용하여 캐시 버스팅
    rollupOptions: {
      output: {
        // 매번 새로운 파일명 생성
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`,
        // 수동 청크 분할로 번들 크기 최적화
        manualChunks: {
          // React 코어 라이브러리
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // 수학 수식 렌더링
          'vendor-katex': ['katex', 'react-katex'],
          // 차트 라이브러리
          'vendor-recharts': ['recharts'],
          // PDF 파싱 (가장 큰 라이브러리)
          'vendor-pdf': ['pdfjs-dist'],
          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],
        }
      }
    }
  }
})
